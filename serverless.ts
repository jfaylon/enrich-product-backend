import type { AWS } from "@serverless/typescript";
import dotenv from "dotenv";
dotenv.config();

const serverlessConfiguration: AWS = {
  service: "product-enrichment",
  frameworkVersion: "3",
  plugins: [
    "serverless-offline",
    "serverless-plugin-typescript",
    "serverless-offline-sqs",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    stage: "dev",
    region: "ap-southeast-1",
    environment: {
      MONGODB_URI: process.env.MONGODB_URI!,
      MONGODB_DATABASE: process.env.MONGODB_DATABASE!,
      ENRICHMENT_QUEUE_URL: process.env.ENRICHMENT_QUEUE_URL || {
        Ref: "EnrichmentQueue",
      },
      ENRICHMENT_QUEUE_ARN: process.env.ENRICHMENT_QUEUE_ARN || {
        "Fn::GetAtt": ["EnrichmentQueue", "Arn"],
      },
    },
  },
  functions: {
    upload: {
      handler: "src/handlers/products/upload.handler",
      events: [{ httpApi: { method: "post", path: "/products" } }],
      timeout: 900,
    },
    enrich: {
      handler: "src/handlers/products/enrich.handler",
      events: [{ httpApi: { method: "post", path: "/products/enrich" } }],
      timeout: 120,
    },
    listProducts: {
      handler: "src/handlers/products/list.handler",
      events: [{ httpApi: { method: "get", path: "/products" } }],
      timeout: 120,
    },
    deleteProducts: {
      handler: "src/handlers/products/delete.handler",
      events: [{ httpApi: { method: "delete", path: "/products" } }],
      timeout: 120,
    },
    getAttributes: {
      handler: "src/handlers/attributes/getAttributes.handler",
      events: [{ httpApi: { method: "get", path: "/attributes" } }],
    },
    createAttribute: {
      handler: "src/handlers/attributes/createAttribute.handler",
      events: [{ httpApi: { method: "post", path: "/attributes" } }],
      timeout: 120,
    },
    deleteAttribute: {
      handler: "src/handlers/attributes/deleteAttribute.handler",
      events: [
        { httpApi: { method: "delete", path: "/attributes/{attributeId}" } },
      ],
      timeout: 120,
    },
    enrichmentProcessor: {
      handler: "src/handlers/enrichment/processor.handler",
      events: [
        {
          sqs: {
            arn: {
              "Fn::GetAtt": ["EnrichmentQueue", "Arn"],
            },
            batchSize: 1, // Only one message at a time
          },
        },
      ],
      provisionedConcurrency: 2,
      reservedConcurrency: 2,
      timeout: 900,
    },
  },
  resources: {
    Resources: {
      EnrichmentQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "enrichmentQueue",
        },
      },
    },
  },
  package: { individually: true },
  custom: {
    "serverless-offline-sqs": {
      autoCreate: true,
      apiVersion: "2012-11-05",
      endpoint: "http://localhost:9324",
      region: "ap-southeast-1",
      queues: [
        {
          name: "enrichmentQueue",
        },
      ],
    },
  },
};

module.exports = serverlessConfiguration;
