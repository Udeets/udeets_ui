/**
 * Client-side public-holiday hints for the events calendar fallback.
 * Region is inferred from Intl locale / timezone (no geolocation, no IP).
 */

export type PublicHolidayEventDisplay = {
  id: string;
  title: string;
  hubName: string;
  eventDate: Date;
  time: string;
  location: string;
  isHoliday: boolean;
};

type HolidaySetId = "US" | "IN" | "GB" | "GENERIC";

/** 0 = Sunday … 6 = Saturday */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  const delta = (weekday - firstDow + 7) % 7;
  const day = 1 + delta + (nth - 1) * 7;
  return new Date(year, month, day);
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0);
  const lastDow = last.getDay();
  const diff = (lastDow - weekday + 7) % 7;
  const d = last.getDate() - diff;
  return new Date(year, month, d);
}

function regionSubtagFromLocale(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "";
    const m = locale.match(/-([a-zA-Z]{2})\b/);
    return m ? m[1].toUpperCase() : "";
  } catch {
    return "";
  }
}

function inferHolidaySetFromTimezone(tz: string): HolidaySetId {
  if (tz.includes("Kolkata") || tz.includes("Calcutta")) return "IN";
  if (tz === "Europe/London") return "GB";
  const nonUsAmerica = new Set([
    "America/Toronto",
    "America/Vancouver",
    "America/Winnipeg",
    "America/Edmonton",
    "America/Halifax",
    "America/St_Johns",
    "America/Mexico_City",
    "America/Sao_Paulo",
    "America/Buenos_Aires",
    "America/Santiago",
  ]);
  if (tz.startsWith("America/") && !nonUsAmerica.has(tz)) return "US";
  return "GENERIC";
}

export function resolvePublicHolidaySetId(): HolidaySetId {
  const region = regionSubtagFromLocale();
  if (region === "IN") return "IN";
  if (region === "US") return "US";
  if (region === "GB" || region === "UK") return "GB";

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return inferHolidaySetFromTimezone(tz);
  } catch {
    return "GENERIC";
  }
}

type NamedHoliday = { title: string; date: Date };

function fixedHolidaysInYear(
  year: number,
  entries: Array<{ month: number; day: number; title: string }>
): NamedHoliday[] {
  return entries.map((e) => ({
    title: e.title,
    date: new Date(year, e.month, e.day),
  }));
}

function usFederalHolidays(year: number): NamedHoliday[] {
  return [
    { title: "New Year's Day", date: new Date(year, 0, 1) },
    { title: "Martin Luther King Jr. Day", date: nthWeekdayOfMonth(year, 0, 1, 3) },
    { title: "Presidents' Day", date: nthWeekdayOfMonth(year, 1, 1, 3) },
    { title: "Memorial Day", date: lastWeekdayOfMonth(year, 4, 1) },
    { title: "Juneteenth", date: new Date(year, 5, 19) },
    { title: "Independence Day", date: new Date(year, 6, 4) },
    { title: "Labor Day", date: nthWeekdayOfMonth(year, 8, 1, 1) },
    { title: "Columbus Day", date: nthWeekdayOfMonth(year, 9, 1, 2) },
    { title: "Veterans Day", date: new Date(year, 10, 11) },
    { title: "Thanksgiving", date: nthWeekdayOfMonth(year, 10, 4, 4) },
    { title: "Christmas Day", date: new Date(year, 11, 25) },
  ];
}

function indiaFixedHolidays(year: number): NamedHoliday[] {
  return fixedHolidaysInYear(year, [
    { month: 0, day: 1, title: "New Year's Day" },
    { month: 0, day: 15, title: "Makar Sankranti" },
    { month: 0, day: 26, title: "Republic Day" },
    { month: 2, day: 14, title: "Holi" },
    { month: 3, day: 14, title: "Ambedkar Jayanti" },
    { month: 4, day: 1, title: "May Day" },
    { month: 7, day: 15, title: "Independence Day" },
    { month: 8, day: 5, title: "Teachers' Day" },
    { month: 9, day: 2, title: "Gandhi Jayanti" },
    { month: 9, day: 24, title: "Dussehra" },
    { month: 10, day: 1, title: "Diwali" },
    { month: 10, day: 14, title: "Children's Day" },
    { month: 11, day: 25, title: "Christmas" },
  ]);
}

function gbBankHolidaysEnglandWales(year: number): NamedHoliday[] {
  return [
    { title: "New Year's Day", date: new Date(year, 0, 1) },
    { title: "Early May bank holiday", date: nthWeekdayOfMonth(year, 4, 1, 1) },
    { title: "Spring bank holiday", date: lastWeekdayOfMonth(year, 4, 1) },
    { title: "Summer bank holiday", date: lastWeekdayOfMonth(year, 7, 1) },
    { title: "Christmas Day", date: new Date(year, 11, 25) },
    { title: "Boxing Day", date: new Date(year, 11, 26) },
  ];
}

function genericHolidays(year: number): NamedHoliday[] {
  return fixedHolidaysInYear(year, [
    { month: 0, day: 1, title: "New Year's Day" },
    { month: 4, day: 1, title: "International Workers' Day" },
    { month: 11, day: 25, title: "Christmas Day" },
  ]);
}

function holidaysForSet(set: HolidaySetId, year: number): NamedHoliday[] {
  switch (set) {
    case "US":
      return usFederalHolidays(year);
    case "IN":
      return indiaFixedHolidays(year);
    case "GB":
      return gbBankHolidaysEnglandWales(year);
    default:
      return genericHolidays(year);
  }
}

/**
 * Upcoming public holidays for the inferred region, as list rows for the events UI.
 */
export function getUpcomingPublicHolidays(now: Date = new Date()): PublicHolidayEventDisplay[] {
  const set = resolvePublicHolidaySetId();
  const y = now.getFullYear();
  const all: NamedHoliday[] = [...holidaysForSet(set, y), ...holidaysForSet(set, y + 1)];

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return all
    .filter((h) => h.date >= startOfToday)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 12)
    .map((h) => ({
      id: `holiday-${set}-${h.date.getFullYear()}-${h.date.getMonth()}-${h.date.getDate()}`,
      title: h.title,
      hubName: "Public Holiday",
      eventDate: h.date,
      time: "All day",
      location: "",
      isHoliday: true,
    }));
}
