import { mapOpenFoodFactsItem } from "./openfoodfacts";
import { mapAmazonProduct } from "./amazon";
import { ReferenceProduct } from "../models/ReferenceProduct";

export type ProductMapper = (
  item: any,
  categories: Record<string, string>
) => Partial<ReferenceProduct>;

export const productMappers: Record<string, ProductMapper> = {
  openfoodfacts: mapOpenFoodFactsItem,
  amazon: mapAmazonProduct,
};
