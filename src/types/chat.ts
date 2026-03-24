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

export interface HistoryConversation {
  conversation_id: string;
  summary: string | null;
  updated_at: number;
  turn_count: number;
}

export interface HistoryListResponse {
  conversations: HistoryConversation[];
  total: number;
  page: number;
  page_size: number;
}

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
  tools_called: string[];
  created_at: number;
}

export interface HistoryDetailResponse {
  conversation_id: string;
  summary: string | null;
  updated_at: number;
  turns: HistoryTurn[];
}
