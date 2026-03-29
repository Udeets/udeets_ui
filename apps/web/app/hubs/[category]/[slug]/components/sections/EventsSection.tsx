"use client";

import type { HubContent } from "@/lib/hub-content";
import { BUTTON_SECONDARY, cn } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export function EventsSection({
  events,
  highlightedItemId,
  onViewEventUpdate,
}: {
  events: HubContent["events"];
  highlightedItemId: string | null;
  onViewEventUpdate: (focusId: string) => void;
}) {
  return (
    <SectionShell title="Events" description="Upcoming plans, gatherings, and reminders for this hub.">
      {events.length === 0 ? (
        <div className="grid min-h-[260px] place-items-center text-center">
          <div className="max-w-sm">
            <h3 className="text-xl font-serif font-semibold tracking-tight text-[#111111]">No events yet</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Plan the first event for your hub when you are ready.</p>
          </div>
        </div>
      ) : (
        <section className="space-y-4">
          {events.map((event) => (
            <article
              id={event.id}
              key={event.id}
              className={cn(
                "scroll-mt-28 rounded-2xl border border-slate-100 bg-slate-50 p-5 transition",
                highlightedItemId === event.id && "ring-2 ring-[#A9D1CA] ring-offset-2 ring-offset-white"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#A9D1CA]/55 px-2.5 py-1 text-[11px] font-semibold text-[#0C5C57]">{event.theme}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{event.badge}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-serif font-semibold text-[#111111]">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                </div>

                <button type="button" onClick={() => onViewEventUpdate(event.focusId)} className={BUTTON_SECONDARY}>
                  View event update
                </button>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3">{event.dateLabel}</div>
                <div className="rounded-2xl bg-white px-4 py-3">{event.time}</div>
                <div className="rounded-2xl bg-white px-4 py-3">{event.location}</div>
              </div>
            </article>
          ))}
        </section>
      )}
    </SectionShell>
  );
}
