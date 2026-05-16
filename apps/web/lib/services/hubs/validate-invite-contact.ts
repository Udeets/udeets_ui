export type InviteContactType = "email" | "phone";

/** Days until invite expires; null = never. */
export type InviteExpiryOption = 7 | 30 | 90 | null;

export const INVITE_EXPIRY_OPTIONS: { label: string; days: InviteExpiryOption }[] = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "Never expires", days: null },
];

export function normalizeInviteEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** US numbers only: returns E.164 +1XXXXXXXXXX or null. */
export function normalizeUsPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  let national: string;
  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    national = digits.slice(1);
  } else {
    return null;
  }
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(national)) {
    return null;
  }
  return `+1${national}`;
}

export function isValidInviteEmail(value: string): boolean {
  const normalized = normalizeInviteEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function isValidUsPhone(value: string): boolean {
  return normalizeUsPhone(value) !== null;
}

export function validateInviteContact(
  type: InviteContactType,
  value: string,
): { ok: true; normalized: string } | { ok: false; message: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, message: "Enter an email address or phone number." };
  }
  if (type === "email") {
    if (!isValidInviteEmail(trimmed)) {
      return { ok: false, message: "Enter a valid email address." };
    }
    return { ok: true, normalized: normalizeInviteEmail(trimmed) };
  }
  const usPhone = normalizeUsPhone(trimmed);
  if (!usPhone) {
    return {
      ok: false,
      message: "Enter a valid US phone number (10 digits, or +1 followed by 10 digits).",
    };
  }
  return { ok: true, normalized: usPhone };
}
