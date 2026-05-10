import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";
import { ChatRateLimitError } from "@/lib/services/chat/chat-errors";
import { CHAT_TYPING_MAX, CHAT_TYPING_WINDOW_MS } from "@/lib/services/chat/chat-rate-limits";
import { chatTypingPhaseBodySchema, parseJsonBody } from "@/lib/services/chat/chat-schemas";
import { recordChatTypingPhase } from "@/lib/services/chat/record-chat-typing-phase";

type RouteCtx = { params: Promise<{ roomId: string }> };

/** Ephemeral typing indicator; clients receive `typing.started` / `typing.stopped` via Realtime on `chat_room_typing`. */
export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const rlKey = `chat:typing:${userId}:${roomId}`;
    if (!(await allowSlidingWindowRateLimit(rlKey, CHAT_TYPING_MAX, CHAT_TYPING_WINDOW_MS))) {
      throw new ChatRateLimitError();
    }
    const raw = await request.json();
    const parsed = parseJsonBody(raw, chatTypingPhaseBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    await recordChatTypingPhase({ userId, roomId, phase: parsed.data.phase });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return chatRouteError(err);
  }
}
