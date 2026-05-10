import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { inviteMemberBodySchema, inviteRevokeQuerySchema, parseJsonBody } from "@/lib/services/chat/chat-schemas";
import { inviteUserToChatRoom } from "@/lib/services/chat/invite-to-chat-room";
import { revokeChatRoomInvite } from "@/lib/services/chat/revoke-chat-room-invite";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const actorId = await requireChatUserId();
    const { roomId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, inviteMemberBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    const result = await inviteUserToChatRoom({
      actorId,
      roomId,
      invitedUserId: parsed.data.invitedUserId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return chatRouteError(err);
  }
}

export async function DELETE(request: Request, context: RouteCtx) {
  try {
    const actorId = await requireChatUserId();
    const { roomId } = await context.params;
    const url = new URL(request.url);
    const parsed = inviteRevokeQuerySchema.safeParse({
      invitedUserId: url.searchParams.get("invitedUserId"),
    });
    if (!parsed.success) return chatBadRequest("invitedUserId query must be a UUID.");
    const result = await revokeChatRoomInvite({
      actorId,
      roomId,
      invitedUserId: parsed.data.invitedUserId,
    });
    return NextResponse.json(result);
  } catch (err) {
    return chatRouteError(err);
  }
}
