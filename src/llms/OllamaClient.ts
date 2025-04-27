import { LLMClient, GenerateOptions, GenerateResult } from "../interfaces";
import ollama from "ollama";
import utils from "../utils";

const OllamaClient: LLMClient = {
  generate: async ({
    model,
    prompt,
    images,
  }: GenerateOptions): Promise<GenerateResult> => {
    let response;

    if (images) {
      const messages = await utils.prepareLlavaChatMessages(prompt, images);
      response = await ollama.chat({
        model,
        messages,
      });
      return {
        raw: response.message.content,
        output: response.message.content.trim(),
      };
    }

    if (prompt) {
      response = await ollama.generate({
        model,
        prompt,
      });

      return {
        raw: response.response,
        output: response.response.trim(),
      };
    }

    throw new Error("Either prompt or messages must be provided.");
  },
  embed: async (input: string): Promise<number[]> => {
    const response = await utils.retry(() =>
      ollama.embeddings({
        model: "nomic-embed-text",
        prompt: input,
      })
    );
    return response.embedding;
  },
};

export default OllamaClient;
