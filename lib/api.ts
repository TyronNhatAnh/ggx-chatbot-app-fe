import type { ChatRequest, ChatResponse } from "../types/chat";

const CHAT_API_URL = "http://localhost:8000/chat";
const CHAT_API_KEY = "demo-key";

export async function sendChatMessage(
  message: string,
  conversationId?: string | null,
): Promise<ChatResponse> {
  const payload: ChatRequest = {
    message,
    conversation_id: conversationId,
  };

  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": CHAT_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as ChatResponse;
}