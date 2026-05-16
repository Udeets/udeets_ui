import { describe, expect, it } from "vitest";

import {
  isValidInviteEmail,
  isValidUsPhone,
  normalizeUsPhone,
  validateInviteContact,
} from "./validate-invite-contact";

describe("validateInviteContact", () => {
  it("accepts valid email", () => {
    const result = validateInviteContact("email", "Person@Example.com");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.normalized).toBe("person@example.com");
  });

  it("rejects invalid email", () => {
    expect(validateInviteContact("email", "not-an-email").ok).toBe(false);
  });

  it("accepts valid US phone with country code", () => {
    expect(normalizeUsPhone("+1 (555) 234-5678")).toBe("+15552345678");
    expect(isValidUsPhone("+1 (555) 234-5678")).toBe(true);
  });

  it("accepts valid US phone without country code", () => {
    expect(normalizeUsPhone("5552345678")).toBe("+15552345678");
  });

  it("rejects non-US length", () => {
    expect(isValidUsPhone("12345")).toBe(false);
    expect(isValidUsPhone("+44 7911 123456")).toBe(false);
  });

  it("rejects invalid US area code", () => {
    expect(isValidUsPhone("0551234567")).toBe(false);
  });

  it("validates email helper", () => {
    expect(isValidInviteEmail("a@b.co")).toBe(true);
    expect(isValidInviteEmail("bad")).toBe(false);
  });
});
