"use client";

import { Copy, Loader2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../hubUtils";

export function InviteModal({
  hubName,
  hubSlug,
  hubCategory,
  onClose,
}: {
  hubName: string;
  hubSlug: string;
  hubCategory: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Use custom subdomain URL if available (hubSlug is the custom subdomain)
  const inviteLink = `https://${hubSlug}.udeets.com?action=join`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
        onClose();
      }, 1500);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  const handleComingSoon = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  return (
    <>
      {/* Modal overlay */}
      <div
        className="fixed inset-0 z-40 bg-[var(--ud-bg-overlay)] transition"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-[var(--ud-bg-card)] p-6 shadow-xl">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-6 pr-8">
            <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">
              Invite people to {hubName}
            </h2>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Copy invite link button */}
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={copied}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition",
                copied
                  ? "bg-gradient-to-r from-[var(--ud-brand-primary)] to-[var(--ud-brand-primary)] text-white"
                  : "bg-gradient-to-r from-[var(--ud-brand-primary)] to-[var(--ud-brand-primary)] text-white hover:opacity-90"
              )}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy Invite Link"}
            </button>

            {/* Invite uDeets member button */}
            <button
              type="button"
              onClick={handleComingSoon}
              className="rounded-lg border border-[var(--ud-brand-primary)] px-4 py-3 font-medium text-[var(--ud-brand-primary)] transition hover:bg-[var(--ud-brand-light)]"
            >
              Invite uDeets Member
            </button>
          </div>

          {/* Coming soon message - shown temporarily */}
          {showToast && (
            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              {copied ? "Link copied to clipboard!" : "Coming soon"}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
