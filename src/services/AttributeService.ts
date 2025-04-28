import Attribute, { AttributeDocument } from "../models/Attribute";

export const getAttributes = async (userId: string) => {
  return await Attribute.find({ userId }).lean();
};

export const createAttribute = async (
  data: Partial<AttributeDocument>,
  userId: string
) => {
  return await Attribute.create({
    ...data,
    userId,
  });
};

export const deleteAttribute = async (attributeId: string, userId: string) => {
  await Attribute.deleteOne({ _id: attributeId, userId });
};
