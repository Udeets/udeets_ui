import * as fs from "node:fs";
import * as path from "node:path";
import type { NextConfig } from "next";

/**
 * Next only auto-loads `.env*` from `apps/web/`. Many monorepos keep a single `.env` at the repo root.
 * Merge root env into `process.env` for keys that are not already set (apps/web wins if Next pre-filled).
 */
function mergeMonorepoRootEnv() {
  const monoRoot = path.resolve(__dirname, "../..");
  for (const name of [".env", ".env.local"] as const) {
    const filePath = path.join(monoRoot, name);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}

mergeMonorepoRootEnv();

const nextConfig: NextConfig = {
  // When tightening security, add `headers()` with Content-Security-Policy here and align
  // `style-src` with sanitized rich-text output (allowlisted inline styles) plus any nonces/hashes.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "psckhdbtissnmdgcfwgo.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      // Local Supabase CLI (storage public URLs use the API port, default 54321).
      // Without these, next/image in the header rejects avatar URLs on localhost.
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
