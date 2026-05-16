"use client";

import { Link2, Send, X } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "../hubUtils";
import { SendInviteTab } from "./invite/SendInviteTab";
import { ShareJoinAccessTab } from "./invite/ShareJoinAccessTab";

type InviteTab = "send" | "share";

export function InviteModal({
  hubName,
  hubSlug,
  hubCategory,
  hubId,
  hubLogoUrl,
  onClose,
}: {
  hubName: string;
  hubSlug: string;
  hubCategory: string;
  hubId: string;
  hubLogoUrl?: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<InviteTab>("send");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[var(--ud-bg-overlay)]" onClick={onClose} aria-hidden />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
      >
        <div className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-2xl bg-[var(--ud-bg-card)] shadow-xl">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--ud-border-subtle)] p-5">
            <div className="min-w-0">
              <h2 id="invite-modal-title" className="truncate text-lg font-semibold text-[var(--ud-text-primary)]">
                Invite to {hubName}
              </h2>
              <p className="mt-1 text-xs text-[var(--ud-text-muted)]">
                {activeTab === "send"
                  ? "Invite people directly by email or phone."
                  : "Share a join link or QR code so people can find your hub."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-lg p-1.5 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1 border-b border-[var(--ud-border-subtle)] px-3">
            {([
              { key: "send" as const, label: "Send Invite", icon: Send },
              { key: "share" as const, label: "Link & QR", icon: Link2 },
            ]).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-sm font-medium transition sm:px-3",
                    active
                      ? "border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)]"
                      : "border-transparent text-[var(--ud-text-secondary)] hover:text-[var(--ud-text-primary)]",
                  )}
                >
                  <Icon className="h-4 w-4 stroke-[1.8]" aria-hidden />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div
            className={cn(
              "min-h-0 flex-1",
              activeTab === "share" ? "overflow-hidden p-4" : "overflow-y-auto p-5",
            )}
            role="tabpanel"
          >
            {activeTab === "send" ? (
              <SendInviteTab hubId={hubId} onToast={showToast} />
            ) : (
              <ShareJoinAccessTab
                hubId={hubId}
                hubName={hubName}
                hubCategory={hubCategory}
                hubSlug={hubSlug}
                hubLogoUrl={hubLogoUrl}
                onToast={showToast}
              />
            )}
          </div>

          {toast ? (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[var(--ud-text-primary)] px-4 py-2 text-xs font-medium text-white shadow-lg">
              {toast}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
