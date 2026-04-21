/** Local calendar date `YYYY-MM-DD` for the given `Date` (browser local). */
export function localYmd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse stored local datetime (`YYYY-MM-DDTHH:mm`, ISO, or date-only) into date + `HH:mm` fields.
 * Used for poll deadlines, scheduled publish, etc.
 */
export function parseLocalDateTime(raw: string): { date: string; time: string } {
  const s = raw.trim().replace(/Z$/i, "");
  if (!s) return { date: "", time: "" };
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  const dOnly = s.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dOnly) return { date: dOnly[1], time: "23:59" };
  const ms = Date.parse(s);
  if (!Number.isNaN(ms)) {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return { date: localYmd(d), time: `${hh}:${mm}` };
  }
  return { date: "", time: "" };
}

/** Combine date + 24h time into `YYYY-MM-DDTHH:mm` for payloads. */
export function buildLocalDateTime(date: string, time: string): string {
  const d = date.trim();
  if (!d) return "";
  let t = (time.trim() || "23:59").slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(t)) t = "23:59";
  return `${d}T${t}`;
}
