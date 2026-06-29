"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UdeetsBrandLockup } from "@/components/brand-logo";
import {
  confirmPhoneVerification,
  fetchAuthMe,
  fetchVerificationStatus,
  resendEmailVerification,
  sendPhoneVerification,
} from "@/lib/api/auth";
import {
  VERIFICATION_MODAL_INTRO,
  VERIFICATION_RESTRICTED_ACCESS_MESSAGE,
} from "@/lib/auth/verification-messages";
import { signOut as signOutUser } from "@/services/auth/signOut";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error") ?? "";
  const focus = searchParams.get("focus") === "email" ? "email" : "phone";
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchVerificationStatus>>>(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(queryError);
  const [busy, setBusy] = useState(false);
  const autoSentPhone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const me = await fetchAuthMe();
      if (cancelled) return;
      if (!me) {
        router.replace("/auth");
        return;
      }
      if (me.verificationComplete) {
        router.replace("/dashboard");
        return;
      }
      const next = await fetchVerificationStatus();
      if (!cancelled) {
        setStatus(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (loading || !status || autoSentPhone.current) return;
    const shouldAutoSend =
      Boolean(status.phone) &&
      !status.phoneVerified &&
      (focus === "phone" || !status.email);
    if (!shouldAutoSend) return;

    autoSentPhone.current = true;
    void (async () => {
      try {
        await sendPhoneVerification();
        setMessage("We sent a 6-digit code to your phone. Enter it below.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not send code");
      }
    })();
  }, [loading, status, focus]);

  async function refreshStatus() {
    const next = await fetchVerificationStatus();
    setStatus(next);
    if (next?.verificationComplete) {
      router.replace("/dashboard");
    }
  }

  async function handleResendEmail() {
    setBusy(true);
    setError("");
    try {
      await resendEmailVerification();
      setMessage("Verification email sent. Check your inbox and click the link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendPhone() {
    setBusy(true);
    setError("");
    try {
      await sendPhoneVerification();
      setMessage("Verification code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmPhone(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await confirmPhoneVerification(otp.trim());
      if (user.verificationComplete) {
        router.replace("/dashboard");
        return;
      }
      await refreshStatus();
      setOtp("");
      setMessage("Phone verified. You can continue using uDeets.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ud-bg-page)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ud-brand-primary)] border-t-transparent" />
      </div>
    );
  }

  const hasEmail = Boolean(status?.email);
  const hasPhone = Boolean(status?.phone);
  const emailPending = hasEmail && !status?.emailVerified;
  const phonePending = hasPhone && !status?.phoneVerified;
  const showPhoneFirst = focus === "phone" && phonePending;
  const showEmailFirst = focus === "email" && emailPending;

  const phonePanel = phonePending ? (
    <div className="rounded-xl border-2 border-[var(--ud-brand-primary)]/30 bg-[var(--ud-bg-subtle)]/50 p-4">
      <p className="text-sm font-semibold text-[var(--ud-text-primary)]">Enter your verification code</p>
      <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">
        We sent a 6-digit code to {status?.phone ?? "your phone"}. Enter it here to verify and unlock full access.
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
          Verify and continue
        </button>
      </form>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleSendPhone()}
        className="mt-3 text-sm font-medium text-[var(--ud-brand-primary)] hover:underline disabled:opacity-60"
      >
        Resend code
      </button>
    </div>
  ) : hasPhone ? (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">Phone verified</div>
  ) : null;

  const emailPanel = emailPending ? (
    <div
      className={
        showEmailFirst
          ? "rounded-xl border-2 border-[var(--ud-brand-primary)]/30 bg-[var(--ud-bg-subtle)]/50 p-4"
          : "rounded-xl border border-[var(--ud-border-subtle)] p-4"
      }
    >
      <p className="text-sm font-medium text-[var(--ud-text-primary)]">Email verification</p>
      <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">
        {showEmailFirst
          ? `Check your inbox${status?.email ? ` at ${status.email}` : ""} and click the verification link.`
          : `Optional for now — verify${status?.email ? ` ${status.email}` : " your email"} from your profile later, or click the link if we emailed you.`}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleResendEmail()}
        className="mt-3 text-sm font-medium text-[var(--ud-brand-primary)] hover:underline disabled:opacity-60"
      >
        {showEmailFirst ? "Resend email" : "Resend verification email"}
      </button>
    </div>
  ) : hasEmail ? (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">Email verified</div>
  ) : null;

  return (
    <div className="min-h-screen bg-[var(--ud-bg-page)] px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <UdeetsBrandLockup className="justify-center" textClassName="text-2xl" showIcon={false} />
          <h1 className="mt-4 text-lg font-semibold text-[var(--ud-text-primary)]">Verify your account</h1>
          <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">{VERIFICATION_RESTRICTED_ACCESS_MESSAGE}</p>
          <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">{VERIFICATION_MODAL_INTRO}</p>
        </div>

        <div className="space-y-4">
          {showPhoneFirst ? (
            <>
              {phonePanel}
              {emailPanel}
            </>
          ) : showEmailFirst ? (
            <>
              {emailPanel}
              {phonePanel}
            </>
          ) : (
            <>
              {phonePanel}
              {emailPanel}
            </>
          )}
        </div>

        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => void signOutUser().then(() => router.replace("/auth"))}
            className="text-[var(--ud-text-muted)] hover:text-[var(--ud-text-primary)]"
          >
            Sign out
          </button>
          <Link href="/dashboard" className="text-[var(--ud-brand-primary)] hover:underline">
            Continue to app
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageContent />
    </Suspense>
  );
}
