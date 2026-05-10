import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { parseJsonBody, updateRoomBodySchema } from "@/lib/services/chat/chat-schemas";
import { getChatRoomForUser } from "@/lib/services/chat/get-chat-room";
import { updateChatRoom } from "@/lib/services/chat/update-chat-room";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const room = await getChatRoomForUser(userId, roomId);
    return NextResponse.json({ room });
  } catch (err) {
    return chatRouteError(err);
  }
}

export async function PATCH(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, updateRoomBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    const b = parsed.data;
    if (
      b.name === undefined &&
      b.description === undefined &&
      b.settings === undefined &&
      b.archived === undefined &&
      b.retentionDays === undefined
    ) {
      return chatBadRequest("No fields to update.");
    }
    await updateChatRoom({
      userId,
      roomId,
      name: b.name,
      description: b.description,
      settingsPatch: b.settings,
      archived: b.archived,
      retentionDays: b.retentionDays,
    });
    const room = await getChatRoomForUser(userId, roomId);
    return NextResponse.json({ room });
  } catch (err) {
    return chatRouteError(err);
  }
}
