export const formatAttributesFromResponse = (
  responseText: string
): Record<string, unknown> => {
  try {
    const jsonStart = responseText.indexOf("{");
    const jsonEnd = responseText.lastIndexOf("}");
    const json = responseText.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(json);
  } catch {
    return { error: "Failed to parse LLM output" };
  }
};
