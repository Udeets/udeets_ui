"use client";

import { ImageWithFallback } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export function PhotosSection({
  recentPhotos,
  hubName,
  onOpenViewer,
}: {
  recentPhotos: string[];
  hubName: string;
  onOpenViewer: (images: string[], index: number, title: string, body: string) => void;
}) {
  return (
    <SectionShell title="Photos" description="Recent images and visual moments shared by this hub.">
      {recentPhotos.length === 0 ? (
        <div className="grid min-h-[240px] w-full place-items-center text-center">
          <div className="w-full">
            <h3 className="text-xl font-semibold tracking-tight text-[#111111]">No photos yet</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Add photos later to bring this hub to life.</p>
          </div>
        </div>
      ) : (
        <section className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recentPhotos.map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-0"
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
        </section>
      )}
    </SectionShell>
  );
}
