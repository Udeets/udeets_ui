"use client";

export const dynamic = "force-dynamic";

import { Calendar, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { listMyMemberships } from "@/lib/services/members/list-my-memberships";

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
  dateLabel: string;
  time: string;
  location: string;
  description: string;
  group: "Today" | "Tomorrow" | "This Week" | "Upcoming";
}

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      const supabase = createClient();
      const memberships = await listMyMemberships();
      const hubIds = memberships.filter((m) => m.status === "active").map((m) => m.hubId);

      if (!hubIds.length || cancelled) {
        setLoading(false);
        return;
      }

      // Fetch events from all user's hubs
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
        setLoading(false);
        return;
      }

      // Fetch hub info
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
          dateLabel: eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          time: formatTime(row.start_time, row.end_time),
          location: row.location || "No location specified",
          description: row.description || "",
          group: getEventGroup(eventDate),
        };
      });

      setEvents(mapped);
      setLoading(false);
    }

    void loadEvents();
    return () => { cancelled = true; };
  }, []);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.hubName.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    );
  }, [events, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, EventDisplay[]> = {};
    for (const e of filteredEvents) {
      (groups[e.group] ??= []).push(e);
    }
    return groups;
  }, [filteredEvents]);

  return (
    <AuthGuard>
      <MockAppShell activeNav="events">
        <section className="mb-4">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Events</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
            Discover events across your hubs and communities.
          </p>
        </section>

        <section className={cardClass("p-5 sm:p-6")}>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-4 py-3">
            <Search className="h-5 w-5 text-[var(--ud-text-muted)]" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, hubs, or locations..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ud-text-secondary)] outline-none sm:text-base"
            />
          </div>
        </section>

        {loading ? (
          <div className={cardClass("mt-6 p-8 text-center")}>
            <p className="text-sm text-[var(--ud-text-muted)]">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className={cardClass("mt-6 p-8 text-center")}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ud-brand-light)]">
              <Calendar className="h-7 w-7 text-[var(--ud-brand-primary)]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--ud-text-primary)]">No upcoming events</h3>
            <p className="mt-2 text-sm text-[var(--ud-text-muted)]">
              Events from your hubs will appear here once they are published.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <section key={group} className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className={sectionTitleClass()}>{group}</h2>
                <p className="text-sm text-[var(--ud-text-muted)]">{items.length} event{items.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((event) => (
                  <div key={event.id} className={cardClass("block p-5 sm:p-6")}>
                    <h3 className="text-lg font-semibold text-[var(--ud-text-primary)]">{event.title}</h3>
                    <p className="mt-1 text-sm font-medium text-[var(--ud-brand-primary)]">{event.hubName}</p>
                    <div className="mt-3 space-y-1 text-sm text-[var(--ud-text-secondary)]">
                      <p>{event.dateLabel}</p>
                      {event.time && <p>{event.time}</p>}
                      <p>{event.location}</p>
                    </div>
                    {event.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </MockAppShell>
    </AuthGuard>
  );
}

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

function getEventGroup(date: Date): "Today" | "Tomorrow" | "This Week" | "Upcoming" {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return "This Week";
  return "Upcoming";
}
