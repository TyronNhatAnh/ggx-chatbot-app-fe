"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [message, resize]);

  function handleSend() {
    if (disabled) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  return (
    <div className="flex items-end gap-3 rounded-2xl border border-border bg-secondary px-4 py-3">
      <textarea
        ref={textareaRef}
        rows={1}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={
          placeholder ??
          (disabled ? "Set service token to start chat..." : "Type a message...")
        }
        className="flex-1 resize-none overflow-y-auto bg-transparent py-1 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        style={{ maxHeight: "200px" }}
      />
      <Button
        type="button"
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="icon-lg"
        aria-label="Send message"
        className="mb-0.5 shrink-0"
      >
        <SendHorizontal size={20} />
      </Button>
    </div>
  );
}
