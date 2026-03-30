"use client";

import type { ReactNode } from "react";
import { cardClass } from "@/components/mock-app-shell";

export function StepPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-17rem)] max-w-3xl items-center justify-center">
      <div className={cardClass("w-full max-w-2xl p-6 sm:p-8")}>
        <div className="text-center">
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-[#111111]">{title}</h1>
          {subtitle ? <p className="mt-3 text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
