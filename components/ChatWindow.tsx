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
    <div className="flex h-full min-h-[600px] w-full max-w-3xl flex-col rounded-3xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Session: {conversationId}
        </p>
        <button
          type="button"
          onClick={handleNewSession}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          New session
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-white p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
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

      <div className="mt-4">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}