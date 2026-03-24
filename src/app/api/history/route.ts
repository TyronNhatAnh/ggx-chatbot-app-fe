import { NextResponse } from "next/server";

import type { HistoryListResponse } from "@/types/chat";

function getBackendBase() {
  const chatUrl = process.env.CHAT_API_URL ?? "http://localhost:8000/chat";
  return chatUrl.replace(/\/chat$/, "");
}

export async function GET(request: Request) {
  const chatApiKey = process.env.CHAT_API_KEY;

  if (!chatApiKey) {
    return NextResponse.json(
      { error: "CHAT_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const pageSize = searchParams.get("page_size") ?? "20";

  let response: Response;
  try {
    response = await fetch(
      `${getBackendBase()}/history?page=${page}&page_size=${pageSize}`,
      {
        headers: { "X-API-Key": chatApiKey },
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach the backend service." },
      { status: 503 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch history." },
      { status: response.status },
    );
  }

  return NextResponse.json((await response.json()) as HistoryListResponse);
}
