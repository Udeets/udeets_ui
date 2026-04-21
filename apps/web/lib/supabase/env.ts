/**
 * Supabase URL and public API key for browser + server clients.
 * Prefer NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (dashboard “Publishable” key);
 * NEXT_PUBLIC_SUPABASE_ANON_KEY is still supported for older projects.
 */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to apps/web/.env.local (or the repo root .env — see next.config.ts), then restart `next dev`."
    );
  }

  const url = raw.replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${JSON.stringify(raw)}`);
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host.includes("your_project") ||
    host.includes("your-project") ||
    host === "example.com" ||
    host === "placeholder.supabase.co"
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL still looks like a template (e.g. YOUR_PROJECT_REF). Replace it with the real HTTPS URL from Supabase → Project Settings → API (format: https://<ref>.supabase.co)."
    );
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL must be http(s): got ${parsed.protocol}`);
  }

  // Serving the app over HTTPS while pointing Auth at HTTP Supabase is blocked by the browser (opaque "Failed to fetch").
  if (typeof window !== "undefined" && window.location.protocol === "https:" && parsed.protocol === "http:") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL uses http: but the site is https:. Use https://…supabase.co in production, or run the app over http://localhost for local Supabase."
    );
  }

  return url;
}

export function getSupabasePublishableOrAnonKey(): string {
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add one to apps/web/.env.local.",
    );
  }
  return key;
}
