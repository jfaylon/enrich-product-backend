import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "product-enrichment",
  frameworkVersion: "3",
  plugins: ["serverless-offline", "serverless-plugin-typescript"],
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    stage: "dev",
    region: undefined,
    environment: {
      MONGODB_URI: "mongodb://localhost:27017/products",
    },
  },
  functions: {
    upload: {
      handler: "src/handlers/products/upload.handler",
      events: [{ http: { method: "post", path: "products" } }],
      timeout: 120,
    },
    enrich: {
      handler: "src/handlers/products/enrich.handler",
      events: [{ http: { method: "post", path: "products/enrich" } }],
      timeout: 120,
    },
    getAttributes: {
      handler: "src/handlers/attributes/getAttributes.handler",
      events: [{ http: { method: "get", path: "attributes" } }],
    },
  },
  package: { individually: true },
};

module.exports = serverlessConfiguration;
