import { NextResponse } from "next/server";

import type { ChatRequest, ChatResponse } from "../../../../types/chat";

const DEFAULT_CHAT_API_URL = "http://localhost:8000/chat";

export async function POST(request: Request) {
  const chatApiUrl = process.env.CHAT_API_URL ?? DEFAULT_CHAT_API_URL;
  const chatApiKey = process.env.CHAT_API_KEY;

  if (!chatApiKey) {
    return NextResponse.json(
      { error: "CHAT_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as ChatRequest;

  const response = await fetch(chatApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": chatApiKey,
    },
    body: JSON.stringify({
      message: body.message,
      conversation_id: body.conversation_id ?? null,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      { error: errorText || "Chat backend request failed." },
      { status: response.status },
    );
  }

  return NextResponse.json((await response.json()) as ChatResponse);
}