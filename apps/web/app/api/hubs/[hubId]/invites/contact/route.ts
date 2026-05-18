import { NextResponse } from "next/server";
import { z } from "zod";

import { buildSessionFromTokens, tokensFromCookieHeader } from "@/lib/auth/cognito-session";
import { allowSlidingWindowRateLimit } from "@/lib/services/rate-limit/sliding-window-allow";
import { validateInviteContact } from "@/lib/services/hubs/validate-invite-contact";

const bodySchema = z.object({
  contactType: z.enum(["email", "phone"]),
  contactValue: z.string().min(1).max(320),
  expiresInDays: z.union([z.literal(7), z.literal(30), z.literal(90), z.null()]).optional(),
});

type RouteCtx = { params: Promise<{ hubId: string }> };

const RATE_MAX = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request, context: RouteCtx) {
  try {
    const { hubId } = await context.params;
    const { accessToken, idToken } = tokensFromCookieHeader(request.headers.get("cookie") ?? "");
    const session = buildSessionFromTokens(accessToken, idToken);
    const user = session?.user ?? null;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const allowed = await allowSlidingWindowRateLimit(
      `hub-contact-invite:${hubId}:${user.id}`,
      RATE_MAX,
      RATE_WINDOW_MS,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many invites sent. Please try again later." },
        { status: 429 },
      );
    }

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const validation = validateInviteContact(parsed.data.contactType, parsed.data.contactValue);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    if (!session?.access_token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const fastApiBase = (
      process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ??
      process.env.FASTAPI_BASE_URL ??
      "http://localhost:8000"
    ).replace(/\/$/, "");

    const response = await fetch(`${fastApiBase}/api/v1/hubs/${hubId}/invites/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        contact_type: parsed.data.contactType,
        contact_value: parsed.data.contactValue,
        expires_in_days: parsed.data.expiresInDays ?? 30,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { detail?: string };
      return NextResponse.json(
        { error: body.detail || "Could not send invitation." },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[hub invites contact route]", err);
    return NextResponse.json({ error: "Could not send invitation." }, { status: 500 });
  }
}
