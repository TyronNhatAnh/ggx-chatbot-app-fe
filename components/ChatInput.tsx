"use client";

import { useState } from "react";

type ChatInputProps = {
  onSend: (message: string) => void;
};

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");

  function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    onSend(trimmedMessage);
    setMessage("");
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#23252b] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <input
        type="text"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
      />
      <button
        type="button"
        onClick={handleSend}
        className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white"
      >
        Send
      </button>
    </div>
  );
}