type VerifyContact = {
  phone?: string | null;
  email?: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  verificationComplete?: boolean;
};

export function verificationFocusForUser(user: VerifyContact): "phone" | "email" {
  const phonePending = Boolean(user.phone && !user.phoneVerified);
  return phonePending ? "phone" : "email";
}

export function buildPostAuthPath(user: VerifyContact, basePath = "/dashboard"): string {
  if (user.verificationComplete) return basePath;
  const focus = verificationFocusForUser(user);
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}verifyOpen=${focus}`;
}

export function formatUsPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return phone;
  return `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}
