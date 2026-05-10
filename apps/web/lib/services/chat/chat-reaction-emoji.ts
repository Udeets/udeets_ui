/** Reactions are raw emoji text — do not run HTML sanitizers (they can break ZWJ sequences). */
export function normalizeChatReactionEmoji(raw: string): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return "";
  return t.length > 32 ? t.slice(0, 32) : t;
}

/** True when two stored reaction strings are the same emoji (handles NFC / FE0F variance). */
export function sameChatReactionEmoji(a: string, b: string): boolean {
  const x = normalizeChatReactionEmoji(a);
  const y = normalizeChatReactionEmoji(b);
  if (x === y) return true;
  try {
    return x.normalize("NFC") === y.normalize("NFC");
  } catch {
    return false;
  }
}
