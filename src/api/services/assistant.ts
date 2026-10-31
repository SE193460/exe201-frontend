import axiosInstance from "../axiosConfig";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantLanguage = "vi" | "en" | "ja";

export type AssistantReply = {
  reply: string;
  source: "llm" | "offline";
  language: AssistantLanguage;
};

/** Map an i18next language tag (e.g. `en-US`) to a supported assistant language. */
export function toAssistantLanguage(language?: string): AssistantLanguage {
  const value = (language ?? "").toLowerCase();
  if (value.startsWith("en")) return "en";
  if (value.startsWith("ja") || value.startsWith("jp")) return "ja";
  return "vi";
}

/**
 * Ask the Roomie assistant. Pass the visitor's current UI language so the
 * assistant answers in that language. Public — works for guests too.
 */
export async function askAssistant(
  messages: AssistantMessage[],
  language: AssistantLanguage = "vi"
): Promise<AssistantReply> {
  const res = await axiosInstance.post("/api/assistant/chat", { messages, language });
  return res.data;
}
