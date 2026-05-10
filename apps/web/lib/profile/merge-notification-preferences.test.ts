import { describe, expect, it } from "vitest";

import { mergeNotificationPreferences } from "@/lib/profile/merge-notification-preferences";

describe("mergeNotificationPreferences", () => {
  it("applies defaults for empty input", () => {
    const m = mergeNotificationPreferences(null);
    expect(m.chat_push_preview).toBe("full");
    expect(m.push_new_posts).toBe(true);
  });

  it("preserves valid chat_push_preview", () => {
    expect(mergeNotificationPreferences({ chat_push_preview: "sender_only" }).chat_push_preview).toBe("sender_only");
    expect(mergeNotificationPreferences({ chat_push_preview: "generic" }).chat_push_preview).toBe("generic");
  });

  it("falls back for invalid chat_push_preview", () => {
    expect(mergeNotificationPreferences({ chat_push_preview: "hacker" }).chat_push_preview).toBe("full");
  });
});
