import { SQSEvent } from "aws-lambda";
import "../../utils/bootstrap";
import { buildProductEnrichmentPrompt } from "../../utils/promptBuilder";
import { formatAttributesFromResponse } from "../../utils/responseParser";
import llm from "../../llms";
import { searchSimilarVectors } from "../../services/QdrantService";
import { updateProductEnrichment } from "../../services/ProductService";
import { getReferenceProducts } from "../../services/ReferenceProductService";

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      const { product, attributes } = payload;

      const embeddingPrompt = `${product.name} ${product.brand || ""} ${
        product.externalId || ""
      }`;
      const embedding = await llm("ollama").embed(embeddingPrompt);
      
      // #TODO: Add a factory for choosing which vector search service
      const similarProductVectorData = await searchSimilarVectors(embedding);
      const similarProductIds: string[] = similarProductVectorData.map(
        (product) => product.payload?.mongoId
      ) as string[];
      const similarProducts = similarProductIds.length
        ? await getReferenceProducts(similarProductIds)
        : undefined;
      const prompt = buildProductEnrichmentPrompt({
        product,
        similarProducts,
        targetAttributes: attributes,
      });
      const llmResponse = await llm("ollama").generate({
        model: "llava",
        prompt,
        images:
          product.images && product.images.length > 0
            ? product.images
            : undefined,
      });
      const attributesResponse = formatAttributesFromResponse(
        llmResponse.output
      );

      const currentProduct = await updateProductEnrichment(
        product._id,
        "completed",
        attributesResponse
      );
      logger.info(currentProduct);
      logger.info("Batch enrichment complete.");
    } catch (error) {
      logger.error("Failed to process message:");
      logger.error(error);
      throw error; // rethrow so SQS retries the message
    }
  }
};
