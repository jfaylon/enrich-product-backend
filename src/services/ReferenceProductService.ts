import ReferenceProduct, {
  ReferenceProductDocument,
} from "../models/ReferenceProduct";

export const getReferenceProducts = async (similarProductIds: string[]) => {
  return await ReferenceProduct.find({
    _id: similarProductIds,
  });
};

export const insertReferenceProducts = async (
  products: Partial<ReferenceProductDocument>[]
) => {
  try {
    return await ReferenceProduct.insertMany(products, {
      ordered: false,
      throwOnValidationError: true,
    });
  } catch (error) {
    throw error;
  }
};
