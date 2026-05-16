import { NextResponse } from "next/server";

import { HubForbiddenError, HubUnauthorizedError } from "./hub-route-auth";

export function hubRouteError(err: unknown): NextResponse {
  if (err instanceof HubUnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof HubForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  const message = err instanceof Error ? err.message : "Internal error";
  console.error("[hub-api]", err);
  return NextResponse.json({ error: message }, { status: 500 });
}
