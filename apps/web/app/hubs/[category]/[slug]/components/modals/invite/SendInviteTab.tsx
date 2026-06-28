"use client";

import { Loader2, Mail, Phone, Send } from "lucide-react";
import { useCallback, useId, useState } from "react";

import {
  ComposerMenuSelect,
  type ComposerMenuSelectOption,
} from "../../deets/composer/ComposerMenuSelect";
import { cn } from "../../hubUtils";
import {
  INVITE_EXPIRY_OPTIONS,
  type InviteContactType,
  type InviteExpiryOption,
} from "@/lib/services/hubs/validate-invite-contact";
import { validateInviteContact } from "@/lib/services/hubs/validate-invite-contact";
import { sendHubContactInviteFromApi } from "@/lib/api/invites";
import { getCurrentSession } from "@/services/auth/getCurrentSession";

const EXPIRY_SELECT_OPTIONS: ComposerMenuSelectOption[] = INVITE_EXPIRY_OPTIONS.map((opt) => ({
  value: opt.days === null ? "never" : String(opt.days),
  label: opt.label,
}));

const GENERIC_SUCCESS =
  "If this person can join, they'll receive an invitation. We never show whether they already have an account.";

export function SendInviteTab({
  hubId,
  onToast,
}: {
  hubId: string;
  onToast: (message: string) => void;
}) {
  const [contactType, setContactType] = useState<InviteContactType>("email");
  const [contactValue, setContactValue] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<InviteExpiryOption>(30);
  const [isSending, setIsSending] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const inputId = useId();
  const hintId = useId();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFieldError(null);
      setSent(false);

      const validation = validateInviteContact(contactType, contactValue);
      if (!validation.ok) {
        setFieldError(validation.message);
        return;
      }

      setIsSending(true);
      try {
        const session = await getCurrentSession();
        if (!session?.access_token) {
          setFieldError("You must be signed in to send invitations.");
          return;
        }

        await sendHubContactInviteFromApi(
          hubId,
          session.access_token,
          contactType,
          contactType === "phone" ? validation.normalized : contactValue.trim(),
          expiresInDays,
        );

        setSent(true);
        setContactValue("");
        onToast("Invitation sent");
      } catch {
        setFieldError("Could not send the invitation. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [contactType, contactValue, expiresInDays, hubId, onToast],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <p className="text-sm text-[var(--ud-text-secondary)]">
        Send a private invitation by email or US phone. We never show whether someone already has an account.
      </p>

      <div className="flex rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] p-1" role="group" aria-label="Contact type">
        {([
          { type: "email" as const, label: "Email", icon: Mail },
          { type: "phone" as const, label: "Phone (US)", icon: Phone },
        ]).map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setContactType(type);
              setFieldError(null);
              setSent(false);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition",
              contactType === type
                ? "bg-[var(--ud-bg-card)] text-[var(--ud-brand-primary)] shadow-sm"
                : "text-[var(--ud-text-secondary)] hover:text-[var(--ud-text-primary)]",
            )}
            aria-pressed={contactType === type}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <div>
        <label htmlFor={inputId} className="sr-only">
          {contactType === "email" ? "Email address" : "US phone number"}
        </label>
        <input
          id={inputId}
          type={contactType === "email" ? "email" : "tel"}
          inputMode={contactType === "email" ? "email" : "tel"}
          autoComplete={contactType === "email" ? "email" : "tel-national"}
          value={contactValue}
          onChange={(e) => {
            setContactValue(e.target.value);
            setFieldError(null);
            setSent(false);
          }}
          placeholder={contactType === "email" ? "name@example.com" : "(555) 234-5678"}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={hintId}
          className={cn(
            "w-full rounded-lg border bg-[var(--ud-bg-subtle)] px-3 py-2.5 text-sm text-[var(--ud-text-primary)] outline-none transition",
            fieldError
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-[var(--ud-border-subtle)] focus:border-[var(--ud-brand-primary)] focus:ring-1 focus:ring-[var(--ud-brand-primary)]",
          )}
        />
        {contactType === "phone" ? (
          <p className="mt-1 text-[11px] text-[var(--ud-text-muted)]">US numbers only. +1 is added automatically.</p>
        ) : null}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">
          Invitation expires
        </label>
        <ComposerMenuSelect
          className="mt-1 w-full"
          aria-label="Invitation expires"
          value={expiresInDays === null ? "never" : String(expiresInDays)}
          onChange={(v) => {
            setExpiresInDays(v === "never" ? null : (Number(v) as InviteExpiryOption));
            setSent(false);
          }}
          options={EXPIRY_SELECT_OPTIONS}
          menuMinWidthPx={260}
          disabled={isSending}
        />
      </div>

      <p id={hintId} className="min-h-[1.25rem] text-xs" role="status">
        {fieldError ? (
          <span className="text-red-600">{fieldError}</span>
        ) : sent ? (
          <span className="text-emerald-600">{GENERIC_SUCCESS}</span>
        ) : (
          <span className="text-[var(--ud-text-muted)]">
            Invitees with an account will see this hub under Profile → Invitations.
          </span>
        )}
      </p>

      <button
        type="submit"
        disabled={isSending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {isSending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {isSending ? "Sending…" : "Send invitation"}
      </button>
    </form>
  );
}
