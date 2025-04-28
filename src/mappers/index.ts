import { mapOpenFoodFactsItem } from "./openfoodfacts";
import { mapAmazonProduct } from "./amazon";
import { ReferenceProductDocument } from "../models/ReferenceProduct";

export type ProductMapper = (
  item: any,
  categories: Record<string, string>
) => Partial<ReferenceProductDocument>;

export const productMappers: Record<string, ProductMapper> = {
  openfoodfacts: mapOpenFoodFactsItem,
  amazon: mapAmazonProduct,
};
