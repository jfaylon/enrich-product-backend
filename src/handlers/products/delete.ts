import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import "../../utils/bootstrap";
import { retrieveUserId } from "../../services/UserService";
import { deleteProducts } from "../../services/ProductService";

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

    const result = await deleteProducts(productIds, userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Deleted ${result.deletedCount} products`,
      }),
    };
  } catch (error) {
    logger.error("Bulk Delete Products Error:");
    logger.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
