import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import "../../utils/bootstrap";
import { retrieveUserId } from "../../services/UserService";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { EnrichProductMessagePayload } from "../../interfaces";
import { getProductDocuments } from "../../services/ProductService";
import { getAttributes } from "../../services/AttributeService";
const ENRICHMENT_QUEUE_URL = process.env.ENRICHMENT_QUEUE_URL;

const sqs = new SQSClient({ region: "ap-southeast-1" }); // Match your config

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const userId = retrieveUserId(event);

    const requestBody = JSON.parse(event.body || "{}");
    const { productIds } = requestBody;
    const attributes = await getAttributes(userId);
    if (!attributes.length) {
      throw new Error("No attributes to enrich. Please create an attribute");
    }

    const products = await getProductDocuments(productIds, userId);
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
          logger.info(result.MessageId, "Message sent to SQS");
        } catch (err) {
          logger.error(err, "Failed to send message to SQS");
          throw err;
        }
      })
    );
    return {
      statusCode: 200,
      body: "",
    };
  } catch (err) {
    logger.error(err, "Enrichment failed:");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Enrich failed",
        detail: (err as Error).message,
      }),
    };
  }
};
