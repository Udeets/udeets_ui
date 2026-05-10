import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { createPollBodySchema, parseJsonBody } from "@/lib/services/chat/chat-schemas";
import { createChatPoll } from "@/lib/services/chat/create-chat-poll";

type RouteCtx = { params: Promise<{ roomId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const raw = await request.json();
    const parsed = parseJsonBody(raw, createPollBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    const b = parsed.data;
    const result = await createChatPoll({
      userId,
      roomId,
      question: b.question,
      options: b.options,
      allowMultiple: b.allowMultiple,
      anonymousVoting: b.anonymousVoting,
      closesAt: b.closesAt ?? null,
      messageBody: b.messageBody,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return chatRouteError(err);
  }
}
