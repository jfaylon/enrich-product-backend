import { AttributeDocument } from "../models/Attribute";
import { ProductDocument } from "../models/Product";

interface SourceInterfaces {
  asin?: string; // amazon
  title?: string; // amazon
  code?: string; // openfoodfacts
  product_name?: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
}

export interface GenerateOptions {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  images?: string[];
}

export interface GenerateResult {
  raw: string;
  output: string;
}

export interface EnrichProductMessagePayload {
  product: Partial<ProductDocument>;
  attributes: Partial<AttributeDocument>[];
}

export interface UploadedFile {
  fieldname: string;
  filename: string;
  fileBuffer: Buffer;
  mimeType: string;
}

interface LLMClient {
  generate: (options: GenerateOptions) => Promise<GenerateResult>;
  embed: (input: string) => Promise<number[]>;
}

export type { SourceInterfaces, LLMClient };
