"use client";

import type { WorkflowStat } from "../types";

export function WorkflowStatCard({ stat }: { stat: WorkflowStat }) {
  return (
    <div className="rounded-2xl bg-[#F7FBFA] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#111111]">{stat.value}</p>
    </div>
  );
}
