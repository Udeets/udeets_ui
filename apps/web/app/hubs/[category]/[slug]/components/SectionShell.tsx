"use client";

import { CARD, cn } from "./hubUtils";

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
    <section className={cn(CARD, "w-full min-w-0 p-5 sm:p-6")}>
      <div className="flex w-full min-w-0 flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-5 w-full min-w-0">{children}</div>
    </section>
  );
}
