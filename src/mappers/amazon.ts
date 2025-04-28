import { ReferenceProductDocument } from "../models/ReferenceProduct";

export function mapAmazonProduct(
  item: any,
  categories: Record<string, string>
): Partial<ReferenceProductDocument> {
  return {
    source: "amazon",
    externalId: item.asin, // ASIN is Amazon's unique identifier for products
    name: item.title,
    brand: item.brand?.split(",").map((c: string) => c.trim()) || [],
    description: item.description,
    imageUrl: item.image,
    productUrl: item.url,
    categories: categories[item.category_id]
      ? [categories[item.category_id]]
      : [],
    tags: [],
    raw: item,
  };
}
