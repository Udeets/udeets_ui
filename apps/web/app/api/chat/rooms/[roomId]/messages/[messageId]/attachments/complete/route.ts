import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";
import { ChatRateLimitError } from "@/lib/services/chat/chat-errors";
import {
  CHAT_ATTACHMENT_COMPLETE_MAX,
  CHAT_ATTACHMENT_MUTATION_WINDOW_MS,
} from "@/lib/services/chat/chat-rate-limits";
import { completeUploadBodySchema, parseJsonBody } from "@/lib/services/chat/chat-schemas";
import { completeChatAttachmentUpload } from "@/lib/services/chat/complete-chat-attachment-upload";

type RouteCtx = { params: Promise<{ roomId: string; messageId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, messageId } = await context.params;
    const rlKey = `chat:att:complete:${userId}:${roomId}`;
    if (!(await allowSlidingWindowRateLimit(rlKey, CHAT_ATTACHMENT_COMPLETE_MAX, CHAT_ATTACHMENT_MUTATION_WINDOW_MS))) {
      throw new ChatRateLimitError();
    }
    const raw = await request.json();
    const parsed = parseJsonBody(raw, completeUploadBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    const b = parsed.data;
    const result = await completeChatAttachmentUpload({
      userId,
      roomId,
      messageId,
      storageKey: b.storageKey,
      mimeType: b.mimeType,
      originalFilename: b.originalFilename,
      sizeBytes: b.sizeBytes,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return chatRouteError(err);
  }
}
