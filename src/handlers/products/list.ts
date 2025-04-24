import { SortOrder } from "mongoose";
import Product from "../../models/Product";
import "../../utils/bootstrap";
import { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField = "_id",
      sortOrder = "asc",
      filter = "{}",
    } = event.queryStringParameters || {};
    const parsedFilter = filter ? JSON.parse(filter) : {};
    const sortOrderNum = sortOrder === "desc" ? -1 : 1;
    const sort: Record<string, SortOrder> = {
      _id: sortOrderNum, // Primary sort by _id
    };

    if (sortField !== "_id") {
      sort[sortField] = sortOrderNum;
    }
    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(parsedFilter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();
    const totalCount = await Product.countDocuments(parsedFilter);

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
