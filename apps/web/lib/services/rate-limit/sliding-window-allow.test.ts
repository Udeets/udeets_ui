import { describe, expect, it } from "vitest";
import { allowSlidingWindowRateLimit } from "./sliding-window-allow";

describe("allowSlidingWindowRateLimit", () => {
  it("allows requests under the limit", async () => {
    const key = `test-${Date.now()}`;
    expect(await allowSlidingWindowRateLimit(key, 3, 60_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 3, 60_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 3, 60_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 3, 60_000)).toBe(false);
  });
});
