"use client";

import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../hubUtils";

export function DeleteHubModal({
  hubName,
  hubId,
  onClose,
  onDeleted,
}: {
  hubName: string;
  hubId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmationText === hubName;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const { deleteHub } = await import("@/lib/services/hubs/delete-hub");
      const result = await deleteHub(hubId);

      if (!result.success) {
        setError(result.error || "Failed to delete hub");
        setIsDeleting(false);
        return;
      }

      // Successfully deleted, redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Error deleting hub:", err);
      setError("An unexpected error occurred");
      setIsDeleting(false);
    }
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
        <div className="relative w-full max-w-md rounded-2xl bg-[var(--ud-bg-card)] p-6 shadow-xl">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="absolute right-4 top-4 rounded-lg p-1 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-secondary)] disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-4 pr-8">
            <h2 className="text-lg font-semibold text-red-600">
              Delete {hubName}?
            </h2>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              This action cannot be undone. All hub data will be permanently deleted.
            </p>
          </div>

          {/* Confirmation input */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-[var(--ud-text-muted)]">
              Type <strong>{hubName}</strong> to confirm deletion
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={hubName}
              disabled={isDeleting}
              className="w-full rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 py-2 text-sm text-[var(--ud-text-primary)] outline-none transition focus:border-red-300 focus:ring-1 focus:ring-red-200 disabled:opacity-50"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 rounded-lg border border-[var(--ud-border)] px-4 py-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                isConfirmed && !isDeleting
                  ? "border border-red-600 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                "Delete Hub"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
