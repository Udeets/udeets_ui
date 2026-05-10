import { allowSlidingWindow } from "@/lib/rate-limit/memory-sliding-window";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";

import { CHAT_HTTP_RATE_LIMIT_BACKEND } from "@/lib/services/rate-limit/rate-limit-backend-config";

export type { RateLimitBackend } from "@/lib/services/rate-limit/rate-limit-backend-config";

/**
 * Sliding-window allow check. Uses {@link CHAT_HTTP_RATE_LIMIT_BACKEND} in
 * `rate-limit-backend-config.ts` (`postgres` = distributed Supabase; `memory` = in-process).
 */
export async function allowSlidingWindowRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  if (CHAT_HTTP_RATE_LIMIT_BACKEND !== "postgres") {
    return allowSlidingWindow(key, max, windowMs);
  }

  const admin = createServiceRoleSupabase();
  if (!admin) {
    console.error(
      "[rate-limit] CHAT_HTTP_RATE_LIMIT_BACKEND is postgres but SUPABASE_SERVICE_ROLE_KEY is missing; falling back to in-memory (not distributed)",
    );
    return allowSlidingWindow(key, max, windowMs);
  }

  const { data, error } = await admin.rpc("chat_rate_limit_sliding_allow", {
    p_key: key,
    p_max: max,
    p_window_ms: windowMs,
  });

  if (error) {
    // Fail-open: do not block chat if the limiter store is unavailable (documented in docs/rate-limiting.md).
    console.error("[rate-limit] chat_rate_limit_sliding_allow RPC failed", error);
    return true;
  }

  return data === true;
}
