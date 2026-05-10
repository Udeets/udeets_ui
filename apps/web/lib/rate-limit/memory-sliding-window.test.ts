import { describe, expect, it } from "vitest";

import { allowSlidingWindow } from "@/lib/rate-limit/memory-sliding-window";

describe("allowSlidingWindow", () => {
  it("allows up to max events per window", () => {
    const key = `t:${Math.random()}`;
    expect(allowSlidingWindow(key, 3, 10_000)).toBe(true);
    expect(allowSlidingWindow(key, 3, 10_000)).toBe(true);
    expect(allowSlidingWindow(key, 3, 10_000)).toBe(true);
    expect(allowSlidingWindow(key, 3, 10_000)).toBe(false);
  });
});
