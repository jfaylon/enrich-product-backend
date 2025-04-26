import { model, Schema, Document } from "mongoose";

interface Measure {
  value: number;
  unit: string;
}

type AttributeValue = string | number | string[] | Measure;

export interface ProductDocument extends Document {
  userId: string;
  name: string;
  brand?: string;
  barcode?: string;
  images?: string[];
  attributes: {
    [key: string]: AttributeValue;
  };
}

const ProductSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    brand: { type: String },
    barcode: { type: String },
    images: [String],
    attributes: { type: Schema.Types.Mixed, default: {} },
    enrichmentStatus: {
      type: String,
      enum: ["not_started", "pending", "completed"], // add processing if necessary
      default: "not_started",
    },
  },
  { timestamps: true }
);

export default model("Product", ProductSchema);
