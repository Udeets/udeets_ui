export type RateLimitBackend = "memory";

/** HTTP rate limits use in-process counters (single-instance / dev-friendly). */
export const CHAT_HTTP_RATE_LIMIT_BACKEND: RateLimitBackend = "memory";
