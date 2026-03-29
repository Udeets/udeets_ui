"use client";

import { Loader2, UserCog } from "lucide-react";
import type { HubRecord } from "@/lib/hubs";
import type { HubMemberRoleItem } from "../hubTypes";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, ImageWithFallback, SettingField, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";

export function SettingsSection({
  isDirty,
  isSavingSettings,
  isCreatorAdmin,
  onCancel,
  onSave,
  dpImageSrc,
  coverImageSrc,
  settingsHubName,
  onSettingsHubNameChange,
  settingsDescription,
  onSettingsDescriptionChange,
  settingsCategory,
  onSettingsCategoryChange,
  settingsLocation,
  onSettingsLocationChange,
  settingsVisibility,
  onSettingsVisibilityChange,
  settingsDiscoverable,
  onSettingsDiscoverableChange,
  notificationsEnabled,
  onNotificationsEnabledChange,
  memberRoleItems,
  approvalSetting,
  onApprovalSettingChange,
  whoCanPost,
  onWhoCanPostChange,
  whoCanUpload,
  onWhoCanUploadChange,
  settingsSaveSuccess,
  settingsSaveError,
}: {
  isDirty: boolean;
  isSavingSettings: boolean;
  isCreatorAdmin: boolean;
  onCancel: () => void;
  onSave: () => void;
  dpImageSrc: string;
  coverImageSrc: string;
  settingsHubName: string;
  onSettingsHubNameChange: (value: string) => void;
  settingsDescription: string;
  onSettingsDescriptionChange: (value: string) => void;
  settingsCategory: HubRecord["category"];
  onSettingsCategoryChange: (value: HubRecord["category"]) => void;
  settingsLocation: string;
  onSettingsLocationChange: (value: string) => void;
  settingsVisibility: "Public" | "Private";
  onSettingsVisibilityChange: (value: "Public" | "Private") => void;
  settingsDiscoverable: boolean;
  onSettingsDiscoverableChange: (value: boolean) => void;
  notificationsEnabled: boolean;
  onNotificationsEnabledChange: (value: boolean) => void;
  memberRoleItems: HubMemberRoleItem[];
  approvalSetting: string;
  onApprovalSettingChange: (value: string) => void;
  whoCanPost: string;
  onWhoCanPostChange: (value: string) => void;
  whoCanUpload: string;
  onWhoCanUploadChange: (value: string) => void;
  settingsSaveSuccess: string | null;
  settingsSaveError: string | null;
}) {
  return (
    <SectionShell
      title="Settings"
      description="Manage how this hub appears and behaves across uDeets."
      actions={
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} disabled={!isDirty || isSavingSettings} className={cn(BUTTON_SECONDARY, (!isDirty || isSavingSettings) && "cursor-not-allowed opacity-60")}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty || isSavingSettings || !isCreatorAdmin}
            className={cn(BUTTON_PRIMARY, (!isDirty || isSavingSettings || !isCreatorAdmin) && "cursor-not-allowed opacity-60")}
          >
            {isSavingSettings ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-serif font-semibold text-[#111111]">Profile</h3>
          <p className="mt-1 text-sm text-slate-600">Update how your hub appears to members across uDeets.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-[120px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-[#A9D1CA]">
              <ImageWithFallback
                src={dpImageSrc}
                sources={[dpImageSrc, coverImageSrc]}
                alt={`${settingsHubName} display`}
                className="h-full w-full object-cover"
                fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-lg font-semibold text-[#111111]"
                fallback={initials(settingsHubName)}
              />
            </div>
            <button type="button" className={BUTTON_SECONDARY}>
              Change DP
            </button>
          </div>
          <div className="space-y-4">
            <SettingField label="Hub Name">
              <input
                value={settingsHubName}
                onChange={(event) => onSettingsHubNameChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
              />
            </SettingField>
            <SettingField label="Cover Image">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-[#F7FBFA] px-4 py-4 text-sm text-slate-500">
                Cover image ready. Upload controls can be added next.
              </div>
            </SettingField>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-serif font-semibold text-[#111111]">Notifications</h3>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F7FBFA] px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-[#111111]">In-app notifications</p>
              <p className="mt-1 text-xs text-slate-500">Receive activity updates for this hub inside uDeets.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              onClick={() => onNotificationsEnabledChange(!notificationsEnabled)}
              className={cn("relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-200", notificationsEnabled ? "bg-[#A9D1CA] ring-1 ring-[#0C5C57]/15" : "bg-slate-300")}
            >
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200", notificationsEnabled ? "left-6" : "left-1")} />
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-serif font-semibold text-[#111111]">Hub Info</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SettingField label="Description">
              <textarea
                value={settingsDescription}
                onChange={(event) => onSettingsDescriptionChange(event.target.value)}
                rows={4}
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
              />
            </SettingField>
            <div className="space-y-4">
              <SettingField label="Category">
                <select
                  value={settingsCategory}
                  onChange={(event) => onSettingsCategoryChange(event.target.value as HubRecord["category"])}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
                >
                  <option value="communities">Community</option>
                  <option value="religious-places">Religious Place</option>
                  <option value="restaurants">Restaurant</option>
                  <option value="fitness">Fitness</option>
                  <option value="pet-clubs">Pet Club</option>
                  <option value="hoa">HOA</option>
                </select>
              </SettingField>
              <SettingField label="Location">
                <input
                  value={settingsLocation}
                  onChange={(event) => onSettingsLocationChange(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
                />
              </SettingField>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-serif font-semibold text-[#111111]">Visibility</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(["Public", "Private"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSettingsVisibilityChange(value)}
                className={cn(
                  "rounded-3xl border px-5 py-5 text-left transition",
                  settingsVisibility === value ? "border-[#0C5C57] bg-[#EAF6F3]" : "border-slate-200 bg-white hover:border-[#A9D1CA]"
                )}
              >
                <p className="text-base font-serif font-semibold text-[#111111]">{value}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F7FBFA] px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-[#111111]">Show this hub in Discover</p>
              <p className="mt-1 text-xs text-slate-500">Control whether new people can find this hub in discovery.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settingsDiscoverable}
              onClick={() => onSettingsDiscoverableChange(!settingsDiscoverable)}
              className={cn("relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-200", settingsDiscoverable ? "bg-[#A9D1CA] ring-1 ring-[#0C5C57]/15" : "bg-slate-300")}
            >
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200", settingsDiscoverable ? "left-6" : "left-1")} />
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-serif font-semibold text-[#111111]">Members</h3>
          <div className="mt-4 space-y-3">
            {memberRoleItems.length ? (
              memberRoleItems.map((member) => (
                <div key={member.name} className="flex items-center justify-between rounded-2xl bg-[#F7FBFA] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#A9D1CA] text-sm font-semibold text-[#111111]">
                      {initials(member.name)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#111111]">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                  <UserCog className="h-4.5 w-4.5 text-slate-400" />
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-[#F7FBFA] px-4 py-4 text-sm text-slate-600">No members yet. Invite people after your first post.</div>
            )}
          </div>
          <div className="mt-4">
            <SettingField label="Approval Settings">
              <select
                value={approvalSetting}
                onChange={(event) => onApprovalSettingChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
              >
                <option>Required</option>
                <option>Open</option>
              </select>
            </SettingField>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-serif font-semibold text-[#111111]">Content Settings</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SettingField label="Who can post">
              <select value={whoCanPost} onChange={(event) => onWhoCanPostChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2">
                <option>Admins only</option>
                <option>Admins and members</option>
              </select>
            </SettingField>
            <SettingField label="Who can upload files/photos">
              <select value={whoCanUpload} onChange={(event) => onWhoCanUploadChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2">
                <option>Admins only</option>
                <option>Admins and members</option>
              </select>
            </SettingField>
          </div>
        </div>

        {settingsSaveSuccess ? <p className="text-sm font-medium text-[#0C5C57]">{settingsSaveSuccess}</p> : null}
        {settingsSaveError ? <p className="text-sm font-medium text-[#B42318]">{settingsSaveError}</p> : null}
      </div>
    </SectionShell>
  );
}
