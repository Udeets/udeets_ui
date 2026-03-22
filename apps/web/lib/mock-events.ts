export type EventTheme =
  | "Pooja"
  | "Temple"
  | "Church"
  | "Food"
  | "Service"
  | "Party"
  | "Trek"
  | "Voluntary"
  | "Cultural"
  | "Kids"
  | "Sports"
  | "Community";

export type MockHubLink = {
  category: string;
  slug: string;
};

export type MockNotification = {
  id: string;
  title: string;
  body: string;
  meta: string;
  type: "Tagged" | "New Posts" | "Activity";
  href: string;
};

export type MockEvent = {
  id: string;
  title: string;
  hub: string;
  dateLabel: string;
  time: string;
  location: string;
  badge: string;
  description: string;
  theme: EventTheme;
  href: string;
  group: "Today" | "Tomorrow" | "This Week";
};

function hubHref(link: MockHubLink, params: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return `/hubs/${link.category}/${link.slug}${search ? `?${search}` : ""}`;
}

const HUBS = {
  rks: {
    category: "communities",
    slug: "richmond-kannada-sangha",
  },
  desi: {
    category: "restaurants",
    slug: "desi-bites",
  },
  hcv: {
    category: "religious-places",
    slug: "hindu-center-of-virginia",
  },
  saintMikes: {
    category: "religious-places",
    slug: "saint-mikes-catholic-church",
  },
  lafit: {
    category: "fitness",
    slug: "la-fitness",
  },
  wellesley: {
    category: "hoa",
    slug: "wellesley-hoa",
  },
  grtava: {
    category: "communities",
    slug: "grtava",
  },
} as const;

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "n1",
    title: "Tagged in volunteer update",
    body: "RKS Organizers tagged you in a post about setup shifts for Saturday.",
    meta: "5m ago",
    type: "Tagged",
    href: hubHref(HUBS.rks, { post: "post-volunteer-shifts" }),
  },
  {
    id: "n2",
    title: "New post from Desi Bites",
    body: "Weekend combo details were just published for subscribers.",
    meta: "24m ago",
    type: "New Posts",
    href: hubHref(HUBS.desi, { post: "post-weekend-combo" }),
  },
  {
    id: "n3",
    title: "New comment on your update",
    body: "A community admin replied to your latest post with schedule details.",
    meta: "1h ago",
    type: "Activity",
    href: hubHref(HUBS.hcv, { post: "post-schedule-update" }),
  },
];

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: "event-rks-orientation",
    title: "Volunteer Orientation",
    hub: "RKS Organizers",
    dateLabel: "Today",
    time: "6:30 PM",
    location: "Community Hall A",
    badge: "My Hubs",
    description: "Final volunteer briefing for registration desks, stage coordination, and family check-in.",
    theme: "Voluntary",
    href: hubHref(HUBS.rks, { event: "event-rks-orientation" }),
    group: "Today",
  },
  {
    id: "event-desi-preview",
    title: "Menu Preview Tasting",
    hub: "Desi Bites",
    dateLabel: "Today",
    time: "8:00 PM",
    location: "Broad Street",
    badge: "Saved",
    description: "A small invite-only tasting for the new family combo and snack lineup.",
    theme: "Food",
    href: hubHref(HUBS.desi, { event: "event-desi-preview" }),
    group: "Today",
  },
  {
    id: "event-lafit-mobility",
    title: "Morning Mobility Session",
    hub: "LA Fitness",
    dateLabel: "Tomorrow",
    time: "9:30 AM",
    location: "Studio Zone B",
    badge: "Sports",
    description: "Guided recovery, stretching, and light conditioning for members of all levels.",
    theme: "Sports",
    href: hubHref(HUBS.lafit, { event: "event-lafit-mobility" }),
    group: "Tomorrow",
  },
  {
    id: "event-hcv-planning",
    title: "Temple Festival Planning",
    hub: "Hindu Center of Virginia",
    dateLabel: "Thursday",
    time: "7:00 PM",
    location: "Main Prayer Hall",
    badge: "Temple",
    description: "Coordinator meeting for seva roles, schedule updates, and cultural program timing.",
    theme: "Temple",
    href: hubHref(HUBS.hcv, { event: "event-hcv-planning" }),
    group: "This Week",
  },
  {
    id: "event-wellesley-meetup",
    title: "Neighborhood Meetup",
    hub: "Wellesley HOA",
    dateLabel: "Saturday",
    time: "10:00 AM",
    location: "Clubhouse Lawn",
    badge: "Community",
    description: "Resident meetup covering landscaping updates, family activities, and seasonal planning.",
    theme: "Community",
    href: hubHref(HUBS.wellesley, { event: "event-wellesley-meetup" }),
    group: "This Week",
  },
  {
    id: "event-saint-mikes-service",
    title: "Parish Outreach Drive",
    hub: "Saint Michael Catholic Church",
    dateLabel: "Saturday",
    time: "11:00 AM",
    location: "Parish Hall",
    badge: "Service",
    description: "Family-friendly service project supporting local donation packing and delivery prep.",
    theme: "Service",
    href: hubHref(HUBS.saintMikes, { event: "event-saint-mikes-service" }),
    group: "This Week",
  },
  {
    id: "event-grtava-cultural-night",
    title: "Telugu Cultural Night",
    hub: "GRTAVA",
    dateLabel: "Friday",
    time: "6:00 PM",
    location: "Richmond Community Center",
    badge: "Cultural",
    description: "An evening of performances, food stalls, and family programming from the local community.",
    theme: "Cultural",
    href: hubHref(HUBS.grtava, { event: "event-grtava-cultural-night" }),
    group: "This Week",
  },
  {
    id: "event-hcv-kids-workshop",
    title: "Kids Rangoli Workshop",
    hub: "Hindu Center of Virginia",
    dateLabel: "Sunday",
    time: "2:00 PM",
    location: "Learning Hall",
    badge: "Kids",
    description: "A beginner-friendly workshop introducing children to festival art and cultural stories.",
    theme: "Kids",
    href: hubHref(HUBS.hcv, { event: "event-hcv-kids-workshop" }),
    group: "This Week",
  },
  {
    id: "event-rks-trek-day",
    title: "Community Trail Trek",
    hub: "RKS Organizers",
    dateLabel: "Sunday",
    time: "8:00 AM",
    location: "Pocahontas State Park",
    badge: "Trek",
    description: "A light family trek with breakfast meetup and photo stops along the route.",
    theme: "Trek",
    href: hubHref(HUBS.rks, { event: "event-rks-trek-day" }),
    group: "This Week",
  },
  {
    id: "event-desi-party-night",
    title: "Street Food Party Night",
    hub: "Desi Bites",
    dateLabel: "Friday",
    time: "7:30 PM",
    location: "Patio Lounge",
    badge: "Party",
    description: "Late evening specials, music, and group dining offers for local regulars.",
    theme: "Party",
    href: hubHref(HUBS.desi, { event: "event-desi-party-night" }),
    group: "This Week",
  },
  {
    id: "event-saint-mikes-mass",
    title: "Family Mass & Fellowship",
    hub: "Saint Michael Catholic Church",
    dateLabel: "Sunday",
    time: "9:00 AM",
    location: "Main Sanctuary",
    badge: "Church",
    description: "Weekend worship followed by coffee hour and children’s fellowship activities.",
    theme: "Church",
    href: hubHref(HUBS.saintMikes, { event: "event-saint-mikes-mass" }),
    group: "This Week",
  },
  {
    id: "event-hcv-pooja-evening",
    title: "Community Pooja Evening",
    hub: "Hindu Center of Virginia",
    dateLabel: "Friday",
    time: "6:00 PM",
    location: "Temple Main Hall",
    badge: "Pooja",
    description: "Evening pooja, prasadam, and volunteer announcements for attending families.",
    theme: "Pooja",
    href: hubHref(HUBS.hcv, { event: "event-hcv-pooja-evening" }),
    group: "This Week",
  },
];
