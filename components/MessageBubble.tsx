"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage } from "../types/chat";
import { MarkdownCodeBlock } from "./MarkdownCodeBlock";

type MessageBubbleProps = {
  role: ChatMessage["role"];
  content: string;
  isTyping?: boolean;
  timestamp?: string;
  showAssistantActions?: boolean;
  showUserActions?: boolean;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
};

export function MessageBubble({
  role,
  content,
  isTyping = false,
  timestamp,
  showAssistantActions = false,
  showUserActions = false,
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

  const iconButtonClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-[#d9d4cb] bg-white px-2.5 py-1.5 text-xs font-medium text-[#625c53] transition-colors hover:bg-[#f8f5ef] hover:text-[#2a2621] disabled:cursor-not-allowed disabled:opacity-50";

  const bubbleTimestamp =
    timestamp ||
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());

  return (
    <div
      className={[
        "message-enter flex w-full items-start gap-3",
        isUser ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      {!isUser ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#151412] text-sm font-bold text-[#f3d67f]">
          AI
        </div>
      ) : null}

      <div
        className={[
          "max-w-[85%] md:max-w-[78%]",
          isUser
            ? "rounded-2xl rounded-tr-sm bg-[#171513] px-6 py-4 text-[#f4efe7]"
            : "rounded-3xl border border-[#d9d4cb] bg-[#f4f2ee] px-5 py-4 text-[#38342e]",
        ].join(" ")}
      >
        {isTyping ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <span className="text-sm font-medium text-[#7a7368]">AI is thinking...</span>
          </div>
        ) : null}

        {!isTyping && isUser ? (
          <>
            <p className="whitespace-pre-wrap break-words text-[16px] leading-[1.6] md:text-[17px]">
              {content}
            </p>

            {showUserActions ? (
              <div className="mt-3 flex justify-end border-t border-white/15 pt-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className={iconButtonClass}
                  aria-label="Copy question"
                  title="Copy question"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="opacity-90"
                  >
                    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            ) : null}

            <p className="mt-2 text-right text-sm text-[#b8b1a6] md:text-base">{bubbleTimestamp}</p>
          </>
        ) : null}

        {!isTyping && !isUser ? (
          <div className="markdown-body break-words text-[16px] leading-[1.7] text-[#3a352f] md:text-[17px]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-4 text-xl font-semibold tracking-tight text-[#1f1c17] last:mb-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 text-lg font-semibold tracking-tight text-[#28231f] last:mb-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 text-base font-semibold text-[#28231f] last:mb-0">
                    {children}
                  </h3>
                ),
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                ul: ({ children }) => (
                  <ul className="mb-4 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>
                ),
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-[#1f1c17]">{children}</strong>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="font-medium text-[#2c2822] underline decoration-[#867f73] underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="mb-4 border-l-4 border-[#b8b0a3] bg-[#ece7df] px-3 py-2 text-[#60594e] italic last:mb-0">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="mb-4 overflow-x-auto rounded-2xl border border-[#dad3c9] bg-[#f8f6f2] shadow-[0_8px_20px_rgba(0,0,0,0.1)] last:mb-0">
                    <table className="min-w-full border-collapse text-left text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-[#f0ece5]">{children}</thead>,
                th: ({ children }) => (
                  <th className="border-b border-[#ddd6cb] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#7e776c]">
                    {children}
                  </th>
                ),
                tbody: ({ children }) => (
                  <tbody className="[&_tr:nth-child(even)]:bg-[#f2eee8]">{children}</tbody>
                ),
                td: ({ children }) => (
                  <td className="border-b border-[#e2dbd1] px-4 py-2.5 align-top text-[#555046] last:border-b-0">
                    {children}
                  </td>
                ),
                pre: ({ children }) => <>{children}</>,
                code: ({ children, className }) => {
                  const isBlock = Boolean(className);
                  const language = className?.replace("language-", "") || "text";
                  const codeText = String(children).replace(/\n$/, "");

                  if (isBlock) {
                    return <MarkdownCodeBlock code={codeText} language={language} />;
                  }

                  return (
                    <code className="rounded-md border border-[#d4cec3] bg-[#ece8e1] px-1.5 py-0.5 font-mono text-[0.85em] text-[#2e2923]">
                      {codeText}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>

            {showAssistantActions ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#dad4ca] pt-3">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className={iconButtonClass}
                  aria-label="Copy answer"
                  title="Copy answer"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="opacity-90"
                  >
                    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                {showRegenerate && onRegenerate ? (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    disabled={!canRegenerate}
                    className={iconButtonClass}
                    aria-label="Regenerate answer"
                    title="Regenerate answer"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="opacity-90"
                    >
                      <path d="M20 11a8 8 0 1 0 2 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M20 4v7h-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Regenerate</span>
                  </button>
                ) : null}
              </div>
            ) : null}

            <p className="mt-2 text-sm text-[#b8b1a6] md:text-base">{bubbleTimestamp}</p>
          </div>
        ) : null}
      </div>

      {isUser ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e1c068] text-sm font-semibold text-[#29251f]">
          N
        </div>
      ) : null}
    </div>
  );
}
