import { describe, expect, it } from "vitest";

import { applyTypingRealtimeEvent, pruneTypingMap } from "./merge-chat-typing";

describe("applyTypingRealtimeEvent", () => {
  it("records started and ignores self", () => {
    const ev = { name: "typing.started" as const, payload: { roomId: "r", userId: "u1", updatedAt: "" } };
    expect(applyTypingRealtimeEvent({}, ev, "u1")).toEqual({});
    const next = applyTypingRealtimeEvent({}, ev);
    expect(next.u1).toBeGreaterThan(0);
  });

  it("removes on stopped", () => {
    const prev = { u1: 100 };
    const ev = { name: "typing.stopped" as const, payload: { roomId: "r", userId: "u1" } };
    expect(applyTypingRealtimeEvent(prev, ev)).toEqual({});
  });
});

describe("pruneTypingMap", () => {
  it("drops stale entries", () => {
    const prev = { a: 1000, b: 9000 };
    const now = 10_000;
    expect(pruneTypingMap(prev, now, 1500)).toEqual({ b: 9000 });
  });
});
