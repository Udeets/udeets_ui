import { NextResponse } from "next/server";
import { z } from "zod";

import { hubRouteError } from "@/app/api/hubs/_lib/hub-route-error";
import { requireHubAdminUserId } from "@/app/api/hubs/_lib/hub-route-auth";
import { createClient } from "@/lib/supabase/server";
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
    const userId = await requireHubAdminUserId(hubId);

    const allowed = await allowSlidingWindowRateLimit(
      `hub-contact-invite:${hubId}:${userId}`,
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

    const supabase = await createClient();
    const expiresInDays = parsed.data.expiresInDays ?? 30;

    const { data, error } = await supabase.rpc("send_hub_contact_invite", {
      p_hub_id: hubId,
      p_contact_type: parsed.data.contactType,
      p_contact_value: parsed.data.contactValue,
      p_expires_in_days: expiresInDays,
    });

    if (error) {
      console.error("[hub contact invite]", error);
      if (error.message.includes("invalid_email") || error.message.includes("invalid_phone")) {
        return NextResponse.json({ error: "Invalid contact information." }, { status: 400 });
      }
      return NextResponse.json({ error: "Could not send invitation." }, { status: 500 });
    }

    if (data && typeof data === "object" && "ok" in data && data.ok !== true) {
      return NextResponse.json({ error: "Could not send invitation." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return hubRouteError(err);
  }
}
