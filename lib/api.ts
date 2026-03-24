import type { ChatRequest, ChatResponse, HistoryDetailResponse, HistoryListResponse } from "../types/chat";

const CHAT_API_URL = "/api/chat";
const HISTORY_API_URL = "/api/history";

export async function sendChatMessage(
  message: string,
  serviceToken: string,
  conversationId?: string | null,
): Promise<ChatResponse> {
  const payload: ChatRequest = {
    message,
    conversation_id: conversationId,
    service_token: serviceToken,
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

export async function fetchHistoryList(
  page = 1,
  pageSize = 20,
): Promise<HistoryListResponse> {
  const response = await fetch(
    `${HISTORY_API_URL}?page=${page}&page_size=${pageSize}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch history list.");
  }

  return (await response.json()) as HistoryListResponse;
}

export async function fetchHistoryDetail(
  conversationId: string,
): Promise<HistoryDetailResponse | null> {
  const response = await fetch(`${HISTORY_API_URL}/${conversationId}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch conversation detail.");
  }

  return (await response.json()) as HistoryDetailResponse;
}