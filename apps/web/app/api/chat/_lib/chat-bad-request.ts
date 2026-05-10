import { NextResponse } from "next/server";

export function chatBadRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
