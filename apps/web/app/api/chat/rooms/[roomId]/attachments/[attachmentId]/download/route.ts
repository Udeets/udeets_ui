import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";
import { ChatRateLimitError } from "@/lib/services/chat/chat-errors";
import {
  CHAT_ATTACHMENT_DOWNLOAD_MAX,
  CHAT_ATTACHMENT_DOWNLOAD_WINDOW_MS,
} from "@/lib/services/chat/chat-rate-limits";
import { createSignedChatAttachmentDownloadUrl } from "@/lib/services/chat/signed-chat-attachment-download";

type RouteCtx = { params: Promise<{ roomId: string; attachmentId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId, attachmentId } = await context.params;
    const rlKey = `chat:att:download:${userId}:${roomId}`;
    if (!(await allowSlidingWindowRateLimit(rlKey, CHAT_ATTACHMENT_DOWNLOAD_MAX, CHAT_ATTACHMENT_DOWNLOAD_WINDOW_MS))) {
      throw new ChatRateLimitError();
    }
    const result = await createSignedChatAttachmentDownloadUrl({ userId, roomId, attachmentId });
    return NextResponse.json(result);
  } catch (err) {
    return chatRouteError(err);
  }
}
