"use client";

import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";

const ALERTS = [
  {
    id: "a1",
    title: "Temple festival reminder",
    source: "Hindu Center of Virginia",
    time: "10m ago",
    body: "Festival seva registration closes tonight at 8 PM. Final reminder sent to subscribers.",
  },
  {
    id: "a2",
    title: "Weekend combo just dropped",
    source: "Desi Bites",
    time: "1h ago",
    body: "The new family combo is now live for Friday through Sunday pickup and dine-in orders.",
  },
  {
    id: "a3",
    title: "Parking update for meetup",
    source: "Richmond Kannada Sangha",
    time: "3h ago",
    body: "Overflow parking has moved to the east lot for tonight's cultural program.",
  },
];

export default function AlertsPage() {
  return (
    <MockAppShell activeNav="alerts">
      <section className="mb-4">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-[#111111]">Alerts</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Quick, mock notifications from the hubs and communities you follow most closely.
        </p>
      </section>

      <div className="space-y-4">
        {ALERTS.map((alert) => (
          <article key={alert.id} className={cardClass("p-5 sm:p-6")}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#A9D1CA] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111]">
                Alert
              </span>
              <span className="text-xs text-slate-500">{alert.time}</span>
            </div>
            <h2 className="mt-3 text-xl font-serif font-semibold text-[#111111]">{alert.title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{alert.source}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{alert.body}</p>
          </article>
        ))}
      </div>

      <section className={cardClass("mt-6 p-5 sm:p-6")}>
        <h2 className={sectionTitleClass()}>Notification Summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#F7FBFA] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Unread</p>
            <p className="mt-2 text-2xl font-serif font-semibold text-[#111111]">7</p>
          </div>
          <div className="rounded-2xl bg-[#F7FBFA] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Important</p>
            <p className="mt-2 text-2xl font-serif font-semibold text-[#111111]">3</p>
          </div>
          <div className="rounded-2xl bg-[#F7FBFA] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Muted Hubs</p>
            <p className="mt-2 text-2xl font-serif font-semibold text-[#111111]">2</p>
          </div>
        </div>
      </section>
    </MockAppShell>
  );
}
