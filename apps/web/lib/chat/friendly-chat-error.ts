/** Patterns that indicate infrastructure / DB / PostgREST details — never show raw to end users. */
const BACKEND_OR_TECH =
  /PGRST|postgrest|schema cache|42P17|infinite recursion|ECONNREFUSED|ECONNRESET|fetch failed|internal server|chat_room|chat_message|violates foreign key|duplicate key|permission denied for table|relation ".*" does not exist|Request failed \(\d+\)|NetworkError|Failed to fetch/i;

/**
 * Maps thrown API/network errors to a short, user-safe string.
 * Preserves known rate-limit copy; otherwise hides technical messages.
 */
export function friendlyChatUserMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const m = err.message.trim();
  if (!m) return fallback;
  if (m.includes("CHAT_RATE_LIMIT") || /too many requests/i.test(m)) return m.length <= 200 ? m : fallback;
  if (BACKEND_OR_TECH.test(m)) return fallback;
  if (m.length > 200) return fallback;
  return m;
}
