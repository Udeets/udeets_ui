import { NextResponse } from "next/server";
import { applyAuthCookie, callAuthApi, AuthApiError } from "@/lib/auth/auth-cookie-server";

function postAuthRedirect(body: { user?: { verificationComplete?: boolean; phone?: string | null; phoneVerified?: boolean; email?: string | null; emailVerified?: boolean } }) {
  const user = body.user ?? {};
  if (user.verificationComplete) return "/dashboard";
  const phonePending = Boolean(user.phone && !user.phoneVerified);
  const focus = phonePending ? "phone" : "email";
  return `/dashboard?verifyOpen=${focus}`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const body = await callAuthApi("register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const redirectTo = postAuthRedirect(body);
    const response = NextResponse.json({
      message: body.message,
      user: body.user,
      redirectTo,
      signedIn: true,
    });
    applyAuthCookie(response, body.accessToken);
    return response;
  } catch (error) {
    const status = error instanceof AuthApiError ? error.statusCode : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status },
    );
  }
}
