import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import "../../utils/bootstrap";
import { retrieveUserId } from "../../services/UserService";
import { deleteAttribute } from "../../services/AttributeService";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { attributeId } = event.pathParameters || {};
    const userId = retrieveUserId(event);

    if (!attributeId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing attributeId or userId" }),
      };
    }

    await deleteAttribute(attributeId, userId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Attribute deleted" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to delete", error: String(err) }),
    };
  }
};
