import { NextResponse } from "next/server";

import type { HistoryDetailResponse } from "../../../../../types/chat";

function getBackendBase() {
  const chatUrl = process.env.CHAT_API_URL ?? "http://localhost:8000/chat";
  return chatUrl.replace(/\/chat$/, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const chatApiKey = process.env.CHAT_API_KEY;

  if (!chatApiKey) {
    return NextResponse.json(
      { error: "CHAT_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const { conversationId } = await params;
  const response = await fetch(
    `${getBackendBase()}/history/${conversationId}`,
    {
      headers: { "X-API-Key": chatApiKey },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch conversation." },
      { status: response.status },
    );
  }

  return NextResponse.json((await response.json()) as HistoryDetailResponse);
}
