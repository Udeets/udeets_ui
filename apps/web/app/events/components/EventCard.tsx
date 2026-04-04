"use client";

import Link from "next/link";
import { cardClass } from "@/components/mock-app-shell";
import type { EventCardProps } from "../types";

export function EventCard({ event }: EventCardProps) {
  return (
    <Link key={event.id} href={event.href} className={cardClass("block p-5 sm:p-6 transition hover:-translate-y-0.5")}>
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full bg-[var(--ud-brand-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ud-brand-primary)]">
          {event.theme}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">
          {event.badge}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-[var(--ud-text-primary)]">{event.title}</h3>
      <p className="mt-1 text-sm font-medium text-[var(--ud-text-secondary)]">{event.hub}</p>
      <div className="mt-3 space-y-1 text-sm text-[var(--ud-text-secondary)]">
        <p>{event.dateLabel}</p>
        <p>{event.time}</p>
        <p>{event.location}</p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{event.description}</p>
    </Link>
  );
}
