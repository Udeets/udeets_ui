import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { addMemberBodySchema, parseJsonBody } from "@/lib/services/chat/chat-schemas";
import { addChatRoomMember } from "@/lib/services/chat/add-chat-room-member";
import { listChatRoomMembers } from "@/lib/services/chat/list-chat-room-members";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const members = await listChatRoomMembers(userId, roomId);
    return NextResponse.json({ members });
  } catch (err) {
    return chatRouteError(err);
  }
}

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, addMemberBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    await addChatRoomMember({
      actorId: userId,
      roomId,
      targetUserId: parsed.data.userId,
      role: parsed.data.role,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return chatRouteError(err);
  }
}
