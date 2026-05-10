import { NextResponse } from "next/server";

import { chatBadRequest } from "@/app/api/chat/_lib/chat-bad-request";
import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";
import { ChatRateLimitError } from "@/lib/services/chat/chat-errors";
import {
  CHAT_ATTACHMENT_MUTATION_WINDOW_MS,
  CHAT_ATTACHMENT_PREPARE_MAX,
} from "@/lib/services/chat/chat-rate-limits";
import { parseJsonBody, prepareUploadBodySchema } from "@/lib/services/chat/chat-schemas";
import { prepareChatAttachmentUpload } from "@/lib/services/chat/prepare-chat-attachment-upload";

type RouteCtx = { params: Promise<{ roomId: string; messageId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, messageId } = await context.params;
    const rlKey = `chat:att:prepare:${userId}:${roomId}`;
    if (!(await allowSlidingWindowRateLimit(rlKey, CHAT_ATTACHMENT_PREPARE_MAX, CHAT_ATTACHMENT_MUTATION_WINDOW_MS))) {
      throw new ChatRateLimitError();
    }
    const raw = await request.json();
    const parsed = parseJsonBody(raw, prepareUploadBodySchema);
    if (!parsed.ok) return chatBadRequest(parsed.error);
    const b = parsed.data;
    const result = await prepareChatAttachmentUpload({
      userId,
      roomId,
      messageId,
      fileName: b.fileName,
      mimeType: b.mimeType,
      sizeBytes: b.sizeBytes,
    });
    return NextResponse.json(result);
  } catch (err) {
    return chatRouteError(err);
  }
}
