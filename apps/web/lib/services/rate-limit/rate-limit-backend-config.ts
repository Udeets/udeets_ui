export type RateLimitBackend = "memory" | "postgres";

/**
 * Where HTTP rate-limit counters live for chat API routes.
 *
 * - **`postgres`** (default) — distributed across all server instances via Supabase RPC
 *   `chat_rate_limit_sliding_allow` (requires `SUPABASE_SERVICE_ROLE_KEY` on the server).
 * - **`memory`** — in-process `Map` only; use for local dev if you intentionally avoid the service role,
 *   or for tests (mock this module).
 *
 * There is **no env var** for this; change the constant when you need a different mode.
 * See `docs/rate-limiting.md`.
 */
export const CHAT_HTTP_RATE_LIMIT_BACKEND: RateLimitBackend = "postgres";
