"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";
import type { HubRecord } from "@/lib/hubs";
import { updateHub } from "@/lib/services/hubs/update-hub";
import { uploadHubMedia } from "@/lib/services/hubs/upload-hub-media";
import { normalizePublicSrc } from "../components/hubUtils";

type UseHubMediaFlowArgs = {
  hub: HubRecord;
  isCreatorAdmin: boolean;
  dpInputRef: RefObject<HTMLInputElement | null>;
  coverInputRef: RefObject<HTMLInputElement | null>;
};

export function useHubMediaFlow({
  hub,
  isCreatorAdmin,
  dpInputRef,
  coverInputRef,
}: UseHubMediaFlowArgs) {
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaSuccess, setMediaSuccess] = useState<string | null>(null);
  const [isUploadingDp, setIsUploadingDp] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [mediaChooserTarget, setMediaChooserTarget] = useState<"dp" | "cover" | null>(null);
  const [isAlbumPickerOpen, setIsAlbumPickerOpen] = useState(false);
  const [dpImageSrc, setDpImageSrc] = useState(normalizePublicSrc(hub.dpImage));
  const [coverImageSrc, setCoverImageSrc] = useState(normalizePublicSrc(hub.heroImage));
  const [galleryImages, setGalleryImages] = useState<string[]>(() =>
    (hub.galleryImages ?? []).map(normalizePublicSrc).filter(Boolean)
  );

  useEffect(() => {
    setDpImageSrc(normalizePublicSrc(hub.dpImage));
    setCoverImageSrc(normalizePublicSrc(hub.heroImage));
    setGalleryImages((hub.galleryImages ?? []).map(normalizePublicSrc).filter(Boolean));
  }, [hub.dpImage, hub.galleryImages, hub.heroImage]);

  const handleMediaUpload = async (kind: "dp" | "cover" | "gallery", file: File) => {
    setMediaError(null);
    setMediaSuccess(null);
    if (kind === "dp") setIsUploadingDp(true);
    if (kind === "cover") setIsUploadingCover(true);
    if (kind === "gallery") setIsUploadingGallery(true);
    try {
      const uploadedUrl = await uploadHubMedia({ file, slug: hub.slug, kind });
      const nextGallery = kind === "gallery" ? [...galleryImages, uploadedUrl] : galleryImages;
      const updatedHub = await updateHub(hub.id, {
        dpImageUrl: kind === "dp" ? uploadedUrl : undefined,
        coverImageUrl: kind === "cover" ? uploadedUrl : undefined,
        galleryImageUrls: kind === "gallery" ? nextGallery : undefined,
      });
      setDpImageSrc(normalizePublicSrc(updatedHub.dp_image_url || undefined));
      setCoverImageSrc(normalizePublicSrc(updatedHub.cover_image_url || undefined));
      setGalleryImages((updatedHub.gallery_image_urls ?? []).map(normalizePublicSrc).filter(Boolean));
      setMediaSuccess(kind === "gallery" ? "Recent photos updated." : kind === "dp" ? "Display picture updated." : "Cover image updated.");
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Hub media could not be updated.");
    } finally {
      if (kind === "dp") setIsUploadingDp(false);
      if (kind === "cover") setIsUploadingCover(false);
      if (kind === "gallery") setIsUploadingGallery(false);
    }
  };

  const handleMediaFileChange =
    (kind: "dp" | "cover" | "gallery") =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      await handleMediaUpload(kind, file);
    };

  const openMediaChooser = (target: "dp" | "cover") => {
    if (!isCreatorAdmin) return;
    setMediaChooserTarget(target);
    setIsAlbumPickerOpen(false);
    setMediaError(null);
  };

  const closeMediaChooser = () => {
    setMediaChooserTarget(null);
    setIsAlbumPickerOpen(false);
  };

  const handleChooseFromDevice = () => {
    if (!mediaChooserTarget) return;
    closeMediaChooser();
    if (mediaChooserTarget === "dp") {
      dpInputRef.current?.click();
      return;
    }
    coverInputRef.current?.click();
  };

  const handleChooseFromAlbums = (albumChoices: string[]) => {
    if (!albumChoices.length) return;
    setIsAlbumPickerOpen(true);
  };

  const handleAlbumImageSelect = async (imageUrl: string) => {
    if (!mediaChooserTarget) return;
    setMediaError(null);
    setMediaSuccess(null);
    if (mediaChooserTarget === "dp") setIsUploadingDp(true);
    else setIsUploadingCover(true);

    try {
      const updatedHub = await updateHub(hub.id, {
        dpImageUrl: mediaChooserTarget === "dp" ? imageUrl : undefined,
        coverImageUrl: mediaChooserTarget === "cover" ? imageUrl : undefined,
      });
      setDpImageSrc(normalizePublicSrc(updatedHub.dp_image_url || undefined));
      setCoverImageSrc(normalizePublicSrc(updatedHub.cover_image_url || undefined));
      setMediaSuccess(mediaChooserTarget === "dp" ? "Display picture updated." : "Cover image updated.");
      closeMediaChooser();
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Hub media could not be updated.");
    } finally {
      setIsUploadingDp(false);
      setIsUploadingCover(false);
    }
  };

  return {
    mediaError,
    mediaSuccess,
    isUploadingDp,
    isUploadingCover,
    isUploadingGallery,
    mediaChooserTarget,
    isAlbumPickerOpen,
    dpImageSrc,
    coverImageSrc,
    galleryImages,
    setIsAlbumPickerOpen,
    openMediaChooser,
    closeMediaChooser,
    handleChooseFromDevice,
    handleChooseFromAlbums,
    handleAlbumImageSelect,
    handleMediaFileChange,
  };
}
