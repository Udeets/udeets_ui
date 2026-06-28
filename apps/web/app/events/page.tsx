"use client";

export const dynamic = "force-dynamic";

import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import MockAppShell from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { getUpcomingPublicHolidays } from "@/lib/calendar/public-holidays";
import { listUpcomingEventsFeedApi } from "@/lib/api/events";

/* ── helpers ── */
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

type UpcomingEventFeedRow = {
  id: string;
  title: string;
  hubName?: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
};

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

/* ── Calendar grid helpers ── */
function buildCalendarGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const rows: Array<Array<{ date: Date; inMonth: boolean }>> = [];
  const current = new Date(year, month, 1 - startDay);

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

/** Find the nearest event on or after the clicked date */
function findNearestEventId(events: EventDisplay[], clickedDate: Date): string | null {
  // First: exact date match
  const exact = events.find((e) => isSameDay(e.eventDate, clickedDate));
  if (exact) return exact.id;

  // Second: nearest future event after clicked date
  const clickedMs = clickedDate.getTime();
  let closest: EventDisplay | null = null;
  let closestDist = Infinity;

  for (const ev of events) {
    const dist = Math.abs(ev.eventDate.getTime() - clickedMs);
    if (dist < closestDist) {
      closestDist = dist;
      closest = ev;
    }
  }

  return closest?.id ?? null;
}

/* ── main page ── */
export default function EventsPage() {
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      let rows: UpcomingEventFeedRow[] = [];
      try {
        rows = await listUpcomingEventsFeedApi(50);
      } catch (error) {
        console.error("[events] failed to load events feed", error);
      }

      if (!rows.length || cancelled) {
        if (!cancelled) {
          setEvents(getUpcomingPublicHolidays());
          setLoading(false);
        }
        return;
      }
      if (cancelled) return;

      const mapped: EventDisplay[] = rows.map((row) => ({
        id: row.id,
        title: row.title,
        hubName: row.hubName || "Hub",
        eventDate: new Date(row.eventDate + "T00:00:00"),
        time: formatTime(row.startTime, row.endTime),
        location: row.location || "",
        isHoliday: false,
      }));

      setEvents(mapped.length > 0 ? mapped : getUpcomingPublicHolidays());
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

  /* Handle calendar date click — scroll to nearest event */
  const handleDateClick = useCallback((clickedDate: Date) => {
    const targetId = findNearestEventId(events, clickedDate);
    if (!targetId) return;

    setHighlightedId(targetId);

    // Scroll the event into view
    requestAnimationFrame(() => {
      const el = document.getElementById(`event-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    // Remove highlight after a short time
    setTimeout(() => setHighlightedId(null), 2000);
  }, [events]);

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

                {/* Calendar grid — clickable dates */}
                {grid.map((row, ri) => (
                  <div key={ri} style={GRID7}>
                    {row.map((cell) => {
                      const isTodayCell = isSameDay(cell.date, today);
                      const hasEvents = eventsOn(cell.date).length > 0;
                      return (
                        <button
                          key={cell.date.toISOString()}
                          type="button"
                          onClick={() => handleDateClick(cell.date)}
                          className={cn(
                            "flex h-10 items-center justify-center text-sm transition",
                            !cell.inMonth && "text-gray-300",
                            cell.inMonth && !isTodayCell && "text-gray-900",
                            isTodayCell && "font-bold",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              isTodayCell && "bg-[#0C5C57] text-white",
                              hasEvents && !isTodayCell && "ring-2 ring-[#0C5C57]/30"
                            )}
                          >
                            {cell.date.getDate()}
                          </span>
                        </button>
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
                  const isHighlighted = highlightedId === ev.id;
                  return (
                    <div
                      key={ev.id}
                      id={`event-${ev.id}`}
                      className={cn(
                        "flex items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors duration-500",
                        isHighlighted ? "bg-[#E8F5F3]" : "bg-white"
                      )}
                    >
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
