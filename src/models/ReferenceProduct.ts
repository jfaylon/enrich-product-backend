import { Schema, model, Document, Types } from "mongoose";

export interface ReferenceProduct extends Document {
  _id: Types.ObjectId;
  source?: string; // e.g., 'openfoodfacts', 'amazon', 'custom'
  externalId?: string;
  name: string;
  brand?: string[];
  description?: string;
  imageUrl?: string;
  productUrl?: string;
  categories?: string[];
  tags?: string[];
  raw?: unknown; // original raw data (optional but useful for auditing)
  embedding: number[];
}

const ReferenceProductSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  source: { type: String }, // e.g. "openfoodfacts"
  externalId: { type: String, index: true }, // e.g. barcode or ASIN
  name: { type: String, required: true, index: true },
  brand: { type: [String] },
  description: { type: String },
  image_url: { type: String },
  product_url: { type: String },
  categories: [String],
  tags: [String],
  raw: Schema.Types.Mixed, // keep the original item for debugging/traceability
  embedding: {
    type: [Number],
    required: true,
  },
});

ReferenceProductSchema.index({ externalId: 1, source: 1 }, { unique: true });

export default model("ReferenceProduct", ReferenceProductSchema);
