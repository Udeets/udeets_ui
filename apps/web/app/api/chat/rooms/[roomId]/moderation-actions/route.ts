import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { listChatModerationActions } from "@/lib/services/chat/list-chat-moderation-actions";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const actions = await listChatModerationActions(userId, roomId);
    return NextResponse.json({ actions });
  } catch (err) {
    return chatRouteError(err);
  }
}
