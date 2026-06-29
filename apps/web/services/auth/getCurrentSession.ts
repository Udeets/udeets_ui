import { buildSessionFromAuthMe, type AuthSession } from "@/lib/auth/session";
import { fetchAuthMe } from "@/lib/api/auth";

export async function getCurrentSession(): Promise<AuthSession | null> {
  if (typeof window === "undefined") return null;
  const me = await fetchAuthMe();
  if (!me) return null;
  return buildSessionFromAuthMe(me);
}
