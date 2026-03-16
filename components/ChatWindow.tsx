"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "../lib/api";
import type { ChatMessage } from "../types/chat";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";

const STREAM_DELAY_MS = 14;

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setConversationId(initialConversationId);
    setMessages([]);
    setLoading(false);
  }, [initialConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function streamAssistantReply(reply: string) {
    const tokens = Array.from(reply);

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "assistant", content: "" },
    ]);

    if (tokens.length === 0) {
      return;
    }

    for (const token of tokens) {
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), STREAM_DELAY_MS);
      });

      setMessages((currentMessages) => {
        if (currentMessages.length === 0) {
          return currentMessages;
        }

        const lastMessage = currentMessages[currentMessages.length - 1];

        if (lastMessage.role !== "assistant") {
          return currentMessages;
        }

        const nextMessages = [...currentMessages];
        nextMessages[nextMessages.length - 1] = {
          ...lastMessage,
          content: `${lastMessage.content}${token}`,
        };

        return nextMessages;
      });
    }
  }

  async function handleSend(message: string) {
    if (loading) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: message },
    ]);
    setLoading(true);

    try {
      const response = await sendChatMessage(message, conversationId);
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

    router.push(`/chat/${createConversationId()}`);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111214] text-zinc-100">
      <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-white/10 bg-[#17181c] md:flex">
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
          </div>

          <p className="text-xs leading-5 text-zinc-500">
            Sidebar stays fixed. Only the chat thread scrolls.
          </p>
        </div>
      </aside>

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
              onClick={handleNewSession}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] md:hidden"
            >
              New
            </button>
          </div>
        </div>

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
                    />
                  ))
                )}

                {loading ? <MessageBubble role="assistant" content="" isTyping /> : null}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#18191d] px-4 py-4 md:px-6">
              <div className="mx-auto w-full max-w-3xl">
                <ChatInput onSend={handleSend} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}