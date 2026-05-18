import { upsertMyProfileApi } from "@/lib/api/profiles";

/**
 * Upsert profile on OAuth sign-in.
 * On first login (INSERT): populate full_name, avatar_url, email from the OAuth provider.
 * On subsequent logins (UPDATE): only update email (which may change); never
 * overwrite full_name or avatar_url since the user may have customised them.
 *
 * When running in a server callback flow, pass `accessToken` so we can call
 * FastAPI directly with bearer auth and avoid direct table writes.
 */
export async function upsertProfile(
  _userId: string,
  fullName: string | null,
  avatarUrl: string | null,
  email: string | null,
  accessToken?: string | null,
): Promise<void> {
  if (accessToken) {
    const base = (process.env.FASTAPI_BASE_URL ?? process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ?? "http://localhost:8002").replace(
      /\/$/,
      "",
    );
    try {
      const response = await fetch(`${base}/api/v1/profiles/me/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ fullName, avatarUrl, email }),
        cache: "no-store",
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("[upsert-profile] FastAPI sync failed:", text || response.statusText);
      }
      return;
    } catch (error) {
      console.error("[upsert-profile] FastAPI sync request failed:", error);
      return;
    }
  }

  try {
    await upsertMyProfileApi({ fullName, avatarUrl, email });
  } catch (error) {
    console.error("[upsert-profile] Failed to sync profile:", error);
  }
}
