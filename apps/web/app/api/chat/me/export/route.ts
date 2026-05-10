import { NextResponse } from "next/server";

import { requireChatUserId } from "@/app/api/chat/_lib/chat-route-auth";
import { chatRouteError } from "@/app/api/chat/_lib/chat-route-error";
import { exportChatUserData } from "@/lib/services/chat/export-chat-user-data";

export async function GET() {
  try {
    const userId = await requireChatUserId();
    const data = await exportChatUserData(userId);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return chatRouteError(err);
  }
}
