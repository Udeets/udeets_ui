"use client";

import { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { cn } from "../helpers";
import type { SettingsSection } from "../types";

export function SettingsSectionCard({
  section,
  settingsState,
  onToggle,
}: {
  section: SettingsSection;
  settingsState: Record<string, boolean>;
  onToggle: (label: string) => void;
}) {
  return (
    <section className={cardClass("p-5 sm:p-6")}>
      <h2 className={sectionTitleClass()}>{section.title}</h2>
      <div className="mt-5 space-y-4">
        {section.items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl bg-[#F7FBFA] p-4">
            <div>
              <p className="text-sm font-medium text-[#111111]">{item.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settingsState[item.label]}
              aria-label={item.label}
              onClick={() => onToggle(item.label)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-all duration-200",
                settingsState[item.label]
                  ? "bg-[#A9D1CA] ring-1 ring-[#0C5C57]/15"
                  : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
                  settingsState[item.label] ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
