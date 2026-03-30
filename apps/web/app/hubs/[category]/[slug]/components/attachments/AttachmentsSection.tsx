"use client";

import { Images, Paperclip } from "lucide-react";
import { SectionShell } from "../SectionShell";
import { ICON, ImageWithFallback, PREMIUM_ICON_WRAPPER } from "../hubUtils";

export function AttachmentsSection({
  activeAttachmentView,
  recentPhotos,
  fileItems,
  hubName,
  onOpenViewer,
}: {
  activeAttachmentView: "photos" | "files";
  recentPhotos: string[];
  fileItems: string[];
  hubName: string;
  onOpenViewer: (images: string[], index: number, title: string, body: string) => void;
}) {
  const blocks =
    activeAttachmentView === "files"
      ? [
          {
            key: "files" as const,
            title: "Files",
            description: "Shared guides, forms, and reference files for this hub.",
          },
          {
            key: "photos" as const,
            title: "Photos",
            description: "Recent images and visual moments shared by this hub.",
          },
        ]
      : [
          {
            key: "photos" as const,
            title: "Photos",
            description: "Recent images and visual moments shared by this hub.",
          },
          {
            key: "files" as const,
            title: "Files",
            description: "Shared guides, forms, and reference files for this hub.",
          },
        ];

  return (
    <SectionShell title="Attachments" description="Photos and files connected to this hub, gathered in one place.">
      <div className="w-full space-y-4">
        {blocks.map((block) =>
          block.key === "photos" ? (
            <section key={block.key} className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
              <div>
                <div className="flex items-center gap-3">
                  <span className={PREMIUM_ICON_WRAPPER}>
                    <Images className={ICON} />
                  </span>
                  <div>
                    <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">{block.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{block.description}</p>
                  </div>
                </div>
              </div>

              {recentPhotos.length ? (
                <div className="mt-5 grid w-full gap-3 sm:grid-cols-2">
                  {recentPhotos.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-0"
                      onClick={() => onOpenViewer(recentPhotos, index, `${hubName} Album`, "Recent photos from this hub.")}
                    >
                      <div className="aspect-square">
                        <ImageWithFallback
                          src={img}
                          sources={[img, ...recentPhotos.filter((photo) => photo !== img)]}
                          alt={`${hubName} album ${index + 1}`}
                          className="h-full w-full object-cover"
                          fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/25 text-sm font-medium text-[#0C5C57]"
                          fallback="Photo"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-5 grid min-h-[240px] w-full place-items-center text-center">
                  <div className="w-full">
                    <h4 className="text-xl font-serif font-semibold tracking-tight text-[#111111]">No photos yet</h4>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">Add photos later to bring this hub to life.</p>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section key={block.key} className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
              <div className="flex items-center gap-3">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <Paperclip className={ICON} />
                </span>
                <div>
                  <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">{block.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{block.description}</p>
                </div>
              </div>

              {fileItems.length ? (
                <div className="mt-5 w-full space-y-3">
                  {fileItems.map((file) => (
                    <div key={file} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <span className={PREMIUM_ICON_WRAPPER}>
                          <Paperclip className={ICON} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#111111]">{file}</p>
                          <p className="text-xs text-slate-500">Mock shared file</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 grid min-h-[240px] w-full place-items-center text-center">
                  <div className="w-full">
                    <h4 className="text-xl font-serif font-semibold tracking-tight text-[#111111]">No files yet</h4>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">Shared guides, forms, and resources will appear here.</p>
                  </div>
                </div>
              )}
            </section>
          )
        )}
      </div>
    </SectionShell>
  );
}
