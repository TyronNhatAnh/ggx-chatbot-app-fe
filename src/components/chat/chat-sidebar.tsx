"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { HistoryConversation } from "@/types/chat";

type ChatSidebarProps = {
  conversationId: string;
  history: HistoryConversation[];
  historyLoading: boolean;
  serviceToken: string;
  tokenTouched: boolean;
  onServiceTokenChange: (value: string) => void;
  isLoading: boolean;
};

function formatHistoryDate(unixTs: number): string {
  const date = new Date(unixTs * 1000);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return `Today · ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date)}`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-GB", { weekday: "long" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function createConversationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatSidebar({
  conversationId,
  history,
  historyLoading,
  serviceToken,
  tokenTouched,
  onServiceTokenChange,
  isLoading,
}: ChatSidebarProps) {
  const router = useRouter();

  function handleNewSession() {
    if (isLoading) return;
    router.push(`/chat/${createConversationId()}`);
  }

  return (
    <div className="flex h-full flex-col bg-[#171412] text-[#f2ede4]">
      {/* Header */}
      <div className="border-b border-white/10 px-7 py-8">
        <h1 className="text-4xl font-semibold leading-tight">Admin Console</h1>
        <p className="mt-1 italic text-[#8f8678]">AI-powered workspace</p>

        <Button
          variant="sidebar"
          size="lg"
          onClick={handleNewSession}
          disabled={isLoading}
          className="mt-7 w-full justify-center gap-2 rounded-xl"
        >
          <Plus size={18} />
          New session
        </Button>
      </div>

      {/* History list */}
      <ScrollArea className="flex-1 px-7 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#6f675b]">
          Sessions
        </p>

        <div className="mt-4 space-y-1">
          {historyLoading && history.length === 0 ? (
            <p className="px-2 text-sm text-[#6f675b]">Loading...</p>
          ) : history.length === 0 ? (
            <p className="px-2 text-sm text-[#6f675b]">No conversations yet.</p>
          ) : (
            history.map((conv) => (
              <button
                key={conv.conversation_id}
                type="button"
                onClick={() => router.push(`/chat/${conv.conversation_id}`)}
                className={[
                  "w-full rounded-xl px-4 py-3 text-left transition-colors",
                  conv.conversation_id === conversationId
                    ? "bg-[#26201a]"
                    : "hover:bg-[#1e1a15]",
                ].join(" ")}
              >
                <p
                  className={[
                    "truncate text-base",
                    conv.conversation_id === conversationId
                      ? "font-semibold text-[#e5c677]"
                      : "text-[#a79f92]",
                  ].join(" ")}
                >
                  {conv.summary ?? conv.conversation_id.slice(0, 16)}
                </p>
                <p className="mt-0.5 text-sm text-[#6f675b]">
                  {formatHistoryDate(conv.updated_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator className="bg-white/10" />

      {/* Service token */}
      <div className="px-7 py-5">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-[#211c17] p-4">
          <label
            htmlFor="service-token"
            className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#7f7668]"
          >
            Service Token
          </label>
          <Textarea
            id="service-token"
            value={serviceToken}
            onChange={(e) => {
              onServiceTokenChange(e.target.value);
            }}
            rows={2}
            placeholder="Bearer <user-access-token>"
            className="resize-none border-white/10 bg-[#171411] text-sm leading-6 text-[#ddd6ca] placeholder:text-[#6f675b] focus-visible:ring-[#ccb47a]"
          />
          {tokenTouched && !serviceToken.trim() && (
            <p className="text-xs text-amber-400">Token required to chat.</p>
          )}
        </div>
      </div>
    </div>
  );
}
