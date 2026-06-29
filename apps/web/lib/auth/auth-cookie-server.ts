import type { NextResponse } from "next/server";

export const AUTH_ACCESS_COOKIE = "udeets_access_token";
export const AUTH_COOKIE_MAX_AGE = 3600;

export function authCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

export function applyAuthCookie(response: NextResponse, accessToken: string | null | undefined) {
  if (accessToken) {
    response.cookies.set(AUTH_ACCESS_COOKIE, accessToken, authCookieOptions());
  }
  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set("access_token", "", { path: "/", maxAge: 0 });
  return response;
}

export function getFastApiBase(): string {
  return (
    process.env.FASTAPI_BASE_URL ??
    process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

export type AuthApiBody = {
  accessToken?: string | null;
  message?: string;
  user?: {
    verificationComplete?: boolean;
  };
  detail?: string;
  error?: string;
};

export class AuthApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
  }
}

export async function callAuthApi(path: string, init: RequestInit): Promise<AuthApiBody> {
  const response = await fetch(`${getFastApiBase()}/api/v1/auth/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = (await response.json()) as AuthApiBody & { detail?: unknown };
  if (!response.ok) {
    const detail =
      (typeof body.detail === "string" && body.detail) ||
      (typeof body.error === "string" && body.error) ||
      "Request failed";
    throw new AuthApiError(detail, response.status);
  }
  return body;
}
