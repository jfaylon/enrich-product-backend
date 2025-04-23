import { APIGatewayProxyHandler } from "aws-lambda";
import Attribute from "../../models/Attribute";
import "../../utils/bootstrap";
import { retrieveUserId } from "../../services/UserService";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = retrieveUserId(event);
    if (!userId) throw new Error("Missing userId");

    const attributes = await Attribute.find({ userId }).lean();

    return {
      statusCode: 200,
      body: JSON.stringify(attributes),
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
