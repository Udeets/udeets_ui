"use client";

import { ChevronRight, Loader2, Save } from "lucide-react";
import type { HubRecord } from "@/lib/hubs";
import type { HubMemberRoleItem } from "../hubTypes";
import { ImageWithFallback, cn, initials } from "../hubUtils";
import { SectionShell } from "../SectionShell";

/* ── tiny primitives ─────────────────────────────────────────────── */

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="shrink-0 text-sm text-[var(--ud-text-muted)]">{label}</span>
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
        checked ? "bg-[var(--ud-brand-primary)]" : "bg-slate-200"
      )}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200", checked ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

function GroupHeader({ title }: { title: string }) {
  return <h3 className="pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--ud-text-muted)]">{title}</h3>;
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border-0 bg-transparent py-0 pr-6 text-right text-sm font-medium text-[var(--ud-text-primary)] outline-none"
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
      className="w-full rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 py-2 text-sm text-[var(--ud-text-primary)] outline-none transition focus:border-[var(--ud-brand-primary)] focus:ring-1 focus:ring-[var(--ud-brand-primary)]"
    />
  );
}

/* ── main component ──────────────────────────────────────────────── */

export function SettingsSection({
  hubName,
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
  hubId,
  onShowDeleteModal,
}: {
  hubName?: string;
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
  hubId: string;
  onShowDeleteModal: () => void;
}) {
  return (
    <SectionShell
      title="Settings"
      description={hubName ? `${hubName} settings` : "Manage how this hub appears and behaves."}
      actions={
        isDirty ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel} disabled={isSavingSettings} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)]">
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSavingSettings || !isCreatorAdmin}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ud-brand-primary)] to-[var(--ud-brand-primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90",
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
          <div className="divide-y divide-[var(--ud-border)]">
            {/* Hub avatar */}
            <div className="flex items-center gap-3 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--ud-brand-primary)]">
                <ImageWithFallback
                  src={dpImageSrc}
                  sources={[dpImageSrc, coverImageSrc]}
                  alt={settingsHubName}
                  className="h-full w-full object-cover"
                  fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-primary)] text-sm font-semibold text-[var(--ud-text-primary)]"
                  fallback={initials(settingsHubName)}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--ud-text-primary)]">{settingsHubName || "Hub"}</p>
                <p className="text-xs text-[var(--ud-text-muted)]">Change photo</p>
              </div>
            </div>
            {/* Hub name */}
            <div className="py-3">
              <span className="mb-1.5 block text-xs text-[var(--ud-text-muted)]">Hub Name</span>
              <TextInput value={settingsHubName} onChange={onSettingsHubNameChange} placeholder="Hub name" />
            </div>
            <div className="py-3">
              <span className="mb-1.5 block text-xs text-slate-400">Description</span>
              <textarea
                value={settingsDescription}
                onChange={(e) => onSettingsDescriptionChange(e.target.value)}
                rows={3}
                autoComplete="off"
                className="w-full rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 py-2 text-sm text-[var(--ud-text-primary)] outline-none transition focus:border-[var(--ud-brand-primary)] focus:ring-1 focus:ring-[var(--ud-brand-primary)]"
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
              <span className="mb-1.5 block text-xs text-[var(--ud-text-muted)]">Location</span>
              <TextInput value={settingsLocation} onChange={onSettingsLocationChange} placeholder="City or address" />
            </div>
            {/* Hub Color Theme — removed */}
          </div>
        </div>

        {/* ── Privacy ────────────────────────────────────────── */}
        <div>
          <GroupHeader title="Privacy" />
          <div className="divide-y divide-[var(--ud-border)]">
            <SettingRow label="Visibility">
              <div className="flex gap-1">
                {(["Public", "Private"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSettingsVisibilityChange(v)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition",
                      settingsVisibility === v ? "bg-[var(--ud-brand-primary)] text-white" : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]"
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
          <div className="divide-y divide-[var(--ud-border)]">
            <SettingRow label="In-app notifications">
              <Toggle checked={notificationsEnabled} onChange={onNotificationsEnabledChange} />
            </SettingRow>
          </div>
        </div>

        {/* ── Permissions ────────────────────────────────────── */}
        <div>
          <GroupHeader title="Permissions" />
          <div className="divide-y divide-[var(--ud-border)]">
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
            <div className="divide-y divide-[var(--ud-border)]">
              {memberRoleItems.map((member) => (
                <div key={member.name} className="flex items-center gap-3 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--ud-brand-light)] text-[10px] font-semibold text-[var(--ud-brand-primary)]">
                    {initials(member.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--ud-text-primary)]">{member.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--ud-bg-subtle)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--ud-text-muted)]">{member.role}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--ud-border)]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Status messages ────────────────────────────────── */}
        {settingsSaveSuccess && <p className="rounded-lg bg-[var(--ud-brand-light)] px-3 py-2 text-xs font-medium text-[var(--ud-brand-primary)]">{settingsSaveSuccess}</p>}
        {settingsSaveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{settingsSaveError}</p>}

        {/* ── Danger Zone ────────────────────────────────────── */}
        {isCreatorAdmin && (
          <div className="border-t border-[var(--ud-border)] pt-6">
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
