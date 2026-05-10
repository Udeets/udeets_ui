import type { ChatRealtimeServerEvent } from "@/lib/services/chat/chat-realtime-contract";

/** userId → last activity epoch ms (for pruning). */
export type TypingMap = Record<string, number>;

export function applyTypingRealtimeEvent(prev: TypingMap, ev: ChatRealtimeServerEvent, viewerUserId?: string): TypingMap {
  if (ev.name === "typing.started") {
    const { userId } = ev.payload;
    if (viewerUserId && userId === viewerUserId) return prev;
    return { ...prev, [userId]: Date.now() };
  }
  if (ev.name === "typing.stopped") {
    const { userId } = ev.payload;
    const next = { ...prev };
    delete next[userId];
    return next;
  }
  return prev;
}

export function pruneTypingMap(prev: TypingMap, now: number, maxAgeMs: number): TypingMap {
  const next = { ...prev };
  for (const k of Object.keys(next)) {
    if (now - next[k] > maxAgeMs) delete next[k];
  }
  return next;
}
