import { APIGatewayProxyEventV2 } from "aws-lambda";

export const retrieveUserId = (event: APIGatewayProxyEventV2) => {
  // #TODO: Modify this if there is user management
  return "test-user-id";
};
