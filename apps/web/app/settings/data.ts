import type { SettingsSection } from "./types";

export const SETTINGS_SECTIONS: SettingsSection[] = [
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
