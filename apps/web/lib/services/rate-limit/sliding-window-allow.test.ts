import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabase: vi.fn(),
}));

import { createServiceRoleSupabase } from "@/lib/supabase/admin";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";

describe("allowSlidingWindowRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls Postgres RPC when service role client is available", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    vi.mocked(createServiceRoleSupabase).mockReturnValue({ rpc } as never);

    await expect(allowSlidingWindowRateLimit("k1", 5, 60_000)).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledWith("chat_rate_limit_sliding_allow", {
      p_key: "k1",
      p_max: 5,
      p_window_ms: 60_000,
    });
  });

  it("fails open on RPC error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    vi.mocked(createServiceRoleSupabase).mockReturnValue({ rpc } as never);

    await expect(allowSlidingWindowRateLimit("k2", 1, 1000)).resolves.toBe(true);
    errSpy.mockRestore();
  });

  it("falls back to in-memory sliding window when service role client is null", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServiceRoleSupabase).mockReturnValue(null);

    const key = `fb:${Math.random()}`;
    expect(await allowSlidingWindowRateLimit(key, 2, 10_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 2, 10_000)).toBe(true);
    expect(await allowSlidingWindowRateLimit(key, 2, 10_000)).toBe(false);
    errSpy.mockRestore();
  });
});
