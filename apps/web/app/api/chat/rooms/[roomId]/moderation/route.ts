import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";
import { ChatRateLimitError } from "@/lib/services/chat/chat-errors";
import { CHAT_MODERATION_MAX, CHAT_MODERATION_WINDOW_MS } from "@/lib/services/chat/chat-rate-limits";
import { moderationActionBodySchema, parseJsonBody } from "@/lib/services/chat/chat-schemas";
import { performChatModeration } from "@/lib/services/chat/perform-chat-moderation";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const rlKey = `chat:mod:${userId}:${roomId}`;
    if (!(await allowSlidingWindowRateLimit(rlKey, CHAT_MODERATION_MAX, CHAT_MODERATION_WINDOW_MS))) {
      throw new ChatRateLimitError();
    }
    const raw = await request.json();
    const parsed = parseJsonBody(raw, moderationActionBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    await performChatModeration(userId, roomId, parsed.data);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return chatRouteError(err);
  }
}
