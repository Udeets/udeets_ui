/** In-process sliding-window counter (per key). Not distributed across instances. */
const buckets = new Map<string, number[]>();

export function allowSlidingWindow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let stamps = buckets.get(key) ?? [];
  stamps = stamps.filter((t) => now - t < windowMs);
  if (stamps.length >= max) {
    buckets.set(key, stamps);
    return false;
  }
  stamps.push(now);
  buckets.set(key, stamps);
  return true;
}
