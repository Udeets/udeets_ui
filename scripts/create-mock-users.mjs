/**
 * Creates mock test users in Supabase for multi-user testing.
 * Run: node scripts/create-mock-users.mjs
 *
 * Note: These users are created via signUp — each will get a confirmation
 * email unless email confirmation is disabled in your Supabase project.
 * If email confirmation is ON, go to Supabase Dashboard → Authentication →
 * Users and manually confirm them (or disable "Enable email confirmations"
 * in Authentication → Providers → Email).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://psckhdbtissnmdgcfwgo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uqL96UPZ45jfXZaRkIEBDQ_HfjFXAwD";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MOCK_USERS = [
  { email: "alice.test@udeets.dev", password: "UDeets@2026!", name: "Alice Martin" },
  { email: "bob.test@udeets.dev", password: "UDeets@2026!", name: "Bob Sharma" },
  { email: "carol.test@udeets.dev", password: "UDeets@2026!", name: "Carol Chen" },
  { email: "dave.test@udeets.dev", password: "UDeets@2026!", name: "Dave Patel" },
  { email: "emma.test@udeets.dev", password: "UDeets@2026!", name: "Emma Rodriguez" },
  { email: "frank.test@udeets.dev", password: "UDeets@2026!", name: "Frank Kim" },
];

async function main() {
  console.log("Creating mock users...\n");

  for (const user of MOCK_USERS) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: { full_name: user.name },
      },
    });

    if (error) {
      console.log(`  ✗ ${user.email} — ${error.message}`);
    } else {
      console.log(`  ✓ ${user.email} (id: ${data.user?.id ?? "pending"})`);
    }
  }

  console.log("\n--- Mock Users Summary ---");
  console.log("Password for all: UDeets@2026!\n");
  for (const u of MOCK_USERS) {
    console.log(`  ${u.name.padEnd(18)} ${u.email}`);
  }
  console.log(
    "\nIf email confirmation is enabled, confirm these users in the Supabase Dashboard → Authentication → Users."
  );
}

main().catch(console.error);
