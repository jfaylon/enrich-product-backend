// src/handlers/swaggerJsonHandler.ts

import { APIGatewayProxyHandler } from "aws-lambda";
import * as fs from "fs";
import * as path from "path";

import swaggerDocument from "../../docs/swagger.json"; // import JSON directly

export const handler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(swaggerDocument),
  };
};
