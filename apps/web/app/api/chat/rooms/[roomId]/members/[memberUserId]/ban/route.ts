import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { banChatRoomMember } from "@/lib/services/chat/ban-chat-room-member";

type RouteCtx = { params: Promise<{ roomId: string; memberUserId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const actorId = await requireChatUserId();
    const { roomId, memberUserId } = await context.params;
    let reason: string | null | undefined;
    try {
      const body = (await request.json()) as { reason?: string | null };
      reason = body.reason;
    } catch {
      /* empty */
    }
    await banChatRoomMember({ actorId, roomId, targetUserId: memberUserId, reason: reason ?? null });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}
