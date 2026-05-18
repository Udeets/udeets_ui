import { describe, expect, it } from "vitest";
import { allowSlidingWindowRateLimit } from "./sliding-window-allow";

describe("allowSlidingWindowRateLimit (memory)", () => {
  it("tracks limits per key", async () => {
    const key = `memory-${Date.now()}`;
    expect(await allowSlidingWindowRateLimit(key, 2, 60_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 2, 60_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 2, 60_000)).toBe(false);
  });
});
