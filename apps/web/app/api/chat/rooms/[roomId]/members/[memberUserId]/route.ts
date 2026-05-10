import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { removeChatRoomMember } from "@/lib/services/chat/remove-chat-room-member";

type RouteCtx = { params: Promise<{ roomId: string; memberUserId: string }> };

export async function DELETE(_request: Request, context: RouteCtx) {
  try {
    const actorId = await requireChatUserId();
    const { roomId, memberUserId } = await context.params;
    await removeChatRoomMember({ actorId, roomId, targetUserId: memberUserId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}
