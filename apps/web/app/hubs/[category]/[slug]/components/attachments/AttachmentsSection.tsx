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
      actions={
        isCreatorAdmin && onOpenGalleryUpload ? (
          <>
            {galleryInputRef ? <input ref={galleryInputRef} type="file" accept="image/*" onChange={onGalleryChange} className="hidden" /> : null}
            <button
              type="button"
              onClick={onOpenGalleryUpload}
              disabled={isUploadingGallery}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#A9D1CA] hover:text-[#0C5C57]",
                isUploadingGallery && "cursor-not-allowed opacity-60"
              )}
            >
              {isUploadingGallery ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading</> : <><Plus className="h-3 w-3" /> Add Photo</>}
            </button>
          </>
        ) : undefined
      }
    >
      {/* Photos grid */}
      <div>
        <div className="flex items-center gap-2 pb-3">
          <Images className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-[#111111]">Photos</span>
          <span className="text-xs text-slate-400">{recentPhotos.length}</span>
        </div>

        {recentPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
            {recentPhotos.map((img, index) => (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() => onOpenViewer(recentPhotos, index, `${hubName} Album`, "Recent photos from this hub.")}
                className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
              >
                <ImageWithFallback
                  src={img}
                  sources={[img]}
                  alt={`${hubName} photo ${index + 1}`}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  fallbackClassName="grid h-full w-full place-items-center bg-slate-100 text-xs text-slate-400"
                  fallback="Photo"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No photos yet</p>
          </div>
        )}
      </div>

      {/* Files */}
      <div className="mt-6">
        <div className="flex items-center gap-2 pb-3">
          <Paperclip className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-[#111111]">Files</span>
          <span className="text-xs text-slate-400">{fileItems.length}</span>
        </div>

        {fileItems.length > 0 ? (
          <div className="space-y-2">
            {fileItems.map((file) => (
              <div key={file} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#111111]">{file}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No files yet</p>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
