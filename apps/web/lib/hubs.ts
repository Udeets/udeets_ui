// apps/web/lib/hubs.ts

export type HubCategorySlug =
  | "religious-places"
  | "communities"
  | "restaurants"
  | "fitness"
  | "pet-clubs"
  | "hoas";

export type HubTag = "trending" | "popular" | "nearby";

export type HubRecord = {
  id: string;
  name: string;
  category: HubCategorySlug;
  slug: string;

  locationLabel: string;
  distanceMi: number;
  membersLabel: string;

  // ✅ allow private hubs
  visibility: "Public" | "Private";

  description: string;

  // images
  heroImage: string; // big cover image
  dpImage?: string; // optional avatar/dp image

  tags: HubTag[];

  // richer content (optional; shown when available)
  about?: string[];
  updates?: Array<{
    id: string;
    title: string;
    body: string;
    image?: string;
    dateLabel: string;
    visibility?: "Public" | "Subscribers";
  }>;
  events?: Array<{
    id: string;
    title: string;
    meta: string; // date/time/location short line
    desc: string;
    visibility?: "Public" | "Subscribers";
  }>;
};

export const HUBS: HubRecord[] = [
  // =========================
  // Religious Places (2)
  // =========================
  {
    id: "hcv",
    name: "Hindu Center of Virginia",
    category: "religious-places",
    slug: "hindu-center-of-virginia",
    locationLabel: "Richmond, VA",
    distanceMi: 6.3,
    membersLabel: "2.4k members",
    visibility: "Public",
    description:
      "Temple updates, festivals, volunteer opportunities, and community programs.",

    // ✅ LOCAL images (from apps/web/public/hub-images/)
    dpImage: "/hub-images/hindu-center-of-virginia-dp.jpg",
    heroImage: "/hub-images/hindu-center-of-virginia2.jpg",

    tags: ["trending", "popular"],
    about: [
      "Daily pujas, major festivals, and family-friendly cultural programs.",
      "Volunteer opportunities and community announcements in one place.",
      "Subscribe to receive event reminders and important updates.",
    ],
    updates: [
      {
        id: "u1",
        title: "Ugadi Celebrations — Volunteers Needed",
        body: "We’re looking for volunteers for setup and prasadam distribution. Please register if you can help.",
        image: "/hub-images/hindu-center-of-virginia2.jpg",
        dateLabel: "This week",
        visibility: "Public",
      },
      {
        id: "u2",
        title: "Special Abhishekam Schedule (Subscribers)",
        body: "Subscriber-only schedule details and lineup for the upcoming special abhishekam.",
        dateLabel: "Upcoming",
        visibility: "Subscribers",
      },
    ],
    events: [
      {
        id: "e1",
        title: "Weekend Bhajan Evening",
        meta: "Sat • 6:30 PM • Main Hall",
        desc: "Join for bhajans and community gathering. Families welcome.",
        visibility: "Public",
      },
      {
        id: "e2",
        title: "Festival Volunteer Briefing (Subscribers)",
        meta: "Fri • 7:00 PM • Community Room",
        desc: "Walkthrough of volunteer roles and assignments.",
        visibility: "Subscribers",
      },
    ],
  },
  {
    id: "church",
    name: "St. Mary’s Church",
    category: "religious-places",
    slug: "st-marys-church",
    locationLabel: "Henrico, VA",
    distanceMi: 4.9,
    membersLabel: "1.2k members",
    visibility: "Public",
    description: "Sunday gatherings and outreach events.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/d1f3c6baf4-21c9cb8caca33f271ab0.png",
    tags: ["nearby"],
  },

  // =========================
  // Communities (2)
  // =========================
  {
    id: "rks",
    name: "Richmond Kannada Sangha",
    category: "communities",
    slug: "richmond-kannada-sangha",
    locationLabel: "Richmond, VA",
    distanceMi: 4.1,
    membersLabel: "1.8k members",

    // ✅ you said RKS is private
    visibility: "Private",

    description:
      "Cultural programs, meetups, youth activities, and community updates.",

    // ✅ LOCAL images
    dpImage: "/hub-images/richmond-kannada-sangha-dp.jpg",
    heroImage: "/hub-images/richmond-kannada-sangha2.jpg",

    tags: ["trending", "nearby"],
    about: [
      "A hub for local Kannada families, students, and professionals.",
      "Events, announcements, and cultural programs throughout the year.",
    ],
    updates: [
      {
        id: "u1",
        title: "Spring Cultural Night — Program Lineup",
        body: "Dance, music, skits, and community dinner. RSVP coming soon.",
        image: "/hub-images/richmond-kannada-sangha-ha2.jpg",
        dateLabel: "This month",
        visibility: "Public",
      },
      {
        id: "u2",
        title: "Volunteer Signups (Subscribers)",
        body: "Subscriber-only volunteer signup sheet and role assignments.",
        dateLabel: "Next week",
        visibility: "Subscribers",
      },
    ],
    events: [
      {
        id: "e1",
        title: "Family Meetup",
        meta: "Sun • 4:00 PM • Park Pavilion",
        desc: "Casual meetup with snacks & games for kids.",
        visibility: "Public",
      },
    ],
  },
  {
    id: "collective",
    name: "Creative Collective",
    category: "communities",
    slug: "creative-collective",
    locationLabel: "Arts District",
    distanceMi: 2.6,
    membersLabel: "956 members",
    visibility: "Public",
    description: "Local artists, meetups, and workshops.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/d318afeb68-88a63ff0fdcc9a1ac5f5.png",
    tags: ["popular", "nearby"],
  },

  // =========================
  // Restaurants (2)
  // =========================
  {
    id: "desi",
    name: "Desi Bites",
    category: "restaurants",
    slug: "desi-bites",
    locationLabel: "Glen Allen, VA",
    distanceMi: 8.7,
    membersLabel: "956 members",

    // ✅ you said Desi Bites is public
    visibility: "Public",

    description: "Menu drops, deals, catering info, and local foodie updates.",

    // ✅ LOCAL images
    dpImage: "/hub-images/desi-bites-dp.jpg",
    heroImage: "/hub-images/desi-bites2.jpg",

    tags: ["trending", "popular"],
    updates: [
      {
        id: "u1",
        title: "Weekend Special: Family Thali Deal",
        body: "Limited-time combo deal. Subscribe to get first access to new offers.",
        image: "/hub-images/desi-bites2.jpg",
        dateLabel: "This weekend",
        visibility: "Public",
      },
      {
        id: "u2",
        title: "Subscribers-only coupon drop",
        body: "Hidden coupon code + early access to next week’s menu drop.",
        dateLabel: "Soon",
        visibility: "Subscribers",
      },
    ],
  },
  {
    id: "brew",
    name: "Brew & Connect",
    category: "restaurants",
    slug: "brew-and-connect",
    locationLabel: "Downtown RVA",
    distanceMi: 1.0,
    membersLabel: "2.3k members",
    visibility: "Public",
    description: "Coffee hub for remote workers.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/81ad6b86a6-70df23259b2b89f8f284.png",
    tags: ["nearby", "popular"],
  },

  // =========================
  // Fitness (2)
  // =========================
  {
    id: "fitlife",
    name: "FitLife Studio",
    category: "fitness",
    slug: "fitlife-studio",
    locationLabel: "Midtown RVA",
    distanceMi: 2.1,
    membersLabel: "1.8k members",
    visibility: "Public",
    description: "Classes, challenges, and wellness updates.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/bf887cb790-11bd34339f2e3b268c5b.png",
    tags: ["trending", "nearby"],
  },
  {
    id: "zen",
    name: "Zen Studio",
    category: "fitness",
    slug: "zen-studio",
    locationLabel: "Richmond, VA",
    distanceMi: 0.7,
    membersLabel: "1.5k members",
    visibility: "Public",
    description: "Yoga and mindfulness community.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/9e623e8724-0c686b198fbd369decf5.png",
    tags: ["popular", "nearby"],
  },

  // =========================
  // Pet Clubs (2)
  // =========================
  {
    id: "pet1",
    name: "Pet Paradise",
    category: "pet-clubs",
    slug: "pet-paradise",
    locationLabel: "Richmond, VA",
    distanceMi: 1.8,
    membersLabel: "3.8k members",
    visibility: "Public",
    description: "Pet meetups and community events.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/83c9c2db99-1bad194d665e27da06ec.png",
    tags: ["popular", "nearby"],
  },
  {
    id: "pet2",
    name: "Paw Pals Club",
    category: "pet-clubs",
    slug: "paw-pals-club",
    locationLabel: "Glen Allen, VA",
    distanceMi: 5.0,
    membersLabel: "1.1k members",
    visibility: "Public",
    description: "Weekend walks and pet socials.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/2b6233915f-16cd8c0c81469eabd0f4.png",
    tags: ["trending"],
  },

  // =========================
  // HOA’s (2)
  // =========================
  {
    id: "hoa1",
    name: "Henrico HOA Updates",
    category: "hoas",
    slug: "henrico-hoa-updates",
    locationLabel: "Henrico, VA",
    distanceMi: 3.5,
    membersLabel: "780 members",
    visibility: "Public",
    description: "Neighborhood updates and notices.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/204e9104e0-9382721196f9e9198af9.png",
    tags: ["nearby"],
  },
  {
    id: "hoa2",
    name: "Riverside HOA",
    category: "hoas",
    slug: "riverside-hoa",
    locationLabel: "Richmond, VA",
    distanceMi: 1.3,
    membersLabel: "620 members",
    visibility: "Public",
    description: "Community alerts and meetings.",
    heroImage:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/204e9104e0-9382721196f9e9198af9.png",
    tags: ["popular", "nearby"],
  },
];

export function getHub(category: string, slug: string): HubRecord | undefined {
  return HUBS.find((h) => h.category === category && h.slug === slug);
}

export function allHubParams() {
  return HUBS.map((h) => ({ category: h.category, slug: h.slug }));
}