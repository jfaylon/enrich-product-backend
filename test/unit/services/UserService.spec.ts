import { APIGatewayProxyEventV2 } from "aws-lambda";

import { retrieveUserId } from "../../../src/services/UserService";
describe("#UserService", () => {
  describe("#retrieveUserId", () => {
    it("should return test-user-id", () => {
      const event: APIGatewayProxyEventV2 = {
        version: "",
        routeKey: "",
        rawPath: "",
        rawQueryString: "",
        headers: {},
        requestContext: {
          accountId: "",
          apiId: "",
          domainName: "",
          domainPrefix: "",
          http: {
            method: "",
            path: "",
            protocol: "",
            sourceIp: "",
            userAgent: "",
          },
          requestId: "",
          routeKey: "",
          stage: "",
          time: "",
          timeEpoch: 0,
        },
        isBase64Encoded: false,
      };
      const result = retrieveUserId(event);
      expect(result).toEqual("test-user-id");
    });
  });
});
