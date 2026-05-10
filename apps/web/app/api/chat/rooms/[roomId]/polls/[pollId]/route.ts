import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { getChatPollByPollId } from "@/lib/services/chat/get-chat-poll-by-id";

type RouteCtx = { params: Promise<{ roomId: string; pollId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, pollId } = await context.params;
    const poll = await getChatPollByPollId({ userId, roomId, pollId });
    return NextResponse.json({ poll });
  } catch (err) {
    return chatRouteError(err);
  }
}
