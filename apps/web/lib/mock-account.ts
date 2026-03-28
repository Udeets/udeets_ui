export const PROFILE_STATS = [
  { label: "Joined Hubs", value: "12" },
  { label: "Posts Shared", value: "18" },
  { label: "Saved Alerts", value: "27" },
];

export const JOINED_HUBS: Array<{
  id: string;
  name: string;
  category: string;
  membersLabel: string;
  href: string;
  image: string;
}> = [];

export const MY_POSTS = [
  {
    id: "mp1",
    title: "Community volunteer signup now open",
    type: "Announcement",
    status: "Published",
    audience: "Subscribers",
    dateLabel: "Today, 9:15 AM",
    body: "Shared a quick volunteer callout for this weekend with time slots and setup notes.",
  },
  {
    id: "mp2",
    title: "Spring meetup RSVP reminder",
    type: "Event",
    status: "Scheduled",
    audience: "Hub Members",
    dateLabel: "Tomorrow, 7:00 PM",
    body: "Queued a reminder post for the upcoming meetup with parking details and RSVP links.",
  },
  {
    id: "mp3",
    title: "Photo recap from last Sunday",
    type: "Image",
    status: "Draft",
    audience: "Public",
    dateLabel: "Edited 2 days ago",
    body: "Preparing a short gallery post with captions before publishing it to the community feed.",
  },
];

export const SETTINGS_SECTIONS = [
  {
    title: "Notifications",
    items: [
      { label: "Push alerts for new hub posts", description: "Stay updated when subscribed hubs publish important updates.", enabled: true },
      { label: "Weekly community digest", description: "Receive a recap of trending updates every Friday morning.", enabled: true },
      { label: "Event reminders", description: "Get reminder nudges before saved events begin.", enabled: false },
    ],
  },
  {
    title: "Privacy",
    items: [
      { label: "Show profile in joined hubs", description: "Let other members see your display name in shared communities.", enabled: true },
      { label: "Allow direct community invites", description: "Receive invite requests from local organizers.", enabled: false },
    ],
  },
];
