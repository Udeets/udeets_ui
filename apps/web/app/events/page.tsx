"use client";

export const dynamic = "force-dynamic";

import { Calendar, CalendarDays, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MockAppShell from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { listMyMemberships } from "@/lib/services/members/list-my-memberships";

/* ── types ── */
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
  hubSlug: string;
  hubCategory: string;
  eventDate: Date;
  dateLabel: string;
  time: string;
  location: string;
  description: string;
  isHoliday: boolean;
}

/* ── helpers ── */
const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

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

/** Static holidays fallback when no events exist */
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
        hubSlug: "",
        hubCategory: "",
        eventDate: d,
        dateLabel: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        time: "All day",
        location: "",
        description: "",
        isHoliday: true,
      };
    })
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .slice(0, 12);
}

/* ── main page ── */
export default function EventsPage() {
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      const supabase = createClient();
      const memberships = await listMyMemberships();
      const hubIds = memberships.filter((m) => m.status === "active").map((m) => m.hubId);

      if (!hubIds.length || cancelled) {
        if (!cancelled) {
          setEvents(getUpcomingHolidays());
          setLoading(false);
        }
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);

      const { data: rows, error } = await supabase
        .from("events")
        .select("id, hub_id, title, description, event_date, start_time, end_time, location, created_at")
        .in("hub_id", hubIds)
        .gte("event_date", todayStr)
        .order("event_date", { ascending: true })
        .limit(50);

      if (error || cancelled) {
        console.error("[events] Failed to load:", error);
        if (!cancelled) {
          setEvents(getUpcomingHolidays());
          setLoading(false);
        }
        return;
      }

      const { data: hubs } = await supabase
        .from("hubs")
        .select("id, name, slug, category")
        .in("id", hubIds);

      const hubMap = Object.fromEntries(
        (hubs ?? []).map((h) => [h.id, { name: h.name, slug: h.slug, category: h.category }]),
      );

      if (cancelled) return;

      const mapped: EventDisplay[] = (rows ?? []).map((row: EventRow) => {
        const hub = hubMap[row.hub_id] || { name: "Unknown Hub", slug: "", category: "" };
        const eventDate = new Date(row.event_date + "T00:00:00");
        return {
          id: row.id,
          title: row.title,
          hubName: hub.name,
          hubSlug: hub.slug,
          hubCategory: hub.category,
          eventDate,
          dateLabel: eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          time: formatTime(row.start_time, row.end_time),
          location: row.location || "",
          description: row.description || "",
          isHoliday: false,
        };
      });

      // If no hub events, show holidays as fallback
      const final = mapped.length > 0 ? mapped : getUpcomingHolidays();
      setEvents(final);
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
        groups.push({
          label: `${FULL_MONTHS[ev.eventDate.getMonth()]} ${ev.eventDate.getFullYear()}`,
          items: [],
        });
      }
      groups[groups.length - 1].items.push(ev);
    }
    return groups;
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
            {eventsByMonth.map((group) => (
              <div key={group.label}>
                {/* Month header */}
                <div className="sticky top-0 z-10 bg-[#F0F8F6] px-4 py-2">
                  <span className="text-sm font-bold text-[#0C5C57]">{group.label}</span>
                </div>

                {/* Event items — Band-style list rows */}
                {group.items.map((ev) => {
                  const d = ev.eventDate;
                  const dayNum = d.getDate();
                  const dayName = SHORT_DAY[d.getDay()];

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3"
                    >
                      {/* Date column */}
                      <div className="flex w-10 shrink-0 flex-col items-center">
                        <span className="text-lg font-bold leading-none text-[var(--ud-text-primary)]">
                          {dayNum}
                        </span>
                        <span className="mt-0.5 text-[11px] font-medium text-gray-400">
                          {dayName}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="h-10 w-px bg-gray-200" />

                      {/* Event info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">
                          {ev.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {ev.isHoliday ? "Public Holiday" : ev.hubName}
                          {ev.time && !ev.isHoliday ? ` · ${ev.time}` : ""}
                        </p>
                      </div>

                      {/* Calendar icon */}
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
