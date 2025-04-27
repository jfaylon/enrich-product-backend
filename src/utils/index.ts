import axios from "axios";
import { SourceInterfaces } from "../interfaces";
import sharp from "sharp";
import { Writable } from "stream";

const getSource = (data: SourceInterfaces): string => {
  if ("code" in data && "product_name" in data) return "openfoodfacts";
  if ("asin" in data && "title" in data) return "amazon";
  return "custom";
};

const retry = async (
  fn: Function,
  retries: number = 3,
  delay: number = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(); // Try to run the function
    } catch (error) {
      lastError = error; // Save the last error
      if (attempt === retries) {
        throw error; // If we've exhausted retries, throw the error
      }
      // Delay and try again
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff (doubling the delay each time)
    }
  }

  throw lastError; // This line is reached if the retries are exhausted
};

const getBufferDataFromImage = async (
  imageUrl: string
): Promise<string | undefined> => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data);

    // // Detect mime type
    // let mimeType = "image/jpeg"; // default
    // if (buffer.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    //   mimeType = "image/jpeg";
    // } else if (
    //   buffer.slice(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) &&
    //   buffer.slice(8, 12).toString() === "WEBP"
    // ) {
    //   mimeType = "image/webp";
    // } else if (
    //   buffer
    //     .slice(0, 8)
    //     .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    // ) {
    //   mimeType = "image/png";
    // }

    return buffer.toString("base64");
    // return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    return undefined;
  }
};

async function fetchImageAsUint8Array(url: string): Promise<Uint8Array> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const resizedBuffer = await sharp(response.data)
      .resize(384, 384, { fit: "inside" })
      .toFormat("jpeg", { quality: 75 })
      .toBuffer();

    return new Uint8Array(resizedBuffer);
  } catch (error) {
    return new Uint8Array();
  }
}

async function prepareLlavaChatMessages(prompt: string, imageUrls: string[]) {
  const imageBuffers = await Promise.all(
    imageUrls.map((url) => fetchImageAsUint8Array(url))
  );

  const messages = [
    {
      role: "user",
      content: prompt,
      images: imageBuffers.filter((buffer) => buffer.length), // This now matches `Uint8Array[]`
    },
  ];

  return messages;
}

export const consumeStream = () =>
  new Writable({
    objectMode: true,
    write(_chunk, _encoding, callback) {
      // Just consume — no-op
      callback();
    },
  });

export default {
  consumeStream,
  getSource,
  retry,
  getBufferDataFromImage,
  fetchImageAsUint8Array,
  prepareLlavaChatMessages,
};
