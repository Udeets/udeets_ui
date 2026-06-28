export async function signOut(): Promise<void> {
  const response = await fetch("/auth/signout", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to clear local auth session.");
  }
  if (typeof window !== "undefined") {
    window.location.assign("/auth");
  }
}
