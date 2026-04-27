"use client";

import type { ChangeEvent, FormEvent } from "react";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { HubContent } from "@/lib/hub-content";
import { createDeet } from "@/lib/services/deets/create-deet";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import { updateDeet } from "@/lib/services/deets/update-deet";
import { createEvent } from "@/lib/services/events/create-event";
import { uploadDeetMedia } from "@/lib/services/deets/upload-deet-media";
import type { ComposerChildFlow, DeetFormattingState, DeetSettingsState } from "../components/deets/deetTypes";
import { INITIAL_DEET_SETTINGS } from "../components/deets/deetTypes";
import { mapComposerStateToSubmitParts } from "../components/deets/composer/composerMapper";
import {
  composerHasMinimumContent,
  composerPayloadDiffersFromDefault,
  composerValidationMessage,
  deetSettingsValidationMessage,
} from "../components/deets/composer/composerValidation";
import type { ComposerContentKind, ComposerTypePayload } from "../components/deets/composer/composerTypes";
import { migrateComposerTypePayload } from "../components/deets/composer/composerMigrate";
import { defaultTypePayload } from "../components/deets/composer/composerTypes";
import {
  deetSettingsStateFromHubFeedItem,
  hydrateComposerFromHubFeedItem,
} from "../components/deets/composer/hydrateComposerFromHubFeedItem";
import { sanitizeDeetBodyHtml } from "@/lib/deets/sanitize-deet-html";

const INITIAL_DEET_FORMATTING: DeetFormattingState = {
  fontSize: "small",
  bold: false,
  italic: false,
  underline: false,
  textColor: "#111111",
};

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
  canCreateDeets: boolean;
  authorName: string;
  authorAvatarSrc?: string;
  userId: string | null;
  onDeetCreated: (deet: DeetRecord) => void;
  onDeetUpdated?: (deet: DeetRecord) => void;
};

const FLOW_TO_KIND: Partial<Record<Exclude<ComposerChildFlow, "quit_confirm">, ComposerContentKind>> = {
  announcement: "announcement",
  notice: "notice",
  poll: "poll",
  event: "event",
  post: "post",
  alert: "alert",
  survey: "survey",
  payment: "payment",
  jobs: "jobs",
  photo: "post",
  emoji: "post",
  settings: "post",
  money: "post",
};

export type OpenComposerArg =
  | null
  | undefined
  | Exclude<ComposerChildFlow, "quit_confirm">
  | {
      initialKind?: ComposerContentKind;
      sheet?: Extract<ComposerChildFlow, "emoji" | "settings">;
      pickPhotos?: boolean;
    }
  | { editFeedItem: HubContent["feed"][number] };

export function useDeetComposer({
  hubId,
  hubSlug,
  demoComposerText,
  canCreateDeets,
  authorName,
  authorAvatarSrc,
  userId,
  onDeetCreated,
  onDeetUpdated,
}: UseDeetComposerArgs) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeComposerChild, setActiveComposerChild] = useState<ComposerChildFlow | null>(null);
  const [composerAccessoryPanel, setComposerAccessoryPanel] = useState<null | "emoji" | "settings">(null);
  const [composerPhase, setComposerPhase] = useState<"pick" | "compose">("compose");
  const [pickPhotosOnOpen, setPickPhotosOnOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<ComposerContentKind>("post");
  const [composerTitle, setComposerTitle] = useState("");
  const [composerBodyHtml, setComposerBodyHtml] = useState("");
  const [composerTypePayload, setComposerTypePayload] = useState<ComposerTypePayload>(() => defaultTypePayload("post"));
  const [selectedPhotoPreviews, setSelectedPhotoPreviews] = useState<string[]>([]);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const [isSubmittingDeet, setIsSubmittingDeet] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deetFormatting, setDeetFormatting] = useState<DeetFormattingState>(INITIAL_DEET_FORMATTING);
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = useState(false);
  const [deetSettings, setDeetSettings] = useState<DeetSettingsState>(INITIAL_DEET_SETTINGS);
  const deetPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [editingDeetId, setEditingDeetId] = useState<string | null>(null);
  const [editPersistedGalleryUrls, setEditPersistedGalleryUrls] = useState<string[]>([]);

  const applyComposerKind = useCallback(
    (nextKind: ComposerContentKind) => {
      if (nextKind === composerKind) return;
      setSubmitError(null);
      setComposerKind(nextKind);
      setComposerTypePayload((prev) => migrateComposerTypePayload(composerKind, nextKind, prev));
      setComposerAccessoryPanel(null);
    },
    [composerKind],
  );

  useEffect(() => {
    setSubmitError(null);
  }, [composerTitle, composerBodyHtml, composerKind, selectedPhotoPreviews, composerTypePayload, editPersistedGalleryUrls]);

  const deetSettingsDirty =
    deetSettings.commentsEnabled !== INITIAL_DEET_SETTINGS.commentsEnabled ||
    deetSettings.reactionsEnabled !== INITIAL_DEET_SETTINGS.reactionsEnabled ||
    deetSettings.pinToTop !== INITIAL_DEET_SETTINGS.pinToTop ||
    deetSettings.publishTiming !== INITIAL_DEET_SETTINGS.publishTiming ||
    deetSettings.scheduledAt !== INITIAL_DEET_SETTINGS.scheduledAt ||
    deetSettings.audience !== INITIAL_DEET_SETTINGS.audience ||
    (deetSettings.localFeedTag ?? null) !== (INITIAL_DEET_SETTINGS.localFeedTag ?? null);

  const isComposerDirty =
    composerBodyHtml.trim().length > 0 ||
    composerTitle.trim().length > 0 ||
    selectedPhotoPreviews.length > 0 ||
    editPersistedGalleryUrls.length > 0 ||
    deetSettingsDirty ||
    composerPayloadDiffersFromDefault(composerKind, composerTypePayload);

  useEffect(() => {
    if (!composerOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isSubmittingDeet) return;
      if (composerPhase === "pick") {
        setComposerOpen(false);
        setActiveComposerChild(null);
        setPickPhotosOnOpen(false);
        setComposerAccessoryPanel(null);
        setComposerPhase("pick");
        setEditingDeetId(null);
        setEditPersistedGalleryUrls([]);
        return;
      }
      if (composerAccessoryPanel) {
        setComposerAccessoryPanel(null);
        return;
      }
      if (activeComposerChild === "quit_confirm") {
        setActiveComposerChild(null);
        return;
      }
      if (isComposerDirty) {
        setComposerAccessoryPanel(null);
        setActiveComposerChild("quit_confirm");
        return;
      }
      setComposerOpen(false);
      setActiveComposerChild(null);
      setPickPhotosOnOpen(false);
      setComposerAccessoryPanel(null);
      setEditingDeetId(null);
      setEditPersistedGalleryUrls([]);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeComposerChild, composerAccessoryPanel, composerOpen, composerPhase, isComposerDirty, isSubmittingDeet]);

  const resetDeetComposer = () => {
    setSubmitError(null);
    setComposerOpen(false);
    setActiveComposerChild(null);
    setComposerAccessoryPanel(null);
    setPickPhotosOnOpen(false);
    setSelectedPhotoPreviews([]);
    setSelectedPhotoFiles([]);
    setComposerBodyHtml("");
    setComposerTitle("");
    setComposerKind("post");
    setComposerTypePayload(defaultTypePayload("post"));
    setIsFontSizeMenuOpen(false);
    setDeetFormatting(INITIAL_DEET_FORMATTING);
    setDeetSettings(INITIAL_DEET_SETTINGS);
    setComposerPhase("pick");
    setEditingDeetId(null);
    setEditPersistedGalleryUrls([]);
  };

  const removePersistedGalleryPhoto = (index: number) => {
    setEditPersistedGalleryUrls((current) => current.filter((_, i) => i !== index));
  };

  const openDeetComposer = (arg?: OpenComposerArg) => {
    const isEditRequest = Boolean(arg && typeof arg === "object" && "editFeedItem" in arg && arg.editFeedItem);
    if (!canCreateDeets && !isEditRequest) return;

    setSubmitError(null);

    if (arg && typeof arg === "object" && "editFeedItem" in arg && arg.editFeedItem) {
      const feedItem = arg.editFeedItem;
      const hydrated = hydrateComposerFromHubFeedItem(feedItem);
      setEditingDeetId(feedItem.id);
      setEditPersistedGalleryUrls(hydrated.editPersistedGalleryUrls);
      setComposerPhase("compose");
      setComposerKind(hydrated.composerKind);
      setComposerTypePayload(hydrated.composerTypePayload);
      setComposerTitle(hydrated.composerTitle);
      setComposerBodyHtml(hydrated.composerBodyHtml);
      setSelectedPhotoPreviews([]);
      setSelectedPhotoFiles([]);
      setDeetFormatting(INITIAL_DEET_FORMATTING);
      setIsFontSizeMenuOpen(false);
      setDeetSettings(deetSettingsStateFromHubFeedItem(feedItem));
      setPickPhotosOnOpen(false);
      setComposerAccessoryPanel(null);
      setActiveComposerChild(null);
      setComposerOpen(true);
      return;
    }

    setEditingDeetId(null);
    setEditPersistedGalleryUrls([]);

    let initialKind: ComposerContentKind = "post";
    let sheet: ComposerChildFlow | null = null;
    let accessory: null | "emoji" | "settings" = null;
    let pickPhotos = false;

    if (arg != null && typeof arg === "object" && !("editFeedItem" in arg)) {
      const o = arg as {
        initialKind?: ComposerContentKind;
        sheet?: Extract<ComposerChildFlow, "emoji" | "settings">;
        pickPhotos?: boolean;
      };
      initialKind = o.initialKind ?? "post";
      if (o.sheet === "emoji" || o.sheet === "settings") sheet = o.sheet;
      if (o.pickPhotos) pickPhotos = true;
    } else if (typeof arg === "string") {
      if (arg === "photo") {
        pickPhotos = true;
        initialKind = "post";
      } else if (arg === "emoji") {
        sheet = "emoji";
        initialKind = "post";
      } else if (arg === "settings") {
        sheet = "settings";
        initialKind = "post";
      } else {
        initialKind = FLOW_TO_KIND[arg] ?? "post";
      }
    }

    const startAtPick =
      arg == null ||
      (typeof arg === "object" &&
        arg !== null &&
        !("editFeedItem" in arg) &&
        !("pickPhotos" in arg && arg.pickPhotos) &&
        !("sheet" in arg && (arg.sheet === "emoji" || arg.sheet === "settings")) &&
        !("initialKind" in arg && arg.initialKind != null));

    setComposerPhase(startAtPick ? "pick" : "compose");

    if (startAtPick) {
      setComposerKind("post");
      setComposerTypePayload(defaultTypePayload("post"));
      setComposerTitle("");
      setComposerBodyHtml("");
      setDeetFormatting(INITIAL_DEET_FORMATTING);
      setIsFontSizeMenuOpen(false);
      setSelectedPhotoPreviews([]);
      setSelectedPhotoFiles([]);
      setDeetSettings({ ...INITIAL_DEET_SETTINGS });
      setPickPhotosOnOpen(false);
      setComposerAccessoryPanel(null);
    } else {
      setComposerKind(initialKind);
      setComposerTypePayload(defaultTypePayload(initialKind));
      setComposerTitle("");
      setComposerBodyHtml(demoComposerText);
      setDeetFormatting(INITIAL_DEET_FORMATTING);
      setIsFontSizeMenuOpen(false);
      setSelectedPhotoPreviews([]);
      setSelectedPhotoFiles([]);
      setDeetSettings({ ...INITIAL_DEET_SETTINGS });
      setPickPhotosOnOpen(pickPhotos);
      if (sheet === "emoji" || sheet === "settings") {
        accessory = sheet;
      }
      setComposerAccessoryPanel(accessory);
    }

    setActiveComposerChild(null);
    setComposerOpen(true);
  };

  const selectComposerKindAndCompose = useCallback(
    (kind: ComposerContentKind) => {
      setSubmitError(null);
      setComposerKind(kind);
      setComposerTypePayload((prev) => migrateComposerTypePayload(composerKind, kind, prev));
      setComposerAccessoryPanel(null);
      setComposerBodyHtml((prev) => (prev.trim() ? prev : demoComposerText));
      setComposerPhase("compose");
    },
    [composerKind, demoComposerText],
  );

  const backToComposerPickStep = useCallback(() => {
    if (editingDeetId) return;
    setSubmitError(null);
    setComposerAccessoryPanel(null);
    setIsFontSizeMenuOpen(false);
    setComposerPhase("pick");
  }, [editingDeetId]);

  const closeDeetComposer = () => {
    if (isSubmittingDeet) return;
    if (composerPhase !== "pick" && isComposerDirty) {
      setComposerAccessoryPanel(null);
      setActiveComposerChild("quit_confirm");
      return;
    }
    setComposerOpen(false);
    setActiveComposerChild(null);
    setPickPhotosOnOpen(false);
    setComposerAccessoryPanel(null);
    setComposerPhase("pick");
    setEditingDeetId(null);
    setEditPersistedGalleryUrls([]);
  };

  const discardDeetComposer = () => {
    if (isSubmittingDeet) return;
    resetDeetComposer();
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
      setComposerAccessoryPanel(null);
    }
  };

  const handleSubmitDeet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingDeet) return;
    if (composerPhase === "pick") return;

    const persistedGallery = editingDeetId ? editPersistedGalleryUrls : [];
    const hasPhotos = selectedPhotoPreviews.length > 0 || persistedGallery.length > 0;
    if (
      !composerHasMinimumContent(composerKind, composerTitle, composerBodyHtml, hasPhotos, composerTypePayload)
    ) {
      setSubmitError(
        composerValidationMessage(composerKind, composerTitle, composerBodyHtml, hasPhotos, composerTypePayload)
      );
      return;
    }

    const settingsErr = deetSettingsValidationMessage(deetSettings);
    if (settingsErr) {
      setSubmitError(settingsErr);
      return;
    }

    setSubmitError(null);
    setIsSubmittingDeet(true);

    try {
      const allDraftPreviews = [...persistedGallery, ...selectedPhotoPreviews];
      const hasPhotoDraft = allDraftPreviews.length > 0;
      const syntheticPhotoAttachment = hasPhotoDraft
        ? {
            type: "photo" as const,
            title: allDraftPreviews.length === 1 ? "1 photo attached" : `${allDraftPreviews.length} photos attached`,
            detail: "Ready to publish with this deet.",
            previews: allDraftPreviews,
            files: selectedPhotoFiles,
          }
        : null;

      const mappedBeforeUpload = mapComposerStateToSubmitParts(
        {
          composerKind,
          composerTitle,
          bodyHtml: composerBodyHtml,
          deetSettings,
          typePayload: composerTypePayload,
        },
        { hasPhotos: hasPhotoDraft }
      );

      const structuredAndPhoto = [...mappedBeforeUpload.structuredAttachments, ...(syntheticPhotoAttachment ? [syntheticPhotoAttachment] : [])];

      const photoFiles = structuredAndPhoto.flatMap((item) => (item.type === "photo" ? item.files ?? [] : []));
      const uploadedPhotoAssets = photoFiles.length
        ? await Promise.all(
            photoFiles.map((file) =>
              uploadDeetMedia({
                file,
                hubId,
                hubSlug,
              })
            )
          )
        : [];
      const uploadedPhotoUrls = uploadedPhotoAssets.map((asset) => asset.publicUrl);
      const uploadedPhotoPaths = uploadedPhotoAssets.map((asset) => asset.path);
      const galleryPreviewUrls = [...persistedGallery, ...uploadedPhotoUrls];
      const primaryImage = galleryPreviewUrls[0];

      const mapped = mapComposerStateToSubmitParts(
        {
          composerKind,
          composerTitle,
          bodyHtml: composerBodyHtml,
          deetSettings,
          typePayload: composerTypePayload,
        },
        { hasPhotos: galleryPreviewUrls.length > 0 }
      );

      let rawBody = mapped.rawBody;
      if (!rawBody && structuredAndPhoto.length > 0) {
        const firstStructured = structuredAndPhoto.find((a) => a.type !== "photo");
        const titleUsedFromAttachment = !composerBodyHtml.trim() && firstStructured?.title;
        const parts: string[] = [];
        for (const att of structuredAndPhoto) {
          if (att.type === "photo" || att.type === "deet_options") continue;
          if (att.title && att.title !== titleUsedFromAttachment) parts.push(`<strong>${att.title}</strong>`);
          if (att.detail) parts.push(att.detail);
        }
        rawBody = parts.join("<br/>");
      }

      const sanitizedBody = sanitizeDeetBodyHtml(rawBody || "");

      const attachmentPayload = structuredAndPhoto.map((item) => ({
        type: item.type,
        title: item.title,
        detail: item.detail,
        previews: item.type === "photo" ? galleryPreviewUrls : item.previews,
        storagePaths: item.type === "photo" ? uploadedPhotoPaths : undefined,
        ...("options" in item && item.options ? { options: item.options } : {}),
        ...("pollSettings" in item && item.pollSettings ? { pollSettings: item.pollSettings } : {}),
        ...("eventData" in item && item.eventData ? { eventData: item.eventData } : {}),
        ...("jobData" in item && item.jobData ? { jobData: item.jobData } : {}),
        ...("meta" in item && item.meta ? { meta: item.meta } : {}),
      }));

      if (editingDeetId) {
        const updatedDeet = await updateDeet({
          id: editingDeetId,
          title: mapped.resolvedTitle,
          body: sanitizedBody,
          kind: mapped.resolvedKind,
          previewImageUrl: primaryImage ?? null,
          previewImageUrls: galleryPreviewUrls,
          attachments: attachmentPayload,
        });
        resetDeetComposer();
        startTransition(() => {
          onDeetUpdated?.(updatedDeet);
        });
      } else {
        const createdDeet = await createDeet({
          hubId,
          authorName,
          title: mapped.resolvedTitle,
          body: sanitizedBody,
          kind: mapped.resolvedKind,
          previewImageUrl: primaryImage,
          previewImageUrls: galleryPreviewUrls,
          attachments: attachmentPayload,
        });

        if (mapped.eventBridge && userId) {
          try {
            await createEvent(
              {
                hubId,
                title: mapped.eventBridge.title,
                description: mapped.eventBridge.description,
                eventDate: mapped.eventBridge.eventDate,
                startTime: mapped.eventBridge.startTime,
                location: mapped.eventBridge.location,
              },
              userId,
            );
          } catch (eventErr) {
            console.error("[deet-submit] event bridge failed:", eventErr);
          }
        }

        resetDeetComposer();
        startTransition(() => {
          onDeetCreated(createdDeet);
        });
      }
    } catch (err) {
      console.error("[deet-submit]", err);
      setSubmitError(err instanceof Error ? err.message : "Could not publish your deet. Please try again.");
    } finally {
      setIsSubmittingDeet(false);
    }
  };

  return {
    composerOpen,
    composerPhase,
    selectComposerKindAndCompose,
    backToComposerPickStep,
    activeComposerChild,
    composerAccessoryPanel,
    setComposerAccessoryPanel,
    pickPhotosOnOpen,
    setPickPhotosOnOpen,
    composerKind,
    setComposerKind,
    applyComposerKind,
    composerTitle,
    setComposerTitle,
    composerBodyHtml,
    setComposerBodyHtml,
    composerTypePayload,
    setComposerTypePayload,
    selectedPhotoPreviews,
    selectedPhotoFiles,
    isSubmittingDeet,
    submitError,
    deetFormatting,
    isFontSizeMenuOpen,
    deetSettings,
    deetPhotoInputRef,
    authorName,
    authorAvatarSrc,
    setActiveComposerChild,
    setDeetFormatting,
    setIsFontSizeMenuOpen,
    setDeetSettings,
    openDeetComposer,
    closeDeetComposer,
    discardDeetComposer,
    removePhoto,
    handleDeetPhotoFiles,
    handleSubmitDeet,
    isComposerDirty,
    editingDeetId,
    editPersistedGalleryUrls,
    removePersistedGalleryPhoto,
  };
}
