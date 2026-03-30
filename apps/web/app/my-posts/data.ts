import type { MyPost, WorkflowStat } from "./types";

export const MY_POSTS: MyPost[] = [
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

export const WORKFLOW_STATS: WorkflowStat[] = [
  { label: "Drafts", value: "4" },
  { label: "Scheduled", value: "2" },
  { label: "Published", value: "18" },
];
