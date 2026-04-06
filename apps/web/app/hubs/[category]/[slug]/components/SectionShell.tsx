"use client";

import { cn } from "./hubUtils";

export function SectionShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-3 sm:p-5 md:p-6")}>
      <div className="flex w-full min-w-0 flex-wrap items-start justify-between gap-3 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]">{title}</h2>
          {description ? <p className="mt-1 text-[13px] text-[var(--ud-text-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="w-full min-w-0">{children}</div>
    </section>
  );
}
