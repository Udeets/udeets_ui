"use client";

import { AlertCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  confirmPhoneVerification,
  fetchVerificationStatus,
  resendEmailVerification,
  sendPhoneVerification,
} from "@/lib/api/auth";
import {
  VERIFICATION_MODAL_INTRO,
  VERIFICATION_RESTRICTED_ACCESS_MESSAGE,
} from "@/lib/auth/verification-messages";
import { formatUsPhoneDisplay } from "@/lib/auth/verification-routes";
import { notifyAuthSessionChanged } from "@/lib/auth/auth-session-events";

type VerificationFocus = "phone" | "email";

export function VerificationModal({
  open,
  focus,
  onClose,
  onVerified,
}: {
  open: boolean;
  focus: VerificationFocus;
  onClose: () => void;
  onVerified?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchVerificationStatus>>>(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const autoSentPhone = useRef(false);

  useEffect(() => {
    if (!open) {
      autoSentPhone.current = false;
      setOtp("");
      setMessage("");
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      const next = await fetchVerificationStatus();
      if (cancelled) return;
      setStatus(next);
      setLoading(false);
      if (next?.verificationComplete) {
        notifyAuthSessionChanged();
        onVerified?.();
        onClose();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, onClose, onVerified]);

  useEffect(() => {
    if (!open || loading || !status || autoSentPhone.current) return;
    const shouldAutoSend =
      Boolean(status.phone) &&
      !status.phoneVerified &&
      (focus === "phone" || !status.email);
    if (!shouldAutoSend) return;

    autoSentPhone.current = true;
    void (async () => {
      try {
        await sendPhoneVerification();
        setMessage("We sent a 6-digit code to your phone.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not send code");
      }
    })();
  }, [open, loading, status, focus]);

  if (!open) return null;

  const phonePending = Boolean(status?.phone && !status.phoneVerified);
  const emailPending = Boolean(status?.email && !status.emailVerified);
  const showPhoneFirst = focus === "phone" && phonePending;

  async function handleConfirmPhone(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await confirmPhoneVerification(otp.trim());
      notifyAuthSessionChanged();
      if (user.verificationComplete) {
        onVerified?.();
        onClose();
        return;
      }
      const next = await fetchVerificationStatus();
      setStatus(next);
      setOtp("");
      setMessage("Phone verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[var(--ud-bg-card)] p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
          aria-label="Close verification"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Limited access</p>
            <p className="mt-1 text-xs text-amber-800">{VERIFICATION_RESTRICTED_ACCESS_MESSAGE}</p>
          </div>
        </div>

        <h2 id="verification-modal-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
          Verify your account
        </h2>
        <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">{VERIFICATION_MODAL_INTRO}</p>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ud-brand-primary)] border-t-transparent" />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {showPhoneFirst && phonePending ? (
              <div className="rounded-xl border-2 border-[var(--ud-brand-primary)]/30 bg-[var(--ud-bg-subtle)]/50 p-4">
                <p className="text-sm font-semibold text-[var(--ud-text-primary)]">Phone verification</p>
                <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">
                  Enter the 6-digit code sent to {formatUsPhoneDisplay(status?.phone) || "your phone"}.
                </p>
                <form onSubmit={(e) => void handleConfirmPhone(e)} className="mt-4 space-y-3">
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-[var(--ud-border)] px-4 py-3 text-center text-lg tracking-[0.3em]"
                    placeholder="000000"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={busy || otp.length !== 6}
                    className="w-full rounded-xl bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Verify phone
                  </button>
                </form>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void sendPhoneVerification()
                      .then(() => setMessage("Code sent again."))
                      .catch((err) => setError(err instanceof Error ? err.message : "Could not resend"))
                  }
                  className="mt-3 text-sm font-medium text-[var(--ud-brand-primary)] hover:underline disabled:opacity-60"
                >
                  Resend code
                </button>
              </div>
            ) : null}

            {emailPending ? (
              <div
                className={
                  !showPhoneFirst && focus === "email"
                    ? "rounded-xl border-2 border-[var(--ud-brand-primary)]/30 bg-[var(--ud-bg-subtle)]/50 p-4"
                    : "rounded-xl border border-[var(--ud-border-subtle)] p-4"
                }
              >
                <p className="text-sm font-semibold text-[var(--ud-text-primary)]">Email verification</p>
                <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">
                  {status?.email
                    ? `Check your inbox at ${status.email} and click the verification link.`
                    : "Check your inbox and click the verification link."}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void resendEmailVerification()
                      .then(() => setMessage("Verification email sent."))
                      .catch((err) => setError(err instanceof Error ? err.message : "Could not resend"))
                  }
                  className="mt-3 text-sm font-medium text-[var(--ud-brand-primary)] hover:underline disabled:opacity-60"
                >
                  Resend email
                </button>
              </div>
            ) : null}

            {!showPhoneFirst && phonePending ? (
              <div className="rounded-xl border border-[var(--ud-border-subtle)] p-4">
                <p className="text-sm font-medium text-[var(--ud-text-primary)]">Phone verification</p>
                <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">
                  Verify {formatUsPhoneDisplay(status?.phone) || "your phone"} with a 6-digit code.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void sendPhoneVerification()
                      .then(() => setMessage("Code sent to your phone."))
                      .catch((err) => setError(err instanceof Error ? err.message : "Could not send"))
                  }
                  className="mt-3 text-sm font-medium text-[var(--ud-brand-primary)] hover:underline disabled:opacity-60"
                >
                  Send code
                </button>
              </div>
            ) : null}
          </div>
        )}

        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-[var(--ud-border)] px-4 py-3 text-sm font-medium text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
        >
          Continue with limited access
        </button>
      </div>
    </div>
  );
}
