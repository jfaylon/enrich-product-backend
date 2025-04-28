import { AttributeDocument } from "../models/Attribute";
import { ReferenceProductDocument } from "../models/ReferenceProduct";

type Product = {
  name: string;
  brand?: string;
  barcode?: string;
  images?: string[];
  description?: string;
  ingredients?: string[] | string;
  weight?: { value: number; unit: string } | string;
  storage?: string;
  width?: { value: number; unit: string };
  height?: { value: number; unit: string };
  items_per_package?: number;
  material?: string;
  color?: string;
  warranty?: { value: number; unit: string };
  [key: string]: any; // Dynamic fields
};

type PromptOptions = {
  product: Product;
  similarProducts?: ReferenceProductDocument[];
  targetAttributes: AttributeDocument[]; // Optional: for custom attributes to enrich
};

// Dynamically build fields to enrich based on available product attributes
const buildDynamicFields = (product: Product) => {
  const fields: string[] = [];

  // Iterate over all product attributes and dynamically add them to the enrichable fields list
  for (const key in product) {
    if (
      product[key] !== undefined &&
      key !== "name" &&
      key !== "brand" &&
      key !== "barcode" &&
      key !== "images"
    ) {
      fields.push(
        `- ${
          key.charAt(0).toUpperCase() + key.slice(1)
        } (type depends on the value)`
      );
    }
  }

  return fields;
};

const formatSimilarProduct = (
  product: ReferenceProductDocument,
  index: number
) => {
  const fields: (string | null | undefined)[] = [
    `#${index + 1}`,
    `Name: ${product.name}`,
    product.brand && `Brand: ${product.brand.join(", ")}`,
    product.description && `Description: ${product.description}`,
    product.imageUrl && `Image URL: ${product.imageUrl}`,
    product.productUrl && `Product URL: ${product.productUrl}`,
    product.categories && `Categories: ${product.categories.join(", ")}`,
    product.tags && `Tags: ${product.tags.join(", ")}`,
  ].filter(Boolean);
  return fields.join("\n");
};

const buildFieldsFromAttributes = (attributes: AttributeDocument[]): string => {
  return attributes
    .map((attr) => {
      const label = attr.label || attr.name;

      switch (attr.type) {
        case "short_text":
          return `- ${label} (short text less than 50 characters)`;
        case "long_text":
          return `- ${label} (long text. Must not be empty)`;
        case "rich_text":
          return `- ${label} (HTML format. Infer more details if not enough data. Must not be empty)`;
        case "number":
          return `- ${label} (number)`;
        case "single_select":
          return `- ${label} (select one: ${
            attr.options?.join(", ") || "no options"
          })`;
        case "multi_select":
          return `- ${label} (select multiple: ${
            attr.options?.join(", ") || "no options"
          })`;
        case "measure":
          return `- ${label} (measure in ${
            attr.unit || "unit"
          }. Number only for value)`;
        default:
          return `- ${label}`;
      }
    })
    .join("\n");
};

const buildJSONResponseFields = (
  product: Record<string, any>,
  attributes: AttributeDocument[]
): string => {
  const defaultExcluded = [
    "name",
    "brand",
    "barcode",
    "images",
    "_id",
    "createdAt",
    "updatedAt",
    "__v",
    "userId",
    "enrichmentStatus",
  ];

  // Base product fields (excluding core ones)
  const baseFields = Object.keys(product)
    .filter(
      (key) => product[key] !== undefined && !defaultExcluded.includes(key)
    )
    .map((key) => {
      const value = product[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return `"${key}": { "value": "...", "unit": "${
          value.unit || "unit"
        }" }`; // Use "..." placeholder
      }
      if (Array.isArray(value)) {
        return `"${key}": ["..."]`; // Use "..." placeholder for arrays
      }
      return `"${key}": "..."`; // Use "..." for simple types
    });

  // Dynamic attribute fields (based on schema)
  const attributeFields = attributes.map((attr) => {
    const key = attr.name;

    switch (attr.type) {
      case "measure":
        return `"${key}": { "value": "...", "unit": "${attr.unit || "unit"}" }`;
      case "number":
        return `"${key}": "..."`;
      case "single_select":
        return `"${key}": "..."`; // Placeholder for single select
      case "multi_select":
        return `"${key}": ["..."]`; // Placeholder for multi select
      default:
        return `"${key}": "..."`; // Placeholder for other types (short_text, long_text, etc.)
    }
  });

  return `{
  ${[...baseFields, ...attributeFields].join(",\n  ")}
}`;
};

export const buildProductEnrichmentPrompt = ({
  product,
  similarProducts = [],
  targetAttributes = [],
}: PromptOptions): string => {
  const images = product.images?.join(", ") ?? "None";
  // Dynamically build fields to enrich based on product attributes or the provided custom targetAttributes
  const fieldsToEnrich = targetAttributes.length
    ? buildFieldsFromAttributes(targetAttributes)
    : buildDynamicFields(product).join("\n");

  // Format similar products info if provided
  const formattedSimilar = similarProducts
    .map((p, i) => formatSimilarProduct(p, i))
    .join("\n\n");

  // Create the prompt
  return `
You are an AI assistant tasked with enriching product details.
Given the following product information, extract or infer the missing attributes.

Important Rules:
- If the field is a measure (e.g., weight, width, height, warranty), always format it as an object: { "value": number, "unit": string }.
- The "value" must be a numeric type (e.g., 0.5, 100), NOT a string. If no value found, put 0
- The "unit" must be a string like "kg", "g", "cm", etc. Use the unit found in fields to enrich.
- If the input measure is unclear, do your best to infer and separate the number and unit correctly.
- Do not return values like "0.5 kg" as a string — split into { value: 0.5, unit: "kg" }.
- When outputting a "measure" field, always output an object containing BOTH value (number) and unit (string). Even if the unit is missing, still include the unit field as an empty string. Example: { \"value\": 42, \"unit\": \"kg\" } or { \"value\": 5, \"unit\": \"\" }. Never omit the unit field. Always use the unit provided.
- Only respond with a valid JSON object, and nothing else.

Simple Field Extraction Rules:
- For attributes with short texts as such as color, material, brand, flavor, size, and similar fields, only extract and return the short value (word or phrase).
- Do not output full sentences, descriptions, or marketing phrases.
- Examples:
  - Correct: "green"
  - Correct: "cotton"
  - Correct: "Apple"
  - Incorrect: "The shirt is green."
  - Incorrect: "Made of high-quality cotton."
- Always respond with the clean value itself, without extra context.

### Product Info
Name: ${product.name}
Brand: ${product.brand ?? "N/A"}
Barcode: ${product.barcode ?? "N/A"}
Image URL(s): ${images}

### Fields to Enrich. Follow only the schema proivded
${fieldsToEnrich}

${similarProducts.length > 0 ? `### Similar Products\n${formattedSimilar}` : ""}

Only respond in a JSON format like:
${buildJSONResponseFields(product, targetAttributes)}
`.trim();
};
