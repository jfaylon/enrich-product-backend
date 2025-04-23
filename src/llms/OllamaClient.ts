import { LLMClient, GenerateOptions, GenerateResult } from "../interfaces";
import ollama, { Message } from "ollama";
import utils from "../utils";

const OllamaClient: LLMClient = {
  generate: async ({
    model,
    prompt,
    images,
  }: GenerateOptions): Promise<GenerateResult> => {
    let response;

    if (images) {
      console.log("went here");
      const messages = await utils.prepareLlavaChatMessages(prompt, images);
      // const messages: Message[] = [
      //   { role: "system", content: "Process these images and text." },
      //   { role: "user", content: [
      //     { type: "image_url", image_url: { url: image } },
      //     { type: "text", text: prompt },
      //   } ],
      // ];
      // for (const image of images) {
      //   messages.push({
      //     role: "user",
      //     content: "image used to support the data",
      //     images: [image],
      //   });
      // }
      response = await ollama.chat({
        model,
        messages,
      });
      console.log(response);
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
};

export default OllamaClient;
