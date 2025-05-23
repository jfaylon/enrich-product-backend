import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import "../../utils/bootstrap";
import { retrieveUserId } from "../../services/UserService";
import { getAttributes } from "../../services/AttributeService";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const userId = retrieveUserId(event);
    if (!userId) throw new Error("Missing userId");

    const defaultAttributes = [
      {
        name: "name",
        label: "Product Name",
        type: "short_text",
      },
      { name: "brand", label: "Brand", type: "short_text" },
      {
        name: "barcode",
        label: "Barcode",
        type: "short_text",
      },
    ];

    const userAttributes = await getAttributes(userId);
    const responseBody = {
      attributes: defaultAttributes.concat(userAttributes),
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responseBody),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch attributes",
        detail: (err as Error).message,
      }),
    };
  }
};
