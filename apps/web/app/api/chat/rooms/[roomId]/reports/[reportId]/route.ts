import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { parseJsonBody, updateReportBodySchema } from "@/lib/services/chat/chat-schemas";
import { updateChatReportStatus } from "@/lib/services/chat/update-chat-report";

type RouteCtx = { params: Promise<{ roomId: string; reportId: string }> };

export async function PATCH(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, reportId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, updateReportBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    await updateChatReportStatus({
      userId,
      roomId,
      reportId,
      status: parsed.data.status,
      staffNotes: parsed.data.staffNotes ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}
