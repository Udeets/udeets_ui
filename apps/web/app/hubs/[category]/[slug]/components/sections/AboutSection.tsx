"use client";

import type { LucideIcon } from "lucide-react";
import { Camera, Facebook, Globe, Instagram, Loader2, MapPin, Phone, Settings, UsersRound, Youtube } from "lucide-react";
import { ACTION_ICON, ACTION_ICON_BUTTON, CARD, displayLinkValue, ImageWithFallback, initials, cn } from "../hubUtils";

export function AboutSection({
  CategoryIcon,
  categoryLabel,
  hubName,
  hubDescription,
  hubTagline,
  settingsVisibility,
  memberCount,
  settingsLocation,
  hubLocationLabel,
  connectLinks,
  isCreatorAdmin,
  userRole,
  onMembershipAction,
  onInviteMembers,
  onOpenConnectEditor,
  onOpenSettings,
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
  onOpenAdminsEditor,
  adminImages,
  dpImageSrc,
  coverImageSrc,
}: {
  CategoryIcon: LucideIcon;
  categoryLabel: string;
  hubName: string;
  hubDescription: string;
  hubTagline: string;
  settingsVisibility: "Public" | "Private";
  memberCount: number;
  settingsLocation: string;
  hubLocationLabel: string;
  connectLinks: { website: string; facebook: string; instagram: string; youtube: string; phone: string };
  isCreatorAdmin: boolean;
  userRole: string | null;
  onMembershipAction: () => void;
  onInviteMembers: () => void;
  onOpenConnectEditor: () => void;
  onOpenSettings: () => void;
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
  onOpenAdminsEditor: () => void;
  adminImages: string[];
  dpImageSrc: string;
  coverImageSrc: string;
}) {
  const connectItems = [
    { icon: Globe,     label: "Website",   value: connectLinks.website,   href: connectLinks.website },
    { icon: Phone,     label: "Phone",     value: connectLinks.phone,     href: connectLinks.phone ? `tel:${connectLinks.phone}` : "" },
    { icon: Facebook,  label: "Facebook",  value: connectLinks.facebook,  href: connectLinks.facebook },
    { icon: Instagram, label: "Instagram", value: connectLinks.instagram, href: connectLinks.instagram },
    { icon: Youtube,   label: "YouTube",   value: connectLinks.youtube,   href: connectLinks.youtube },
  ].filter((item) => item.value);

  const locationValue = settingsLocation || (hubLocationLabel !== "Location coming soon" ? hubLocationLabel : "");
  const photoStack = recentPhotos.slice(0, 4);
  const extraPhotos = recentPhotos.length > 4 ? recentPhotos.length - 4 : 0;
  const rotations = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

  const showConnectCard = connectItems.length > 0 || isCreatorAdmin;
  const showPhotosCard = recentPhotos.length > 0 || isCreatorAdmin;

  return (
    <section className={cn(CARD, "w-full min-w-0 p-5 sm:p-6")}>
      <div className="space-y-6">

        {/* BLOCK 1 — Welcome row */}
        <div className="border-b border-slate-100 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#111111]">Welcome to {hubName}!</h2>
            <div className="flex shrink-0 items-center gap-2">
              {!userRole ? (
                <button
                  type="button"
                  onClick={onMembershipAction}
                  className="rounded-xl border border-[#0C5C57] px-3 py-1 text-xs font-semibold text-[#0C5C57] transition hover:bg-[#EAF6F3]"
                >
                  Join
                </button>
              ) : null}
              {isCreatorAdmin ? (
                <button
                  type="button"
                  onClick={onInviteMembers}
                  className="rounded-xl px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-[#F7FBFA] hover:text-[#0C5C57]"
                >
                  Invite
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-1.5">
            {hubDescription ? (
              <p className="truncate text-sm text-slate-500">{hubDescription}</p>
            ) : null}
            {!hubDescription && !hubTagline && isCreatorAdmin ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <span className="font-medium text-[#111111]">Add a description</span>
                {" — "}Tell people what {hubName} is about, who it&apos;s for, and what they can expect.{" "}
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-[#0C5C57] underline underline-offset-2 transition hover:opacity-80"
                >
                  Add now →
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* BLOCK 2 — Connect + Photos */}
        {(showConnectCard || showPhotosCard) ? (
          <div className="grid gap-6 sm:grid-cols-2">

            {/* Connect */}
            {showConnectCard ? (
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-500">Connect</p>
                  {isCreatorAdmin ? (
                    <button type="button" onClick={onOpenConnectEditor} className={ACTION_ICON_BUTTON} aria-label="Edit connect links" title="Edit connect links">
                      <Settings className={ACTION_ICON} />
                    </button>
                  ) : null}
                </div>
                {connectItems.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {connectItems.map(({ icon: LinkIcon, label, value, href }) => (
                      <a
                        key={label}
                        href={href}
                        target={label === "Phone" ? undefined : "_blank"}
                        rel={label === "Phone" ? undefined : "noreferrer"}
                        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition hover:bg-[#F7FBFA]"
                      >
                        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="shrink-0 text-xs text-slate-400">{label}</span>
                        <span className="min-w-0 truncate text-xs font-medium text-[#111111]">
                          {label === "Phone" ? value : displayLinkValue(value)}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenConnectEditor}
                    className="mt-2 text-sm text-[#0C5C57] transition hover:underline"
                  >
                    Add contact info →
                  </button>
                )}
                {connectSuccess ? <p className="mt-2 text-xs font-medium text-[#0C5C57]">{connectSuccess}</p> : null}
                {connectError ? <p className="mt-2 text-xs font-medium text-[#B42318]">{connectError}</p> : null}
              </div>
            ) : null}

            {/* Photos */}
            {showPhotosCard ? (
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-500">Photos</p>
                  {isCreatorAdmin ? (
                    <button
                      type="button"
                      onClick={onOpenGalleryUpload}
                      disabled={isUploadingGallery}
                      className={cn(
                        "rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-[#A9D1CA] hover:text-[#0C5C57]",
                        isUploadingGallery && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {isUploadingGallery ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading
                        </span>
                      ) : (
                        "Add Photo"
                      )}
                    </button>
                  ) : null}
                </div>
                <input ref={galleryInputRef} type="file" accept="image/*" onChange={onGalleryChange} className="hidden" />

                {photoStack.length > 0 ? (
                  <div className="mt-3 flex items-center justify-start">
                    <div className="relative h-36 w-36">
                      {photoStack.map((photo, i) => (
                        <div
                          key={`${photo}-${i}`}
                          className={cn(
                            "absolute inset-0 overflow-hidden rounded-xl border-4 border-white bg-slate-100 shadow",
                            rotations[i] ?? ""
                          )}
                          style={{ zIndex: i + 1 }}
                        >
                          <ImageWithFallback
                            src={photo}
                            sources={[photo, coverImageSrc, dpImageSrc].filter(Boolean)}
                            alt={`${hubName} photo ${i + 1}`}
                            className="h-full w-full object-cover"
                            fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA]/35 text-xs text-[#0C5C57]"
                            fallback="Photo"
                          />
                        </div>
                      ))}
                      {extraPhotos > 0 ? (
                        <div className="absolute -bottom-2 -right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#0C5C57] text-[11px] font-bold text-white shadow">
                          +{extraPhotos}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7FBFA] px-4 py-3">
                    <Camera className="h-4 w-4 shrink-0 text-slate-400" />
                    <button
                      type="button"
                      onClick={onOpenGalleryUpload}
                      className="text-sm text-[#0C5C57] transition hover:underline"
                    >
                      Add photos to bring this hub to life
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* BLOCK 3 — Quick facts + Community leadership */}
        <div className="grid gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2">

          {/* Quick facts */}
          <div>
            <p className="text-sm font-medium text-slate-500">About this hub</p>
            <div className="mt-2 space-y-1.5">
              {[
                { icon: CategoryIcon, label: "Category",   value: categoryLabel },
                { icon: Globe,        label: "Visibility", value: settingsVisibility },
                { icon: UsersRound,   label: "Members",    value: `${memberCount} ${memberCount === 1 ? "member" : "members"}` },
                ...(locationValue ? [{ icon: MapPin, label: "Location", value: locationValue }] : []),
              ].map(({ icon: FactIcon, label, value }) => (
                <div key={label} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                  <FactIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="shrink-0 text-xs text-slate-400">{label}</span>
                  <span className="min-w-0 truncate text-xs font-medium text-[#111111]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Community leadership */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-500">Community leadership</p>
              {isCreatorAdmin ? (
                <button type="button" onClick={onOpenAdminsEditor} className={ACTION_ICON_BUTTON} aria-label="Manage hub admins" title="Manage hub admins">
                  <Settings className={ACTION_ICON} />
                </button>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#F7FBFA] px-3 py-3">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
                <ImageWithFallback
                  src={creatorAvatarSrc}
                  sources={[creatorAvatarSrc, ...adminImages, dpImageSrc, coverImageSrc, ...recentPhotos]}
                  alt={creatorDisplayName}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-xs font-semibold text-[#111111]"
                  fallback={initials(creatorDisplayName)}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111111]">{creatorDisplayName}</p>
                <p className="text-xs text-slate-400">{creatorDetail}</p>
              </div>
            </div>
            {status === "loading" ? (
              <p className="mt-2 text-xs text-slate-400">Loading details...</p>
            ) : null}
          </div>
        </div>

      </div>
    </section>
  );
}
