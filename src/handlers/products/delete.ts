import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import "../../utils/bootstrap";
import Product from "../../models/Product";
import { retrieveUserId } from "../../services/UserService";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const userId = retrieveUserId(event);
    const { productIds } = JSON.parse(event.body || "{}");

    if (!userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing product IDs to delete" }),
      };
    }

    const result = await Product.deleteMany({
      _id: { $in: productIds },
      userId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Deleted ${result.deletedCount} products`,
      }),
    };
  } catch (error) {
    console.error("Bulk Delete Products Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
