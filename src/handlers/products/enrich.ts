import { APIGatewayProxyHandler } from "aws-lambda";
import "../../utils/bootstrap";
import { retrieveUserId } from "../../services/UserService";
import Product, { ProductDocument } from "../../models/Product";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import Attribute from "../../models/Attribute";
import { EnrichProductMessagePayload } from "../../interfaces";
const ENRICHMENT_QUEUE_URL = process.env.ENRICHMENT_QUEUE_URL;

const sqs = new SQSClient({ region: "ap-southeast-1" }); // Match your config

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = retrieveUserId(event);

    const requestBody = JSON.parse(event.body || "[]");
    const { productIds } = requestBody;
    console.log(productIds);
    const attributes = await Attribute.find({ userId }).lean();
    if (!attributes.length) {
      throw new Error("No attributes to enrich. Please create an attribute");
    }

    const products = await Product.find({ _id: productIds, userId });
    await Promise.all(
      products.map(async (product) => {
        const payload: EnrichProductMessagePayload = {
          product: product.toObject(),
          attributes,
        };
        const command = new SendMessageCommand({
          QueueUrl: ENRICHMENT_QUEUE_URL,
          MessageBody: JSON.stringify(payload),
        });

        try {
          const result = await sqs.send(command);
          product.enrichmentStatus = "pending";
          await product.save();
          console.log("Message sent to SQS", result.MessageId);
        } catch (err) {
          console.error("Failed to send message to SQS", err);
          throw err;
        }
      })
    );
    return {
      statusCode: 200,
      body: "",
    };
  } catch (err) {
    console.error("Enrichment failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Enrich failed",
        detail: (err as Error).message,
      }),
    };
  }
};
