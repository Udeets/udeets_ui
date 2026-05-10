import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";
import { ChatRateLimitError } from "@/lib/services/chat/chat-errors";
import { CHAT_MESSAGE_SEND_MAX, CHAT_MESSAGE_SEND_WINDOW_MS } from "@/lib/services/chat/chat-rate-limits";
import { listMessagesQuerySchema, parseJsonBody, parseSearchParams, sendMessageBodySchema } from "@/lib/services/chat/chat-schemas";
import { listChatMessages } from "@/lib/services/chat/list-chat-messages";
import type { OutboundChatMessageKind } from "@/lib/services/chat/send-chat-message";
import { sendChatMessage } from "@/lib/services/chat/send-chat-message";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function GET(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const q = parseSearchParams(new URL(request.url).searchParams, listMessagesQuerySchema);
    if (!q.ok) return chatBadRequest(q.error);
    const cursorId = q.data.cursor && q.data.cursor.length > 0 ? q.data.cursor : null;
    const result = await listChatMessages(userId, roomId, { limit: q.data.limit, cursorId });
    return NextResponse.json(result);
  } catch (err) {
    return chatRouteError(err);
  }
}

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const rlKey = `chat:msg:${userId}:${roomId}`;
    if (!(await allowSlidingWindowRateLimit(rlKey, CHAT_MESSAGE_SEND_MAX, CHAT_MESSAGE_SEND_WINDOW_MS))) {
      throw new ChatRateLimitError();
    }
    const raw = await request.json();
    const parsed = parseJsonBody(raw, sendMessageBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    const b = parsed.data;
    const result = await sendChatMessage({
      userId,
      roomId,
      body: b.body,
      messageKind: b.messageKind as OutboundChatMessageKind,
      replyToId: b.replyToId ?? null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return chatRouteError(err);
  }
}
