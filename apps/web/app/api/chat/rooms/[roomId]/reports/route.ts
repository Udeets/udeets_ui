import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";
import { ChatRateLimitError } from "@/lib/services/chat/chat-errors";
import { CHAT_REPORT_MAX, CHAT_REPORT_WINDOW_MS } from "@/lib/services/chat/chat-rate-limits";
import { createReportBodySchema, listReportsQuerySchema, parseJsonBody, parseSearchParams } from "@/lib/services/chat/chat-schemas";
import { createChatReport } from "@/lib/services/chat/create-chat-report";
import { listChatMessageReports } from "@/lib/services/chat/list-chat-reports";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function GET(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const q = parseSearchParams(new URL(request.url).searchParams, listReportsQuerySchema);
    if (!q.ok) return chatBadRequest(q.error);
    const reports = await listChatMessageReports(userId, roomId, { status: q.data.status });
    return NextResponse.json({ reports });
  } catch (err) {
    return chatRouteError(err);
  }
}

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const rlKey = `chat:report:${userId}:${roomId}`;
    if (!(await allowSlidingWindowRateLimit(rlKey, CHAT_REPORT_MAX, CHAT_REPORT_WINDOW_MS))) {
      throw new ChatRateLimitError();
    }
    const raw = await request.json();
    const parsed = parseJsonBody(raw, createReportBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    const b = parsed.data;
    const result = await createChatReport({
      userId,
      roomId,
      targetMessageId: b.targetMessageId ?? null,
      targetUserId: b.targetUserId ?? null,
      reason: b.reason,
      reasonCode: b.reasonCode ?? null,
      details: b.details ?? null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return chatRouteError(err);
  }
}
