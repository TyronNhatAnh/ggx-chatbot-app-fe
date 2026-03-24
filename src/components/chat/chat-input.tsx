"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  function handleSend() {
    if (disabled) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessage("");
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary p-3">
      <Input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={
          placeholder ??
          (disabled ? "Set service token to start chat..." : "Type a message...")
        }
        className="flex-1 border-0 bg-transparent px-3 py-2 text-base text-foreground shadow-none focus-visible:ring-0 disabled:opacity-60"
      />
      <Button
        type="button"
        onClick={handleSend}
        disabled={disabled}
        size="icon-lg"
        aria-label="Send message"
      >
        <SendHorizontal size={20} />
      </Button>
    </div>
  );
}
