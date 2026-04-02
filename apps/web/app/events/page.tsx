"use client";

export const dynamic = "force-dynamic";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { HOME_EVENTS } from "@/lib/hub-content";
import { EventCard } from "./components/EventCard";
import { EVENT_THEMES } from "./constants";
import { filterEvents } from "./helpers";
import type { EventThemeFilter } from "./types";

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [activeTheme, setActiveTheme] = useState<EventThemeFilter>("All");

  const filteredEvents = useMemo(
    () => filterEvents(HOME_EVENTS, query, activeTheme),
    [activeTheme, query]
  );

  return (
    <MockAppShell activeNav="events">
      <section className="mb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Events</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Discover events across your hubs, communities, and favorite local places.
        </p>
      </section>

      <section className={cardClass("p-5 sm:p-6")}>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, hubs, locations, or themes..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none sm:text-base"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {EVENT_THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => setActiveTheme(theme)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeTheme === theme
                  ? "bg-[#A9D1CA]/55 text-[#0C5C57]"
                  : "bg-[#F7FBFA] text-slate-600 hover:bg-slate-100"
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className={sectionTitleClass()}>Event Discovery</h2>
          <p className="text-sm text-slate-500">{filteredEvents.length} events</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredEvents.length ? (
            filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <div className={cardClass("p-6 text-center lg:col-span-2")}>
              <h3 className="text-xl font-semibold text-[#111111]">No events yet</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Events will appear here once hubs start publishing them.
              </p>
            </div>
          )}
        </div>
      </section>
    </MockAppShell>
  );
}
