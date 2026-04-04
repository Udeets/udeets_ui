"use client";

import { Images, Loader2, Paperclip, Plus } from "lucide-react";
import { SectionShell } from "../SectionShell";
import { cn, ImageWithFallback } from "../hubUtils";

export function AttachmentsSection({
  activeAttachmentView,
  recentPhotos,
  fileItems,
  hubName,
  onOpenViewer,
  isCreatorAdmin,
  isUploadingGallery,
  onOpenGalleryUpload,
  galleryInputRef,
  onGalleryChange,
}: {
  activeAttachmentView: "photos" | "files";
  recentPhotos: string[];
  fileItems: string[];
  hubName: string;
  onOpenViewer: (images: string[], index: number, title: string, body: string) => void;
  isCreatorAdmin?: boolean;
  isUploadingGallery?: boolean;
  onOpenGalleryUpload?: () => void;
  galleryInputRef?: React.RefObject<HTMLInputElement | null>;
  onGalleryChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <SectionShell
      title="Attachments"
      description="Photos and files shared in this hub."
    >
      {/* Top action buttons */}
      {isCreatorAdmin && onOpenGalleryUpload && (
        <div className="flex gap-2 pb-4">
          {galleryInputRef ? <input ref={galleryInputRef} type="file" accept="image/*" onChange={onGalleryChange} className="hidden" /> : null}
          <button
            type="button"
            onClick={onOpenGalleryUpload}
            disabled={isUploadingGallery}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-brand-primary)] hover:text-[var(--ud-brand-primary)]",
              isUploadingGallery && "cursor-not-allowed opacity-60"
            )}
          >
            {isUploadingGallery ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading</> : <><Plus className="h-3 w-3" /> Add Photos</>}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-brand-primary)] hover:text-[var(--ud-brand-primary)]"
          >
            <Plus className="h-3 w-3" /> Add Files
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Photos section - always show */}
        <div>
          <div className="flex items-center gap-2 pb-3">
            <Images className="h-4 w-4 text-[var(--ud-text-muted)]" />
            <span className="text-sm font-medium text-[var(--ud-text-primary)]">Photos</span>
            <span className="text-xs text-[var(--ud-text-muted)]">({recentPhotos.length})</span>
          </div>

          {recentPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
              {recentPhotos.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => onOpenViewer(recentPhotos, index, `${hubName} Album`, "Recent photos from this hub.")}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-[var(--ud-bg-subtle)]"
                >
                  <ImageWithFallback
                    src={img}
                    sources={[img]}
                    alt={`${hubName} photo ${index + 1}`}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-bg-subtle)] text-xs text-[var(--ud-text-muted)]"
                    fallback="Photo"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--ud-bg-subtle)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--ud-text-muted)]">No photos yet</p>
            </div>
          )}
        </div>

        {/* Files section - always show */}
        <div>
          <div className="flex items-center gap-2 pb-3">
            <Paperclip className="h-4 w-4 text-[var(--ud-text-muted)]" />
            <span className="text-sm font-medium text-[var(--ud-text-primary)]">Files</span>
            <span className="text-xs text-[var(--ud-text-muted)]">({fileItems.length})</span>
          </div>

          {fileItems.length > 0 ? (
            <div className="space-y-2">
              {fileItems.map((file) => (
                <div key={file} className="flex items-center gap-3 rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] px-3 py-2.5">
                  <Paperclip className="h-4 w-4 shrink-0 text-[var(--ud-text-muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--ud-text-primary)]">{file}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--ud-bg-subtle)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--ud-text-muted)]">No files yet</p>
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
