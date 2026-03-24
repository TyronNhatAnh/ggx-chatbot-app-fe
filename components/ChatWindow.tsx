"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchHistoryDetail, fetchHistoryList, sendChatMessage } from "../lib/api";
import type { ChatMessage, HistoryConversation } from "../types/chat";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";

const SERVICE_TOKEN_STORAGE_KEY = "chat-service-token";

type UIChatMessage = ChatMessage & {
  createdAt: string;
};

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

function formatHistoryDate(unixTs: number): string {
  const date = new Date(unixTs * 1000);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return `Today · ${formatTimestamp(unixTs)}`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-GB", { weekday: "long" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function createConversationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatWindow({ initialConversationId }: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<UIChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>(
    initialConversationId,
  );
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serviceToken, setServiceToken] = useState("");
  const [tokenTouched, setTokenTouched] = useState(false);
  const [history, setHistory] = useState<HistoryConversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const result = await fetchHistoryList();
      setHistory(result.conversations);
    } catch {
      // silently fail — sidebar shows empty state
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadConversationMessages(id: string) {
    try {
      const detail = await fetchHistoryDetail(id);
      if (!detail || detail.turns.length === 0) return;
      setMessages(
        detail.turns.map((turn) => ({
          role: turn.role,
          content: turn.content,
          createdAt: formatTimestamp(turn.created_at),
        })),
      );
      setConversationId(detail.conversation_id);
    } catch {
      // new conversation — no history to load
    }
  }

  useEffect(() => {
    setConversationId(initialConversationId);
    setMessages([]);
    setLoading(false);
    void loadHistory();
    void loadConversationMessages(initialConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  useEffect(() => {
    const storedToken = window.sessionStorage.getItem(SERVICE_TOKEN_STORAGE_KEY);

    if (storedToken) {
      setServiceToken(storedToken);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(SERVICE_TOKEN_STORAGE_KEY, serviceToken);
  }, [serviceToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function streamAssistantReply(reply: string) {
    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "assistant", content: reply, createdAt: getCurrentTimeLabel() },
    ]);
  }

  async function handleSend(message: string) {
    if (loading) {
      return;
    }

    if (!serviceToken.trim()) {
      setTokenTouched(true);
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: message, createdAt: getCurrentTimeLabel() },
    ]);
    setLoading(true);

    try {
      const response = await sendChatMessage(
        message,
        serviceToken.trim(),
        conversationId,
      );
      await streamAssistantReply(response.reply);
      setConversationId(response.conversation_id);
      void loadHistory();
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the chat service. Please try again.",
          createdAt: getCurrentTimeLabel(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleNewSession() {
    if (loading) {
      return;
    }

    setSidebarOpen(false);
    router.push(`/chat/${createConversationId()}`);
  }

  function getLatestUserMessage() {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === "user") {
        return messages[index].content;
      }
    }

    return null;
  }

  async function handleRegenerate() {
    if (loading) {
      return;
    }

    if (!serviceToken.trim()) {
      setTokenTouched(true);
      return;
    }

    const latestUserMessage = getLatestUserMessage();

    if (!latestUserMessage) {
      return;
    }

    setMessages((currentMessages) => {
      if (currentMessages.length === 0) {
        return currentMessages;
      }

      const nextMessages = [...currentMessages];

      if (nextMessages[nextMessages.length - 1]?.role === "assistant") {
        nextMessages.pop();
      }

      return nextMessages;
    });

    setLoading(true);

    try {
      const response = await sendChatMessage(
        latestUserMessage,
        serviceToken.trim(),
        conversationId,
      );
      await streamAssistantReply(response.reply);
      setConversationId(response.conversation_id);
      void loadHistory();
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: "Sorry, I couldn't regenerate the response. Please try again.",
          createdAt: getCurrentTimeLabel(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const latestAssistantIndex = messages.reduce<number>((lastIndex, message, index) => {
    if (message.role === "assistant") {
      return index;
    }

    return lastIndex;
  }, -1);

  const canRegenerate = !loading && messages.some((message) => message.role === "user");
  const hasServiceToken = Boolean(serviceToken.trim());
  const currentSummary =
    history.find((c) => c.conversation_id === conversationId)?.summary ?? null;

  const sidebarContent = (
    <>
        <div className="border-b border-white/10 px-7 py-8">
          <h1 className="text-4xl font-semibold leading-tight text-[#f2ede4]">
            Admin Console
          </h1>
          <p className="text-lg text-[#8f8678] italic">AI-powered workspace</p>

          <button
            type="button"
            onClick={handleNewSession}
            className="mt-7 flex w-full items-center justify-center rounded-xl border border-white/15 bg-[#171513] px-4 py-3 text-xl font-semibold text-[#f5efe5] transition-colors hover:bg-[#0f0d0c]"
          >
            + New session
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-7 py-6">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.26em] text-[#6f675b]">
              Sessions
            </p>

            <div className="mt-4 space-y-1">
              {historyLoading && history.length === 0 ? (
                <p className="px-2 text-base text-[#6f675b]">Loading...</p>
              ) : history.length === 0 ? (
                <p className="px-2 text-base text-[#6f675b]">No conversations yet.</p>
              ) : (
                history.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      router.push(`/chat/${conv.conversation_id}`);
                    }}
                    className={[
                      "w-full rounded-xl px-4 py-3 text-left transition-colors",
                      conv.conversation_id === conversationId
                        ? "bg-[#26201a]"
                        : "hover:bg-[#1e1a15]",
                    ].join(" ")}
                  >
                    <p
                      className={[
                        "truncate text-xl",
                        conv.conversation_id === conversationId
                          ? "font-semibold text-[#e5c677]"
                          : "text-[#a79f92]",
                      ].join(" ")}
                    >
                      {conv.summary ?? conv.conversation_id.slice(0, 16)}
                    </p>
                    <p className="mt-1 text-base text-[#6f675b]">
                      {formatHistoryDate(conv.updated_at)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-[#211c17] p-4">
            <label
              htmlFor="service-token"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7f7668]"
            >
              Service Token
            </label>
            <textarea
              id="service-token"
              value={serviceToken}
              onChange={(event) => {
                setServiceToken(event.target.value);
                if (!tokenTouched) {
                  setTokenTouched(true);
                }
              }}
              rows={2}
              placeholder="Bearer <user-access-token>"
              className="w-full resize-none rounded-xl border border-white/10 bg-[#171411] px-3 py-2 text-base leading-6 text-[#ddd6ca] outline-none placeholder:text-[#6f675b] focus:border-[#ccb47a]"
            />
          </div>
        </div>
      </>
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-[#24211c] text-[#f4efe6]">
      <div className="mx-auto flex h-full w-full overflow-hidden border border-[#4a4237] bg-[#211c17] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <aside className="hidden h-full w-[360px] shrink-0 flex-col border-r border-white/10 bg-[#171412] md:flex">
          {sidebarContent}
        </aside>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <aside className="flex h-full w-80 max-w-[85vw] flex-col border-r border-white/10 bg-[#171412] shadow-2xl">
              <div className="border-b border-white/10 p-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-zinc-300"
                >
                  Close
                </button>
              </div>
              {sidebarContent}
            </aside>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="h-full flex-1 bg-black/70"
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f2f0ec] text-[#2d2a25]">
          <div className="border-b border-[#ddd5ca] bg-[#f2f0ec] px-6 py-5 md:px-9">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-[#201d18] md:text-2xl">
                  {currentSummary ?? "New conversation"}
                </h1>
              </div>

              <p className="hidden text-md font-semibold text-[#b4aca0] md:block italic">
                {conversationId.slice(0, 8)}-{conversationId.slice(-4)}
              </p>

              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-[#dbd2c7] bg-[#f8f5ef] px-3 py-2 text-sm font-medium text-[#494338] transition-colors hover:bg-[#ece6dd] md:hidden"
              >
                Menu
              </button>
            </div>
          </div>

          {!hasServiceToken && tokenTouched ? (
            <div className="mx-auto mt-3 w-full max-w-5xl rounded-xl border border-amber-700/30 bg-amber-100 px-4 py-2 text-sm text-amber-900">
              Please set a valid service token in the sidebar before sending messages.
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 md:px-8 md:py-6">
            <div className="mx-auto flex h-full w-full max-w-5xl min-w-0 flex-col overflow-hidden border border-[#d8d1c6] bg-[#f4f2ee] shadow-[0_10px_30px_rgba(45,41,35,0.08)]">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 md:px-9">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                  {messages.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-[#cfc7bb] bg-[#f0ece5] text-base text-[#8f8578]">
                      Start a conversation.
                    </div>
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

                  {loading ? <MessageBubble role="assistant" content="" isTyping /> : null}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-[#dbd4c9] bg-[#f4f2ee] px-4 py-4 md:px-6">
                <div className="mx-auto w-full max-w-4xl">
                  <ChatInput
                    onSend={handleSend}
                    disabled={!hasServiceToken}
                    placeholder="Nhập tin nhắn..."
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