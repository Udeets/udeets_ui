"use client";

import { Pencil } from "lucide-react";
import type { HubSection } from "@/lib/services/sections/section-types";
import { TAG_LABELS, TAG_COLORS } from "@/lib/services/sections/section-types";
import { ACTION_ICON, ACTION_ICON_BUTTON, cn } from "../../hubUtils";

export function CustomSectionDisplay({
  sections,
  isCreatorAdmin,
  onEdit,
}: {
  sections: HubSection[];
  isCreatorAdmin: boolean;
  onEdit?: () => void;
}) {
  const visibleSections = sections.filter((s) => s.is_visible);

  if (visibleSections.length === 0 && !isCreatorAdmin) return null;

  return (
    <div className="space-y-4">
      {visibleSections.map((section) => (
        <div key={section.id} className="rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-500">{section.title}</p>
            {isCreatorAdmin && onEdit ? (
              <button type="button" onClick={onEdit} className={ACTION_ICON_BUTTON} aria-label="Edit sections">
                <Pencil className={ACTION_ICON} />
              </button>
            ) : null}
          </div>
          {section.items.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {section.items.map((item) => (
                <li key={item.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5">
                  {item.tag ? (
                    <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", TAG_COLORS[item.tag as keyof typeof TAG_COLORS] || "bg-slate-100 text-slate-600")}>
                      {TAG_LABELS[item.tag as keyof typeof TAG_LABELS] || item.tag}
                    </span>
                  ) : (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0C5C57]" />
                  )}
                  <div className="min-w-0">
                    <span className="text-sm text-[#111111]">{item.label}</span>
                    {item.value ? (
                      <span className="ml-1 text-xs text-slate-400">{item.value}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">No items added yet.</p>
          )}
        </div>
      ))}

      {isCreatorAdmin && visibleSections.length === 0 && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm text-slate-500 transition hover:border-[#A9D1CA]"
        >
          <span className="font-medium text-[#111111]">Add a custom section</span>
          {" — "}Create sections like Menu, Hours, Rules, Services, and more.
        </button>
      ) : null}
    </div>
  );
}
