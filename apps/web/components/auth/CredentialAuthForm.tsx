"use client";

import { useState } from "react";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { loginWithPassword, registerWithPassword } from "@/lib/api/auth";
import { buildPostAuthPath } from "@/lib/auth/verification-routes";

type Mode = "signin" | "signup";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function validatePhoneDigits(phone: string): string | null {
  if (!phone.trim()) return null;
  if (phone.length === 10) return null;
  return "Enter a valid 10-digit US phone number.";
}

function validateSignIn(identifier: string): string | null {
  const trimmed = identifier.trim();
  if (!trimmed) return "Enter your email or phone number.";
  if (trimmed.includes("@")) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) return null;
  if (digits.length > 0) return "Enter a valid US phone number (10 digits) or email address.";
  return null;
}

function validateSignUp(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): string | null {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  if (firstName.length < 1) return "Enter your first name.";
  if (lastName.length < 1) return "Enter your last name.";
  if (!email && !phone) return "Enter an email address or phone number.";
  const phoneError = validatePhoneDigits(phone);
  if (phoneError) return phoneError;
  if (input.password.length < 12) return "Use at least 12 characters for your password.";
  if (input.password !== input.confirmPassword) return "Passwords do not match.";
  return null;
}

export function CredentialAuthForm({
  mode,
  onSuccess,
  onError,
}: {
  mode: Mode;
  onSuccess: (redirectTo: string) => void;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(mode === "signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const inputClass =
    "w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-page)] px-4 py-3 text-sm text-[var(--ud-text-primary)] outline-none transition focus:border-[var(--ud-brand-primary)]";

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    onError("");
    setFieldError("");

    const validationError = validateSignUp({
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
    });
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setBusy(true);
    try {
      const trimmedEmail = email.trim();
      const result = await registerWithPassword({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail || undefined,
        phone: phone || undefined,
        password,
        confirmPassword,
      });

      onSuccess(buildPostAuthPath(result.user ?? {}));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    onError("");
    setFieldError("");

    const signInError = validateSignIn(identifier);
    if (signInError) {
      setFieldError(signInError);
      return;
    }

    setBusy(true);
    try {
      const user = await loginWithPassword({ identifier: identifier.trim(), password });
      onSuccess(buildPostAuthPath(user));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      if (message.includes("Incorrect email/phone or password") && identifier.includes("@")) {
        onError(
          `${message} If you signed up with phone only, sign in with your phone number instead of email.`,
        );
        return;
      }
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === "signup" && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-page)] px-4 py-3 text-sm font-medium text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
      >
        Sign up with email or phone
      </button>
    );
  }

  if (mode === "signup") {
    return (
      <form onSubmit={(e) => void handleSignUp(e)} className="space-y-3 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/40 p-4">
        <p className="text-sm font-medium text-[var(--ud-text-primary)]">Account details</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-[var(--ud-text-secondary)]">
            First name
            <input
              className={cx(inputClass, "mt-1")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </label>
          <label className="block text-xs font-medium text-[var(--ud-text-secondary)]">
            Last name
            <input
              className={cx(inputClass, "mt-1")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          </label>
        </div>
        <label className="block text-xs font-medium text-[var(--ud-text-secondary)]">
          Email
          <input
            className={cx(inputClass, "mt-1")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--ud-text-secondary)]">
          Phone
          <PhoneInput value={phone} onChange={setPhone} />
        </label>
        <p className="text-xs text-[var(--ud-text-muted)]">
          Provide at least one of email or phone. After sign-up you&apos;ll verify one method to unlock full access.
        </p>
        <label className="block text-xs font-medium text-[var(--ud-text-secondary)]">
          Password
          <input
            className={cx(inputClass, "mt-1")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={12}
          />
        </label>
        <label className="block text-xs font-medium text-[var(--ud-text-secondary)]">
          Confirm password
          <input
            className={cx(inputClass, "mt-1")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={12}
          />
        </label>
        <p className="text-xs text-[var(--ud-text-muted)]">Use at least 12 characters.</p>
        {fieldError ? <p className="text-sm text-red-600">{fieldError}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void handleSignIn(e)} className="space-y-3">
      <p className="text-xs text-[var(--ud-text-muted)]">
        Use the same email or phone number you signed up with.
      </p>
      <label className="block text-xs font-medium text-[var(--ud-text-secondary)]">
        Email or phone
        <input
          className={cx(inputClass, "mt-1")}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          placeholder="you@example.com or 5551234567"
          required
        />
      </label>
      <label className="block text-xs font-medium text-[var(--ud-text-secondary)]">
        Password
        <input
          className={cx(inputClass, "mt-1")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-page)] px-4 py-3 text-sm font-semibold text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)] disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in with password"}
      </button>
      {fieldError ? <p className="text-sm text-red-600">{fieldError}</p> : null}
    </form>
  );
}
