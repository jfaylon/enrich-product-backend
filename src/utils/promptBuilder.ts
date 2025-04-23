export const createPromptFromProduct = (product) => {
  return `
You are an AI assistant tasked with enriching product details.
Given the following product information, extract or infer the missing attributes:

Name: ${product.name}
Brand: ${product.brand}
Barcode: ${product.barcode}
Image URL: ${product.images.join(",")}

Enrich the following fields:
- Product Description (rich HTML text)
- Summary (less than 50 characters)
- Ingredients (simple text, if food. Not applicable if there is materials)
- Item Weight
- Storage Requirements (Options: Dry Storage [if keep dry], Deep Frozen [if needs deep freezing], Ambient Storage [if can be kept at room temperature], Frozen Food Storage [if it needs to be in a freezer])
- Width / Height (if applicable)
- Items per Package
- Material (if non-food, not applicable if there are ingredients found)
- Color (descriptive word such as red or blue or yellow)
- Warranty (if applicable, 0 if not applicable)


Only respond in a JSON format like:
{
  "summary": "...",
  "description": "...",
  "ingredients": [...],
  "weight": { "value": ..., "unit": "g" },
  "storage": "...",
  "items_per_package": ...,
  "color": "...",
  "material": "...",
  "width": { "value": ..., "unit": "cm" },
  "height": { "value": ..., "unit": "cm" },
  "warranty": {"value": ..., "unit": "years" }, 
}
`;
};
