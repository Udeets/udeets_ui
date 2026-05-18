export type ChatReportListStatusFilter = "pending" | "resolved" | "dismissed" | "all";

export type ChatMessageReportRow = {
  id: string;
  hubId: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolverId: string | null;
  reporterId: string;
  targetMessageId: string | null;
  targetUserId: string | null;
  reason: string | null;
  reasonCode: string | null;
  details: string | null;
  appealStatus: string;
  appealSubmittedAt: string | null;
  reviewNotesInternal: string | null;
  reporterDisplayName: string | null;
  targetUserDisplayName: string | null;
  resolverDisplayName: string | null;
};
