import { describe, expect, it } from "vitest";

import { pruneTypingMap } from "./merge-chat-typing";

describe("pruneTypingMap", () => {
  it("drops stale entries", () => {
    const now = 10_000;
    const prev = { a: 1000, b: 9000 };
    expect(pruneTypingMap(prev, now, 1500)).toEqual({ b: 9000 });
  });
});
