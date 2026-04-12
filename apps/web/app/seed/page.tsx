"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Retail hubs (broadcast-only) with deal posts ── */
const RETAIL_HUBS = [
  {
    name: "Costco",
    slug: "costco-deals",
    tagline: "Wholesale savings for members",
    description: "Official Costco broadcast channel — weekly deals, hot buys, and warehouse savings you don't want to miss.",
    deals: [
      { title: "Kirkland Signature Olive Oil 2L", body: "<b>$12.99</b> (Reg. $18.99) — Save $6. Premium extra virgin, cold-pressed. Valid through 4/20.", tag: "deals" },
      { title: "Samsung 65\" 4K QLED TV", body: "<b>$599.99</b> (Reg. $849.99) — $250 OFF. Smart TV with Alexa & Google Assistant. In-warehouse only.", tag: "deals" },
      { title: "Tide Pods 112ct Mega Pack", body: "<b>$22.49</b> (Reg. $29.99) — Members-only price. Limit 2 per household.", tag: "deals" },
    ],
  },
  {
    name: "Walmart",
    slug: "walmart-deals",
    tagline: "Save money. Live better.",
    description: "Walmart broadcast channel — rollbacks, clearance alerts, and everyday low prices delivered to your feed.",
    deals: [
      { title: "Air Fryer XL 5.8qt", body: "<b>$34.00</b> (Was $69.00) — ROLLBACK! Digital touchscreen, 8 presets. Ships free.", tag: "deals" },
      { title: "Great Value Organic Eggs 24ct", body: "<b>$4.97</b> — Everyday low price. Cage-free, USDA organic certified.", tag: "deals" },
    ],
  },
  {
    name: "Target",
    slug: "target-deals",
    tagline: "Expect more. Pay less.",
    description: "Target broadcast hub — Circle offers, weekly ad highlights, and exclusive deals from your favorite store.",
    deals: [
      { title: "Threshold Patio Furniture Set", body: "<b>$249.99</b> (Reg. $399.99) — 30% OFF with Target Circle. 4-piece wicker conversation set.", tag: "deals" },
      { title: "Buy 3 Get 1 Free — All Books", body: "Mix & match all books, including new releases! In-store and online. Ends Sunday.", tag: "deals" },
      { title: "Up & Up Diapers Size 1-6", body: "<b>$21.99</b> (Reg. $27.99) — 20% off with same-day delivery. Subscribe & save extra 5%.", tag: "deals" },
    ],
  },
  {
    name: "Kroger",
    slug: "kroger-deals",
    tagline: "Fresh for everyone",
    description: "Kroger broadcast channel — digital coupons, fuel points deals, and weekly specials from your neighborhood Kroger.",
    deals: [
      { title: "Buy 5 Save $5 — Weekly Event", body: "Mix and match participating items — cereals, snacks, frozen meals. Load coupons to your Kroger card.", tag: "deals" },
      { title: "Fresh Atlantic Salmon Fillets", body: "<b>$7.99/lb</b> (Reg. $11.99/lb) — Wild-caught, skin-on. Friday-Sunday only.", tag: "deals" },
    ],
  },
  {
    name: "Food Lion",
    slug: "food-lion-deals",
    tagline: "Easy, fresh and affordable",
    description: "Food Lion broadcast hub — MVP savings, weekly specials, and fresh deals from your local Food Lion.",
    deals: [
      { title: "Boneless Chicken Breast Family Pack", body: "<b>$1.99/lb</b> MVP Price (Reg. $3.49/lb). Stock up and save! Limit 2 packs.", tag: "deals" },
      { title: "Nature's Promise Organic Milk 1gal", body: "<b>$4.49</b> MVP Price — Whole, 2%, or Skim. While supplies last.", tag: "deals" },
      { title: "Buy 2 Get 1 Free — Frozen Pizzas", body: "DiGiorno, Red Baron, or Tombstone. MVP card required. Mix & match any brand.", tag: "deals" },
    ],
  },
];

/* ── Local news channel hubs with tagged posts ── */
const NEWS_HUBS = [
  {
    name: "Oak Valley Tribune",
    slug: "oak-valley-tribune",
    tagline: "Your trusted local news source",
    description: "Community news, alerts, and events from the Oak Valley area. Stay informed about what matters in your neighborhood.",
    posts: [
      { title: "City Council Approves New Park Expansion", body: "The Oak Valley City Council voted 5-2 to approve a $3.2M expansion of Riverside Park, adding walking trails, a splash pad, and new playground equipment. Construction starts this summer.", kind: "News", tag: "news" },
      { title: "Burglary Alert: Series of Break-ins on Maple Street", body: "Oak Valley PD reports 4 home break-ins on Maple Street over the past week, occurring between 2-5 PM while residents are at work. Suspects entered through unlocked rear doors. Police urge residents to lock all entry points and report suspicious activity.", kind: "Alerts", tag: "news+burglary" },
      { title: "Spring Community Meetup at Riverside Park", body: "Join your neighbors for the annual Spring Community Meetup this Saturday from 10 AM - 2 PM at Riverside Park pavilion. Free BBQ, live music from local bands, kids activities, and a chance to meet your city council representatives. Bring a lawn chair!", kind: "News", tag: "news+events" },
    ],
  },
  {
    name: "Metro Daily Pulse",
    slug: "metro-daily-pulse",
    tagline: "Breaking news. Local stories.",
    description: "Real-time local news updates, safety alerts, and community event coverage for the greater metro area.",
    posts: [
      { title: "Water Main Break Causes Road Closure on 5th Ave", body: "A water main break early this morning has shut down 5th Avenue between Oak and Pine streets. Crews are on site and expect repairs to take 8-12 hours. Detour via 7th Avenue. Boil water advisory in effect for blocks 400-600.", kind: "Alerts", tag: "news+alerts" },
      { title: "Local Restaurant Week Kicks Off Friday", body: "Over 30 restaurants across the metro area are participating in Restaurant Week April 17-24. Prix fixe lunches starting at $15 and dinners at $35. Full list of participating restaurants at metrodailypulse.com/restaurantweek.", kind: "News", tag: "news+events" },
      { title: "Catalytic Converter Thefts Spike in Downtown Area", body: "Metro PD warns of a 40% increase in catalytic converter thefts downtown over the past month, particularly targeting SUVs and trucks in open parking lots. Officers recommend parking in well-lit areas and installing anti-theft shields.", kind: "Alerts", tag: "news+burglary" },
    ],
  },
];

export default function SeedPage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const appendLog = (msg: string) => setLog((prev) => [...prev, msg]);

  async function runSeed() {
    setRunning(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      appendLog("ERROR: Not signed in. Please sign in first.");
      setRunning(false);
      return;
    }

    appendLog(`Signed in as ${user.email} (${user.id})`);

    // ── Seed retail hubs ──
    for (const hub of RETAIL_HUBS) {
      appendLog(`Creating retail hub: ${hub.name}...`);

      // Check if already exists
      const { data: existing } = await supabase.from("hubs").select("id").eq("slug", hub.slug).maybeSingle();
      let hubId: string;

      if (existing) {
        hubId = existing.id;
        appendLog(`  ↳ Hub "${hub.name}" already exists (${hubId}), skipping creation.`);
      } else {
        const { data: created, error } = await supabase
          .from("hubs")
          .insert({
            name: hub.name,
            slug: hub.slug,
            category: "retail",
            visibility: "public",
            tagline: hub.tagline,
            description: hub.description,
            gallery_image_urls: [],
            created_by: user.id,
          })
          .select("id")
          .single();

        if (error) {
          appendLog(`  ✗ Failed to create hub: ${error.message}`);
          continue;
        }

        hubId = created.id;
        appendLog(`  ✓ Created hub ${hubId}`);

        // Add creator as member
        await supabase.from("hub_members").insert({
          hub_id: hubId,
          user_id: user.id,
          role: "creator",
          status: "active",
        });
      }

      // Create deal posts
      for (const deal of hub.deals) {
        const { error: deetError } = await supabase.from("deets").insert({
          hub_id: hubId,
          author_name: hub.name,
          title: deal.title,
          body: deal.body,
          kind: "Deals",
          created_by: user.id,
          attachments: [],
        });

        if (deetError) {
          appendLog(`  ✗ Failed to create deal "${deal.title}": ${deetError.message}`);
        } else {
          appendLog(`  ✓ Deal: ${deal.title}`);
        }
      }
    }

    // ── Seed news hubs ──
    for (const hub of NEWS_HUBS) {
      appendLog(`Creating news hub: ${hub.name}...`);

      const { data: existing } = await supabase.from("hubs").select("id").eq("slug", hub.slug).maybeSingle();
      let hubId: string;

      if (existing) {
        hubId = existing.id;
        appendLog(`  ↳ Hub "${hub.name}" already exists (${hubId}), skipping creation.`);
      } else {
        const { data: created, error } = await supabase
          .from("hubs")
          .insert({
            name: hub.name,
            slug: hub.slug,
            category: "community",
            visibility: "public",
            tagline: hub.tagline,
            description: hub.description,
            gallery_image_urls: [],
            created_by: user.id,
          })
          .select("id")
          .single();

        if (error) {
          appendLog(`  ✗ Failed to create hub: ${error.message}`);
          continue;
        }

        hubId = created.id;
        appendLog(`  ✓ Created hub ${hubId}`);

        await supabase.from("hub_members").insert({
          hub_id: hubId,
          user_id: user.id,
          role: "creator",
          status: "active",
        });
      }

      // Create news posts with appropriate tags
      for (const post of hub.posts) {
        const { error: deetError } = await supabase.from("deets").insert({
          hub_id: hubId,
          author_name: hub.name,
          title: post.title,
          body: post.body,
          kind: post.kind,
          created_by: user.id,
          attachments: [],
        });

        if (deetError) {
          appendLog(`  ✗ Failed to create post "${post.title}": ${deetError.message}`);
        } else {
          appendLog(`  ✓ ${post.tag}: ${post.title}`);
        }
      }
    }

    appendLog("Done! All hubs and posts seeded.");
    setDone(true);
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Seed Data</h1>
        <p className="mt-2 text-gray-600">
          Creates 5 retail broadcast hubs with deal posts, and 2 local news channel hubs with tagged news posts.
        </p>

        <button
          type="button"
          onClick={runSeed}
          disabled={running || done}
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {running ? "Seeding..." : done ? "Done!" : "Run Seed"}
        </button>

        {log.length > 0 && (
          <pre className="mt-6 max-h-96 overflow-y-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
            {log.join("\n")}
          </pre>
        )}
      </div>
    </div>
  );
}
