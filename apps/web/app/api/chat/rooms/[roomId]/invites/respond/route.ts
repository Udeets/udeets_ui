import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { inviteRespondBodySchema, parseJsonBody } from "@/lib/services/chat/chat-schemas";
import { acceptChatRoomInvite, declineChatRoomInvite } from "@/lib/services/chat/respond-chat-room-invite";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, inviteRespondBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    if (parsed.data.action === "accept") {
      await acceptChatRoomInvite({ userId, roomId });
    } else {
      await declineChatRoomInvite({ userId, roomId });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return chatRouteError(err);
  }
}
