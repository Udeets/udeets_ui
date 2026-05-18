import { NextResponse } from "next/server";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 0,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("udeets_access_token", "", COOKIE_OPTIONS);
  response.cookies.set("udeets_id_token", "", COOKIE_OPTIONS);
  response.cookies.set("cognito_access_token", "", COOKIE_OPTIONS);
  response.cookies.set("cognito_id_token", "", COOKIE_OPTIONS);
  response.cookies.set("access_token", "", COOKIE_OPTIONS);
  response.cookies.set("id_token", "", COOKIE_OPTIONS);
  return response;
}
