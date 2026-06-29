"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatEventEnvelope, ChatRealtimeServerMessage } from "@/lib/chat/chat-realtime-types";
import { chatApiRealtimePreflight } from "@/lib/chat/chat-browser-api";
import { getChatAccessToken } from "@/lib/chat/get-chat-access-token";
import { pruneTypingMap, type TypingMap } from "@/lib/chat/merge-chat-typing";

const TYPING_PRUNE_MS = 8000;

const MAX_SEEN_EVENTS = 500;
const PING_MS = 25_000;
const RECONNECT_MS = 3_000;

function isRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHAT_REALTIME_ENABLED === "true";
}

function wsBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_FASTAPI_WS_URL ?? "ws://localhost:8000/api/v1/chat/ws"
  ).replace(/\/$/, "");
}

export type UseChatRealtimeOptions = {
  roomId: string | null;
  enabled?: boolean;
  lastSeenMessageId?: string | null;
  onEvent?: (envelope: ChatEventEnvelope) => void;
  onAccessRevoked?: (roomId: string, reason?: string) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export function useChatRealtime({
  roomId,
  enabled = true,
  lastSeenMessageId,
  onEvent,
  onAccessRevoked,
  onConnectionChange,
}: UseChatRealtimeOptions) {
  const [connected, setConnected] = useState(false);
  const [typingMap, setTypingMap] = useState<TypingMap>({});
  const seenEventsRef = useRef<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rememberEvent = useCallback((eventId: string) => {
    const set = seenEventsRef.current;
    set.add(eventId);
    if (set.size > MAX_SEEN_EVENTS) {
      const iter = set.values();
      set.delete(iter.next().value as string);
    }
  }, []);

  const handleEnvelope = useCallback(
    (envelope: ChatEventEnvelope) => {
      if (seenEventsRef.current.has(envelope.event_id)) return;
      rememberEvent(envelope.event_id);

      if (envelope.event_type === "typing.started") {
        const userId = String(envelope.payload.user_id || "");
        if (userId) {
          setTypingMap((m) => ({ ...m, [userId]: Date.now() }));
        }
        return;
      }
      if (envelope.event_type === "typing.stopped") {
        const userId = String(envelope.payload.user_id || "");
        if (userId) {
          setTypingMap((m) => {
            const next = { ...m };
            delete next[userId];
            return next;
          });
        }
        return;
      }
      if (envelope.event_type === "typing.snapshot") {
        const ids = envelope.payload.user_ids;
        if (Array.isArray(ids)) {
          const now = Date.now();
          const snap: TypingMap = {};
          for (const id of ids) {
            if (typeof id === "string" && id) snap[id] = now;
          }
          setTypingMap(snap);
        }
        return;
      }

      onEvent?.(envelope);
    },
    [onEvent, rememberEvent],
  );

  const connect = useCallback(() => {
    if (!isRealtimeEnabled() || !enabled || !roomId) return;

    void (async () => {
      const token = await getChatAccessToken();
      if (!token) {
        onConnectionChange?.(false);
        return;
      }

      try {
        await chatApiRealtimePreflight(roomId);
      } catch {
        onConnectionChange?.(false);
        return;
      }

      const url = `${wsBaseUrl()}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        onConnectionChange?.(true);
        ws.send(
          JSON.stringify({
            type: "room.join",
            roomId,
            lastSeenMessageId: lastSeenMessageId ?? null,
          }),
        );
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_MS);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as ChatRealtimeServerMessage;
          if (msg.type === "event") {
            handleEnvelope(msg.envelope);
            return;
          }
          if (msg.type === "room.access_revoked") {
            onAccessRevoked?.(msg.roomId, msg.reason);
            return;
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        onConnectionChange?.(false);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        wsRef.current = null;
        if (enabled && roomId && isRealtimeEnabled()) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_MS);
        }
      };
    })();
  }, [
    roomId,
    enabled,
    lastSeenMessageId,
    handleEnvelope,
    onAccessRevoked,
    onConnectionChange,
  ]);

  useEffect(() => {
    if (!isRealtimeEnabled() || !enabled || !roomId) {
      setConnected(false);
      return () => {};
    }
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN && roomId) {
        ws.send(JSON.stringify({ type: "room.leave", roomId }));
      }
      ws?.close();
      wsRef.current = null;
    };
  }, [connect, roomId, enabled]);

  useEffect(() => {
    const t = setInterval(() => {
      setTypingMap((m) => pruneTypingMap(m, Date.now(), TYPING_PRUNE_MS));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return { connected, typingMap };
}

export function isChatRealtimeFeatureEnabled(): boolean {
  return isRealtimeEnabled();
}

export function isChatPollingFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHAT_POLLING_FALLBACK_ENABLED !== "false";
}
