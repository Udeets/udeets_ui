import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { createClient } from "@/lib/supabase/server";
import { assertCanSubscribeToChatMessages } from "@/lib/services/chat/chat-realtime";

type RouteCtx = { params: Promise<{ roomId: string }> };

/** Call before opening a browser Realtime channel on `chat_messages` for this room. */
export async function GET(_request: Request, context: RouteCtx) {
  try {
    const userId = await requireChatUserId();
    const { roomId } = await context.params;
    const supabase = await createClient();
    await assertCanSubscribeToChatMessages(supabase, roomId, userId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return chatRouteError(err);
  }
}
