"use client";

import type { LucideIcon } from "lucide-react";
import { Facebook, Globe, Images, Instagram, Loader2, MapPin, Phone, Settings, UsersRound, Youtube } from "lucide-react";
import { ACTION_ICON, ACTION_ICON_BUTTON, BUTTON_SECONDARY, ICON, PREMIUM_ICON_WRAPPER, displayLinkValue, ImageWithFallback, initials, cn } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export function AboutSection({
  CategoryIcon,
  categoryLabel,
  hubName,
  hubDescription,
  settingsVisibility,
  memberCount,
  settingsLocation,
  hubLocationLabel,
  connectLinks,
  isCreatorAdmin,
  onOpenConnectEditor,
  connectSuccess,
  connectError,
  isUploadingGallery,
  onOpenGalleryUpload,
  galleryInputRef,
  onGalleryChange,
  recentPhotos,
  creatorAvatarSrc,
  creatorDisplayName,
  creatorDetail,
  status,
  isAdminsEditorOpen,
  onOpenAdminsEditor,
  adminImages,
  dpImageSrc,
  coverImageSrc,
}: {
  CategoryIcon: LucideIcon;
  categoryLabel: string;
  hubName: string;
  hubDescription: string;
  settingsVisibility: "Public" | "Private";
  memberCount: number;
  settingsLocation: string;
  hubLocationLabel: string;
  connectLinks: { website: string; facebook: string; instagram: string; youtube: string; phone: string };
  isCreatorAdmin: boolean;
  onOpenConnectEditor: () => void;
  connectSuccess: string | null;
  connectError: string | null;
  isUploadingGallery: boolean;
  onOpenGalleryUpload: () => void;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onGalleryChange: React.ChangeEventHandler<HTMLInputElement>;
  recentPhotos: string[];
  creatorAvatarSrc: string;
  creatorDisplayName: string;
  creatorDetail: string;
  status: string;
  isAdminsEditorOpen: boolean;
  onOpenAdminsEditor: () => void;
  adminImages: string[];
  dpImageSrc: string;
  coverImageSrc: string;
}) {
  void isAdminsEditorOpen;

  return (
    <SectionShell title="About" description="A public-facing overview of this hub, its people, and the ways to stay connected.">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#F7FBFA_0%,#E6F4F1_55%,#FDFCF8_100%)] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.7fr)] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0C5C57] ring-1 ring-[#0C5C57]/10">
                <CategoryIcon className="h-3.5 w-3.5" />
                Welcome
              </div>
              <h3 className="mt-4 text-3xl font-serif font-semibold tracking-tight text-[#111111] sm:text-4xl">Discover {hubName}</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {hubDescription || "This hub is getting ready to welcome its first conversations, updates, and shared moments."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#12312D] shadow-sm ring-1 ring-[#0C5C57]/10">
                  <CategoryIcon className="h-4 w-4" />
                  {categoryLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#12312D] shadow-sm ring-1 ring-[#0C5C57]/10">
                  <Globe className="h-4 w-4" />
                  {settingsVisibility}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#12312D] shadow-sm ring-1 ring-[#0C5C57]/10">
                  <UsersRound className="h-4 w-4" />
                  {memberCount} members
                </span>
              </div>
            </div>

            <div className="grid gap-3 rounded-[24px] bg-white/80 p-4 shadow-sm ring-1 ring-white/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <Images className={ICON} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Visual Presence</p>
                  <p className="mt-1 text-sm font-medium text-[#111111]">
                    {recentPhotos.length > 0 ? `${recentPhotos.length} recent shared photos` : "Gallery ready for first shared moments"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <MapPin className={ICON} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Local Presence</p>
                  <p className="mt-1 text-sm font-medium text-[#111111]">{settingsLocation || hubLocationLabel || "Location coming soon"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Quick facts</h3>
            <p className="mt-1 text-sm text-slate-600">A fast look at how this hub is set up for the community.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Category", value: categoryLabel, icon: CategoryIcon },
              { label: "Visibility", value: settingsVisibility, icon: Globe },
              { label: "Location", value: settingsLocation || hubLocationLabel || "Not added yet", icon: MapPin },
              { label: "Members", value: String(memberCount), icon: UsersRound },
            ].map(({ label, value, icon: FactIcon }) => (
              <article key={label} className="rounded-[24px] bg-[#F7FBFA] p-5 shadow-sm ring-1 ring-[#0C5C57]/6">
                <span className={PREMIUM_ICON_WRAPPER}>
                  <FactIcon className={ICON} />
                </span>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-[#111111]">{value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Stay connected</h3>
                <p className="mt-1 text-sm text-slate-600">Reach this hub through its public links and contact points.</p>
              </div>
              {isCreatorAdmin ? (
                <button type="button" onClick={onOpenConnectEditor} className={ACTION_ICON_BUTTON} aria-label="Edit connect links" title="Edit connect links">
                  <Settings className={ACTION_ICON} />
                </button>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Globe, label: "Website", value: connectLinks.website, alwaysVisible: true, href: connectLinks.website || "#" },
                { icon: Facebook, label: "Facebook", value: connectLinks.facebook, href: connectLinks.facebook },
                { icon: Instagram, label: "Instagram", value: connectLinks.instagram, href: connectLinks.instagram },
                { icon: Youtube, label: "YouTube", value: connectLinks.youtube, href: connectLinks.youtube },
                { icon: Phone, label: "Phone", value: connectLinks.phone, href: connectLinks.phone ? `tel:${connectLinks.phone}` : undefined },
              ]
                .filter((item) => item.alwaysVisible || item.value)
                .map(({ icon: LinkIcon, label, value, href, alwaysVisible }) =>
                  value ? (
                    <a
                      key={label}
                      href={href}
                      target={label === "Phone" ? undefined : "_blank"}
                      rel={label === "Phone" ? undefined : "noreferrer"}
                      className="rounded-[20px] bg-white p-4 transition hover:-translate-y-0.5 hover:text-[#0C5C57] hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className={PREMIUM_ICON_WRAPPER}>
                          <LinkIcon className={ICON} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                          <p className="mt-1 truncate text-sm font-medium text-[#111111]">
                            {label === "Phone" ? value : displayLinkValue(value)}
                          </p>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div key={label} className="rounded-[20px] bg-white p-4 text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className={PREMIUM_ICON_WRAPPER}>
                          <LinkIcon className={ICON} />
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                          {alwaysVisible ? <p className="mt-1 text-sm italic">Not added yet</p> : null}
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>
            {connectSuccess ? <p className="mt-4 text-xs font-medium text-[#0C5C57]">{connectSuccess}</p> : null}
            {connectError ? <p className="mt-4 text-xs font-medium text-[#B42318]">{connectError}</p> : null}
          </div>

          <div className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
            <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">What defines this hub</h3>
            <p className="mt-1 text-sm text-slate-600">A simple preview of what people will notice first when they visit.</p>
            <div className="mt-5 grid gap-3">
              {[
                {
                  title: "Identity",
                  description: `This hub is presented as a ${categoryLabel.toLowerCase()} space with a clear public-facing presence.`,
                  icon: CategoryIcon,
                },
                {
                  title: "Community reach",
                  description: memberCount > 1 ? `${memberCount} people are already connected here.` : "This hub is ready to welcome its first members and shared updates.",
                  icon: UsersRound,
                },
                {
                  title: "Current activity",
                  description: recentPhotos.length > 0 ? `${recentPhotos.length} recent visual moments are already available in the gallery.` : "Photos, events, and shared highlights will appear here as the hub becomes more active.",
                  icon: Images,
                },
              ].map(({ title, description, icon: FeatureIcon }) => (
                <div key={title} className="rounded-[20px] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className={PREMIUM_ICON_WRAPPER}>
                      <FeatureIcon className={ICON} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#111111]">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <div className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Visual moments</h3>
                <p className="mt-1 text-sm text-slate-600">A polished gallery view of the imagery already connected to this hub.</p>
              </div>
              {isCreatorAdmin ? (
                <button type="button" onClick={onOpenGalleryUpload} disabled={isUploadingGallery} className={cn(BUTTON_SECONDARY, isUploadingGallery && "cursor-not-allowed opacity-70")}>
                  {isUploadingGallery ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading
                    </span>
                  ) : (
                    "Add Photo"
                  )}
                </button>
              ) : null}
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={onGalleryChange} className="hidden" />
            {recentPhotos.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentPhotos.slice(0, 6).map((photo, index) => (
                  <div key={`${photo}-${index}`} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div className="aspect-[4/3] bg-slate-100">
                      <ImageWithFallback
                        src={photo}
                        sources={[photo, coverImageSrc, dpImageSrc].filter(Boolean)}
                        alt={`${hubName} gallery ${index + 1}`}
                        className="h-full w-full object-cover"
                        fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-sm font-medium text-[#0C5C57]"
                        fallback="Photo"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[20px] bg-white p-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EAF6F3] text-[#0C5C57]">
                  <Images className="h-6 w-6 stroke-[1.8]" />
                </div>
                <h4 className="mt-4 text-lg font-serif font-semibold text-[#111111]">A gallery is ready to grow</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Shared images will appear here as this hub starts collecting moments, updates, and visual highlights.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[24px] bg-[#F7FBFA] p-6 shadow-sm ring-1 ring-[#0C5C57]/6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-serif font-semibold tracking-tight text-[#111111]">Community leadership</h3>
                <p className="mt-1 text-sm text-slate-600">A clear, welcoming snapshot of who is currently guiding this hub.</p>
              </div>
              {isCreatorAdmin ? (
                <button type="button" onClick={onOpenAdminsEditor} className={ACTION_ICON_BUTTON} aria-label="Manage hub admins" title="Manage hub admins">
                  <Settings className={ACTION_ICON} />
                </button>
              ) : null}
            </div>
            <div className="mt-5 rounded-[20px] bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                  <ImageWithFallback
                    src={creatorAvatarSrc}
                    sources={[creatorAvatarSrc, ...adminImages, dpImageSrc, coverImageSrc, ...recentPhotos]}
                    alt={creatorDisplayName}
                    className="h-full w-full object-cover"
                    fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-sm font-semibold text-[#111111]"
                    fallback={initials(creatorDisplayName)}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-tight text-[#111111]">{creatorDisplayName}</p>
                  <p className="mt-1 text-sm text-slate-500">{creatorDetail}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {status === "loading"
                  ? "Loading admin details..."
                  : isCreatorAdmin
                    ? "You created this hub and currently lead the first layer of community presence here."
                    : "The hub creator is currently the first visible point of contact for this community."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </SectionShell>
  );
}
