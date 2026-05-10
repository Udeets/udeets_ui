import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { parseJsonBody, pollVoteBodySchema } from "@/lib/services/chat/chat-schemas";
import { castChatPollVote } from "@/lib/services/chat/vote-chat-poll";

type RouteCtx = { params: Promise<{ roomId: string; pollId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, pollId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, pollVoteBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    await castChatPollVote({ userId, roomId, pollId, optionId: parsed.data.optionId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}
