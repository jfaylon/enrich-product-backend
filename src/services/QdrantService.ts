import { QdrantClient } from "@qdrant/js-client-rest";
import { ReferenceProduct } from "../models/ReferenceProduct";
import { randomUUID } from "crypto";

const COLLECTION_NAME = "products";
const VECTOR_DIMENSION = 768; // Update if your model outputs a different size

export const qdrant = new QdrantClient({
  url: "http://localhost:6333",
});

export const initQdrantCollection = async (): Promise<void> => {
  const { collections } = await qdrant.getCollections();

  const exists = collections.some((col) => col.name === COLLECTION_NAME);
  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_DIMENSION,
        distance: "Cosine",
      },
    });
    logger.info(`[Qdrant] Collection "${COLLECTION_NAME}" created`);
  } else {
    logger.info(`[Qdrant] Collection "${COLLECTION_NAME}" already exists`);
  }
};

export const upsertVector = async (
  id: string,
  vector: number[],
  payload?: Record<string, any>
): Promise<void> => {
  console.log(id);
  const point = {
    id,
    vector,
    payload,
  };

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: [point],
  });
};

export const upsertManyToQdrant = async (
  products: Partial<ReferenceProduct>[]
) => {
  if (products.length === 0) return;

  await qdrant.upsert(COLLECTION_NAME, {
    points: products.map((p) => ({
      id: randomUUID(),
      vector: p.embedding!,
      payload: {
        mongoId: p._id!.toString(),
        externalId: p.externalId,
        name: p.name,
      },
    })),
  });
};

export const searchSimilarVectors = async (
  vector: number[],
  limit = 5,
  filter?: Record<string, any>
): Promise<
  {
    id: string;
    score: number;
    payload?: Record<string, unknown> | null;
  }[]
> => {
  const searchParams: any = {
    vector,
    limit,
    score_threshold: 0.75,
  };

  if (filter) {
    searchParams.filter = filter;
  }

  const result = await qdrant.search(COLLECTION_NAME, searchParams);
  return result.map((r) => ({
    id: r.id as string,
    score: r.score,
    payload: r.payload,
  }));
};
