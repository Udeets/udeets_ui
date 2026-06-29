export type AuthUserProfile = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationComplete: boolean;
  authMethods: string[];
  oauthProviders: string[];
};

export type AuthMeResponse = AuthUserProfile & {
  role?: string | null;
};

export async function registerWithPassword(input: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}): Promise<{
  verificationComplete?: boolean;
  user?: Pick<AuthUserProfile, "phone" | "email" | "phoneVerified" | "emailVerified">;
}> {
  const response = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const body = (await response.json()) as {
    user?: Pick<AuthUserProfile, "phone" | "email" | "phoneVerified" | "emailVerified" | "verificationComplete">;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.error ?? "Registration failed");
  }
  return {
    verificationComplete: body.user?.verificationComplete,
    user: body.user,
  };
}

export async function loginWithPassword(input: {
  identifier: string;
  password: string;
}): Promise<AuthMeResponse> {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const body = (await response.json()) as { user?: AuthMeResponse; error?: string };
  if (!response.ok || !body.user) {
    throw new Error(body.error ?? "Sign in failed");
  }
  return body.user;
}

let authMeInflight: Promise<AuthMeResponse | null> | null = null;

export async function fetchAuthMe(): Promise<AuthMeResponse | null> {
  if (authMeInflight) return authMeInflight;

  authMeInflight = (async () => {
    const response = await fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store" });
    if (response.status === 401) return null;
    if (!response.ok) return null;
    return (await response.json()) as AuthMeResponse;
  })();

  try {
    return await authMeInflight;
  } finally {
    authMeInflight = null;
  }
}

export async function fetchVerificationStatus(): Promise<{
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationComplete: boolean;
  verificationRequired: string[];
} | null> {
  const response = await fetch("/api/v1/auth/verification-status", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as {
    email: string | null;
    phone: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    verificationComplete: boolean;
    verificationRequired: string[];
  };
}

export async function resendEmailVerification(): Promise<void> {
  const response = await fetch("/api/v1/auth/verify-email/resend", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const body = (await response.json()) as { error?: string; detail?: string };
    throw new Error(body.error ?? body.detail ?? "Could not resend email");
  }
}

export async function sendPhoneVerification(): Promise<void> {
  const response = await fetch("/api/v1/auth/verify-phone/send", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const body = (await response.json()) as { error?: string; detail?: string };
    throw new Error(body.error ?? body.detail ?? "Could not send code");
  }
}

export async function changeContact(input: {
  channel: "email" | "phone";
  value: string;
}): Promise<AuthMeResponse> {
  const response = await fetch("/auth/change-contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const body = (await response.json()) as { user?: AuthMeResponse; error?: string };
  if (!response.ok || !body.user) {
    throw new Error(body.error ?? "Could not update contact");
  }
  return body.user;
}

export async function confirmPhoneVerification(code: string): Promise<AuthMeResponse> {
  const response = await fetch("/auth/verify-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    credentials: "include",
  });
  const body = (await response.json()) as { user?: AuthMeResponse; error?: string };
  if (!response.ok || !body.user) {
    throw new Error(body.error ?? "Invalid code");
  }
  return body.user;
}
