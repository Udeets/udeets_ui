import { describe, expect, it } from "vitest";

import { friendlyChatUserMessage } from "./friendly-chat-error";

describe("friendlyChatUserMessage", () => {
  it("hides RLS recursion errors", () => {
    expect(
      friendlyChatUserMessage(new Error("infinite recursion detected in policy for relation \"chat_rooms\""), "Try again."),
    ).toBe("Try again.");
  });

  it("hides generic HTTP wrapper from fetch helper", () => {
    expect(friendlyChatUserMessage(new Error("Request failed (500)"), "Try again.")).toBe("Try again.");
  });

  it("hides PostgREST table errors", () => {
    expect(
      friendlyChatUserMessage(
        new Error("Could not find the table 'public.chat_rooms' in the schema cache"),
        "Try again.",
      ),
    ).toBe("Try again.");
  });

  it("keeps rate limit text", () => {
    expect(friendlyChatUserMessage(new Error("Too many requests. Try again shortly."), "x")).toContain("Too many");
  });

  it("keeps short benign messages", () => {
    expect(friendlyChatUserMessage(new Error("Room name is required."), "fallback")).toBe("Room name is required.");
  });
});
