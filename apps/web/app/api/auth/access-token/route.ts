import { NextResponse } from "next/server";
import { AUTH_ACCESS_COOKIE } from "@/lib/auth/auth-cookie-server";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader.match(new RegExp(`${AUTH_ACCESS_COOKIE}=([^;]+)`));
  const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
  if (!accessToken) {
    return NextResponse.json({ accessToken: null }, { status: 401 });
  }
  return NextResponse.json({ accessToken });
}
