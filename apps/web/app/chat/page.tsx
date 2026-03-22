"use client";

import MockAppShell, { cardClass } from "@/components/mock-app-shell";

const THREADS = [
  {
    id: "c1",
    name: "RKS Organizers",
    preview: "Can we lock the volunteer list by Friday evening?",
    time: "2m ago",
    unread: 3,
  },
  {
    id: "c2",
    name: "Desi Bites Team",
    preview: "Weekend menu graphics look good. Posting mock update shortly.",
    time: "22m ago",
    unread: 0,
  },
  {
    id: "c3",
    name: "Neighborhood Planning",
    preview: "I added the landscaping note to the agenda draft.",
    time: "1h ago",
    unread: 1,
  },
];

export default function ChatPage() {
  return (
    <MockAppShell activeNav="chat">
      <section className="mb-4">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-[#111111]">Chat</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Mock direct and group conversations for organizers, members, and community admins.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className={cardClass("p-4")}>
          <div className="space-y-3">
            {THREADS.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className="flex w-full items-start justify-between rounded-2xl bg-[#F7FBFA] px-4 py-4 text-left hover:bg-[#EEF7F5]"
              >
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{thread.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{thread.preview}</p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-xs text-slate-500">{thread.time}</p>
                  {thread.unread ? (
                    <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0C5C57] px-2 text-xs font-semibold text-white">
                      {thread.unread}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className={cardClass("flex min-h-[420px] flex-col p-6")}>
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-serif font-semibold text-[#111111]">RKS Organizers</h2>
            <p className="mt-1 text-sm text-slate-500">Mock conversation preview</p>
          </div>

          <div className="flex-1 space-y-4 py-5">
            <div className="max-w-[80%] rounded-2xl bg-[#F7FBFA] px-4 py-3 text-sm text-slate-700">
              Volunteer registration looks strong. We just need final parking instructions.
            </div>
            <div className="ml-auto max-w-[80%] rounded-2xl bg-[#A9D1CA]/55 px-4 py-3 text-sm text-[#111111]">
              I can draft the parking update and queue it as a mock post tonight.
            </div>
            <div className="max-w-[80%] rounded-2xl bg-[#F7FBFA] px-4 py-3 text-sm text-slate-700">
              Perfect. Let&apos;s share it in the organizer thread before sending it to subscribers.
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
              Type a message... (mock only)
            </div>
          </div>
        </section>
      </div>
    </MockAppShell>
  );
}
