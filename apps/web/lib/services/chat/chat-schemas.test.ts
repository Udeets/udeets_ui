import { describe, expect, it } from "vitest";

import {
  CHAT_ATTACHMENT_MAX_BYTES_DEFAULT,
  CHAT_ATTACHMENT_MAX_BYTES_VIDEO,
} from "@/lib/services/chat/chat-attachment-media";
import {
  completeUploadBodySchema,
  createReportBodySchema,
  editMessageBodySchema,
  listMessagesQuerySchema,
  listReportsQuerySchema,
  listRoomsQuerySchema,
  moderationActionBodySchema,
  parseJsonBody,
  parseSearchParams,
  prepareUploadBodySchema,
  updateReportBodySchema,
  updateRoomBodySchema,
} from "@/lib/services/chat/chat-schemas";

const sampleUuid = "11111111-1111-4111-8111-111111111111";
const otherUuid = "22222222-2222-4222-8222-222222222222";
const thirdUuid = "33333333-3333-4333-8333-333333333333";
const fourthUuid = "44444444-4444-4444-8444-444444444444";

describe("parseJsonBody", () => {
  it("accepts valid create report with message target and reason", () => {
    const raw = { targetMessageId: sampleUuid, reason: "Spam content", details: "extra" };
    const r = parseJsonBody(raw, createReportBodySchema);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.targetMessageId).toBe(sampleUuid);
      expect(r.data.reason).toBe("Spam content");
    }
  });

  it("rejects create report without reason", () => {
    const r = parseJsonBody({ targetMessageId: sampleUuid }, createReportBodySchema);
    expect(r.ok).toBe(false);
  });

  it("rejects create report without message or user target", () => {
    const r = parseJsonBody({ reason: "x", reasonCode: "x" }, createReportBodySchema);
    expect(r.ok).toBe(false);
  });

  it("accepts update report with optional staffNotes", () => {
    const r = parseJsonBody({ status: "resolved", staffNotes: "Verified policy breach." }, updateReportBodySchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.staffNotes).toContain("Verified");
  });

  it("accepts edit message body", () => {
    const r = parseJsonBody({ body: "hello" }, editMessageBodySchema);
    expect(r.ok).toBe(true);
  });

  it("rejects empty edit message body", () => {
    const r = parseJsonBody({ body: "" }, editMessageBodySchema);
    expect(r.ok).toBe(false);
  });

  it("prepare upload rejects disallowed MIME", () => {
    const r = parseJsonBody(
      { fileName: "x.exe", mimeType: "application/x-msdownload", sizeBytes: 100 },
      prepareUploadBodySchema,
    );
    expect(r.ok).toBe(false);
  });

  it("prepare upload rejects image over default max", () => {
    const r = parseJsonBody(
      {
        fileName: "big.png",
        mimeType: "image/png",
        sizeBytes: CHAT_ATTACHMENT_MAX_BYTES_DEFAULT + 1,
      },
      prepareUploadBodySchema,
    );
    expect(r.ok).toBe(false);
  });

  it("prepare upload accepts image at default max", () => {
    const r = parseJsonBody(
      {
        fileName: "ok.png",
        mimeType: "image/png",
        sizeBytes: CHAT_ATTACHMENT_MAX_BYTES_DEFAULT,
      },
      prepareUploadBodySchema,
    );
    expect(r.ok).toBe(true);
  });

  it("prepare upload rejects video over video max", () => {
    const r = parseJsonBody(
      {
        fileName: "big.mp4",
        mimeType: "video/mp4",
        sizeBytes: CHAT_ATTACHMENT_MAX_BYTES_VIDEO + 1,
      },
      prepareUploadBodySchema,
    );
    expect(r.ok).toBe(false);
  });

  it("prepare upload accepts video at video max", () => {
    const r = parseJsonBody(
      {
        fileName: "ok.mp4",
        mimeType: "video/mp4",
        sizeBytes: CHAT_ATTACHMENT_MAX_BYTES_VIDEO,
      },
      prepareUploadBodySchema,
    );
    expect(r.ok).toBe(true);
  });

  it("complete upload rejects disallowed MIME", () => {
    const r = parseJsonBody(
      {
        storageKey: `${sampleUuid}/${otherUuid}/${thirdUuid}/${fourthUuid}/f.bin`,
        mimeType: "application/octet-stream",
        originalFilename: "f.bin",
        sizeBytes: 10,
      },
      completeUploadBodySchema,
    );
    expect(r.ok).toBe(false);
  });

  it("complete upload rejects size over tier for declared MIME", () => {
    const key = `${sampleUuid}/${otherUuid}/${thirdUuid}/${fourthUuid}/x.jpg`;
    const r = parseJsonBody(
      {
        storageKey: key,
        mimeType: "image/jpeg",
        originalFilename: "x.jpg",
        sizeBytes: CHAT_ATTACHMENT_MAX_BYTES_DEFAULT + 1,
      },
      completeUploadBodySchema,
    );
    expect(r.ok).toBe(false);
  });

  it("complete upload accepts valid body", () => {
    const key = `${sampleUuid}/${otherUuid}/${thirdUuid}/${fourthUuid}/x.jpg`;
    const r = parseJsonBody(
      {
        storageKey: key,
        mimeType: "image/jpeg",
        originalFilename: "x.jpg",
        sizeBytes: 1024,
      },
      completeUploadBodySchema,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.storageKey).toBe(key);
  });
});

describe("parseSearchParams", () => {
  it("defaults message list limit and treats empty cursor as absent", () => {
    const sp = new URLSearchParams("");
    const r = parseSearchParams(sp, listMessagesQuerySchema);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.limit).toBe(30);
      expect(r.data.cursor).toBeUndefined();
    }
  });

  it("parses limit and cursor", () => {
    const sp = new URLSearchParams({ limit: "10", cursor: otherUuid });
    const r = parseSearchParams(sp, listMessagesQuerySchema);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.limit).toBe(10);
      expect(r.data.cursor).toBe(otherUuid);
    }
  });

  it("treats empty string cursor as undefined", () => {
    const sp = new URLSearchParams({ cursor: "" });
    const r = parseSearchParams(sp, listMessagesQuerySchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.cursor).toBeUndefined();
  });

  it("validates hubId for room list", () => {
    const bad = parseSearchParams(new URLSearchParams({ hubId: "nope" }), listRoomsQuerySchema);
    expect(bad.ok).toBe(false);
    const good = parseSearchParams(new URLSearchParams({ hubId: sampleUuid }), listRoomsQuerySchema);
    expect(good.ok).toBe(true);
  });

  it("defaults list reports status to all", () => {
    const r = parseSearchParams(new URLSearchParams(""), listReportsQuerySchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.status).toBe("all");
  });

  it("parses list reports status pending", () => {
    const r = parseSearchParams(new URLSearchParams({ status: "pending" }), listReportsQuerySchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.status).toBe("pending");
  });
});

describe("updateRoomBodySchema", () => {
  it("accepts retention null and allowed day values", () => {
    expect(updateRoomBodySchema.safeParse({ retentionDays: null }).success).toBe(true);
    expect(updateRoomBodySchema.safeParse({ retentionDays: 30 }).success).toBe(true);
    expect(updateRoomBodySchema.safeParse({ retentionDays: 365 }).success).toBe(true);
  });

  it("rejects invalid retention day counts", () => {
    expect(updateRoomBodySchema.safeParse({ retentionDays: 31 }).success).toBe(false);
    expect(updateRoomBodySchema.safeParse({ retentionDays: 1 }).success).toBe(false);
  });
});

describe("moderationActionBodySchema", () => {
  it("parses hide_message", () => {
    const r = moderationActionBodySchema.safeParse({
      action: "hide_message",
      messageId: sampleUuid,
    });
    expect(r.success).toBe(true);
  });

  it("parses mute_user with optional mutedUntil", () => {
    const r = moderationActionBodySchema.safeParse({
      action: "mute_user",
      userId: sampleUuid,
      mutedUntil: "2026-01-01T00:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });
});
