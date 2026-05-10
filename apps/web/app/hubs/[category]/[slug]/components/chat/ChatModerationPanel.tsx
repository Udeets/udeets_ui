"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  chatApiListMembers,
  chatApiListReports,
  chatApiModeration,
  chatApiPatchReport,
  type ChatMessageReportRow,
  type ChatRoomMemberDto,
} from "@/lib/chat/chat-browser-api";
import { ComposerMenuSelect, type ComposerMenuSelectOption } from "../deets/composer/ComposerMenuSelect";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_CLASS, cn, initials, normalizePublicSrc } from "../hubUtils";

function memberLabel(m: ChatRoomMemberDto): string {
  const n = m.displayName?.trim() || "Member";
  return `${n} · ${m.role}`;
}

export function ChatModerationPanel({
  open,
  roomId,
  viewerUserId,
  onClose,
  onError,
  onModerationDone,
}: {
  open: boolean;
  roomId: string;
  /** Signed-in user; excluded from mute/ban picker (cannot moderate yourself). */
  viewerUserId?: string | null;
  onClose: () => void;
  onError: (msg: string) => void;
  /** After hide/mute/ban, parent may refresh messages or members. */
  onModerationDone?: () => void;
}) {
  const [reports, setReports] = useState<ChatMessageReportRow[]>([]);
  const [roomMembers, setRoomMembers] = useState<ChatRoomMemberDto[]>([]);
  const [membersFetchInFlight, setMembersFetchInFlight] = useState(false);
  const [modUserId, setModUserId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reportScope, setReportScope] = useState<"pending" | "all">("pending");
  const [staffDraft, setStaffDraft] = useState<Record<string, string>>({});
  const prevRoomIdRef = useRef(roomId);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const moderatableMembers = useMemo(
    () => roomMembers.filter((m) => !viewerUserId || m.userId !== viewerUserId),
    [roomMembers, viewerUserId],
  );

  const modMemberSelectOptions: ComposerMenuSelectOption[] = useMemo(
    () => [
      { value: "", label: "Select a member…" },
      ...moderatableMembers.map((m) => ({ value: m.userId, label: memberLabel(m) })),
    ],
    [moderatableMembers],
  );

  useEffect(() => {
    if (prevRoomIdRef.current !== roomId) {
      prevRoomIdRef.current = roomId;
      setReports([]);
      setRoomMembers([]);
      setModUserId("");
    }
  }, [roomId]);

  useEffect(() => {
    setReports([]);
  }, [reportScope]);

  const load = useCallback(async () => {
    try {
      const { reports: r } = await chatApiListReports(roomId, {
        status: reportScope === "pending" ? "pending" : "all",
      });
      setReports(r);
    } catch (e) {
      setReports([]);
      onErrorRef.current(e instanceof Error ? e.message : "Could not load reports");
    }
  }, [roomId, reportScope]);

  const loadMembers = useCallback(async () => {
    setMembersFetchInFlight(true);
    try {
      const { members: m } = await chatApiListMembers(roomId);
      setRoomMembers(m);
    } catch {
      setRoomMembers([]);
    } finally {
      setMembersFetchInFlight(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (open && roomId) void load();
  }, [open, roomId, load]);

  useEffect(() => {
    if (open && roomId) void loadMembers();
  }, [open, roomId, loadMembers]);

  useEffect(() => {
    if (modUserId && !moderatableMembers.some((m) => m.userId === modUserId)) {
      setModUserId("");
    }
  }, [modUserId, moderatableMembers]);

  if (!open) return null;

  const displayName = (id: string | null | undefined, fallback: string | null | undefined) => {
    const f = fallback?.trim();
    if (f) return f;
    if (!id) return "Unknown";
    return "Member";
  };

  const setReportStatus = async (reportId: string, status: "resolved" | "dismissed") => {
    setBusyId(reportId);
    try {
      const staffNotes = staffDraft[reportId]?.trim() || undefined;
      await chatApiPatchReport(roomId, reportId, { status, staffNotes });
      setStaffDraft((d) => {
        const next = { ...d };
        delete next[reportId];
        return next;
      });
      await load();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not update report");
    } finally {
      setBusyId(null);
    }
  };

  const hideMessage = async (messageId: string) => {
    setBusyId(messageId);
    try {
      await chatApiModeration(roomId, { action: "hide_message", messageId, reason: "Member report" });
      onModerationDone?.();
      await load();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Hide message failed");
    } finally {
      setBusyId(null);
    }
  };

  const muteUser = async () => {
    const uid = modUserId.trim();
    if (!uid) {
      onError("Choose a member to mute.");
      return;
    }
    setBusyId(`mute:${uid}`);
    try {
      await chatApiModeration(roomId, { action: "mute_user", userId: uid, reason: "Moderation" });
      onModerationDone?.();
      setModUserId("");
      await loadMembers();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Mute failed");
    } finally {
      setBusyId(null);
    }
  };

  const banUser = async () => {
    const uid = modUserId.trim();
    if (!uid) {
      onError("Choose a member to ban.");
      return;
    }
    setBusyId(`ban:${uid}`);
    try {
      await chatApiModeration(roomId, { action: "ban_user", userId: uid, reason: "Moderation" });
      onModerationDone?.();
      setModUserId("");
      await loadMembers();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Ban failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="chat-mod-title">
      <div className={cn(CARD, "max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 shadow-xl")}>
        <h2 id="chat-mod-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
          Moderation
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ud-text-secondary)]">
          <strong>Reports</strong> are messages members have flagged. Read what they wrote, hide the message if it breaks
          your rules, then mark the report resolved or dismissed. Change how you get notified in{" "}
          <Link href="/settings" className="font-medium text-[var(--ud-brand-primary)] underline">
            Account settings
          </Link>
          .
        </p>

        <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--ud-text-muted)]">Reports</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(BUTTON_SECONDARY, "py-1 text-xs", reportScope === "pending" && "ring-1 ring-[var(--ud-brand-primary)]")}
            onClick={() => setReportScope("pending")}
          >
            Needs review
          </button>
          <button
            type="button"
            className={cn(BUTTON_SECONDARY, "py-1 text-xs", reportScope === "all" && "ring-1 ring-[var(--ud-brand-primary)]")}
            onClick={() => setReportScope("all")}
          >
            All reports
          </button>
        </div>
        <div className="mt-2 min-h-[3rem]">
          {reports.length === 0 ? (
            <p className="text-sm text-[var(--ud-text-secondary)]">Nothing to show for this filter.</p>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.id} className="rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-[var(--ud-text-secondary)]">
                    <span className="rounded bg-[var(--ud-bg-card)] px-1.5 py-0.5 font-medium text-[var(--ud-text-primary)]">{r.status}</span>
                    <span>{new Date(r.createdAt).toLocaleString()}</span>
                    {r.resolvedAt ? <span className="text-[var(--ud-text-muted)]">Resolved {new Date(r.resolvedAt).toLocaleString()}</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-[var(--ud-text-primary)]">
                    <span className="font-semibold text-[var(--ud-text-muted)]">From </span>
                    {displayName(r.reporterId, r.reporterDisplayName)}
                    <span className="font-semibold text-[var(--ud-text-muted)]"> · About </span>
                    {displayName(r.targetUserId, r.targetUserDisplayName)}
                  </p>
                  {r.resolverDisplayName ? (
                    <p className="mt-0.5 text-[11px] text-[var(--ud-text-muted)]">Handled by {r.resolverDisplayName}</p>
                  ) : null}
                  {r.reason ? (
                    <p className="mt-2 text-sm leading-snug text-[var(--ud-text-primary)]">
                      <span className="font-semibold text-[var(--ud-text-muted)]">Reason: </span>
                      {r.reason}
                    </p>
                  ) : null}
                  {r.details ? (
                    <p className="mt-1 text-sm leading-snug text-[var(--ud-text-secondary)]">
                      <span className="font-semibold text-[var(--ud-text-muted)]">Details: </span>
                      {r.details}
                    </p>
                  ) : null}
                  {r.reviewNotesInternal ? (
                    <p className="mt-1 text-xs italic text-[var(--ud-text-muted)]">Moderator notes: {r.reviewNotesInternal}</p>
                  ) : null}
                  {r.appealStatus !== "none" ? (
                    <p className="mt-1 text-xs text-[var(--ud-text-muted)]">
                      Appeal: {r.appealStatus}
                      {r.appealSubmittedAt ? ` · ${new Date(r.appealSubmittedAt).toLocaleString()}` : ""}
                    </p>
                  ) : null}
                  {r.status === "pending" ? (
                    <div className="mt-2 space-y-2">
                      <label className="block text-[var(--ud-text-muted)]">
                        Notes for other moderators (optional)
                        <textarea
                          className={cn(INPUT_CLASS, "mt-1 min-h-[52px] w-full font-sans")}
                          value={staffDraft[r.id] ?? ""}
                          maxLength={4000}
                          onChange={(e) => setStaffDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={cn(BUTTON_SECONDARY, "py-1 text-xs")}
                          disabled={busyId === r.id}
                          onClick={() => void setReportStatus(r.id, "resolved")}
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          className={cn(BUTTON_SECONDARY, "py-1 text-xs")}
                          disabled={busyId === r.id}
                          onClick={() => void setReportStatus(r.id, "dismissed")}
                        >
                          Dismiss
                        </button>
                        {r.targetMessageId ? (
                          <button
                            type="button"
                            className={cn(BUTTON_PRIMARY, "py-1 text-xs")}
                            disabled={busyId === r.targetMessageId}
                            onClick={() => void hideMessage(r.targetMessageId!)}
                          >
                            Hide message
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <h3 className="mt-6 text-xs font-bold uppercase tracking-wide text-[var(--ud-text-muted)]">Mute / ban</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-[var(--ud-text-muted)]">
          Room <strong>moderators</strong> can mute someone. Only room owners, room admins, or hub admins can ban. Your own
          account is not listed. Choose someone from the menu below.
        </p>
        <ComposerMenuSelect
          className="mt-2 w-full"
          disabled={membersFetchInFlight && moderatableMembers.length === 0}
          value={modUserId}
          onChange={(v) => setModUserId(v)}
          options={modMemberSelectOptions}
          placeholder="Select a member…"
          menuMinWidthPx={280}
          aria-label="Member to moderate"
        />
        {moderatableMembers.length > 0 ? (
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-2">
            {moderatableMembers.slice(0, 12).map((m) => {
              const n = m.displayName?.trim() || "Member";
              const ini = initials(n);
              return (
                <li key={m.userId} className="flex items-center gap-2 text-xs text-[var(--ud-text-secondary)]">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={normalizePublicSrc(m.avatarUrl)} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ud-brand-light)] text-[10px] font-bold text-[var(--ud-brand-primary)]">
                      {ini}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--ud-text-primary)]">{n}</span>
                  <span className="shrink-0 text-[var(--ud-text-muted)]">{m.role}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={cn(BUTTON_SECONDARY, "text-xs")} disabled={!!busyId} onClick={() => void muteUser()}>
            Mute
          </button>
          <button
            type="button"
            className={cn(BUTTON_PRIMARY, "bg-[var(--ud-danger)] text-xs text-white hover:opacity-90")}
            disabled={!!busyId}
            onClick={() => void banUser()}
          >
            Ban from room
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" className={BUTTON_SECONDARY} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
