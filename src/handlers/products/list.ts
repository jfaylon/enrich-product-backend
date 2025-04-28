import { SortOrder } from "mongoose";
import "../../utils/bootstrap";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { retrieveUserId } from "../../services/UserService";
import { AttributeDocument } from "../../models/Attribute";
import {
  countProductDocuments,
  listProducts,
} from "../../services/ProductService";
import { getAttributes } from "../../services/AttributeService";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const userId = retrieveUserId(event);
    const {
      page = 1,
      limit = 10,
      sortField = "_id",
      sortOrder = "asc",
      ...filter
    } = event.queryStringParameters || {};
    const parsedFilter: Record<
      string,
      string | { $regex: string; $options: string } | string[] | number
    > = { userId };
    const userAttributesArray = await getAttributes(userId);
    const userAttributesObject: Record<string, Partial<AttributeDocument>> = {};
    userAttributesArray.map((attribute) => {
      userAttributesObject[attribute.name] = attribute;
    });
    for (const key in filter) {
      if (
        !["page", "limit", "sortField", "sortOrder"].includes(key) &&
        filter[key]
      ) {
        if (
          ["short_text", "long_text", "rich_text"].includes(
            userAttributesObject[key!]?.type!
          )
        ) {
          parsedFilter[`attributes.${key}`] = {
            $regex: `${filter[key]}`,
            $options: "i",
          };
        } else if (
          ["single_select", "multi_select"].includes(
            userAttributesObject[key!]?.type!
          )
        ) {
          parsedFilter[`attributes.${key}`] = filter[key].split(",");
        } else if (["measure"].includes(userAttributesObject[key!]?.type!)) {
          parsedFilter[`attributes.${key}.value`] = Number(filter[key]);
        } else if (["barcode"].includes(key)) {
          parsedFilter[key] = filter[key];
        } else {
          parsedFilter[key] = {
            $regex: `${filter[key]}`,
            $options: "i",
          };
        }
      }
    }
    const sortOrderNum = sortOrder === "desc" ? -1 : 1;
    const sort: Record<string, SortOrder> = {};

    if (sortField) {
      if (userAttributesObject[sortField]) {
        sort[`attributes.${sortField}`] = sortOrderNum;
      } else {
        sort[sortField] = sortOrderNum;
      }
    } else {
      sort["_id"] = 1;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const products = await listProducts(
      parsedFilter,
      sort,
      skip,
      Number(limit)
    );
    const totalCount = await countProductDocuments(parsedFilter);

    // Return the response with the products and pagination info
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: products,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: page,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch products" }),
    };
  }
};
