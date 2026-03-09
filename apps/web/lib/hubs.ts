// apps/web/lib/hubs.ts

export type HubCategorySlug =
  | "religious-places"
  | "communities"
  | "restaurants"
  | "fitness"
  | "pet-clubs"
  | "hoa";

export type HubTag = "trending" | "popular" | "nearby";

export type HubRecord = {
  id: string;
  name: string;
  category: HubCategorySlug;
  slug: string;
  href: string;

  locationLabel: string;
  distanceMi: number;
  membersLabel: string;

  visibility: "Public" | "Private";

  description: string;
  tagline?: string;
  intro?: string;
  website?: string;

  // images
  heroImage?: string;
  dpImage?: string;
  galleryImages?: string[];
  feedImages?: string[];
  adminImages?: string[];

  tags: HubTag[];

  quickInfo?: Array<{ label: string; value: string }>;
  about?: string[];
  offerings?: string[];
  highlights?: string[];
  contact?: {
    visit: string;
    stayConnected: string;
  };
  cta?: {
    title: string;
    description: string;
    buttonLabel: string;
  };

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
    meta: string;
    desc: string;
    visibility?: "Public" | "Subscribers";
  }>;
};

const HUBS_BASE: HubRecord[] = [
  {
    id: "hcv",
    name: "Hindu Center of Virginia",
    category: "religious-places",
    slug: "hindu-center-of-virginia",
    href: "/hubs/religious-places/hindu-center-of-virginia",
    locationLabel: "Richmond, VA",
    distanceMi: 6.3,
    membersLabel: "2.4k members",
    visibility: "Public",
    description:
      "Temple updates, festivals, volunteer opportunities, and community programs.",
    tagline: "Faith, culture, and family gatherings throughout the year.",
    intro:
      "Stay connected with puja schedules, community celebrations, and volunteer opportunities in one trusted place.",
    website: "https://www.hcva.org",
    dpImage: "/hub-images/hindu-center-of-virginia-dp.jpg",
    heroImage: "/hub-images/hindu-center-of-virginia1.jpg",
    galleryImages: [
      "/hub-images/hindu-center-of-virginia1.jpg",
      "/hub-images/hindu-center-of-virginia2.jpg",
    ],
    tags: ["trending", "popular"],
    quickInfo: [
      { label: "Type", value: "Religious Place" },
      { label: "Language", value: "Multilingual" },
      { label: "Best For", value: "Families & Volunteers" },
    ],
    about: [
      "Daily pujas, major festivals, and family-friendly cultural programs.",
      "Volunteer opportunities and community announcements in one place.",
      "Subscribe to receive event reminders and important updates.",
    ],
    offerings: [
      "Temple schedules and festival announcements",
      "Volunteer coordination and seva updates",
      "Cultural classes and family participation info",
    ],
    highlights: [
      "Seasonal events and celebrations",
      "Community-led outreach and service",
      "Trusted local updates for regular attendees",
    ],
    contact: {
      visit: "Check the website for darshan timings, event calendars, and directions.",
      stayConnected:
        "Subscribe for reminders on festivals, volunteer calls, and special programs.",
    },
    cta: {
      title: "Stay Connected to Temple Updates",
      description:
        "Get timely notifications about pujas, festivals, and family programs.",
      buttonLabel: "Subscribe for Updates",
    },
  },
  {
    id: "rks",
    name: "Richmond Kannada Sangha",
    category: "communities",
    slug: "richmond-kannada-sangha",
    href: "/hubs/communities/richmond-kannada-sangha",
    locationLabel: "Richmond, VA",
    distanceMi: 4.1,
    membersLabel: "1.8k members",
    visibility: "Private",
    description:
      "Cultural programs, meetups, youth activities, and community updates.",
    tagline: "A vibrant Kannada community for families, youth, and professionals.",
    intro:
      "Follow local Kannada events, family meetups, youth activities, and volunteer opportunities in one place.",
    website: "https://www.rksva.org",
    dpImage: "/hub-images/richmond-kannada-sangha-dp.jpg",
    heroImage: "/hub-images/richmond-kannada-sangha1.jpg",
    galleryImages: [
      "/hub-images/richmond-kannada-sangha1.jpg",
      "/hub-images/richmond-kannada-sangha2.jpg",
    ],
    tags: ["trending", "nearby"],
    quickInfo: [
      { label: "Type", value: "Community Organization" },
      { label: "Access", value: "Private Hub" },
      { label: "Programs", value: "Cultural & Family" },
    ],
    about: [
      "A hub for local Kannada families, students, and professionals.",
      "Events, announcements, and cultural programs throughout the year.",
      "Members get early updates on programs, volunteering, and registrations.",
    ],
    offerings: [
      "Cultural nights and festival celebrations",
      "Youth activities and family-friendly meetups",
      "Volunteer signups and event coordination",
    ],
    highlights: [
      "Regional Kannada connections in Richmond",
      "Community-first events for all age groups",
      "Collaborative, volunteer-driven programming",
    ],
    contact: {
      visit: "Use the organization channels for membership and event participation details.",
      stayConnected:
        "Request access to receive member announcements and RSVP reminders.",
    },
    cta: {
      title: "Join the Kannada Community",
      description:
        "Request access to follow upcoming programs, events, and volunteer opportunities.",
      buttonLabel: "Request Access",
    },
  },
  {
    id: "desi",
    name: "Desi Bites",
    category: "restaurants",
    slug: "desi-bites",
    href: "/hubs/restaurants/desi-bites",
    locationLabel: "Glen Allen, VA",
    distanceMi: 8.7,
    membersLabel: "956 members",
    visibility: "Public",
    description: "Menu drops, deals, catering info, and local foodie updates.",
    tagline: "Fresh flavors, local favorites, and weekly specials.",
    intro:
      "Get menu highlights, seasonal specials, and timely updates before your next visit.",
    website: "https://desibitesva.com",
    dpImage: "/hub-images/desi-bites-dp.jpg",
    heroImage: "/hub-images/desi-bites1.jpg",
    galleryImages: [
      "/hub-images/desi-bites1.jpg",
      "/hub-images/desi-bites2.jpg",
      "/hub-images/desi-bites3.jpg",
    ],
    tags: ["trending", "popular"],
    quickInfo: [
      { label: "Type", value: "Restaurant" },
      { label: "Service", value: "Dine-in & Takeout" },
      { label: "Known For", value: "Daily Specials" },
    ],
    about: [
      "Desi Bites shares menu updates, deals, and catering announcements.",
      "Stay ahead on limited-time offers and festive menu drops.",
      "Follow for convenient local dining updates.",
    ],
    offerings: [
      "Weekly specials and combo offers",
      "Catering announcements and booking windows",
      "Festival menus and quick update alerts",
    ],
    highlights: [
      "Community favorite for quick Indian meals",
      "Clear updates on offers and availability",
      "Family-friendly local dining experience",
    ],
    contact: {
      visit: "Visit the restaurant site or call ahead for current menu and order options.",
      stayConnected:
        "Subscribe to get notified when new specials and promotions go live.",
    },
    cta: {
      title: "Follow Food Updates",
      description:
        "Stay in the loop on menu launches, specials, and event catering announcements.",
      buttonLabel: "Subscribe",
    },
  },

  {
    id: "saint-mikes",
    name: "Saint Michael Catholic Church",
    category: "religious-places",
    slug: "saint-mikes-catholic-church",
    href: "/hubs/religious-places/saint-mikes-catholic-church",
    locationLabel: "Glen Allen, VA",
    distanceMi: 7.2,
    membersLabel: "3.1k members",
    visibility: "Public",
    description:
      "Parish updates, worship schedules, ministries, and family faith formation resources.",
    tagline: "A welcoming parish for worship, service, and belonging.",
    intro:
      "Stay informed on Mass schedules, ministry opportunities, faith formation programs, and parish events for all ages.",
    website: "https://saint-mikes.org",
    dpImage: "/hub-images/saintmike-1.png",
    heroImage: "/hub-images/saintmike-1.png",
    galleryImages: [
      "/hub-images/saintmike-1.png",
      "/hub-images/saintmike-2.webp",
      "/hub-images/saintmike-3.webp",
      "/hub-images/saintmike-4.png",
    ],
    tags: ["popular", "nearby"],
    quickInfo: [
      { label: "Type", value: "Catholic Parish" },
      { label: "Focus", value: "Worship & Ministries" },
      { label: "Audience", value: "Individuals & Families" },
    ],
    about: [
      "Saint Michael the Archangel serves as a local parish home for worship and fellowship.",
      "Families can stay connected through sacramental preparation, faith formation, and ministry life.",
      "The hub makes it easy to track parish announcements and community gatherings.",
    ],
    offerings: [
      "Mass and liturgy schedule updates",
      "Ministry opportunities and volunteer signups",
      "Faith formation and parish education reminders",
    ],
    highlights: [
      "Strong family and youth engagement",
      "Seasonal parish events and service opportunities",
      "Consistent communication for parish life",
    ],
    contact: {
      visit: "Visit the parish website for office hours, Mass times, and ministry contacts.",
      stayConnected:
        "Subscribe for parish updates, event reminders, and community announcements.",
    },
    cta: {
      title: "Stay Connected With Parish Life",
      description:
        "Follow Saint Michael updates so you never miss worship schedules or ministry opportunities.",
      buttonLabel: "Subscribe to Parish Updates",
    },
  },
  {
    id: "grtava",
    name: "Greater Richmond Telugu Association",
    category: "communities",
    slug: "grtava",
    href: "/hubs/communities/grtava",
    locationLabel: "Richmond, VA",
    distanceMi: 5.6,
    membersLabel: "2.2k members",
    visibility: "Public",
    description:
      "Telugu cultural programs, family events, volunteer initiatives, and regional community updates.",
    tagline: "Celebrating Telugu culture through events, service, and shared community.",
    intro:
      "Discover local Telugu events, community programs, and opportunities for families to participate and volunteer.",
    website: "https://grtava.org",
    dpImage: "/hub-images/grta-1.jpg",
    heroImage: "/hub-images/grta-1.jpg",
    galleryImages: [
      "/hub-images/grta-1.jpg",
      "/hub-images/grta-2.jpeg",
      "/hub-images/grta-3.jpeg",
      "/hub-images/grta-4.jpeg",
    ],
    tags: ["trending", "popular"],
    quickInfo: [
      { label: "Type", value: "Cultural Community" },
      { label: "Programs", value: "Events & Volunteering" },
      { label: "Region", value: "Greater Richmond" },
    ],
    about: [
      "GRTAVA supports Telugu families and individuals through cultural, educational, and social events.",
      "The association brings people together across generations through inclusive programming.",
      "Stay updated on volunteer opportunities and regional community initiatives.",
    ],
    offerings: [
      "Cultural celebrations and seasonal events",
      "Family and youth participation programs",
      "Volunteer drives and local outreach updates",
    ],
    highlights: [
      "Strong regional Telugu network",
      "Family-first event experiences",
      "Active volunteer and community engagement",
    ],
    contact: {
      visit: "Visit the official association site for program calendars and membership details.",
      stayConnected:
        "Subscribe for event launches, volunteer announcements, and community alerts.",
    },
    cta: {
      title: "Be Part of the Telugu Community",
      description:
        "Follow GRTAVA to stay current on events, volunteering, and family programs.",
      buttonLabel: "Explore Community Updates",
    },
  },
  {
    id: "honest",
    name: "Honest Indian Vegetarian Restaurant",
    category: "restaurants",
    slug: "honest-restaurant",
    href: "/hubs/restaurants/honest-restaurant",
    locationLabel: "Henrico, VA",
    distanceMi: 6.9,
    membersLabel: "1.6k members",
    visibility: "Public",
    description:
      "Vegetarian menu highlights, street-food favorites, specials, and local dining updates.",
    tagline: "Indian vegetarian favorites with a lively street-food feel.",
    intro:
      "Follow Honest for menu updates, seasonal dishes, and timely notices on specials and community-favorite items.",
    website: "https://honestrestaurantva.com",
    dpImage: "/hub-images/honest-dp.jpg",
    heroImage: "/hub-images/honest-1.jpg",
    galleryImages: [
      "/hub-images/honest-1.jpg",
      "/hub-images/honest-2.jpg",
      "/hub-images/honest-3.jpg",
    ],
    tags: ["trending", "nearby"],
    quickInfo: [
      { label: "Type", value: "Vegetarian Restaurant" },
      { label: "Style", value: "Indian Street Food" },
      { label: "Service", value: "Dine-in & Takeout" },
    ],
    about: [
      "Honest Indian Vegetarian Restaurant is known for flavorful vegetarian comfort food and street-food classics.",
      "The hub shares quick updates so guests can plan meals and discover new items.",
      "Regular followers get first look at rotating specials and dining announcements.",
    ],
    offerings: [
      "Menu item spotlights and chef specials",
      "Festival and weekend dining updates",
      "Limited-time offers and community engagement posts",
    ],
    highlights: [
      "Popular destination for vegetarian dining",
      "Wide variety from snacks to full meals",
      "Consistent local updates for repeat visitors",
    ],
    contact: {
      visit: "Use the restaurant website for hours, location details, and contact information.",
      stayConnected:
        "Subscribe to stay informed about menu additions and limited-time specials.",
    },
    cta: {
      title: "Follow Honest Menu Drops",
      description:
        "Get timely updates on specials, fresh menu additions, and local dining announcements.",
      buttonLabel: "Stay Updated",
    },
  },
  {
    id: "otf",
    name: "Orangetheory Fitness",
    category: "fitness",
    slug: "orangetheory",
    href: "/hubs/fitness/orangetheory",
    locationLabel: "Richmond, VA",
    distanceMi: 4.4,
    membersLabel: "2.9k members",
    visibility: "Public",
    description:
      "Coach-led workout updates, class schedules, member motivation, and progress-focused fitness reminders.",
    tagline: "High-energy coaching and measurable fitness progress.",
    intro:
      "Track class highlights, studio announcements, and motivational updates designed to help members stay consistent.",
    website: "https://www.orangetheory.com",
    dpImage: "/hub-images/orangetheory-1.webp",
    heroImage: "/hub-images/orangetheory-1.webp",
    galleryImages: [
      "/hub-images/orangetheory-1.webp",
      "/hub-images/orangetheory-2.avif",
      "/hub-images/orangetheory-3.webp",
      "/hub-images/orangetheory-4.webp",
    ],
    tags: ["popular", "nearby"],
    quickInfo: [
      { label: "Type", value: "Fitness Studio" },
      { label: "Format", value: "Coach-Led Workouts" },
      { label: "Focus", value: "Accountability & Progress" },
    ],
    about: [
      "Orangetheory combines structured workouts, coaching, and performance tracking.",
      "Members use this hub for class updates, challenge reminders, and studio notices.",
      "It is designed to support consistency and momentum in daily fitness routines.",
    ],
    offerings: [
      "Class schedule reminders and studio announcements",
      "Challenge updates and motivational highlights",
      "Coaching insights for better routine consistency",
    ],
    highlights: [
      "Energy-driven community atmosphere",
      "Supportive accountability for all levels",
      "Progress-oriented workout culture",
    ],
    contact: {
      visit: "Visit Orangetheory online to find local studio details and class information.",
      stayConnected:
        "Subscribe for class reminders, challenge updates, and member alerts.",
    },
    cta: {
      title: "Keep Your Fitness Momentum",
      description:
        "Follow studio updates and reminders to stay consistent with your workout goals.",
      buttonLabel: "Join Fitness Updates",
    },
  },
  {
    id: "lafit",
    name: "LA Fitness",
    category: "fitness",
    slug: "la-fitness",
    href: "/hubs/fitness/la-fitness",
    locationLabel: "Glen Allen, VA",
    distanceMi: 5.3,
    membersLabel: "2.1k members",
    visibility: "Public",
    description:
      "Gym updates, class info, training programs, and practical tips for consistent fitness routines.",
    tagline: "Flexible gym routines with coaching, classes, and community support.",
    intro:
      "Use this hub to stay informed on facility updates, class schedules, and training-focused announcements.",
    website: "https://www.lafitness.com/Pages/Default.aspx",
    dpImage: "/hub-images/lafitness-1.jpeg",
    heroImage: "/hub-images/lafitness-1.jpeg",
    galleryImages: [
      "/hub-images/lafitness-1.jpeg",
      "/hub-images/lafitness-2.jpeg",
      "/hub-images/lafitness-3.jpeg",
    ],
    tags: ["trending", "nearby"],
    quickInfo: [
      { label: "Type", value: "Fitness Club" },
      { label: "Amenities", value: "Gym & Group Classes" },
      { label: "Goal", value: "Routine Consistency" },
    ],
    about: [
      "LA Fitness supports a range of workout goals with flexible access and class options.",
      "This hub helps members keep up with schedules, announcements, and service updates.",
      "It is built for people focused on long-term consistency and healthy routines.",
    ],
    offerings: [
      "Class and facility schedule updates",
      "Training reminders and member notices",
      "Routine-focused wellness and consistency tips",
    ],
    highlights: [
      "Accessible fitness options for different goals",
      "Supportive local member community",
      "Reliable updates for planning workout weeks",
    ],
    contact: {
      visit: "Visit LA Fitness online for club information, hours, and membership details.",
      stayConnected:
        "Subscribe to receive local club alerts, schedule reminders, and updates.",
    },
    cta: {
      title: "Stay On Track With Your Routine",
      description:
        "Follow updates from your fitness club to keep your schedule consistent.",
      buttonLabel: "Follow Club Updates",
    },
  },
  {
    id: "tiny-paws",
    name: "Tiny Paws",
    category: "pet-clubs",
    slug: "tiny-paws",
    href: "/hubs/pet-clubs/tiny-paws",
    locationLabel: "Henrico, VA",
    distanceMi: 4.8,
    membersLabel: "1.4k members",
    visibility: "Public",
    description:
      "Pet care updates, service announcements, and trusted support for local pet parents.",
    tagline: "Trusted care and updates for happy pets and confident pet parents.",
    intro:
      "Stay informed on pet care services, scheduling notices, and helpful updates for day-to-day pet support.",
    website: "https://tinypawsva.com",
    dpImage: "/hub-images/tinypaws-1.webp",
    heroImage: "/hub-images/tinypaws-1.webp",
    galleryImages: [
      "/hub-images/tinypaws-1.webp",
      "/hub-images/tinypaws-2.jpg",
      "/hub-images/tinypaws-3.png",
    ],
    tags: ["popular", "nearby"],
    quickInfo: [
      { label: "Type", value: "Pet Club" },
      { label: "Services", value: "Care & Support" },
      { label: "Audience", value: "Local Pet Parents" },
    ],
    about: [
      "Tiny Paws offers a dependable local space for pet care communication and service updates.",
      "Pet parents can quickly follow announcements about availability and care-related updates.",
      "The hub is designed to build trust through consistent and clear communication.",
    ],
    offerings: [
      "Service and schedule notifications",
      "Care-focused updates for pet parents",
      "Community-friendly pet wellness announcements",
    ],
    highlights: [
      "Reliable local pet support communication",
      "Friendly and responsive pet-parent experience",
      "Practical updates for planning pet care",
    ],
    contact: {
      visit: "Visit the Tiny Paws site for service details, hours, and contact options.",
      stayConnected:
        "Subscribe for timely notices and care updates from the Tiny Paws team.",
    },
    cta: {
      title: "Get Pet Care Updates",
      description:
        "Stay connected with service news and care reminders for your pets.",
      buttonLabel: "Stay Connected",
    },
  },
  {
    id: "ruff",
    name: "Ruff Canine Club",
    category: "pet-clubs",
    slug: "ruff-canine-club",
    href: "/hubs/pet-clubs/ruff-canine-club",
    locationLabel: "Richmond, VA",
    distanceMi: 3.9,
    membersLabel: "1.7k members",
    visibility: "Public",
    description:
      "Dog-focused updates on daycare, training, play programs, and community activities.",
    tagline: "Play, training, and trusted routines for social, happy dogs.",
    intro:
      "Follow club updates for training opportunities, daycare availability, and activities that keep dogs engaged.",
    website: "https://www.ruffcanineclub.com",
    dpImage: "/hub-images/ruffcanine-2.webp",
    heroImage: "/hub-images/ruffcanine-2.webp",
    galleryImages: ["/hub-images/ruffcanine-2.webp"],
    tags: ["trending", "popular"],
    quickInfo: [
      { label: "Type", value: "Canine Club" },
      { label: "Programs", value: "Training & Daycare" },
      { label: "Focus", value: "Social Dog Care" },
    ],
    about: [
      "Ruff Canine Club shares practical updates for dog daycare, structured activities, and training support.",
      "Pet parents can track key announcements and plan around availability.",
      "The club emphasizes trust, socialization, and consistent routines for dogs.",
    ],
    offerings: [
      "Daycare and training program updates",
      "Club activity highlights and reminders",
      "Pet-parent notices and scheduling communication",
    ],
    highlights: [
      "Dog-first programming and enrichment focus",
      "Supportive community of local pet parents",
      "Clear communication for daily planning",
    ],
    contact: {
      visit: "Check the Ruff Canine Club site for service details and enrollment information.",
      stayConnected:
        "Subscribe for program alerts, availability updates, and community announcements.",
    },
    cta: {
      title: "Follow Dog Club Updates",
      description:
        "Stay updated on training, daycare, and upcoming club activities.",
      buttonLabel: "Explore Updates",
    },
  },
  {
    id: "giles-hanover",
    name: "Giles Hanover HOA",
    category: "hoa",
    slug: "giles-hanover",
    href: "/hubs/hoa/giles-hanover",
    locationLabel: "Hanover, VA",
    distanceMi: 8.1,
    membersLabel: "940 residents",
    visibility: "Public",
    description:
      "Neighborhood notices, meeting reminders, amenities information, and resident communications.",
    tagline: "Neighborhood communication made clear, timely, and easy to follow.",
    intro:
      "Stay informed on HOA announcements, resident notices, neighborhood events, and shared community updates.",
    website: "https://www.gileshanoverva.com",
    dpImage: "/hub-images/giles-1.webp",
    heroImage: "/hub-images/giles-1.webp",
    galleryImages: [
      "/hub-images/giles-1.webp",
      "/hub-images/giles-2.webp",
      "/hub-images/giles-3.webp",
      "/hub-images/giles-4.webp",
    ],
    tags: ["nearby", "popular"],
    quickInfo: [
      { label: "Type", value: "HOA" },
      { label: "Focus", value: "Resident Communication" },
      { label: "Coverage", value: "Neighborhood Updates" },
    ],
    about: [
      "Giles Hanover HOA supports organized communication for residents and neighborhood planning.",
      "This hub centralizes notices, meeting information, and amenity updates.",
      "Residents can stay aligned with governance updates and local events.",
    ],
    offerings: [
      "Resident notices and community alerts",
      "Meeting schedules and governance updates",
      "Amenity and neighborhood event communication",
    ],
    highlights: [
      "Central place for HOA communication",
      "Timely notices for neighborhood planning",
      "Stronger resident participation through visibility",
    ],
    contact: {
      visit: "Visit the HOA site for resident resources, notices, and official updates.",
      stayConnected:
        "Subscribe to receive neighborhood alerts and meeting reminders.",
    },
    cta: {
      title: "Stay Aligned With Neighborhood Updates",
      description:
        "Follow HOA notices, events, and announcements that affect your community.",
      buttonLabel: "Stay Connected",
    },
  },
  {
    id: "wellesley-hoa",
    name: "Wellesley HOA",
    category: "hoa",
    slug: "wellesley-hoa",
    href: "/hubs/hoa/wellesley-hoa",
    locationLabel: "Henrico, VA",
    distanceMi: 6.0,
    membersLabel: "1.1k residents",
    visibility: "Public",
    description:
      "Resident notices, neighborhood engagement updates, amenities communication, and HOA announcements.",
    tagline: "Connected residents and informed neighborhood decisions.",
    intro:
      "Track key community notices, neighborhood updates, amenities information, and resident engagement opportunities.",
    website: "https://engage.goenumerate.com/s/wellesleyhoa/",
    dpImage: "/hub-images/wellesley-1.jpeg",
    heroImage: "/hub-images/wellesley-1.jpeg",
    galleryImages: [
      "/hub-images/wellesley-1.jpeg",
      "/hub-images/wellesley-2.jpeg",
      "/hub-images/wellesley-3.jpg",
      "/hub-images/wellesley-4.jpg",
    ],
    tags: ["trending", "nearby"],
    quickInfo: [
      { label: "Type", value: "HOA" },
      { label: "Focus", value: "Resident Notices" },
      { label: "Engagement", value: "Events & Meetings" },
    ],
    about: [
      "Wellesley HOA uses this hub to keep residents informed and engaged.",
      "Important notices, amenities info, and meeting communications are easy to track.",
      "The goal is clear neighborhood communication and stronger community participation.",
    ],
    offerings: [
      "Resident alerts and timely neighborhood notices",
      "HOA meeting updates and reminders",
      "Amenity communication and local event details",
    ],
    highlights: [
      "Consistent communication channel for residents",
      "Clear updates on meetings and decisions",
      "Community-focused engagement opportunities",
    ],
    contact: {
      visit: "Visit the Wellesley HOA portal for official notices and resident resources.",
      stayConnected:
        "Subscribe for updates on meetings, neighborhood alerts, and shared amenities.",
    },
    cta: {
      title: "Follow Wellesley HOA Notices",
      description:
        "Stay current with resident announcements, meetings, and community updates.",
      buttonLabel: "Subscribe for Notices",
    },
  },
];

function hubMediaPaths(category: HubCategorySlug, slug: string) {
  const base = `/hub-images/${category}/${slug}`;
  return {
    dpImage: `${base}/dp.jpg`,
    heroImage: `${base}/cover.jpg`,
    galleryImages: [
      `${base}/gallery-1.jpg`,
      `${base}/gallery-2.jpg`,
      `${base}/gallery-3.jpg`,
    ],
    feedImages: [
      `${base}/feed-1.jpg`,
      `${base}/feed-2.jpg`,
      `${base}/feed-3.jpg`,
    ],
    adminImages: [`${base}/admin-1.jpg`, `${base}/admin-2.jpg`],
  } as const;
}

export const HUBS: HubRecord[] = HUBS_BASE.map((hub) => {
  const scoped = hubMediaPaths(hub.category, hub.slug);
  return {
    ...hub,
    dpImage: hub.dpImage ?? scoped.dpImage,
    heroImage: hub.heroImage ?? scoped.heroImage,
    galleryImages: hub.galleryImages?.length ? hub.galleryImages : scoped.galleryImages,
    feedImages: hub.feedImages?.length ? hub.feedImages : scoped.feedImages,
    adminImages: hub.adminImages?.length ? hub.adminImages : scoped.adminImages,
  };
});

export function getHub(category: string, slug: string): HubRecord | undefined {
  return HUBS.find((h) => h.category === category && h.slug === slug);
}

export function allHubParams() {
  return HUBS.map((h) => ({ category: h.category, slug: h.slug }));
}
