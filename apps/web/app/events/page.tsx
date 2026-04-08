"use client";

export const dynamic = "force-dynamic";

import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MockAppShell from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { listMyMemberships } from "@/lib/services/members/list-my-memberships";

/* ── helpers ── */
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface EventRow {
  id: string;
  hub_id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  created_at: string;
}

interface EventDisplay {
  id: string;
  title: string;
  hubName: string;
  eventDate: Date;
  time: string;
  location: string;
  isHoliday: boolean;
}

const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const GRID7: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" };

function formatTime(start: string | null, end: string | null): string {
  if (!start) return "";
  const fmt = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${suffix}`;
  };
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

function getUpcomingHolidays(): EventDisplay[] {
  const now = new Date();
  const year = now.getFullYear();
  const holidays: Array<{ month: number; day: number; title: string }> = [
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
  ];

  return holidays
    .map((h) => {
      let d = new Date(year, h.month, h.day);
      if (d < now) d = new Date(year + 1, h.month, h.day);
      return {
        id: `holiday-${h.month}-${h.day}`,
        title: h.title,
        hubName: "Public Holiday",
        eventDate: d,
        time: "All day",
        location: "",
        isHoliday: true,
      };
    })
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .slice(0, 12);
}

/* ── Calendar grid helpers ── */
function buildCalendarGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const rows: Array<Array<{ date: Date; inMonth: boolean }>> = [];
  let current = new Date(year, month, 1 - startDay);

  for (let r = 0; r < 6; r++) {
    const row: Array<{ date: Date; inMonth: boolean }> = [];
    for (let c = 0; c < 7; c++) {
      row.push({ date: new Date(current), inMonth: current.getMonth() === month });
      current.setDate(current.getDate() + 1);
    }
    rows.push(row);
    if (current.getMonth() !== month && current.getDate() > 7) break;
  }
  return rows;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* ── main page ── */
export default function EventsPage() {
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      const supabase = createClient();
      const memberships = await listMyMemberships();
      const hubIds = memberships.filter((m) => m.status === "active").map((m) => m.hubId);

      if (!hubIds.length || cancelled) {
        if (!cancelled) { setEvents(getUpcomingHolidays()); setLoading(false); }
        return;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: rows, error } = await supabase
        .from("events")
        .select("id, hub_id, title, description, event_date, start_time, end_time, location, created_at")
        .in("hub_id", hubIds)
        .gte("event_date", todayStr)
        .order("event_date", { ascending: true })
        .limit(50);

      if (error || cancelled) {
        if (!cancelled) { setEvents(getUpcomingHolidays()); setLoading(false); }
        return;
      }

      const { data: hubs } = await supabase.from("hubs").select("id, name").in("id", hubIds);
      const hubMap = Object.fromEntries((hubs ?? []).map((h) => [h.id, h.name]));
      if (cancelled) return;

      const mapped: EventDisplay[] = (rows ?? []).map((row: EventRow) => ({
        id: row.id,
        title: row.title,
        hubName: hubMap[row.hub_id] || "Hub",
        eventDate: new Date(row.event_date + "T00:00:00"),
        time: formatTime(row.start_time, row.end_time),
        location: row.location || "",
        isHoliday: false,
      }));

      setEvents(mapped.length > 0 ? mapped : getUpcomingHolidays());
      setLoading(false);
    }

    void loadEvents();
    return () => { cancelled = true; };
  }, []);

  /* Group events by month */
  const eventsByMonth = useMemo(() => {
    const groups: Array<{ label: string; items: EventDisplay[] }> = [];
    let currentKey = "";
    for (const ev of events) {
      const key = `${ev.eventDate.getFullYear()}-${ev.eventDate.getMonth()}`;
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ label: `${FULL_MONTHS[ev.eventDate.getMonth()]} ${ev.eventDate.getFullYear()}`, items: [] });
      }
      groups[groups.length - 1].items.push(ev);
    }
    return groups;
  }, [events]);

  /* Calendar grid data */
  const grid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const eventsOn = (date: Date) => events.filter((e) => isSameDay(e.eventDate, date));

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  return (
    <AuthGuard>
      <MockAppShell activeNav="events">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0C5C57] border-t-transparent" />
          </div>
        ) : (
          <div className="pb-20">
            {/* Toggle button */}
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition",
                  viewMode === "list"
                    ? "bg-[#E8F5F3] text-[#0C5C57]"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <CalendarDays className="h-4 w-4" />
                {viewMode === "list" ? "Calendar View" : "List View"}
              </button>
            </div>

            {/* ═══ CALENDAR VIEW ═══ */}
            {viewMode === "calendar" && (
              <div className="px-4 pb-4">
                {/* Month nav */}
                <div className="flex items-center justify-between pb-4">
                  <button
                    type="button"
                    onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
                    className="text-sm font-medium text-gray-500"
                  >
                    Today
                  </button>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => shiftMonth(-1)} className="p-1 text-gray-400">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-base font-bold text-gray-900">
                      {SHORT_MONTHS[viewMonth]} {viewYear}
                    </span>
                    <button type="button" onClick={() => shiftMonth(1)} className="p-1 text-gray-400">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                </div>

                {/* Day headers */}
                <div style={GRID7} className="pb-2">
                  {DAY_HEADERS.map((d, i) => (
                    <span key={i} className="text-center text-[11px] font-medium text-gray-400">{d}</span>
                  ))}
                </div>

                {/* Calendar grid */}
                {grid.map((row, ri) => (
                  <div key={ri} style={GRID7}>
                    {row.map((cell) => {
                      const isToday = isSameDay(cell.date, today);
                      const hasEvents = eventsOn(cell.date).length > 0;
                      return (
                        <div
                          key={cell.date.toISOString()}
                          className={cn(
                            "flex h-10 items-center justify-center text-sm",
                            !cell.inMonth && "text-gray-300",
                            cell.inMonth && !isToday && "text-gray-900",
                            isToday && "font-bold",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              isToday && "bg-[#0C5C57] text-white",
                              hasEvents && !isToday && "ring-2 ring-[#0C5C57]/30"
                            )}
                          >
                            {cell.date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* ═══ LIST VIEW — grouped by month ═══ */}
            {eventsByMonth.map((group) => (
              <div key={group.label}>
                <div className="sticky top-0 z-10 bg-[#F0F8F6] px-4 py-2">
                  <span className="text-sm font-bold text-[#0C5C57]">{group.label}</span>
                </div>
                {group.items.map((ev) => {
                  const d = ev.eventDate;
                  return (
                    <div key={ev.id} className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
                      <div className="flex w-10 shrink-0 flex-col items-center">
                        <span className="text-lg font-bold leading-none text-gray-900">{d.getDate()}</span>
                        <span className="mt-0.5 text-[11px] font-medium text-gray-400">{SHORT_DAY[d.getDay()]}</span>
                      </div>
                      <div className="h-10 w-px bg-gray-200" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{ev.title}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {ev.isHoliday ? "Public Holiday" : ev.hubName}
                          {ev.time && !ev.isHoliday ? ` · ${ev.time}` : ""}
                        </p>
                      </div>
                      <CalendarDays className="h-5 w-5 shrink-0 text-[#0C5C57]" />
                    </div>
                  );
                })}
              </div>
            ))}

            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">No upcoming events</p>
              </div>
            )}
          </div>
        )}
      </MockAppShell>
    </AuthGuard>
  );
}
