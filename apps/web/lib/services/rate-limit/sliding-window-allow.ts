import { allowSlidingWindow } from "@/lib/rate-limit/memory-sliding-window";

export type { RateLimitBackend } from "@/lib/services/rate-limit/rate-limit-backend-config";

/** In-process sliding-window rate limit (no external store). */
export async function allowSlidingWindowRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  return allowSlidingWindow(key, max, windowMs);
}
