"use client";

import { Paperclip } from "lucide-react";
import { BUTTON_SECONDARY, ICON, PREMIUM_ICON_WRAPPER } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export function FilesSection({ fileItems }: { fileItems: string[] }) {
  return (
    <SectionShell title="Files" description="Shared guides, forms, and reference files for this hub.">
      {fileItems.length === 0 ? (
        <div className="grid min-h-[240px] w-full place-items-center text-center">
          <div className="w-full">
            <h3 className="text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]">No files yet</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ud-text-secondary)]">Shared guides, forms, and resources will appear here.</p>
          </div>
        </div>
      ) : (
        <section className="w-full space-y-3">
          {fileItems.map((file) => (
            <div key={file} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] p-4">
              <div className="flex items-center gap-3">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <Paperclip className={ICON} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--ud-text-primary)]">{file}</p>
                  <p className="text-xs text-[var(--ud-text-muted)]">Mock shared file</p>
                </div>
              </div>
              <button type="button" className={BUTTON_SECONDARY}>
                Open
              </button>
            </div>
          ))}
        </section>
      )}
    </SectionShell>
  );
}
