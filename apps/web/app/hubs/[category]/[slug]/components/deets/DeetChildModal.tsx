"use client";

import { X } from "lucide-react";
import { ICON } from "../hubUtils";

export function DeetChildModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-[var(--ud-bg-overlay)] p-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-[var(--ud-bg-card)] shadow-[0_24px_70px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-[var(--ud-border)] px-5 py-4">
          <h4 className="text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--ud-border)] p-2 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)]"
          >
            <X className={ICON} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
