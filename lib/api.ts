import type { ChatRequest, ChatResponse } from "../types/chat";

const CHAT_API_URL = "/api/chat";

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
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to send chat message.");
  }

  return (await response.json()) as ChatResponse;
}