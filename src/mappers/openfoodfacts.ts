import { ReferenceProductDocument } from "../models/ReferenceProduct";

export function mapOpenFoodFactsItem(item: any): Partial<ReferenceProductDocument> {
  return {
    source: "openfoodfacts",
    externalId: item.code, // barcode
    name: item.product_name,
    brand: item.brands?.split(",").map((c: string) => c.trim()) || [],
    description: item.ingredients_text,
    imageUrl: item.image_url,
    productUrl: item.url,
    categories: item.categories?.split(",").map((c: string) => c.trim()) || [],
    tags: item.labels_en?.split(",").map((t: string) => t.trim()) || [],
    raw: item,
  };
}
