import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MarkdownCodeBlock } from "./MarkdownCodeBlock";
import type { ChatMessage } from "../types/chat";

type MessageBubbleProps = {
  role: ChatMessage["role"];
  content: string;
  isTyping?: boolean;
};

export function MessageBubble({
  role,
  content,
  isTyping = false,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={[
        "message-enter flex w-full",
        isUser ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      <div
        className={[
          "max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
          isUser
            ? "bg-zinc-900 text-white"
            : isTyping
              ? "border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white text-zinc-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              : "bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200",
        ].join(" ")}
      >
        {isTyping ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <span className="text-sm font-medium text-zinc-500">
              AI is thinking...
            </span>
          </div>
        ) : null}

        {!isTyping && isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : null}

        {!isTyping && !isUser ? (
          <div className="markdown-body break-words text-[15px] leading-7">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-4 text-xl font-semibold tracking-tight text-zinc-950 last:mb-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 text-lg font-semibold tracking-tight text-zinc-950 last:mb-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 text-base font-semibold text-zinc-900 last:mb-0">
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
                  <strong className="font-semibold text-zinc-950">
                    {children}
                  </strong>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="font-medium text-zinc-900 underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="mb-4 border-l-4 border-zinc-300 bg-zinc-200/40 px-3 py-2 text-zinc-700 italic last:mb-0">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="mb-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] last:mb-0">
                    <table className="min-w-full border-collapse text-left text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-zinc-100">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border-b border-zinc-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    {children}
                  </th>
                ),
                tbody: ({ children }) => (
                  <tbody className="[&_tr:nth-child(even)]:bg-zinc-50">
                    {children}
                  </tbody>
                ),
                td: ({ children }) => (
                  <td className="border-b border-zinc-100 px-4 py-2.5 align-top text-zinc-700 last:border-b-0">
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
                    <code className="rounded-md border border-zinc-300 bg-zinc-200/80 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-900">
                      {codeText}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  );
}