import OllamaClient from "./OllamaClient";
import { LLMClient } from "../interfaces";

type ProviderType = "ollama"; // Add more as needed

const LLMFactory = (provider: ProviderType): LLMClient => {
  switch (provider) {
    case "ollama":
      return OllamaClient;
    default:
      throw new Error(`LLM provider '${provider}' is not supported`);
  }
};

export default LLMFactory;
