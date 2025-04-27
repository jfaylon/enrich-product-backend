import { SQSEvent } from "aws-lambda";
import "../../utils/bootstrap";
import Product, { ProductDocument } from "../../models/Product";
import { buildProductEnrichmentPrompt } from "../../utils/promptBuilder";
import { formatAttributesFromResponse } from "../../utils/responseParser";
import llm from "../../llms";
import { QdrantClient } from "@qdrant/js-client-rest";
import { searchSimilarVectors } from "../../services/QdrantService";
import ReferenceProduct from "../../models/ReferenceProduct";

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      const { product, attributes } = payload;
      // get similar products

      const embeddingPrompt = `${product.name} ${product.brand || ""} ${
        product.externalId || ""
      }`;
      const embedding = await llm("ollama").embed(embeddingPrompt);
      const similarProductVectorData = await searchSimilarVectors(embedding);
      const similarProductIds = similarProductVectorData.map(
        (product) => product.payload?.mongoId
      );
      const similarProducts = similarProductIds.length
        ? await ReferenceProduct.find({
            _id: similarProductIds,
          })
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
      const currentProduct = await Product.findByIdAndUpdate(product._id, {
        $set: {
          attributes: attributesResponse,
          enrichmentStatus: "completed",
        },
      });

      console.log(currentProduct);

      // if (!Array.isArray(productIds) || productIds.length === 0) {
      //   console.warn("No valid productIds found in the message");
      //   continue;
      // }

      // for (const productId of productIds) {
      //   console.log(`Enriching product: ${productId}`);
      //   await enrichProduct(productId); // your business logic
      // }

      console.log("Batch enrichment complete.");
    } catch (error) {
      console.error("Failed to process message:", error);
      throw error; // rethrow so SQS retries the message
    }
  }
};
