"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import type { ChatRealtimeServerEvent } from "@/lib/services/chat/chat-realtime-contract";
import { mapChatPostgresPayloadToServerEvents } from "@/lib/services/chat/map-chat-realtime-postgres";
import { createClient } from "@/lib/supabase/client";

export type ChatRoomRealtimeHandlers = {
  onServerEvent?: (event: ChatRealtimeServerEvent) => void;
  /** Raw Realtime subscribe status (`SUBSCRIBED`, `CHANNEL_ERROR`, …). */
  onSubscribeStatus?: (status: string, err?: Error) => void;
};

function bindRoomTable(
  channel: RealtimeChannel,
  table: string,
  roomId: string,
  handlers: ChatRoomRealtimeHandlers,
) {
  const filter = `room_id=eq.${roomId}`;
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table, filter },
    (payload) => {
      const events = mapChatPostgresPayloadToServerEvents(payload);
      for (const ev of events) handlers.onServerEvent?.(ev);
    },
  );
}

/** Server checks membership before any Realtime traffic (same guard as DB RLS). */
export async function preflightChatRealtime(roomId: string, apiBase = ""): Promise<void> {
  const res = await fetch(`${apiBase}/api/chat/rooms/${roomId}/realtime-preflight`, {
    credentials: "include",
    method: "GET",
  });
  if (!res.ok) throw new Error(`Realtime preflight failed: ${res.status}`);
}

/**
 * Subscribe to hub chat updates for one room. Uses Supabase Realtime (WebSocket) +
 * `postgres_changes`; RLS on each table ensures non-members never receive rows.
 * Call `preflight` first (also invoked here) so the app fails fast before opening the socket.
 */
export async function subscribeChatRoomRealtime(
  roomId: string,
  handlers: ChatRoomRealtimeHandlers,
  options?: { supabase?: SupabaseClient; apiBase?: string },
): Promise<() => Promise<void>> {
  await preflightChatRealtime(roomId, options?.apiBase ?? "");
  const supabase = options?.supabase ?? createClient();
  const channel = supabase.channel(`ud-chat:${roomId}`);

  bindRoomTable(channel, "chat_messages", roomId, handlers);
  bindRoomTable(channel, "chat_message_reactions", roomId, handlers);
  bindRoomTable(channel, "chat_poll_votes", roomId, handlers);
  bindRoomTable(channel, "chat_room_memberships", roomId, handlers);
  bindRoomTable(channel, "chat_room_typing", roomId, handlers);
  bindRoomTable(channel, "chat_message_reports", roomId, handlers);

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const t = setTimeout(() => {
      if (!settled) {
        settled = true;
        void supabase.removeChannel(channel);
        reject(new Error("Realtime subscribe timed out"));
      }
    }, 20_000);

    channel.subscribe((status, err) => {
      handlers.onSubscribeStatus?.(status, err);
      if (settled) return;
      if (status === "SUBSCRIBED") {
        settled = true;
        clearTimeout(t);
        resolve();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        settled = true;
        clearTimeout(t);
        reject(err ?? new Error(`Realtime subscribe ${status}`));
      }
    });
  });

  return async () => {
    await supabase.removeChannel(channel);
  };
}
