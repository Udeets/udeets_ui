"use client";

import type { ChangeEvent, FormEvent } from "react";
import { startTransition, useEffect, useRef, useState } from "react";
import { createDeet } from "@/lib/services/deets/create-deet";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
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
  onDeetCreated: (deet: DeetRecord) => void;
};

export function useDeetComposer({
  hubId,
  hubSlug,
  demoComposerText,
  isCreatorAdmin,
  authorName,
  authorAvatarSrc,
  onDeetCreated,
}: UseDeetComposerArgs) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeComposerChild, setActiveComposerChild] = useState<ComposerChildFlow | null>(null);
  const [attachedDeetItems, setAttachedDeetItems] = useState<AttachedDeetItem[]>([]);
  const [selectedPhotoPreviews, setSelectedPhotoPreviews] = useState<string[]>([]);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const [modalDraftText, setModalDraftText] = useState("");
  const [isSubmittingDeet, setIsSubmittingDeet] = useState(false);
  const [deetFormatting, setDeetFormatting] = useState<DeetFormattingState>(INITIAL_DEET_FORMATTING);
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = useState(false);
  const [deetSettings, setDeetSettings] = useState<DeetSettingsState>(INITIAL_DEET_SETTINGS);
  const deetPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const isComposerDirty =
    modalDraftText.trim().length > 0 ||
    attachedDeetItems.length > 0 ||
    selectedPhotoPreviews.length > 0 ||
    deetSettings.noticeEnabled ||
    !deetSettings.commentsEnabled ||
    deetSettings.postType !== "post";

  useEffect(() => {
    if (!composerOpen) return;

    setModalDraftText(demoComposerText);
    setDeetFormatting(INITIAL_DEET_FORMATTING);
    setIsFontSizeMenuOpen(false);
    setAttachedDeetItems([]);
    setSelectedPhotoPreviews([]);
    setSelectedPhotoFiles([]);
    setDeetSettings(INITIAL_DEET_SETTINGS);
  }, [composerOpen, demoComposerText]);

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
    setAttachedDeetItems([]);
    setSelectedPhotoPreviews([]);
    setSelectedPhotoFiles([]);
    setModalDraftText("");
    setIsFontSizeMenuOpen(false);
    setDeetFormatting(INITIAL_DEET_FORMATTING);
    setDeetSettings(INITIAL_DEET_SETTINGS);
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
    const hasContent = Boolean(trimmedText || attachedDeetItems.length || selectedPhotoPreviews.length);
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
              })
            )
          )
        : [];
      const uploadedPhotoUrls = uploadedPhotoAssets.map((asset) => asset.publicUrl);
      const uploadedPhotoPaths = uploadedPhotoAssets.map((asset) => asset.path);
      const primaryImage = uploadedPhotoUrls[0];
      const newestSticker = [...attachedDeetItems].reverse().find((item) => item.type === "sticker" && item.detail);

      const postTypeToKind: Record<string, string> = {
        post: primaryImage ? "Photos" : "Posts",
        notice: "Notices",
        news: "News",
        deal: "Deals",
        hazard: "Hazards",
        alert: "Alerts",
      };
      const postTypeToTitle: Record<string, string> = {
        post: primaryImage ? "Photo" : "Deet",
        notice: "Notice",
        news: "News",
        deal: "Deal",
        hazard: "Hazard",
        alert: "Alert",
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

      const createdDeet = await createDeet({
        hubId,
        authorName,
        title: resolvedTitle,
        body: sanitizedBody,
        kind: resolvedKind,
        previewImageUrl: primaryImage,
        previewImageUrls: uploadedPhotoUrls,
        attachments: finalAttachments.map((item) => ({
          type: item.type,
          title: item.title,
          detail: item.detail,
          previews: item.type === "photo" ? uploadedPhotoUrls : item.previews,
          storagePaths: item.type === "photo" ? uploadedPhotoPaths : undefined,
          ...("options" in item && item.options ? { options: item.options } : {}),
          ...("pollSettings" in item && item.pollSettings ? { pollSettings: item.pollSettings } : {}),
        })),
      });

      resetDeetComposer();
      startTransition(() => {
        onDeetCreated(createdDeet);
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
    attachedDeetItems,
    selectedPhotoPreviews,
    selectedPhotoFiles,
    modalDraftText,
    isSubmittingDeet,
    deetFormatting,
    isFontSizeMenuOpen,
    deetSettings,
    deetPhotoInputRef,
    authorName,
    authorAvatarSrc,
    setActiveComposerChild,
    setModalDraftText,
    setDeetFormatting,
    setIsFontSizeMenuOpen,
    setDeetSettings,
    openDeetComposer,
    closeDeetComposer,
    discardDeetComposer,
    attachDeetItem,
    removePhoto,
    handleDeetPhotoFiles,
    handleSubmitDeet,
  };
}
