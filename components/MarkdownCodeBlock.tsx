"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type MarkdownCodeBlockProps = {
  code: string;
  language: string;
};

export function MarkdownCodeBlock({ code, language }: MarkdownCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 last:mb-0">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700"
          aria-label="Copy code block"
          title="Copy code block"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <SyntaxHighlighter
        language={language === "text" ? undefined : language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "12px 16px",
          background: "transparent",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-geist-mono), monospace" } }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}