"use client";

import { useState } from "react";

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
    if (disabled) {
      return;
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    onSend(trimmedMessage);
    setMessage("");
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#d5cec3] bg-[#f7f5f1] p-3">
      <input
        type="text"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSend();
          }
        }}
        placeholder={
          placeholder ||
          (disabled ? "Set service token to start chat..." : "Type a message...")
        }
        className="flex-1 bg-transparent px-3 py-2 text-base text-[#2f2b26] outline-none placeholder:text-[#b5aea4] disabled:cursor-not-allowed disabled:text-[#8f887c]"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#151412] text-[#e9c469] transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#bdb6ab] disabled:text-[#ebe4d8]"
        aria-label="Send message"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 19L20 12L4 5V10L14 12L4 14V19Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}