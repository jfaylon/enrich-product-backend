// src/handlers/swaggerHtmlHandler.ts

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import * as fs from "fs";
import * as path from "path";

const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Enrich Product Backend API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/swagger.json",
        dom_id: "#swagger-ui",
      });
    };
  </script>
</body>
</html>
`;

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: swaggerHtml,
  };
};
