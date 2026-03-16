"use client";

import { useEffect, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MarkdownCodeBlock } from "./MarkdownCodeBlock";
import type { ChatMessage } from "../types/chat";

type MessageBubbleProps = {
  role: ChatMessage["role"];
  content: string;
  isTyping?: boolean;
  showAssistantActions?: boolean;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
};

export function MessageBubble({
  role,
  content,
  isTyping = false,
  showAssistantActions = false,
  showRegenerate = false,
  onRegenerate,
  canRegenerate = false,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopyMessage() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={[
        "message-enter flex w-full",
        isUser ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm md:max-w-[78%]",
          isUser
            ? "bg-[#2b2d31] text-zinc-100"
            : isTyping
              ? "border border-white/10 bg-gradient-to-br from-[#202127] to-[#17181c] text-zinc-300 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
              : "border border-white/8 bg-[#1f2026] text-zinc-200",
        ].join(" ")}
      >
        {isTyping ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <span className="text-sm font-medium text-zinc-400">
              AI is thinking...
            </span>
          </div>
        ) : null}

        {!isTyping && isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : null}

        {!isTyping && !isUser ? (
          <div className="markdown-body break-words text-[15px] leading-7 text-zinc-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-4 text-xl font-semibold tracking-tight text-zinc-50 last:mb-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 text-lg font-semibold tracking-tight text-zinc-100 last:mb-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 text-base font-semibold text-zinc-100 last:mb-0">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 list-disc space-y-1.5 pl-5 last:mb-0">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 list-decimal space-y-1.5 pl-5 last:mb-0">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-50">
                    {children}
                  </strong>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="font-medium text-zinc-200 underline decoration-zinc-500 underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="mb-4 border-l-4 border-zinc-600 bg-white/[0.04] px-3 py-2 text-zinc-300 italic last:mb-0">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="mb-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#16171b] shadow-[0_8px_20px_rgba(0,0,0,0.22)] last:mb-0">
                    <table className="min-w-full border-collapse text-left text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-white/[0.04]">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border-b border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {children}
                  </th>
                ),
                tbody: ({ children }) => (
                  <tbody className="[&_tr:nth-child(even)]:bg-white/[0.025]">
                    {children}
                  </tbody>
                ),
                td: ({ children }) => (
                  <td className="border-b border-white/8 px-4 py-2.5 align-top text-zinc-300 last:border-b-0">
                    {children}
                  </td>
                ),
                pre: ({ children }) => <>{children}</>,
                code: ({ children, className }) => {
                  const isBlock = Boolean(className);
                  const language = className?.replace("language-", "") || "text";
                  const codeText = String(children).replace(/\n$/, "");

                  if (isBlock) {
                    return (
                      <MarkdownCodeBlock code={codeText} language={language} />
                    );
                  }

                  return (
                    <code className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-100">
                      {codeText}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>

            {showAssistantActions ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-zinc-100"
                >
                  {copied ? "Copied" : "Copy"}
                </button>

                {showRegenerate && onRegenerate ? (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    disabled={!canRegenerate}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}