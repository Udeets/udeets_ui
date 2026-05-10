import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { parseJsonBody, reactionBodySchema } from "@/lib/services/chat/chat-schemas";
import { addChatReaction } from "@/lib/services/chat/add-chat-reaction";
import { removeChatReaction } from "@/lib/services/chat/remove-chat-reaction";

type RouteCtx = { params: Promise<{ roomId: string; messageId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, messageId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, reactionBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    await addChatReaction({ userId, roomId, messageId, emoji: parsed.data.emoji });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return chatRouteError(err);
  }
}

export async function DELETE(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, messageId } = await context.params;
    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get("emoji");
    if (!emoji) return chatBadRequest("emoji query parameter is required");
    const parsed = reactionBodySchema.safeParse({ emoji });
    if (!parsed.success) return chatBadRequest(parsed.error.message);
    await removeChatReaction({ userId, roomId, messageId, emoji: parsed.data.emoji });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}
