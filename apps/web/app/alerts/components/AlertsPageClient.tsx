"use client";

import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";

const ALERTS: Array<{
  id: string;
  title: string;
  source: string;
  time: string;
  body: string;
}> = [];

export default function AlertsPageClient() {
  return (
    <MockAppShell activeNav="alerts">
      <section className="mb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Alerts</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
          Quick notifications from the hubs and communities you follow most closely.
        </p>
      </section>

      <div className="space-y-4">
        {ALERTS.length ? (
          ALERTS.map((alert) => (
            <article key={alert.id} className={cardClass("p-5 sm:p-6")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--ud-brand-light)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ud-text-primary)]">
                  Alert
                </span>
                <span className="text-xs text-[var(--ud-text-muted)]">{alert.time}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-[var(--ud-text-primary)]">{alert.title}</h2>
              <p className="mt-1 text-sm font-medium text-[var(--ud-text-muted)]">{alert.source}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{alert.body}</p>
            </article>
          ))
        ) : (
          <article className={cardClass("p-5 text-center sm:p-6")}>
            <h2 className="text-xl font-semibold text-[var(--ud-text-primary)]">No alerts yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
              Hub alerts will appear here once your hubs start publishing updates.
            </p>
          </article>
        )}
      </div>

      <section className={cardClass("mt-6 p-5 sm:p-6")}>
        <h2 className={sectionTitleClass()}>Notification Summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[var(--ud-bg-subtle)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">Unread</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--ud-text-primary)]">7</p>
          </div>
          <div className="rounded-2xl bg-[var(--ud-bg-subtle)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">Important</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--ud-text-primary)]">3</p>
          </div>
          <div className="rounded-2xl bg-[var(--ud-bg-subtle)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">Muted Hubs</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--ud-text-primary)]">2</p>
          </div>
        </div>
      </section>
    </MockAppShell>
  );
}
