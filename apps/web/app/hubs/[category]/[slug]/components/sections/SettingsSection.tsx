"use client";

import { ChevronRight, Loader2, Palette, Save } from "lucide-react";
import type { HubRecord } from "@/lib/hubs";
import { HUB_COLOR_THEMES, type HubColorThemeKey } from "@/lib/hub-color-themes";
import type { HubMemberRoleItem } from "../hubTypes";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";

/* ── tiny primitives ─────────────────────────────────────────────── */

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-[#A9D1CA]" : "bg-slate-200"
      )}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200", checked ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

function GroupHeader({ title }: { title: string }) {
  return <h3 className="pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{title}</h3>;
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border-0 bg-transparent py-0 pr-6 text-right text-sm font-medium text-[#111111] outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      data-1p-ignore
      data-lpignore="true"
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#111111] outline-none transition focus:border-[#A9D1CA] focus:ring-1 focus:ring-[#A9D1CA]"
    />
  );
}

/* ── main component ──────────────────────────────────────────────── */

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
  settingsAccentColor,
  onSettingsAccentColorChange,
  settingsSaveSuccess,
  settingsSaveError,
  hubId,
  onShowDeleteModal,
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
  settingsAccentColor: HubColorThemeKey;
  onSettingsAccentColorChange: (value: HubColorThemeKey) => void;
  settingsSaveSuccess: string | null;
  settingsSaveError: string | null;
  hubId: string;
  onShowDeleteModal: () => void;
}) {
  return (
    <SectionShell
      title="Settings"
      description="Manage how this hub appears and behaves."
      actions={
        isDirty ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel} disabled={isSavingSettings} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSavingSettings || !isCreatorAdmin}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-[#0C5C57] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#094a46]",
                (isSavingSettings || !isCreatorAdmin) && "cursor-not-allowed opacity-60"
              )}
            >
              {isSavingSettings ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {isSavingSettings ? "Saving" : "Save"}
            </button>
          </div>
        ) : null
      }
    >
      <div className="space-y-6">
        {/* ── Profile ────────────────────────────────────────── */}
        <div>
          <GroupHeader title="Profile" />
          <div className="divide-y divide-slate-100">
            {/* Hub avatar */}
            <div className="flex items-center gap-3 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#A9D1CA]">
                <ImageWithFallback
                  src={dpImageSrc}
                  sources={[dpImageSrc, coverImageSrc]}
                  alt={settingsHubName}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[#A9D1CA] text-sm font-semibold text-[#111111]"
                  fallback={initials(settingsHubName)}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111111]">{settingsHubName || "Hub"}</p>
                <p className="text-xs text-slate-400">Change photo</p>
              </div>
            </div>
            {/* Hub name */}
            <div className="py-3">
              <span className="mb-1.5 block text-xs text-slate-400">Hub Name</span>
              <TextInput value={settingsHubName} onChange={onSettingsHubNameChange} placeholder="Hub name" />
            </div>
            <div className="py-3">
              <span className="mb-1.5 block text-xs text-slate-400">Description</span>
              <textarea
                value={settingsDescription}
                onChange={(e) => onSettingsDescriptionChange(e.target.value)}
                rows={3}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#111111] outline-none transition focus:border-[#A9D1CA] focus:ring-1 focus:ring-[#A9D1CA]"
              />
            </div>
            <SettingRow label="Category">
              <SelectInput
                value={settingsCategory}
                onChange={(v) => onSettingsCategoryChange(v as HubRecord["category"])}
                options={[
                  { value: "communities", label: "Community" },
                  { value: "restaurants", label: "Restaurant" },
                  { value: "religious-places", label: "Religious Place" },
                  { value: "fitness", label: "Fitness" },
                  { value: "pet-clubs", label: "Pet Club" },
                  { value: "hoa", label: "HOA" },
                  { value: "pta", label: "PTA" },
                  { value: "health-wellness", label: "Health & Wellness" },
                  { value: "home-services", label: "Home Services" },
                  { value: "retail", label: "Retail" },
                  { value: "events", label: "Events" },
                ]}
              />
            </SettingRow>
            <div className="py-3">
              <span className="mb-1.5 block text-xs text-slate-400">Location</span>
              <TextInput value={settingsLocation} onChange={onSettingsLocationChange} placeholder="City or address" />
            </div>
            {/* Accent color theme */}
            <div className="py-3">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                <Palette className="h-3 w-3" /> Hub Color Theme
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {HUB_COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.key}
                    type="button"
                    onClick={() => onSettingsAccentColorChange(theme.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition",
                      settingsAccentColor === theme.key
                        ? "border-slate-400 bg-slate-50 text-[#111111] shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: theme.swatch }}
                    />
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Privacy ────────────────────────────────────────── */}
        <div>
          <GroupHeader title="Privacy" />
          <div className="divide-y divide-slate-100">
            <SettingRow label="Visibility">
              <div className="flex gap-1">
                {(["Public", "Private"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSettingsVisibilityChange(v)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition",
                      settingsVisibility === v ? "bg-[#0C5C57] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </SettingRow>
            <SettingRow label="Show in Discover">
              <Toggle checked={settingsDiscoverable} onChange={onSettingsDiscoverableChange} />
            </SettingRow>
          </div>
        </div>

        {/* ── Notifications ──────────────────────────────────── */}
        <div>
          <GroupHeader title="Notifications" />
          <div className="divide-y divide-slate-100">
            <SettingRow label="In-app notifications">
              <Toggle checked={notificationsEnabled} onChange={onNotificationsEnabledChange} />
            </SettingRow>
          </div>
        </div>

        {/* ── Permissions ────────────────────────────────────── */}
        <div>
          <GroupHeader title="Permissions" />
          <div className="divide-y divide-slate-100">
            <SettingRow label="Member approval">
              <SelectInput
                value={approvalSetting}
                onChange={onApprovalSettingChange}
                options={[{ value: "Required", label: "Required" }, { value: "Open", label: "Open" }]}
              />
            </SettingRow>
            <SettingRow label="Who can post">
              <SelectInput
                value={whoCanPost}
                onChange={onWhoCanPostChange}
                options={[{ value: "Admins only", label: "Admins only" }, { value: "Admins and members", label: "Everyone" }]}
              />
            </SettingRow>
            <SettingRow label="Who can upload">
              <SelectInput
                value={whoCanUpload}
                onChange={onWhoCanUploadChange}
                options={[{ value: "Admins only", label: "Admins only" }, { value: "Admins and members", label: "Everyone" }]}
              />
            </SettingRow>
          </div>
        </div>

        {/* ── Members ────────────────────────────────────────── */}
        {memberRoleItems.length > 0 && (
          <div>
            <GroupHeader title="Members" />
            <div className="divide-y divide-slate-100">
              {memberRoleItems.map((member) => (
                <div key={member.name} className="flex items-center gap-3 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EAF6F3] text-[10px] font-semibold text-[#0C5C57]">
                    {initials(member.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#111111]">{member.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">{member.role}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Status messages ────────────────────────────────── */}
        {settingsSaveSuccess && <p className="rounded-lg bg-[#EAF6F3] px-3 py-2 text-xs font-medium text-[#0C5C57]">{settingsSaveSuccess}</p>}
        {settingsSaveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{settingsSaveError}</p>}

        {/* ── Danger Zone ────────────────────────────────────── */}
        {isCreatorAdmin && (
          <div className="border-t border-slate-100 pt-6">
            <GroupHeader title="Danger Zone" />
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-red-900">Delete this hub</p>
                  <p className="text-xs text-red-700">This action cannot be undone.</p>
                </div>
                <button
                  type="button"
                  onClick={onShowDeleteModal}
                  className="shrink-0 rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  Delete Hub
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
