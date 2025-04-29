import { SortOrder } from "mongoose";
import Product from "../models/Product";

export const updateProductEnrichment = async (
  productId: string,
  status: string,
  attributesResponse?: Record<string, unknown>
) => {
  return await Product.findByIdAndUpdate(productId, {
    $set: {
      attributes: attributesResponse,
      enrichmentStatus: status,
    },
  });
};

export const deleteProducts = async (productIds: string[], userId: string) => {
  return await Product.deleteMany({
    _id: { $in: productIds },
    userId,
  });
};

export const getProductDocuments = async (
  productIds: string[],
  userId: string
) => {
  return await Product.find({ _id: productIds, userId });
};

export const listProducts = async (
  filter: Record<
    string,
    | string
    | { $regex: string; $options: string }
    | { $in: string[] }
    | string[]
    | number
  >,
  sort: Record<string, SortOrder>,
  skip: number,
  limit: number
) => {
  return await Product.find(filter)
    .collation({ locale: "en", strength: 2 })
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();
};

export const countProductDocuments = async (
  filter: Record<
    string,
    | string
    | { $regex: string; $options: string }
    | { $in: string[] }
    | string[]
    | number
  >
) => {
  return await Product.countDocuments(filter);
};
