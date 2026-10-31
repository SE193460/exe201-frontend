import axiosInstance from "../axiosConfig";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantReply = {
  reply: string;
  source: "llm" | "offline";
};

/** Ask the Roomie AI assistant. Works for guests (no account required). */
export async function askAssistant(messages: AssistantMessage[]) {
  const response = await axiosInstance.post("/api/assistant/chat", { messages });
  return response.data as AssistantReply;
}
