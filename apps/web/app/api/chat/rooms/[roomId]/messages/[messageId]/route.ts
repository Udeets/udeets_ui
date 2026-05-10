import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { editMessageBodySchema, parseJsonBody } from "@/lib/services/chat/chat-schemas";
import { softDeleteChatMessage } from "@/lib/services/chat/soft-delete-chat-message";
import { updateChatMessage } from "@/lib/services/chat/update-chat-message";

type RouteCtx = { params: Promise<{ roomId: string; messageId: string }> };

export async function PATCH(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, messageId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, editMessageBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    await updateChatMessage({ userId, roomId, messageId, body: parsed.data.body });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}

export async function DELETE(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, messageId } = await context.params;
    let moderationReason: string | null = null;
    try {
      const body = await request.json();
      if (body && typeof body === "object" && typeof (body as { moderationReason?: string }).moderationReason === "string") {
        moderationReason = (body as { moderationReason: string }).moderationReason;
      }
    } catch {
      /* empty body */
    }
    await softDeleteChatMessage({ userId, roomId, messageId, moderationReason });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}
