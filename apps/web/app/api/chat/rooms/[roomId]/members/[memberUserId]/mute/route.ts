import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { muteChatRoomMember } from "@/lib/services/chat/mute-chat-room-member";

type RouteCtx = { params: Promise<{ roomId: string; memberUserId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const actorId = await requireChatUserId();
    const { roomId, memberUserId } = await context.params;
    let mutedUntil: string | null | undefined;
    let reason: string | null | undefined;
    try {
      const body = (await request.json()) as { mutedUntil?: string | null; reason?: string | null };
      mutedUntil = body.mutedUntil;
      reason = body.reason;
    } catch {
      /* empty */
    }
    await muteChatRoomMember({
      actorId,
      roomId,
      targetUserId: memberUserId,
      mutedUntil: mutedUntil ?? null,
      reason: reason ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}
