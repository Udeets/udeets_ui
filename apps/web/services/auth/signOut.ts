import { buildCognitoLogoutUrl } from "@/lib/auth/cognito";

export async function signOut(): Promise<void> {
  const response = await fetch("/auth/signout", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to clear local auth session.");
  }
  if (typeof window !== "undefined") {
    const logoutUrl = buildCognitoLogoutUrl(`${window.location.origin}/auth`);
    window.location.assign(logoutUrl);
  }
}
