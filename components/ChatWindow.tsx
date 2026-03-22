"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "../lib/api";
import type { ChatMessage } from "../types/chat";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";

const SERVICE_TOKEN_STORAGE_KEY = "chat-service-token";

type ChatWindowProps = {
  initialConversationId: string;
};

function createConversationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatWindow({ initialConversationId }: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>(
    initialConversationId,
  );
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serviceToken, setServiceToken] = useState("");
  const [tokenTouched, setTokenTouched] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setConversationId(initialConversationId);
    setMessages([]);
    setLoading(false);
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
      { role: "assistant", content: reply },
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
      { role: "user", content: message },
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
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the chat service. Please try again.",
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
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: "Sorry, I couldn't regenerate the response. Please try again.",
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

  function SidebarContent() {
    return (
      <>
        <div className="border-b border-white/10 p-4">
          <button
            type="button"
            onClick={handleNewSession}
            className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-[#2a2b31] px-4 py-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-[#34353d]"
          >
            New session
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                AI Admin Assistant
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Dark chat workspace with one active session per URL.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Active session
              </p>
              <p className="mt-2 break-all text-sm leading-6 text-zinc-300">
                {conversationId}
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <label
                htmlFor="service-token"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
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
                rows={3}
                placeholder="Bearer <user-access-token>"
                className="w-full resize-none rounded-xl border border-white/10 bg-[#0f1013] px-3 py-2 text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-400/70"
              />
              <p className="text-xs text-zinc-500">
                Required for every chat request.
              </p>
            </div>
          </div>

          <p className="text-xs leading-5 text-zinc-500">
            Sidebar stays fixed. Only the chat thread scrolls.
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111214] text-zinc-100">
      <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-white/10 bg-[#17181c] md:flex">
        <SidebarContent />
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="h-full flex-1 bg-black/55"
          />
          <aside className="flex h-full w-72 max-w-[85vw] flex-col border-l border-white/10 bg-[#17181c] shadow-2xl">
            <div className="border-b border-white/10 p-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300"
              >
                Close
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-white/10 bg-[#111214]/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100 md:text-2xl">
                AI Admin Assistant
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Ask questions, inspect context, and continue the conversation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] md:hidden"
            >
              Menu
            </button>
          </div>
        </div>

        {!hasServiceToken && tokenTouched ? (
          <div className="mx-auto mt-3 w-full max-w-4xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
            Please set a valid service token in the sidebar before sending messages.
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto flex h-full w-full max-w-4xl min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#18191d] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
                {messages.length === 0 ? (
                  <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-zinc-500">
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
                    />
                  ))
                )}

                {loading ? <MessageBubble role="assistant" content="" isTyping /> : null}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#18191d] px-4 py-4 md:px-6">
              <div className="mx-auto w-full max-w-3xl">
                <ChatInput onSend={handleSend} disabled={!hasServiceToken} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}