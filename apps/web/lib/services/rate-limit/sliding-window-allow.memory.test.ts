import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/rate-limit/rate-limit-backend-config", () => ({
  CHAT_HTTP_RATE_LIMIT_BACKEND: "memory" as const,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabase: vi.fn(),
}));

import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";

describe("allowSlidingWindowRateLimit (memory backend)", () => {
  it("uses in-process sliding window and does not call Supabase", async () => {
    const key = `mem:${Math.random()}`;
    expect(await allowSlidingWindowRateLimit(key, 2, 10_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 2, 10_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 2, 10_000)).toBe(false);
    expect(createServiceRoleSupabase).not.toHaveBeenCalled();
  });
});
