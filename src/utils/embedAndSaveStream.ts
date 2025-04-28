// EmbedAndSaveStream.ts
import { Transform } from "stream";
import ollama from "ollama";
import { ReferenceProductDocument } from "../models/ReferenceProduct";
import Utils from "./index";
import { productMappers } from "../mappers";
import { upsertManyToQdrant } from "../services/QdrantService";
import { Types } from "mongoose";
import { insertReferenceProducts } from "../services/ReferenceProductService";

// Define the transform stream for embedding and saving

const BATCH_SIZE = 50;
let batch: Partial<ReferenceProductDocument>[] = [];

export const embedAndSaveStream = (categories: Record<string, string>) => {
  return new Transform({
    objectMode: true,
    async transform(data, encoding, callback) {
      try {
        const source = Utils.getSource(data);
        const mapper = productMappers[source];
        const mappedData = mapper(data, categories);
        if (!mappedData.name) {
          logger.warn(`No name found. Skipping.. ${mappedData.externalId}`);
          return callback(null, data);
        }

        const prompt = `${mappedData.name} ${mappedData.categories?.join(
          " "
        )} ${mappedData.brand?.join(" ")} ${mappedData.externalId}`;
        const response = await Utils.retry(() =>
          ollama.embeddings({
            model: "nomic-embed-text",
            prompt: prompt,
          })
        );
        const embedding = response.embedding; // Get the embedding for the product

        // // Save to MongoDB
        const _id = new Types.ObjectId();
        batch.push({
          _id,
          ...mappedData,
          embedding,
        });
        if (batch.length >= BATCH_SIZE) {
          await saveBatch(batch);
          batch = [];
        }
        logger.info(`Saved: ${mappedData.externalId}`);

        // Push the transformed data (product) to the next step in the pipeline
        return callback(null, data); // You can also pass the modified data if needed for later steps
      } catch (error) {
        logger.error((error as Error).message);
        logger.error(`Error processing ${JSON.stringify(data)}:`, error);
        callback(error as Error); // In case of error, we should pass it to the callback to handle backpressure
      }
    },
    async flush(callback) {
      try {
        if (batch.length > 0) {
          await saveBatch(batch);
          batch = [];
        }
        logger.info("Triggered flush");
        return callback();
      } catch (err) {
        return callback(err as Error);
      }
    },
  });
};

const saveBatch = async (products: Partial<ReferenceProductDocument>[]) => {
  logger.info("executing batch upload");
  const productIds = products.map((product) => product.externalId);
  logger.info(productIds);
  await Promise.all([
    insertReferenceProducts(products),
    upsertManyToQdrant(products),
  ]);
  logger.info("Triggered batch upload");
};
