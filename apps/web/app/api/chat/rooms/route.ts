import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { createRoomBodySchema, listRoomsQuerySchema, parseJsonBody, parseSearchParams } from "@/lib/services/chat/chat-schemas";
import { createChatRoom } from "@/lib/services/chat/create-chat-room";
import { listChatRoomsForHub } from "@/lib/services/chat/list-chat-rooms";

export async function GET(request: Request) {
  try {
    const userId = await requireChatUserId();
    const searchParams = new URL(request.url).searchParams;
    if (!searchParams.get("hubId")?.trim()) {
      return chatBadRequest("Missing hubId query parameter.");
    }
    const q = parseSearchParams(searchParams, listRoomsQuerySchema);
    if (!q.ok) return chatBadRequest(q.error);
    const rooms = await listChatRoomsForHub(userId, q.data.hubId);
    return NextResponse.json({ rooms });
  } catch (err) {
    return chatRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireChatUserId();
    const raw = await request.json();
    const parsed = parseJsonBody(raw, createRoomBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    const { roomId } = await createChatRoom({
      userId,
      hubId: parsed.data.hubId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    });
    return NextResponse.json({ roomId }, { status: 201 });
  } catch (err) {
    return chatRouteError(err);
  }
}
