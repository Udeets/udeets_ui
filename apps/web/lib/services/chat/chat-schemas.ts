import { z, type output } from "zod";

import { getChatAttachmentMaxBytesForMime, isChatAttachmentMimeAllowed } from "@/lib/services/chat/chat-attachment-media";

export const uuidSchema = z.string().uuid();

export const listRoomsQuerySchema = z.object({
  hubId: uuidSchema,
});

export const createRoomBodySchema = z.object({
  hubId: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
});

export const chatRetentionDaysSchema = z.union([z.literal(30), z.literal(90), z.literal(365)]).nullable();

export const updateRoomBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  archived: z.boolean().optional(),
  /** null = keep messages indefinitely; 30 / 90 / 365 = auto-purge after that many days. */
  retentionDays: chatRetentionDaysSchema.optional(),
  settings: z
    .object({
      attachmentsEnabled: z.boolean().optional(),
      invitePolicy: z.enum(["hub_admins_only", "room_admins"]).optional(),
      whoCanCreatePolls: z.enum(["room_admin_and_moderator", "room_admin_only", "all_active_members"]).optional(),
    })
    .strict()
    .optional(),
});

export const inviteMemberBodySchema = z.object({
  invitedUserId: uuidSchema,
});

export const inviteRevokeQuerySchema = z.object({
  invitedUserId: uuidSchema,
});

export const inviteRespondBodySchema = z.object({
  action: z.enum(["accept", "decline"]),
});

/** Zod v4: use transform so output `role` is always the literal union (optional().default() inference can widen). */
export const addMemberBodySchema = z
  .object({
    userId: uuidSchema,
    role: z.enum(["member", "moderator", "admin"]).optional(),
  })
  .transform((d) => ({
    userId: d.userId,
    role: d.role ?? ("member" as const),
  }));

export const sendMessageBodySchema = z.object({
  body: z.string().max(8000),
  messageKind: z.enum(["text", "media", "attachment", "poll"]),
  replyToId: uuidSchema.nullable().optional(),
});

export const editMessageBodySchema = z.object({
  body: z.string().min(1).max(8000),
});

export const listMessagesQuerySchema = z.object({
  limit: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.coerce.number().int().min(1).max(100).optional().default(30),
  ),
  cursor: z.preprocess((v) => (v === "" || v === undefined ? undefined : v), z.string().max(2048).optional()),
});

export const reactionBodySchema = z.object({
  emoji: z.string().min(1).max(32),
});

export const createPollBodySchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(12),
  allowMultiple: z.boolean().optional().default(false),
  anonymousVoting: z.boolean().optional().default(false),
  closesAt: z.string().datetime().nullable().optional(),
  /** Optional caption stored on the poll message body */
  messageBody: z.string().max(2000).optional().default(""),
});

export const createReportBodySchema = z
  .object({
    targetMessageId: uuidSchema.optional(),
    targetUserId: uuidSchema.optional(),
    /** Human-readable reason (stored as `reason`); required for new reports. */
    reason: z.string().min(1).max(500).trim(),
    /** Optional machine-oriented tag (e.g. `spam`, `harassment`). */
    reasonCode: z.string().max(64).optional(),
    details: z.string().max(4000).optional(),
  })
  .refine((v) => v.targetMessageId || v.targetUserId, {
    message: "targetMessageId or targetUserId is required",
  });

export const updateReportBodySchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  /** Staff-only notes persisted on the report row (not shown to reporters). */
  staffNotes: z.string().max(4000).optional(),
});

export const listReportsQuerySchema = z.object({
  /** Default `all` preserves prior list behavior; use `pending` for triage queue. */
  status: z.enum(["pending", "resolved", "dismissed", "all"]).optional().default("all"),
});

export const moderationActionBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("hide_message"),
    messageId: uuidSchema,
    reason: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("mute_user"),
    userId: uuidSchema,
    mutedUntil: z.string().datetime().nullable().optional(),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("ban_user"),
    userId: uuidSchema,
    reason: z.string().max(500).optional(),
  }),
]);

export const prepareUploadBodySchema = z
  .object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(128),
    sizeBytes: z.number().int().positive().max(100 * 1024 * 1024),
  })
  .superRefine((val, ctx) => {
    if (!isChatAttachmentMimeAllowed(val.mimeType)) {
      ctx.addIssue({ code: "custom", message: "Unsupported MIME type for chat uploads.", path: ["mimeType"] });
    } else {
      const max = getChatAttachmentMaxBytesForMime(val.mimeType);
      if (val.sizeBytes > max) {
        ctx.addIssue({
          code: "custom",
          message: `File too large for this type (max ${Math.round(max / (1024 * 1024))} MB).`,
          path: ["sizeBytes"],
        });
      }
    }
  });

export const completeUploadBodySchema = z
  .object({
    storageKey: z.string().min(1).max(1024),
    mimeType: z.string().min(1).max(128),
    originalFilename: z.string().min(1).max(255),
    sizeBytes: z.number().int().nonnegative().max(100 * 1024 * 1024),
  })
  .superRefine((val, ctx) => {
    if (!isChatAttachmentMimeAllowed(val.mimeType)) {
      ctx.addIssue({ code: "custom", message: "Unsupported MIME type for chat uploads.", path: ["mimeType"] });
    } else {
      const max = getChatAttachmentMaxBytesForMime(val.mimeType);
      if (val.sizeBytes > max) {
        ctx.addIssue({
          code: "custom",
          message: `File too large for this type (max ${Math.round(max / (1024 * 1024))} MB).`,
          path: ["sizeBytes"],
        });
      }
    }
  });

export const pollVoteBodySchema = z.object({
  optionId: uuidSchema,
});

export const chatTypingPhaseBodySchema = z.object({
  phase: z.enum(["started", "stopped"]),
});

/** Use Zod `output` so `.transform()` / `.pipe()` schemas infer the parsed shape, not the raw input. */
export function parseJsonBody<S extends z.ZodType>(
  raw: unknown,
  schema: S,
): { ok: true; data: output<S> } | { ok: false; error: string } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors.join("; ") || parsed.error.message;
    return { ok: false, error: msg || "Invalid request body" };
  }
  return { ok: true, data: parsed.data };
}

export function parseSearchParams<S extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: S,
): { ok: true; data: output<S> } | { ok: false; error: string } {
  const obj: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    obj[k] = v;
  });
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors.join("; ") || parsed.error.message;
    return { ok: false, error: msg || "Invalid query parameters" };
  }
  return { ok: true, data: parsed.data };
}
