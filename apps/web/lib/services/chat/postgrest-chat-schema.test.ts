import { describe, expect, it } from "vitest";

import { isChatTablesMissingFromPostgrest } from "./postgrest-chat-schema";

describe("isChatTablesMissingFromPostgrest", () => {
  it("detects PGRST205 for chat_rooms", () => {
    expect(
      isChatTablesMissingFromPostgrest({
        code: "PGRST205",
        message: "Could not find the table 'public.chat_rooms' in the schema cache",
      }),
    ).toBe(true);
  });

  it("ignores unrelated PGRST205", () => {
    expect(
      isChatTablesMissingFromPostgrest({
        code: "PGRST205",
        message: "Could not find the table 'public.deet_comments' in the schema cache",
      }),
    ).toBe(false);
  });
});
