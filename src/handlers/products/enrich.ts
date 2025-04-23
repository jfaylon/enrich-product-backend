import { APIGatewayProxyHandler } from "aws-lambda";
import "../../utils/bootstrap";
import llm from "../../llms";
import { createPromptFromProduct } from "../../utils/promptBuilder";
import { formatAttributesFromResponse } from "../../utils/responseParser";
import utils from "../../utils";
import { retrieveUserId } from "../../services/UserService";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = retrieveUserId(event);

    const productIds = JSON.parse(event.body || "[]");
    const products = 
    const enriched = await Promise.all(
      products.map(async (product) => {
        const prompt = createPromptFromProduct(product);
        const llmResponse = await llm("ollama").generate({
          model: "llava",
          prompt,
          images:
            product.images && product.images.length > 0
              ? product.images
              : undefined,
        });
        const attributes = formatAttributesFromResponse(llmResponse.output);
        return {
          ...product,
          attributes,
        };
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=enriched-products.json`,
      },
      body: JSON.stringify(enriched, null, 2),
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
