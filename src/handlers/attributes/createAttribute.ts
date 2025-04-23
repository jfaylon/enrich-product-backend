import { APIGatewayProxyHandler } from "aws-lambda";
import Attribute from "../../models/Attribute";
import "../../utils/bootstrap";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const attribute = await Attribute.create(data);
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
