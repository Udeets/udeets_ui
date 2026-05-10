import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { listChatInviteCandidates } from "@/lib/services/chat/list-chat-invite-candidates";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const candidates = await listChatInviteCandidates(userId, roomId);
    return NextResponse.json({ candidates });
  } catch (err) {
    return chatRouteError(err);
  }
}
