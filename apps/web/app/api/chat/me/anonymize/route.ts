import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { anonymizeChatUserData } from "@/lib/services/chat/anonymize-chat-user-data";

/** Call when the authenticated user deletes their account or requests erasure of chat content. */
export async function POST() {
  try {
    const userId = await requireChatUserId();
    await anonymizeChatUserData(userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return chatRouteError(err);
  }
}
