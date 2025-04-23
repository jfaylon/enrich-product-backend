import mongoose, { Schema, Document } from "mongoose";

export interface AttributeDocument extends Document {
  userId: string;
  name: string;
  label: string;
  type:
    | "short_text"
    | "long_text"
    | "rich_text"
    | "number"
    | "single_select"
    | "multi_select"
    | "measure";
  options?: string[]; // for select types
  unit?: string; // for measure
  required?: boolean;
}

const AttributeSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true }, // internal key
    label: { type: String, required: true }, // display name
    type: {
      type: String,
      required: true,
      enum: [
        "short_text",
        "long_text",
        "rich_text",
        "number",
        "single_select",
        "multi_select",
        "measure",
      ],
    },
    options: { type: [String], default: undefined },
    unit: { type: String },
    required: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<AttributeDocument>("Attribute", AttributeSchema);
