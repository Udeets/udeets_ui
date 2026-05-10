"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  chatApiCompleteUpload,
  chatApiCreatePoll,
  chatApiCreateReport,
  chatApiCreateRoom,
  chatApiDeleteMessage,
  chatApiInviteCandidates,
  chatApiInviteMember,
  chatApiListMembers,
  chatApiListRooms,
  chatApiPatchMessage,
  chatApiPrepareUpload,
  chatApiRemoveMember,
  chatApiSendMessage,
  chatApiTyping,
  chatUploadToSignedUrl,
} from "@/lib/chat/chat-browser-api";
import { chatApiRevokeInvite } from "@/lib/chat/chat-api-invite-revoke";
import { friendlyChatUserMessage } from "@/lib/chat/friendly-chat-error";
import type { ChatInviteCandidateDto, ChatRoomListItem, ChatRoomMemberDto } from "@/lib/chat/chat-browser-api";
import type { ChatRealtimeServerEvent } from "@/lib/services/chat/chat-realtime-contract";
import type { ChatRoomDetail } from "@/lib/services/chat/get-chat-room";
import { COMPOSER_INPUT, COMPOSER_TOGGLE, COMPOSER_TOGGLE_KNOB } from "../deets/composer/composerFieldClasses";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_CLASS, cn, initials, normalizePublicSrc } from "../hubUtils";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageRow } from "./ChatMessageRow";
import { ChatModerationPanel } from "./ChatModerationPanel";
import { ChatRoomSettingsModal } from "./ChatRoomSettingsModal";
import { useHubChatThread } from "./useHubChatThread";

type HubChatSectionProps = {
  hubId: string;
  currentUserId: string | undefined;
  /** Hub creator or hub admin — can create rooms; member actions still enforced by API. */
  hubStaff: boolean;
  /** Shown on optimistic outbound messages. */
  viewerDisplayName?: string;
};

export function HubChatSection({ hubId, currentUserId, hubStaff, viewerDisplayName }: HubChatSectionProps) {
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteBusyUserId, setInviteBusyUserId] = useState<string | null>(null);
  const [revokeBusyUserId, setRevokeBusyUserId] = useState<string | null>(null);
  /** Rows successfully invited this session (until modal closes or room changes). */
  const [inviteSentUserIds, setInviteSentUserIds] = useState<Record<string, true>>({});

  const [hubPickerCandidates, setHubPickerCandidates] = useState<ChatInviteCandidateDto[]>([]);
  const [hubPickerLoading, setHubPickerLoading] = useState(false);
  const [hubPickerQuery, setHubPickerQuery] = useState("");

  const [liveReportBanner, setLiveReportBanner] = useState<{ reportId: string; reason: string | null } | null>(null);
  const viewerCanModerateRef = useRef(false);

  const [members, setMembers] = useState<ChatRoomMemberDto[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollAnonymous, setPollAnonymous] = useState(false);
  const [pollDeadlineEnabled, setPollDeadlineEnabled] = useState(false);
  const [pollDeadlineInput, setPollDeadlineInput] = useState("");
  const [pollBusy, setPollBusy] = useState(false);

  const resetPollForm = useCallback(() => {
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollAllowMultiple(false);
    setPollAnonymous(false);
    setPollDeadlineEnabled(false);
    setPollDeadlineInput("");
  }, []);

  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Image/file chosen in composer; user adds optional caption then Send (WhatsApp-style). */
  const [pendingAttach, setPendingAttach] = useState<{ file: File; previewUrl: string } | null>(null);

  const [roomSettingsOpen, setRoomSettingsOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const thread = useHubChatThread(selectedRoomId, currentUserId ?? null, viewerDisplayName ?? null, {
    onRealtimeEvent: useCallback((ev: ChatRealtimeServerEvent) => {
      if (ev.name !== "report.created") return;
      if (!viewerCanModerateRef.current) return;
      setLiveReportBanner({ reportId: ev.payload.reportId, reason: ev.payload.reason });
    }, []),
  });

  viewerCanModerateRef.current = Boolean(thread.room?.viewerCanModerate);

  useEffect(() => {
    setLiveReportBanner(null);
    setInviteSentUserIds({});
    setRevokeBusyUserId(null);
  }, [selectedRoomId]);

  const loadHubPickerCandidates = useCallback(async () => {
    if (!selectedRoomId || !hubStaff) return;
    setHubPickerLoading(true);
    try {
      const { candidates } = await chatApiInviteCandidates(selectedRoomId);
      setHubPickerCandidates(candidates);
    } catch {
      setHubPickerCandidates([]);
    } finally {
      setHubPickerLoading(false);
    }
  }, [selectedRoomId, hubStaff]);

  useEffect(() => {
    if (inviteOpen && hubStaff && selectedRoomId) {
      void loadHubPickerCandidates();
      setHubPickerQuery("");
      setInviteSentUserIds({});
      setRevokeBusyUserId(null);
    }
  }, [inviteOpen, hubStaff, selectedRoomId, loadHubPickerCandidates]);

  const loadRooms = useCallback(async (): Promise<ChatRoomListItem[]> => {
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      const { rooms: r } = await chatApiListRooms(hubId);
      setRooms(r);
      return r;
    } catch (e) {
      setRoomsError(friendlyChatUserMessage(e, "Chat could not be loaded. Please try again."));
      return [];
    } finally {
      setRoomsLoading(false);
    }
  }, [hubId]);

  useEffect(() => {
    void loadRooms();
  }, [hubId, loadRooms]);

  const activeRooms = useMemo(() => rooms.filter((r) => !r.archivedAt), [rooms]);
  const archivedRooms = useMemo(() => rooms.filter((r) => r.archivedAt), [rooms]);

  useEffect(() => {
    if (roomsLoading) return;
    if (rooms.length === 0) {
      setSelectedRoomId(null);
      return;
    }
    const active = rooms.filter((r) => !r.archivedAt);
    if (!selectedRoomId) {
      setSelectedRoomId(active[0]?.id ?? rooms[0]!.id);
      return;
    }
    if (!rooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(active[0]?.id ?? rooms[0]?.id ?? null);
    }
  }, [roomsLoading, rooms, selectedRoomId]);

  const loadMembers = useCallback(async () => {
    if (!selectedRoomId || !hubStaff) return;
    setMembersLoading(true);
    try {
      const { members: m } = await chatApiListMembers(selectedRoomId);
      setMembers(m);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [selectedRoomId, hubStaff]);

  useEffect(() => {
    if (membersOpen) void loadMembers();
  }, [membersOpen, loadMembers]);

  const handleTypingPhase = useCallback(
    async (phase: "started" | "stopped") => {
      if (!selectedRoomId) return;
      try {
        await chatApiTyping(selectedRoomId, phase);
      } catch {
        /* optional rate limit */
      }
    },
    [selectedRoomId],
  );

  const openReport = (messageId: string) => {
    setReportMessageId(messageId);
    setReportDetails("");
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!selectedRoomId || !reportMessageId) return;
    const reason = reportDetails.trim();
    if (!reason) {
      thread.setError("Please add a short reason for this report.");
      return;
    }
    setReportBusy(true);
    try {
      await chatApiCreateReport(selectedRoomId, {
        targetMessageId: reportMessageId,
        reason,
        reasonCode: "user_report",
      });
      setReportOpen(false);
    } catch (e) {
      thread.setError(friendlyChatUserMessage(e, "Could not submit report. Please try again."));
    } finally {
      setReportBusy(false);
    }
  };

  const createRoom = async () => {
    const n = createName.trim();
    if (!n) return;
    setCreateBusy(true);
    try {
      const { roomId } = await chatApiCreateRoom({ hubId, name: n, description: null });
      setCreateOpen(false);
      setCreateName("");
      await loadRooms();
      setSelectedRoomId(roomId);
    } catch (e) {
      setRoomsError(friendlyChatUserMessage(e, "Could not create room. Please try again."));
    } finally {
      setCreateBusy(false);
    }
  };

  const chronological = [...thread.messages].reverse();

  const hubPickerNotInRoomTargets = useMemo(() => {
    const q = hubPickerQuery.trim().toLowerCase();
    return hubPickerCandidates
      .filter((c) => !c.inRoom)
      .filter((c) => !q || c.displayName.toLowerCase().includes(q) || c.userId.toLowerCase().includes(q));
  }, [hubPickerCandidates, hubPickerQuery]);

  const clearPendingAttach = useCallback(() => {
    setPendingAttach((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      setPendingAttach((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
    };
  }, []);

  const handleAttachmentUpload = async (file: File, caption: string) => {
    if (!selectedRoomId || uploadBusy) return;
    setUploadBusy(true);
    thread.setSendingBusy(true);
    setUploadPct(0);
    thread.setError(null);
    try {
      const { messageId } = await chatApiSendMessage(selectedRoomId, {
        body: caption.trim(),
        messageKind: "attachment",
        replyToId: null,
      });
      const prep = await chatApiPrepareUpload(selectedRoomId, messageId, {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      await chatUploadToSignedUrl(prep.signedUploadUrl, file, file.type || "application/octet-stream", (p) =>
        setUploadPct(Math.round(p * 100)),
      );
      await chatApiCompleteUpload(selectedRoomId, messageId, {
        storageKey: prep.storageKey,
        mimeType: file.type || "application/octet-stream",
        originalFilename: file.name,
        sizeBytes: file.size,
      });
      await thread.reloadMessages();
    } catch (e) {
      thread.setError(friendlyChatUserMessage(e, "Upload failed. Please try again."));
    } finally {
      setUploadBusy(false);
      thread.setSendingBusy(false);
      setUploadPct(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const createPoll = async () => {
    if (!selectedRoomId) return;
    const opts = pollOptions.map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2) {
      thread.setError("Add at least two answer choices.");
      return;
    }
    let closesAt: string | null = null;
    if (pollDeadlineEnabled && pollDeadlineInput.trim()) {
      const ms = new Date(pollDeadlineInput).getTime();
      if (Number.isNaN(ms)) {
        thread.setError("Enter a valid close date and time.");
        return;
      }
      closesAt = new Date(ms).toISOString();
    }
    setPollBusy(true);
    thread.setSendingBusy(true);
    try {
      await chatApiCreatePoll(selectedRoomId, {
        question: pollQuestion.trim(),
        options: opts,
        allowMultiple: pollAllowMultiple,
        anonymousVoting: pollAnonymous,
        closesAt,
        messageBody: "",
      });
      setPollOpen(false);
      resetPollForm();
      await thread.reloadMessages();
    } catch (e) {
      thread.setError(friendlyChatUserMessage(e, "Could not create poll. Please try again."));
    } finally {
      setPollBusy(false);
      thread.setSendingBusy(false);
    }
  };

  const openEditMessage = (messageId: string, body: string) => {
    setEditMessageId(messageId);
    setEditBody(body);
    setEditOpen(true);
  };

  const saveEditMessage = async () => {
    if (!selectedRoomId || !editMessageId) return;
    const b = editBody.trim();
    if (!b) return;
    setEditBusy(true);
    try {
      await chatApiPatchMessage(selectedRoomId, editMessageId, { body: b });
      setEditOpen(false);
      setEditMessageId(null);
    } catch (e) {
      thread.setError(friendlyChatUserMessage(e, "Could not save edit. Please try again."));
    } finally {
      setEditBusy(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!selectedRoomId) return;
    if (!confirm("Delete this message for everyone in this room?")) return;
    try {
      await chatApiDeleteMessage(selectedRoomId, messageId);
      thread.softDeleteMessageLocally(messageId);
    } catch (e) {
      thread.setError(friendlyChatUserMessage(e, "Could not delete message. Please try again."));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div
        className={cn(
          CARD,
          "flex min-h-[420px] flex-col overflow-hidden border border-[var(--ud-border-subtle)] p-0 shadow-sm lg:min-h-[min(70vh,700px)] lg:rounded-xl",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[minmax(220px,280px)_1fr] lg:items-stretch">
        {/* Mobile sidebar toggle */}
        <div className="flex items-center justify-between border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-3 py-2 lg:hidden">
          <button
            type="button"
            className={cn(BUTTON_SECONDARY, "py-1.5 text-xs")}
            onClick={() => setMobileSidebarOpen(true)}
            aria-expanded={mobileSidebarOpen}
          >
            Rooms
          </button>
          <span className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">
            {rooms.find((r) => r.id === selectedRoomId)?.name ?? "Chat"}
          </span>
          <span className="w-16" />
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            "flex min-h-0 flex-col border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] lg:border-r lg:py-2",
            mobileSidebarOpen ? "fixed inset-0 z-40 p-4 lg:static lg:inset-auto lg:flex lg:p-0" : "hidden lg:flex",
          )}
        >
          <div className="mb-2 flex shrink-0 items-center justify-between px-2 lg:px-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--ud-text-muted)]">Rooms</h2>
            <button type="button" className="rounded-lg p-1 text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)] lg:hidden" onClick={() => setMobileSidebarOpen(false)} aria-label="Close room list">
              <X className="h-5 w-5" />
            </button>
          </div>
          {roomsLoading ? (
            <div
              className="flex min-h-[12rem] flex-1 flex-col items-center justify-center gap-2 px-3 py-8 text-sm text-[var(--ud-text-muted)]"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
              <span>Loading…</span>
            </div>
          ) : roomsError ? (
            <div className="px-3 py-2 text-sm text-[var(--ud-danger)]">{roomsError}</div>
          ) : rooms.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[var(--ud-text-secondary)]">
              <p>No chat rooms yet.</p>
              {hubStaff ? (
                <button type="button" className={cn(BUTTON_PRIMARY, "mt-3")} onClick={() => setCreateOpen(true)}>
                  Create room
                </button>
              ) : (
                <p className="mt-2 text-xs">Ask a hub admin to create one.</p>
              )}
            </div>
          ) : (
            <ul className="max-h-[50vh] min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1 lg:max-h-none" role="listbox" aria-label="Chat rooms">
              {activeRooms.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedRoomId === r.id}
                    onClick={() => {
                      setSelectedRoomId(r.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                      selectedRoomId === r.id
                        ? "bg-[var(--ud-brand-light)] font-medium text-[var(--ud-brand-primary)]"
                        : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]",
                    )}
                  >
                    <MessageSquarePlus className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    <span className="truncate">{r.name}</span>
                  </button>
                </li>
              ))}
              {hubStaff && archivedRooms.length > 0 ? (
                <>
                  <li className="px-3 pt-3 pb-0.5" aria-hidden>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--ud-text-muted)]">Archived</span>
                  </li>
                  {archivedRooms.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedRoomId === r.id}
                        onClick={() => {
                          setSelectedRoomId(r.id);
                          setMobileSidebarOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                          selectedRoomId === r.id
                            ? "bg-[var(--ud-brand-light)] font-medium text-[var(--ud-brand-primary)]"
                            : "text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]",
                        )}
                      >
                        <MessageSquarePlus className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                        <span className="truncate">{r.name}</span>
                        <span className="shrink-0 text-[10px] uppercase text-[var(--ud-text-muted)]">Archived</span>
                      </button>
                    </li>
                  ))}
                </>
              ) : null}
            </ul>
          )}
          {hubStaff ? (
            <div className="mt-auto shrink-0 border-t border-[var(--ud-border-subtle)] p-2">
              <button type="button" className={cn(BUTTON_SECONDARY, "w-full justify-center py-2 text-xs")} onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                New room
              </button>
            </div>
          ) : null}
        </aside>

        {/* Main thread */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--ud-bg-card)]">
          {selectedRoomId ? (
            <>
              <div className="flex flex-col gap-2 border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <h3 className="min-w-0 text-sm font-semibold leading-tight text-[var(--ud-text-primary)] sm:flex-1 sm:truncate">
                  {thread.room?.name ?? rooms.find((r) => r.id === selectedRoomId)?.name ?? "Chat"}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                {hubStaff ? (
                  <>
                    <button
                      type="button"
                      className={cn(BUTTON_SECONDARY, "py-1.5 text-xs")}
                      onClick={() => {
                        resetPollForm();
                        setPollOpen(true);
                      }}
                      aria-label="Create poll"
                    >
                      <BarChart3 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      Poll
                    </button>
                    <button type="button" className={cn(BUTTON_SECONDARY, "py-1.5 text-xs")} onClick={() => setMembersOpen(true)}>
                      <Users className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      Members
                    </button>
                    <button type="button" className={cn(BUTTON_SECONDARY, "py-1.5 text-xs")} onClick={() => setInviteOpen(true)}>
                      Invite
                    </button>
                  </>
                ) : null}
                {currentUserId ? (
                  <>
                    <button
                      type="button"
                      className={cn(BUTTON_SECONDARY, "py-1.5 text-xs", !thread.room ? "pointer-events-none opacity-50" : "")}
                      disabled={!thread.room}
                      onClick={() => setRoomSettingsOpen(true)}
                    >
                      Room settings
                    </button>
                    <button type="button" className={cn(BUTTON_SECONDARY, "py-1.5 text-xs")} onClick={() => setModOpen(true)}>
                      Moderation
                    </button>
                  </>
                ) : null}
                </div>
              </div>

              {liveReportBanner && thread.room?.viewerCanModerate ? (
                <div
                  className="flex flex-wrap items-start gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50"
                  role="status"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">New message report</p>
                    <p className="mt-0.5 text-xs text-amber-900/90 dark:text-amber-100/90">
                      {liveReportBanner.reason?.trim()
                        ? `Reason: ${liveReportBanner.reason.trim()}`
                        : "A member reported a message. Open Moderation to review it and choose what to do next."}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <button
                      type="button"
                      className={cn(BUTTON_PRIMARY, "py-1.5 text-xs")}
                      onClick={() => {
                        setModOpen(true);
                        setLiveReportBanner(null);
                      }}
                    >
                      Review reports
                    </button>
                    <button type="button" className={cn(BUTTON_SECONDARY, "py-1.5 text-xs")} onClick={() => setLiveReportBanner(null)}>
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}

              {uploadPct != null ? (
                <div className="border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-3 py-2 text-xs text-[var(--ud-text-secondary)]">
                  Uploading… {uploadPct}%
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--ud-border)]">
                    <div className="h-full bg-[var(--ud-brand-primary)] transition-all" style={{ width: `${uploadPct}%` }} />
                  </div>
                </div>
              ) : null}

              {thread.error ? (
                <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
                  {thread.error}
                  <button type="button" className="ml-2 font-semibold underline" onClick={() => thread.setError(null)}>
                    Dismiss
                  </button>
                </div>
              ) : null}

              <div
                className="min-h-0 flex-1 overflow-y-auto px-2 sm:px-3"
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
              >
                {thread.loading ? (
                  <div className="flex justify-center py-12 text-[var(--ud-text-muted)]">
                    <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading messages" />
                  </div>
                ) : chronological.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--ud-text-secondary)]">No messages yet. Say hello!</div>
                ) : (
                  <>
                    {chronological.map((m) => (
                      <ChatMessageRow
                        key={m.clientLocalId ?? m.id}
                        roomId={selectedRoomId}
                        message={m}
                        currentUserId={currentUserId}
                        pollTick={thread.pollTick}
                        onReport={openReport}
                        onRetrySend={(id) => void thread.retrySend(id)}
                        onEdit={openEditMessage}
                        onDelete={(id) => void deleteMessage(id)}
                        onDiscardOutbound={(id) => thread.discardOutbound(id)}
                        onReactionRemoved={(mid, rid, fb) => thread.removeReactionLocally(mid, rid, fb)}
                      />
                    ))}
                    {thread.nextCursor ? (
                      <div className="py-3 text-center">
                        <button
                          type="button"
                          className={cn(BUTTON_SECONDARY, "text-xs")}
                          disabled={thread.loadingMore}
                          onClick={() => void thread.loadMore()}
                        >
                          {thread.loadingMore ? "Loading…" : "Load older messages"}
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {thread.typingUserIds.length > 0 ? (
                <div className="border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-3 py-1.5 text-xs text-[var(--ud-text-muted)]">
                  {thread.typingUserIds.length === 1
                    ? "Someone is typing…"
                    : `${thread.typingUserIds.length} people are typing…`}
                </div>
              ) : null}
              <ChatComposer
                sending={thread.sending}
                muted={thread.room?.viewerMuted}
                banned={thread.room?.viewerBanned}
                disabled={!selectedRoomId}
                pendingAttachment={pendingAttach}
                onClearPendingAttachment={clearPendingAttach}
                onSend={async (t) => {
                  if (pendingAttach) {
                    const { file, previewUrl } = pendingAttach;
                    setPendingAttach(null);
                    URL.revokeObjectURL(previewUrl);
                    await handleAttachmentUpload(file, t);
                    return;
                  }
                  await thread.sendText(t);
                }}
                onTypingPhase={handleTypingPhase}
                attachControl={
                  <label
                    className={cn(
                      BUTTON_SECONDARY,
                      "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center gap-1.5 px-3",
                      uploadBusy || thread.room?.viewerBanned || thread.room?.viewerMuted
                        ? "pointer-events-none opacity-50"
                        : "",
                    )}
                    title="Attach a file"
                  >
                    <Paperclip className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="sr-only">Attach file</span>
                    <input
                      ref={fileRef}
                      type="file"
                      className="sr-only"
                      disabled={uploadBusy || thread.room?.viewerBanned || thread.room?.viewerMuted}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setPendingAttach((prev) => {
                          if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
                          return { file: f, previewUrl: URL.createObjectURL(f) };
                        });
                        e.target.value = "";
                      }}
                    />
                  </label>
                }
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-[var(--ud-text-secondary)]">
              <p>Select a room to start chatting.</p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Create room modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="chat-create-title">
          <div className={cn(CARD, "w-full max-w-md p-5 shadow-xl")}>
            <h2 id="chat-create-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
              New chat room
            </h2>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Name</label>
            <input className={cn(INPUT_CLASS, "mt-1")} value={createName} onChange={(e) => setCreateName(e.target.value)} maxLength={200} />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={BUTTON_SECONDARY} onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="button" className={BUTTON_PRIMARY} disabled={createBusy || !createName.trim()} onClick={() => void createRoom()}>
                {createBusy ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Report modal */}
      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="chat-report-title">
          <div className={cn(CARD, "w-full max-w-md p-5 shadow-xl")}>
            <h2 id="chat-report-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
              Report message
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
              Moderators and hub admins will see this. Briefly describe what is wrong, for example harassment, spam, or a
              safety concern. Someone will look into it; reporting does not automatically remove the message.
            </p>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">
              What happened? (required, up to 500 characters)
            </label>
            <textarea
              className={cn(INPUT_CLASS, "mt-1 min-h-[100px]")}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              maxLength={500}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={BUTTON_SECONDARY} onClick={() => setReportOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={BUTTON_PRIMARY}
                disabled={reportBusy || !reportDetails.trim()}
                onClick={() => void submitReport()}
              >
                {reportBusy ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Room members modal */}
      {membersOpen && hubStaff ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="chat-members-title">
          <div className={cn(CARD, "max-h-[85vh] w-full max-w-md overflow-y-auto p-5 shadow-xl")}>
            <h2 id="chat-members-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
              Room members
            </h2>
            <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">People in this chat room right now. You can remove someone if they should no longer have access.</p>
            <div className="mt-3 max-h-[55vh] space-y-1 overflow-y-auto">
              {membersLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-[var(--ud-text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading members…
                </div>
              ) : members.length === 0 ? (
                <p className="py-6 text-sm text-[var(--ud-text-secondary)]">No members to show yet.</p>
              ) : (
                <ul className="space-y-1">
                  {members.map((m) => {
                    const label = m.displayName?.trim() || "Member";
                    const ini = initials(label);
                    return (
                      <li key={m.userId} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/40 px-2.5 py-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          {m.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={normalizePublicSrc(m.avatarUrl)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]">
                              {ini}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--ud-text-primary)]">{label}</p>
                            <p className="text-[11px] capitalize text-[var(--ud-text-muted)]">{m.role}</p>
                          </div>
                        </div>
                        {m.userId !== currentUserId ? (
                          <button
                            type="button"
                            className="shrink-0 text-xs font-medium text-[var(--ud-danger)] hover:underline"
                            onClick={async () => {
                              if (!selectedRoomId) return;
                              if (!confirm("Remove this member from the room?")) return;
                              try {
                                await chatApiRemoveMember(selectedRoomId, m.userId);
                                await loadMembers();
                              } catch (e) {
                                thread.setError(friendlyChatUserMessage(e, "Could not remove member. Please try again."));
                              }
                            }}
                          >
                            Remove
                          </button>
                        ) : (
                          <span className="shrink-0 text-xs text-[var(--ud-text-muted)]">You</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" className={BUTTON_SECONDARY} onClick={() => setMembersOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="chat-invite-title">
          <div className={cn(CARD, "max-h-[85vh] w-full max-w-md overflow-y-auto p-5 shadow-xl")}>
            <h2 id="chat-invite-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
              Invite from hub
            </h2>
            <p className="mt-1 text-sm text-[var(--ud-text-secondary)]">
              Pick someone from this hub who is not in the room yet. They will get an invite to join.
            </p>
            <input
              className={cn(INPUT_CLASS, "mt-3")}
              placeholder="Search by name…"
              value={hubPickerQuery}
              onChange={(e) => setHubPickerQuery(e.target.value)}
              aria-label="Filter hub members"
            />
            <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto">
              {hubPickerLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-[var(--ud-text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading hub members…
                </div>
              ) : hubPickerNotInRoomTargets.length === 0 ? (
                <p className="py-4 text-sm text-[var(--ud-text-secondary)]">
                  {hubPickerCandidates.filter((c) => !c.inRoom).length === 0
                    ? "Everyone from this hub is already here, or you do not have permission to invite people."
                    : "No one matches that search. Try a different name."}
                </p>
              ) : (
                hubPickerNotInRoomTargets.map((c) => {
                  const ini = initials(c.displayName);
                  return (
                    <div
                      key={c.userId}
                      className="flex items-center gap-3 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/40 p-2.5"
                    >
                      {c.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={normalizePublicSrc(c.avatarUrl)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ud-brand-light)] text-xs font-bold text-[var(--ud-brand-primary)]">
                          {ini}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--ud-text-primary)]">{c.displayName}</p>
                        <p className="text-[11px] capitalize text-[var(--ud-text-muted)]">
                          Hub · {c.hubRole.replace(/_/g, " ")}
                        </p>
                      </div>
                      {inviteSentUserIds[c.userId] || c.pendingInvite ? (
                        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                          {inviteSentUserIds[c.userId] ? (
                            <span
                              className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                              role="status"
                            >
                              Invite sent
                            </span>
                          ) : (
                            <span
                              className="shrink-0 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--ud-text-secondary)]"
                              role="status"
                            >
                              Invite pending
                            </span>
                          )}
                          <button
                            type="button"
                            className={cn(BUTTON_SECONDARY, "shrink-0 py-1.5 text-xs")}
                            disabled={inviteBusyUserId !== null || revokeBusyUserId !== null}
                            onClick={async () => {
                              if (!selectedRoomId) return;
                              setRevokeBusyUserId(c.userId);
                              try {
                                await chatApiRevokeInvite(selectedRoomId, c.userId);
                                setInviteSentUserIds((prev) => {
                                  const next = { ...prev };
                                  delete next[c.userId];
                                  return next;
                                });
                                await loadHubPickerCandidates();
                              } catch (e) {
                                thread.setError(
                                  friendlyChatUserMessage(e, "Could not unsend invite. Please try again."),
                                );
                              } finally {
                                setRevokeBusyUserId(null);
                              }
                            }}
                          >
                            {revokeBusyUserId === c.userId ? "Unsending…" : "Unsend invite"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={cn(BUTTON_PRIMARY, "shrink-0 py-1.5 text-xs")}
                          disabled={inviteBusyUserId !== null || revokeBusyUserId !== null}
                          onClick={async () => {
                            if (!selectedRoomId) return;
                            setInviteBusyUserId(c.userId);
                            try {
                              await chatApiInviteMember(selectedRoomId, c.userId);
                              setInviteSentUserIds((prev) => ({ ...prev, [c.userId]: true }));
                              await loadHubPickerCandidates();
                              await loadMembers();
                            } catch (e) {
                              thread.setError(friendlyChatUserMessage(e, "Invite could not be sent. Please try again."));
                            } finally {
                              setInviteBusyUserId(null);
                            }
                          }}
                        >
                          {inviteBusyUserId === c.userId ? "Sending…" : "Invite"}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" className={BUTTON_SECONDARY} onClick={() => setInviteOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedRoomId ? (
        <ChatRoomSettingsModal
          open={roomSettingsOpen}
          roomId={selectedRoomId}
          room={thread.room}
          onClose={() => setRoomSettingsOpen(false)}
          onSaved={async (next: ChatRoomDetail) => {
            void thread.reloadRoom();
            const r = await loadRooms();
            if (next.archivedAt) {
              const pick = r.find((x) => !x.archivedAt) ?? r[0] ?? null;
              if (pick) setSelectedRoomId(pick.id);
            }
          }}
          onDeleted={async () => {
            await loadRooms();
          }}
          onError={(msg) =>
            thread.setError(friendlyChatUserMessage(new Error(msg), "Could not update room settings. Please try again."))
          }
        />
      ) : null}
      {selectedRoomId ? (
        <ChatModerationPanel
          open={modOpen}
          roomId={selectedRoomId}
          viewerUserId={currentUserId ?? null}
          onClose={() => setModOpen(false)}
          onError={(msg) => thread.setError(friendlyChatUserMessage(new Error(msg), "That action could not be completed. Please try again."))}
          onModerationDone={() => void thread.reloadMessages()}
        />
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="chat-edit-title">
          <div className={cn(CARD, "w-full max-w-md p-5 shadow-xl")}>
            <h2 id="chat-edit-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
              Edit message
            </h2>
            <textarea className={cn(INPUT_CLASS, "mt-3 min-h-[120px]")} value={editBody} onChange={(e) => setEditBody(e.target.value)} maxLength={8000} />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={BUTTON_SECONDARY}
                onClick={() => {
                  setEditOpen(false);
                  setEditMessageId(null);
                }}
              >
                Cancel
              </button>
              <button type="button" className={BUTTON_PRIMARY} disabled={editBusy || !editBody.trim()} onClick={() => void saveEditMessage()}>
                {editBusy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Poll modal */}
      {pollOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="chat-poll-title">
          <div className={cn(CARD, "max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto p-5 shadow-xl")}>
            <h2 id="chat-poll-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
              New poll
            </h2>
            <p className="mt-1 text-sm text-[var(--ud-text-muted)]">Same layout as a hub post poll — question, choices, and optional voting rules.</p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Question</label>
            <input
              className={cn(INPUT_CLASS, "mt-1")}
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              maxLength={500}
              placeholder="What do you want to ask?"
            />

            <p className="mt-4 text-sm text-[var(--ud-text-muted)]">Answer choices</p>
            <div className="mt-2 space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] text-xs font-semibold text-[var(--ud-text-muted)]">
                    {i + 1}
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => setPollOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                    placeholder="Option"
                    maxLength={200}
                    className={cn(COMPOSER_INPUT, "flex-1")}
                  />
                  {pollOptions.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-full p-1.5 text-[var(--ud-text-muted)] hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                      aria-label={`Remove option ${i + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : null}
                </div>
              ))}
              {pollOptions.length < 12 ? (
                <button
                  type="button"
                  onClick={() => setPollOptions((prev) => [...prev, ""])}
                  className="inline-flex items-center gap-1.5 pl-8 text-sm font-medium text-[var(--ud-brand-primary)]"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add option
                </button>
              ) : null}
            </div>

            <details
              className={cn(
                "group mt-4 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/40 px-3 py-2 transition-shadow duration-200 open:shadow-sm",
              )}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 text-sm font-semibold tracking-tight text-[var(--ud-text-primary)] [&::-webkit-details-marker]:hidden">
                <span>Advanced poll options</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ud-text-muted)] transition-transform duration-200 group-open:rotate-180" aria-hidden />
              </summary>
              <div className="mt-3 space-y-4 border-t border-[var(--ud-border-subtle)] pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--ud-text-primary)]">Allow multi-select</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pollAllowMultiple}
                    onClick={() => setPollAllowMultiple((v) => !v)}
                    className={cn(COMPOSER_TOGGLE, pollAllowMultiple ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300")}
                  >
                    <span className={cn(COMPOSER_TOGGLE_KNOB, pollAllowMultiple ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--ud-text-primary)]">Secret voting</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pollAnonymous}
                    onClick={() => setPollAnonymous((v) => !v)}
                    className={cn(COMPOSER_TOGGLE, pollAnonymous ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300")}
                  >
                    <span className={cn(COMPOSER_TOGGLE_KNOB, pollAnonymous ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                </div>
                <div className="rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]/80 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[var(--ud-text-primary)]">Poll closes</span>
                      <p className="mt-0.5 text-xs text-[var(--ud-text-muted)]">Optional — stop accepting votes at a date and time.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pollDeadlineEnabled}
                      onClick={() => setPollDeadlineEnabled((v) => !v)}
                      className={cn(
                        COMPOSER_TOGGLE,
                        "shrink-0 self-end sm:self-center",
                        pollDeadlineEnabled ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300",
                      )}
                    >
                      <span className={cn(COMPOSER_TOGGLE_KNOB, pollDeadlineEnabled ? "translate-x-4" : "translate-x-0.5")} />
                    </button>
                  </div>
                  {pollDeadlineEnabled ? (
                    <input
                      type="datetime-local"
                      value={pollDeadlineInput}
                      onChange={(e) => setPollDeadlineInput(e.target.value)}
                      className={cn(COMPOSER_INPUT, "mt-3 w-full sm:max-w-xs")}
                    />
                  ) : null}
                </div>
              </div>
            </details>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={BUTTON_SECONDARY}
                onClick={() => {
                  setPollOpen(false);
                  resetPollForm();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={BUTTON_PRIMARY}
                disabled={pollBusy || !pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
                onClick={() => void createPoll()}
              >
                {pollBusy ? "Creating…" : "Post poll"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
