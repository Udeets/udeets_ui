/** userId → last activity epoch ms (for pruning stale typing indicators). */
export type TypingMap = Record<string, number>;

export function pruneTypingMap(prev: TypingMap, now: number, maxAgeMs: number): TypingMap {
  const next = { ...prev };
  for (const k of Object.keys(next)) {
    if (now - next[k] > maxAgeMs) delete next[k];
  }
  return next;
}
