export type AmPm = "AM" | "PM";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Parse `HH:mm` (24h) into 12h clock parts. */
export function parseTime24ToParts(hhmm: string): { hour12: number; minute: string; ampm: AmPm } {
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { hour12: 12, minute: "00", ampm: "AM" };
  let H = parseInt(m[1], 10);
  const minute = m[2].slice(0, 2).padStart(2, "0");
  if (Number.isNaN(H) || H < 0 || H > 23) return { hour12: 12, minute: "00", ampm: "AM" };
  const ampm: AmPm = H >= 12 ? "PM" : "AM";
  let h12 = H % 12;
  if (h12 === 0) h12 = 12;
  return { hour12: h12, minute, ampm };
}

/** Build `HH:mm` from 12h clock. */
export function partsToTime24(hour12: number, minuteStr: string, ampm: AmPm): string {
  let min = parseInt(minuteStr, 10);
  if (Number.isNaN(min)) min = 0;
  min = clamp(min, 0, 59);
  const h = clamp(hour12, 1, 12);
  let H = h % 12;
  if (ampm === "PM") H += 12;
  return `${String(H).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Normalize free-form time to `HH:mm` (24h).
 * Accepts `HH:mm`, `H:mm`, or `h:mm AM` / `hh:mm PM`. Returns "" if empty or unparseable.
 */
export function normalizeEventTimeTo24h(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [a, b] = t.split(":");
    const H = clamp(parseInt(a, 10), 0, 23);
    const M = clamp(parseInt(b, 10), 0, 59);
    return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`;
  }
  const m = t.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)\s*$/i);
  if (m) {
    const h = parseInt(m[1], 10);
    const minStr = String(clamp(parseInt(m[2], 10), 0, 59)).padStart(2, "0");
    const ap = (m[3].toUpperCase() === "PM" ? "PM" : "AM") as AmPm;
    return partsToTime24(h, minStr, ap);
  }
  return "";
}

/** Human label like `3:05 PM` from stored `HH:mm`. */
export function format24hAs12hLabel(hhmm: string): string {
  const n = normalizeEventTimeTo24h(hhmm);
  if (!n) return "";
  const { hour12, minute, ampm } = parseTime24ToParts(n);
  return `${hour12}:${minute} ${ampm}`;
}
