import { APIGatewayProxyEvent } from "aws-lambda";

export const retrieveUserId = (event: APIGatewayProxyEvent) => {
  // #TODO: Modify this if there is user management
  return event.requestContext?.authorizer?.principalId || "test-user-id";
};
