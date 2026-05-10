import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { getChatPollByMessageId } from "@/lib/services/chat/get-chat-poll-by-message";

type RouteCtx = { params: Promise<{ roomId: string; messageId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, messageId } = await context.params;
    const poll = await getChatPollByMessageId({ userId, roomId, messageId });
    return NextResponse.json({ poll });
  } catch (err) {
    return chatRouteError(err);
  }
}
