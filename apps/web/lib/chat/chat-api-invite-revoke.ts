/** Standalone client helper so Turbopack always binds a real function (avoids HMR issues on large `chat-browser-api` chunks). */

async function parseErr(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string; code?: string };
    if (j.code === "CHAT_RATE_LIMIT") return j.error ?? "Too many requests. Try again shortly.";
    return j.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function chatApiRevokeInvite(roomId: string, invitedUserId: string): Promise<{ revoked: boolean }> {
  const qs = new URLSearchParams({ invitedUserId });
  const res = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/invites?${qs}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErr(res));
  return (await res.json()) as { revoked: boolean };
}
