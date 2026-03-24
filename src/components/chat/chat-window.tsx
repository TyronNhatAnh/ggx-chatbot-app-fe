"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchHistoryDetail, fetchHistoryList, sendChatMessage } from "@/lib/api";
import type { ChatMessage, HistoryConversation } from "@/types/chat";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { MessageBubble } from "./message-bubble";

const SERVICE_TOKEN_KEY = "chat-service-token";

type UIChatMessage = ChatMessage & { createdAt: string };

type ChatWindowProps = {
  initialConversationId: string;
};

function getCurrentTimeLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function formatTimestamp(unixTs: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(unixTs * 1000));
}

export function ChatWindow({ initialConversationId }: ChatWindowProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<UIChatMessage[]>([]);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serviceToken, setServiceToken] = useState("");
  const [tokenTouched, setTokenTouched] = useState(false);
  const [history, setHistory] = useState<HistoryConversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const result = await fetchHistoryList();
      setHistory(result.conversations);
      return result.conversations;
    } catch {
      toast.error("Failed to load conversation history.");
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadConversationMessages(id: string) {
    try {
      const detail = await fetchHistoryDetail(id);
      if (!detail || detail.turns.length === 0) return;
      setApiError(null);
      setMessages(
        detail.turns.map((turn) => ({
          role: turn.role,
          content: turn.content,
          createdAt: formatTimestamp(turn.created_at),
        })),
      );
      setConversationId(detail.conversation_id);
    } catch {
      toast.error("Failed to load conversation messages.");
      setApiError("Could not connect to the backend service. Please check your connection and try again.");
    }
  }

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    setConversationId(initialConversationId);
    setMessages([]);
    setApiError(null);
    setLoading(false);

    void (async () => {
      const conversations = await loadHistory();
      const exists = conversations.some(
        (c) => c.conversation_id === initialConversationId,
      );
      if (exists) {
        void loadConversationMessages(initialConversationId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SERVICE_TOKEN_KEY);
    if (stored) setServiceToken(stored);
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(SERVICE_TOKEN_KEY, serviceToken);
  }, [serviceToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleServiceTokenChange(value: string) {
    setServiceToken(value);
    if (!tokenTouched) setTokenTouched(true);
  }

  async function handleSend(message: string) {
    if (loading) return;

    if (!serviceToken.trim()) {
      setTokenTouched(true);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: message, createdAt: getCurrentTimeLabel() },
    ]);
    setLoading(true);

    try {
      const response = await sendChatMessage(
        message,
        serviceToken.trim(),
        conversationId,
      );
      setApiError(null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          createdAt: getCurrentTimeLabel(),
        },
      ]);
      setConversationId(response.conversation_id);
      void loadHistory();
    } catch {
      toast.error("Could not reach the chat service. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't reach the chat service. Please try again.",
          createdAt: getCurrentTimeLabel(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function getLatestUserMessage() {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return null;
  }

  async function handleRegenerate() {
    if (loading) return;
    if (!serviceToken.trim()) {
      setTokenTouched(true);
      return;
    }

    const latestUserMessage = getLatestUserMessage();
    if (!latestUserMessage) return;

    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      if (next[next.length - 1]?.role === "assistant") next.pop();
      return next;
    });

    setLoading(true);

    try {
      const response = await sendChatMessage(
        latestUserMessage,
        serviceToken.trim(),
        conversationId,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          createdAt: getCurrentTimeLabel(),
        },
      ]);
      setConversationId(response.conversation_id);
      void loadHistory();
    } catch {
      toast.error("Could not regenerate the response. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't regenerate the response. Please try again.",
          createdAt: getCurrentTimeLabel(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const latestAssistantIndex = messages.reduce<number>(
    (last, msg, idx) => (msg.role === "assistant" ? idx : last),
    -1,
  );
  const canRegenerate = !loading && messages.some((m) => m.role === "user");
  const hasServiceToken = Boolean(serviceToken.trim());
  const currentSummary =
    history.find((c) => c.conversation_id === conversationId)?.summary ?? null;
  const shortId = `${conversationId.slice(0, 8)}-${conversationId.slice(-4)}`;

  // ── Render ────────────────────────────────────────────────────────────────

  const sidebarSlot = (
    <ChatSidebar
      conversationId={conversationId}
      history={history}
      historyLoading={historyLoading}
      serviceToken={serviceToken}
      tokenTouched={tokenTouched}
      onServiceTokenChange={handleServiceTokenChange}
      isLoading={loading}
    />
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-[#24211c]">
      <div className="mx-auto flex h-full w-full overflow-hidden border border-[#4a4237] bg-[#211c17] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">

        {/* Desktop sidebar */}
        <aside className="hidden h-full w-[320px] shrink-0 md:block">
          {sidebarSlot}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <aside className="flex h-full w-80 max-w-[85vw] flex-col shadow-2xl">
              <div className="border-b border-white/10 bg-[#171412] px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                  Close
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">{sidebarSlot}</div>
            </aside>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="h-full flex-1 bg-black/70"
            />
          </div>
        )}

        {/* Main chat area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f2f0ec] text-[#2d2a25]">

          {/* Header */}
          <header className="border-b border-[#ddd5ca] bg-[#f2f0ec] px-6 py-4 md:px-9">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
              <h1 className="truncate text-xl font-semibold tracking-tight text-[#201d18] md:text-2xl">
                {currentSummary ?? "New conversation"}
              </h1>

              <div className="flex shrink-0 items-center gap-3">
                <Badge
                  variant="secondary"
                  className="hidden font-mono text-xs text-[#b4aca0] md:inline-flex"
                >
                  {shortId}
                </Badge>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden"
                  aria-label="Open sidebar"
                >
                  <Menu size={16} />
                  Menu
                </Button>
              </div>
            </div>
          </header>

          {/* Token warning */}
          {!hasServiceToken && tokenTouched && (
            <div className="mx-auto mt-3 w-full max-w-5xl px-6 md:px-9">
              <div className="rounded-xl border border-amber-700/30 bg-amber-100 px-4 py-2 text-sm text-amber-900">
                Please set a valid service token in the sidebar before sending
                messages.
              </div>
            </div>
          )}

          {/* Message list */}
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 md:px-8 md:py-6">
            <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#d8d1c6] bg-[#f4f2ee] shadow-[0_10px_30px_rgba(45,41,35,0.08)]">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 md:px-9">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                  {messages.length === 0 ? (
                    apiError ? (
                      <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-3xl border border-red-200 bg-red-50 px-6 py-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" />
                            <path d="M12 7v5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="12" cy="16" r="0.75" fill="#ef4444" />
                          </svg>
                        </div>
                        <p className="text-base font-medium text-red-700">Connection Error</p>
                        <p className="max-w-sm text-sm text-red-500">{apiError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setApiError(null);
                            void (async () => {
                              const conversations = await loadHistory();
                              const exists = conversations.some(
                                (c) => c.conversation_id === conversationId,
                              );
                              if (exists) {
                                void loadConversationMessages(conversationId);
                              }
                            })();
                          }}
                          className="mt-1 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-[#cfc7bb] bg-[#f0ece5] text-base text-[#8f8578]">
                        Start a conversation.
                      </div>
                    )
                  ) : (
                    messages.map((message, index) => (
                      <MessageBubble
                        key={`${message.role}-${index}`}
                        role={message.role}
                        content={message.content}
                        showAssistantActions={message.role === "assistant"}
                        showUserActions={message.role === "user"}
                        showRegenerate={index === latestAssistantIndex}
                        onRegenerate={handleRegenerate}
                        canRegenerate={canRegenerate && hasServiceToken}
                        timestamp={message.createdAt}
                      />
                    ))
                  )}

                  {loading && (
                    <MessageBubble role="assistant" content="" isTyping />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input bar */}
              <div className="border-t border-[#dbd4c9] bg-[#f4f2ee] px-4 py-4 md:px-6">
                <div className="mx-auto w-full max-w-4xl">
                  <ChatInput
                    onSend={handleSend}
                    disabled={!hasServiceToken}
                    placeholder="Type a message..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
