import { describe, expect, it } from "vitest";

import { isAllowedChatRetentionDays } from "@/lib/services/chat/chat-retention";

describe("isAllowedChatRetentionDays", () => {
  it("allows null and 30/90/365", () => {
    expect(isAllowedChatRetentionDays(null)).toBe(true);
    expect(isAllowedChatRetentionDays(30)).toBe(true);
    expect(isAllowedChatRetentionDays(90)).toBe(true);
    expect(isAllowedChatRetentionDays(365)).toBe(true);
  });

  it("rejects other numbers", () => {
    expect(isAllowedChatRetentionDays(7)).toBe(false);
    expect(isAllowedChatRetentionDays(31)).toBe(false);
  });
});
