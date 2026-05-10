import { createClient } from "@/lib/supabase/server";
import {
  ChatForbiddenError,
  ChatNotFoundError,
  ChatUnauthorizedError,
} from "@/lib/services/chat/chat-errors";

export type CreateChatRoomInput = {
  userId: string;
  hubId: string;
  name: string;
  description?: string | null;
};

export type CreateChatRoomResult = { roomId: string };

/**
 * Creates a room and an active owner membership for the signed-in user (`auth.uid()` in DB).
 * Uses RPC `create_chat_room_for_hub` (SECURITY DEFINER) so creation is not blocked by RLS
 * edge cases on direct `insert` from PostgREST.
 */
export async function createChatRoom(input: CreateChatRoomInput): Promise<CreateChatRoomResult> {
  const supabase = await createClient();

  const { data: roomId, error } = await supabase.rpc("create_chat_room_for_hub", {
    p_hub_id: input.hubId,
    p_name: input.name.trim(),
    p_description: input.description?.trim() ?? null,
  });

  if (error) {
    console.error("[createChatRoom] rpc", error);
    const msg = (error.message ?? "").toUpperCase();
    if (msg.includes("CHAT_ROOM_CREATE_FORBIDDEN")) {
      throw new ChatForbiddenError("Only hub creators or admins can create chat rooms.");
    }
    if (msg.includes("CHAT_ROOM_CREATE_UNAUTH")) {
      throw new ChatUnauthorizedError();
    }
    if (msg.includes("CHAT_ROOM_HUB_NOT_FOUND")) {
      throw new ChatNotFoundError("Hub not found.");
    }
    if (msg.includes("CHAT_ROOM_NAME_INVALID")) {
      throw new Error("Room name must be between 1 and 200 characters.");
    }
    if (msg.includes("CHAT_ROOM_DESC_INVALID")) {
      throw new Error("Description must be at most 2000 characters.");
    }
    throw new Error("Could not create chat room.");
  }

  if (!roomId || typeof roomId !== "string") {
    console.error("[createChatRoom] unexpected rpc payload", roomId);
    throw new Error("Could not create chat room.");
  }

  return { roomId };
}
