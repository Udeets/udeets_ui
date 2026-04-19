"use client";

import type { ChangeEvent, FormEvent } from "react";
import { startTransition, useEffect, useRef, useState } from "react";
import { createDeet } from "@/lib/services/deets/create-deet";
import { updateDeet } from "@/lib/services/deets/update-deet";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import type { HubFeedItem } from "@/lib/hub-content";
import { createEvent } from "@/lib/services/events/create-event";
import { uploadDeetMedia } from "@/lib/services/deets/upload-deet-media";
import type { AttachedDeetItem, ComposerChildFlow, DeetFormattingState, DeetSettingsState } from "../components/deets/deetTypes";

const INITIAL_DEET_FORMATTING: DeetFormattingState = {
  fontSize: "small",
  bold: false,
  italic: false,
  underline: false,
  textColor: "#111111",
};

const INITIAL_DEET_SETTINGS: DeetSettingsState = {
  noticeEnabled: false,
  commentsEnabled: true,
  postType: "post",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image preview could not be created."));
    };
    reader.onerror = () => reject(new Error("Image preview could not be created."));
    reader.readAsDataURL(file);
  });
}

type UseDeetComposerArgs = {
  hubId: string;
  hubSlug: string;
  demoComposerText: string;
  isCreatorAdmin: boolean;
  authorName: string;
  authorAvatarSrc?: string;
  userId: string | null;
  onDeetCreated: (deet: DeetRecord) => void;
  onDeetUpdated?: (deet: DeetRecord) => void;
};

export function useDeetComposer({
  hubId,
  hubSlug,
  demoComposerText,
  isCreatorAdmin,
  authorName,
  authorAvatarSrc,
  userId,
  onDeetCreated,
  onDeetUpdated,
}: UseDeetComposerArgs) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeComposerChild, setActiveComposerChild] = useState<ComposerChildFlow | null>(null);
  const [editingDeetId, setEditingDeetId] = useState<string | null>(null);
  const [attachedDeetItems, setAttachedDeetItems] = useState<AttachedDeetItem[]>([]);
  const [selectedPhotoPreviews, setSelectedPhotoPreviews] = useState<string[]>([]);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const [selectedDocFiles, setSelectedDocFiles] = useState<File[]>([]);
  const [modalDraftText, setModalDraftText] = useState("");
  const [isSubmittingDeet, setIsSubmittingDeet] = useState(false);
  const [deetFormatting, setDeetFormatting] = useState<DeetFormattingState>(INITIAL_DEET_FORMATTING);
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = useState(false);
  const [deetSettings, setDeetSettings] = useState<DeetSettingsState>(INITIAL_DEET_SETTINGS);
  const deetPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const deetFileInputRef = useRef<HTMLInputElement | null>(null);

  const isComposerDirty =
    modalDraftText.trim().length > 0 ||
    attachedDeetItems.length > 0 ||
    selectedPhotoPreviews.length > 0 ||
    selectedDocFiles.length > 0 ||
    deetSettings.noticeEnabled ||
    !deetSettings.commentsEnabled ||
    deetSettings.postType !== "post";

  useEffect(() => {
    if (!composerOpen) return;
    // When opened for an edit, we leave state alone — the startEditingDeet
    // caller has already populated it. Only reset when opening for a new deet.
    if (editingDeetId) return;

    setModalDraftText(demoComposerText);
    setDeetFormatting(INITIAL_DEET_FORMATTING);
    setIsFontSizeMenuOpen(false);
    setAttachedDeetItems([]);
    setSelectedPhotoPreviews([]);
    setSelectedPhotoFiles([]);
    setSelectedDocFiles([]);
    setDeetSettings(INITIAL_DEET_SETTINGS);
  }, [composerOpen, demoComposerText, editingDeetId]);

  useEffect(() => {
    if (!composerOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isSubmittingDeet) return;
      if (activeComposerChild && activeComposerChild !== "quit_confirm") {
        setActiveComposerChild(null);
        return;
      }
      if (isComposerDirty) {
        setActiveComposerChild("quit_confirm");
        return;
      }
      setComposerOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeComposerChild, composerOpen, isComposerDirty, isSubmittingDeet]);

  const resetDeetComposer = () => {
    setComposerOpen(false);
    setActiveComposerChild(null);
    setEditingDeetId(null);
    setAttachedDeetItems([]);
    setSelectedPhotoPreviews([]);
    setSelectedPhotoFiles([]);
    setSelectedDocFiles([]);
    setModalDraftText("");
    setIsFontSizeMenuOpen(false);
    setDeetFormatting(INITIAL_DEET_FORMATTING);
    setDeetSettings(INITIAL_DEET_SETTINGS);
  };

  /**
   * Opens the composer pre-populated with an existing deet's content so the user
   * can edit and re-save it. Supports body text, announcement/notice attachments,
   * poll options (read-only placeholder), and previously-uploaded images.
   */
  const startEditingDeet = (item: HubFeedItem) => {
    if (!isCreatorAdmin) return;
    setEditingDeetId(item.id);
    setModalDraftText(item.body || "");
    setSelectedPhotoPreviews([]);
    setSelectedPhotoFiles([]);
    setSelectedDocFiles([]);
    setDeetFormatting(INITIAL_DEET_FORMATTING);
    setIsFontSizeMenuOpen(false);

    // Rehydrate attached items from the mapped feed item. This covers
    // announcement, notice, poll, event, and photo attachments enough for
    // the composer to display chips and re-submit the deet with the same data.
    const rehydrated: AttachedDeetItem[] = (item.deetAttachments ?? []).map((att, index) => ({
      id: `edit-${item.id}-${index}`,
      type: att.type,
      title: att.title ?? "",
      detail: att.detail,
      previews: att.previews,
      options: att.options,
    }));

    // If the deet has images but no explicit photo attachment, surface them
    // as a synthetic photo chip so the user sees the current image(s).
    const existingImages = (item.images && item.images.length > 0) ? item.images : item.image ? [item.image] : [];
    const alreadyHasPhoto = rehydrated.some((r) => r.type === "photo");
    if (!alreadyHasPhoto && existingImages.length > 0) {
      rehydrated.push({
        id: `edit-${item.id}-photo`,
        type: "photo",
        title: existingImages.length === 1 ? "1 photo attached" : `${existingImages.length} photos attached`,
        detail: "Existing image(s).",
        previews: existingImages,
      });
    }
    setAttachedDeetItems(rehydrated);

    // Restore the post-type so the correct chip lights up. HubFeedItemKind
    // doesn't map 1:1 to DeetPostType so we do a best-effort mapping.
    const mappedPostType = ((): DeetSettingsState["postType"] => {
      if (item.kind === "notice" || item.kind === "announcement") return "notice";
      if (item.kind === "alert" || item.kind === "hazard") return "alert";
      if (item.kind === "jobs") return "jobs";
      if (item.kind === "news") return "news";
      if (item.kind === "deal") return "deal";
      return "post";
    })();
    setDeetSettings({
      noticeEnabled: item.kind === "notice" || item.kind === "announcement",
      commentsEnabled: item.allowComments !== false,
      postType: mappedPostType,
    });
    setComposerOpen(true);
    setActiveComposerChild(null);
  };

  const openDeetComposer = (child: ComposerChildFlow | null = null) => {
    if (!isCreatorAdmin) return;
    setComposerOpen(true);
    setActiveComposerChild(child);
  };

  const closeDeetComposer = () => {
    if (isSubmittingDeet) return;
    if (isComposerDirty) {
      setActiveComposerChild("quit_confirm");
      return;
    }
    setComposerOpen(false);
    setActiveComposerChild(null);
  };

  const discardDeetComposer = () => {
    if (isSubmittingDeet) return;
    resetDeetComposer();
  };

  const attachDeetItem = (item: Omit<AttachedDeetItem, "id">) => {
    setAttachedDeetItems((current) => [...current, { id: `${item.type}-${Date.now()}-${current.length}`, ...item }]);
    setActiveComposerChild(null);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotoPreviews((current) => current.filter((_, i) => i !== index));
    setSelectedPhotoFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleDeetPhotoFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (!files.length) return;

    try {
      const previews = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setSelectedPhotoPreviews((current) => [...current, ...previews]);
      setSelectedPhotoFiles((current) => [...current, ...files]);
    } catch {
      setActiveComposerChild(null);
    }
  };

  const handleDeetDocFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (!files.length) return;
    setSelectedDocFiles((current) => [...current, ...files]);
  };

  const removeDocFile = (index: number) => {
    setSelectedDocFiles((current) => current.filter((_, i) => i !== index));
  };

  const sanitizeHtml = (html: string): string => {
    // Remove script tags and event handlers to prevent XSS
    const div = document.createElement("div");
    div.innerHTML = html;

    // Remove all script tags
    const scripts = div.querySelectorAll("script");
    scripts.forEach((script) => script.remove());

    // Remove event handler attributes
    const allElements = div.querySelectorAll("*");
    allElements.forEach((el) => {
      // Remove all on* event handlers
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith("on")) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return div.innerHTML;
  };

  const handleSubmitDeet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingDeet) return;

    const trimmedText = modalDraftText.trim();
    const hasContent = Boolean(trimmedText || attachedDeetItems.length || selectedPhotoPreviews.length || selectedDocFiles.length);
    if (!hasContent) return;

    setIsSubmittingDeet(true);

    try {
      const photoAttachment = attachedDeetItems.find((item) => item.type === "photo" && item.previews?.length);
      const syntheticPhotoAttachment =
        !photoAttachment && selectedPhotoPreviews.length
          ? {
              type: "photo" as const,
              title: selectedPhotoPreviews.length === 1 ? "1 photo attached" : `${selectedPhotoPreviews.length} photos attached`,
              detail: "Ready to post in this deet.",
              previews: selectedPhotoPreviews,
              files: selectedPhotoFiles,
            }
          : null;
      const finalAttachments = [...attachedDeetItems, ...(syntheticPhotoAttachment ? [syntheticPhotoAttachment] : [])];
      const photoFiles = finalAttachments.flatMap((item) => (item.type === "photo" ? item.files ?? [] : []));
      const uploadedPhotoAssets = photoFiles.length
        ? await Promise.all(
            photoFiles.map((file) =>
              uploadDeetMedia({
                file,
                hubId,
                hubSlug,
                kind: "image",
              })
            )
          )
        : [];
      const uploadedPhotoUrls = uploadedPhotoAssets.map((asset) => asset.publicUrl);
      const uploadedPhotoPaths = uploadedPhotoAssets.map((asset) => asset.path);
      const primaryImage = uploadedPhotoUrls[0];

      const uploadedDocAssets = selectedDocFiles.length
        ? await Promise.all(
            selectedDocFiles.map((file) =>
              uploadDeetMedia({
                file,
                hubId,
                hubSlug,
                kind: "file",
              })
            )
          )
        : [];
      const docFileAttachments: AttachedDeetItem[] = uploadedDocAssets.map((asset, index) => ({
        id: `file-${Date.now()}-${index}`,
        type: "file",
        title: asset.fileName,
        detail: formatFileSize(asset.sizeBytes),
        meta: asset.mimeType,
        previews: [asset.publicUrl],
      }));
      const newestSticker = [...attachedDeetItems].reverse().find((item) => item.type === "sticker" && item.detail);

      const postTypeToKind: Record<string, string> = {
        post: primaryImage ? "Photos" : "Posts",
        notice: "Notices",
        news: "News",
        deal: "Deals",
        hazard: "Hazards",
        alert: "Alerts",
        jobs: "Jobs",
      };
      const postTypeToTitle: Record<string, string> = {
        post: primaryImage ? "Photo" : "Deet",
        notice: "Notice",
        news: "News",
        deal: "Deal",
        hazard: "Hazard",
        alert: "Alert",
        jobs: "Job",
      };
      const resolvedKind = (deetSettings.noticeEnabled ? "Notices" : postTypeToKind[deetSettings.postType] || "Posts") as import("@/lib/services/deets/deet-types").DeetKind;
      const fallbackTitle = deetSettings.noticeEnabled ? "Notice" : postTypeToTitle[deetSettings.postType] || "Deet";

      // Derive a meaningful title from the content instead of using a generic type name
      const contentForTitle = trimmedText
        || finalAttachments.find((a) => a.title)?.title
        || "";
      const resolvedTitle = contentForTitle
        ? contentForTitle.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100)
        : fallbackTitle;

      // Build body from attached items if the main editor is empty.
      // Skip the attachment title if it was already used as the post title
      // to avoid title/body duplication.
      let rawBody = trimmedText;
      if (!rawBody && finalAttachments.length > 0) {
        const titleUsedFromAttachment = !trimmedText && finalAttachments.find((a) => a.title)?.title;
        const parts: string[] = [];
        for (const att of finalAttachments) {
          if (att.type === "photo") continue; // photos render as images, not text
          // Skip the title if it's already used as the post title
          if (att.title && att.title !== titleUsedFromAttachment) parts.push(`<strong>${att.title}</strong>`);
          if (att.detail) parts.push(att.detail);
        }
        rawBody = parts.join("<br/>");
      }
      if (!rawBody && newestSticker?.detail) {
        rawBody = newestSticker.detail;
      }

      // Sanitize the HTML content before saving
      const sanitizedBody = sanitizeHtml(rawBody || "");

      const attachmentsWithFiles = [...finalAttachments, ...docFileAttachments];

      // Preserve existing image URLs when editing a deet and no new photos were selected.
      const existingPhotoAttachment = editingDeetId
        ? attachmentsWithFiles.find((item) => item.type === "photo" && (!item.files || item.files.length === 0) && item.previews?.length)
        : null;
      const existingImageUrls = existingPhotoAttachment?.previews ?? [];
      const effectivePhotoUrls = uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : existingImageUrls;
      const effectivePrimaryImage = primaryImage || existingImageUrls[0];

      const attachmentsPayload = attachmentsWithFiles.map((item) => ({
        type: item.type,
        title: item.title,
        detail: item.detail,
        previews: item.type === "photo"
          ? (uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : (item.previews ?? []))
          : item.previews,
        storagePaths: item.type === "photo" ? uploadedPhotoPaths : undefined,
        ...("options" in item && item.options ? { options: item.options } : {}),
        ...("pollSettings" in item && item.pollSettings ? { pollSettings: item.pollSettings } : {}),
        ...("eventData" in item && item.eventData ? { eventData: item.eventData } : {}),
        ...("jobData" in item && item.jobData ? { jobData: item.jobData } : {}),
        ...("meta" in item && item.meta ? { meta: item.meta } : {}),
      }));

      let savedDeet: DeetRecord;
      if (editingDeetId) {
        savedDeet = await updateDeet({
          id: editingDeetId,
          title: resolvedTitle,
          body: sanitizedBody,
          kind: resolvedKind,
          previewImageUrl: effectivePrimaryImage,
          previewImageUrls: effectivePhotoUrls,
          allowComments: deetSettings.commentsEnabled,
          attachments: attachmentsPayload,
        });
      } else {
        savedDeet = await createDeet({
          hubId,
          authorName,
          title: resolvedTitle,
          body: sanitizedBody,
          kind: resolvedKind,
          previewImageUrl: primaryImage,
          previewImageUrls: uploadedPhotoUrls,
          allowComments: deetSettings.commentsEnabled,
          attachments: attachmentsPayload,
        });
      }
      // Alias preserved below for the existing event-bridge code.
      const createdDeet = savedDeet;

      // Bridge: also create an entry in the events table so it appears
      // in the hub Events tab and the global Events page.
      const eventAttachment = finalAttachments.find((item): item is import("../components/deets/deetTypes").AttachedDeetItem => item.type === "event" && "eventData" in item && !!item.eventData);
      if (eventAttachment?.eventData && userId) {
        try {
          await createEvent(
            {
              hubId,
              title: eventAttachment.title,
              description: sanitizedBody || undefined,
              eventDate: eventAttachment.eventData.date,
              startTime: eventAttachment.eventData.time || undefined,
              location: eventAttachment.eventData.location || undefined,
            },
            userId,
          );
        } catch (eventErr) {
          // Event deet was already created successfully — don't fail the whole post
          console.error("[deet-submit] event bridge failed:", eventErr);
        }
      }

      const wasEditing = Boolean(editingDeetId);
      resetDeetComposer();
      startTransition(() => {
        if (wasEditing && onDeetUpdated) {
          onDeetUpdated(createdDeet);
        } else {
          onDeetCreated(createdDeet);
        }
      });
    } catch (err) {
      console.error("[deet-submit]", err);
      alert(err instanceof Error ? err.message : "Failed to create post. Please try again.");
    } finally {
      setIsSubmittingDeet(false);
    }
  };

  return {
    composerOpen,
    activeComposerChild,
    editingDeetId,
    attachedDeetItems,
    selectedPhotoPreviews,
    selectedPhotoFiles,
    selectedDocFiles,
    modalDraftText,
    isSubmittingDeet,
    deetFormatting,
    isFontSizeMenuOpen,
    deetSettings,
    deetPhotoInputRef,
    deetFileInputRef,
    authorName,
    authorAvatarSrc,
    setActiveComposerChild,
    setModalDraftText,
    setDeetFormatting,
    setIsFontSizeMenuOpen,
    setDeetSettings,
    openDeetComposer,
    startEditingDeet,
    closeDeetComposer,
    discardDeetComposer,
    attachDeetItem,
    removePhoto,
    removeDocFile,
    handleDeetPhotoFiles,
    handleDeetDocFiles,
    handleSubmitDeet,
  };
}
