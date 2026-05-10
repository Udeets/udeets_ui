import { NextResponse } from "next/server";

import {
  ChatForbiddenError,
  ChatNotFoundError,
  ChatRateLimitError,
  ChatUnauthorizedError,
} from "@/lib/services/chat/chat-errors";

export function chatRouteError(err: unknown): NextResponse {
  if (err instanceof ChatRateLimitError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 429 });
  }
  if (err instanceof ChatForbiddenError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 403 });
  }
  if (err instanceof ChatUnauthorizedError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 401 });
  }
  if (err instanceof ChatNotFoundError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 404 });
  }
  if (err instanceof Error) {
    console.error("[api/chat]", err);
    // Avoid leaking internal exception text to clients in production.
    const safe =
      process.env.NODE_ENV === "production" ? "Something went wrong. Please try again later." : err.message;
    return NextResponse.json({ error: safe }, { status: 500 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
