// apps/api/src/index.ts
import Fastify from "fastify";

type HubCategory = "religious" | "restaurants" | "communities";

type Hub = {
  id: string;
  name: string;
  slug: string; // should match your Next route under /hubs/<slug>
  category: HubCategory;
  city?: string;
  state?: string;
  heroImage?: string;
};

type FeedItem = {
  id: string;
  hubSlug: string;
  hubName: string;
  category: HubCategory;
  type: "image" | "event" | "deal";
  title: string;
  body?: string;
  imageUrl?: string;
  createdAt: string;
};

const hubs: Hub[] = [
  {
    id: "hub_hcv",
    name: "Hindu Center of Virginia",
    slug: "hindu-center-of-virginia",
    category: "religious",
    city: "Richmond",
    state: "VA",
  },
  {
    id: "hub_desibites",
    name: "Desi Bites",
    slug: "desi-bites",
    category: "restaurants",
    city: "Richmond",
    state: "VA",
  },
  {
    id: "hub_rks",
    name: "Richmond Kannada Sangha",
    slug: "richmond-kannada-sangha",
    category: "communities",
    city: "Richmond",
    state: "VA",
  },
];

const feed: FeedItem[] = [
  {
    id: "feed_1",
    hubSlug: "hindu-center-of-virginia",
    hubName: "Hindu Center of Virginia",
    category: "religious",
    type: "event",
    title: "Upcoming: Community Puja & Prasadam",
    body: "Join us this weekend for a special puja followed by prasadam. Families welcome.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "feed_2",
    hubSlug: "desi-bites",
    hubName: "Desi Bites",
    category: "restaurants",
    type: "deal",
    title: "Weekend Deal: Buy 1 Get 1 50% Off",
    body: "Limited-time offer on select street food items. Dine-in only.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "feed_3",
    hubSlug: "richmond-kannada-sangha",
    hubName: "Richmond Kannada Sangha",
    category: "communities",
    type: "image",
    title: "Highlights from our last meetup",
    imageUrl: "/mock/rks-meetup.jpg",
    createdAt: new Date().toISOString(),
  },
];

const app = Fastify({ logger: true });

// Optional: remove favicon 404 noise in logs
app.get("/favicon.ico", async (_req, reply) => reply.code(204).send());

app.get("/health", async () => {
  return { ok: true, name: "udeets-api" };
});

// GET /hubs
// GET /hubs?category=religious|restaurants|communities
app.get<{
  Querystring: { category?: string };
}>("/hubs", async (req, reply) => {
  const { category } = req.query;

  if (!category) return hubs;

  const allowed: HubCategory[] = ["religious", "restaurants", "communities"];
  if (!allowed.includes(category as HubCategory)) {
    return reply.code(400).send({
      error: "Invalid category",
      allowed,
    });
  }

  const filtered = hubs.filter((h) => h.category === (category as HubCategory));
  return filtered;
});

// GET /feed (mock public feed)
app.get("/feed", async () => {
  return feed;
});

const port = Number(process.env.PORT || 3002);
const host = "0.0.0.0";

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});