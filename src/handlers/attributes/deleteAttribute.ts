import { APIGatewayProxyHandler } from "aws-lambda";
import "../../utils/bootstrap";
import Attribute from "../../models/Attribute";

export const deleteAttribute: APIGatewayProxyHandler = async (event) => {
  try {
    const { attributeId } = event.pathParameters || {};
    const userId = event.requestContext.authorizer?.principalId;

    if (!attributeId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing attributeId or userId" }),
      };
    }

    await Attribute.deleteOne({ _id: attributeId, userId });

    // Optionally, remove this attribute from all products owned by this user
    // You can trigger another service or queue that process this cleanup

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
