import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import "../../utils/bootstrap";
import { retrieveUserId } from "../../services/UserService";
import { createAttribute } from "../../services/AttributeService";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const userId = retrieveUserId(event);
    const data = JSON.parse(event.body || "{}");
    const attribute = await createAttribute(data, userId);
    return {
      statusCode: 200,
      body: JSON.stringify(attribute),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to create attribute",
        detail: (err as Error).message,
      }),
    };
  }
};
