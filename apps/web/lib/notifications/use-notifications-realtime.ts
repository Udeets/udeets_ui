"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getChatAccessTokenFromCookies } from "@/lib/chat/get-chat-access-token";
import type {
  NotificationEventEnvelope,
  NotificationRealtimeServerMessage,
} from "@/lib/notifications/notifications-realtime-types";

const MAX_SEEN_EVENTS = 500;
const PING_MS = 25_000;
const RECONNECT_MS = 3_000;

function isNotificationsRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NOTIFICATIONS_REALTIME_ENABLED === "true";
}

function notificationsWsBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL ??
    "ws://localhost:8000/api/v1/notifications/ws"
  ).replace(/\/$/, "");
}

export type UseNotificationsRealtimeOptions = {
  enabled?: boolean;
  onEvent?: (envelope: NotificationEventEnvelope) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export function useNotificationsRealtime({
  enabled = true,
  onEvent,
  onConnectionChange,
}: UseNotificationsRealtimeOptions) {
  const [connected, setConnected] = useState(false);
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

  const connect = useCallback(() => {
    if (!isNotificationsRealtimeEnabled() || !enabled) return;
    const token = getChatAccessTokenFromCookies();
    if (!token) return;

    const url = `${notificationsWsBaseUrl()}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      onConnectionChange?.(true);
      pingTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, PING_MS);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as NotificationRealtimeServerMessage;
        if (msg.type !== "event") return;
        const envelope = msg.envelope;
        if (seenEventsRef.current.has(envelope.event_id)) return;
        rememberEvent(envelope.event_id);
        onEvent?.(envelope);
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      onConnectionChange?.(false);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      wsRef.current = null;
      if (enabled && isNotificationsRealtimeEnabled()) {
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_MS);
      }
    };
  }, [enabled, onEvent, onConnectionChange, rememberEvent]);

  useEffect(() => {
    if (!isNotificationsRealtimeEnabled() || !enabled) {
      setConnected(false);
      return () => {};
    }
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, enabled]);

  return { connected };
}

export function isNotificationsRealtimeFeatureEnabled(): boolean {
  return isNotificationsRealtimeEnabled();
}
