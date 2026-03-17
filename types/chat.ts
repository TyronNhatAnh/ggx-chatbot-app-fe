export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  service_token: string;
}

export interface ChatResponse {
  reply: string;
  conversation_id: string;
}
