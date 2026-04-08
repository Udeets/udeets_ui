"use client";

import { useEffect, useState } from "react";
import type { HubRecord } from "@/lib/hubs";
import { updateHub } from "@/lib/services/hubs/update-hub";
import type { HubVisibility } from "@/lib/services/hubs/hub-types";

type UseHubSettingsFlowArgs = {
  hub: HubRecord;
  initialHubName: string;
  hubDescription: string;
  isCreatorAdmin: boolean;
  onAfterSave?: (savedCategory: string) => void;
};

export function useHubSettingsFlow({
  hub,
  initialHubName,
  hubDescription,
  isCreatorAdmin,
  onAfterSave,
}: UseHubSettingsFlowArgs) {
  /* ── saved (DB) snapshots ─────────────────────────────────────── */
  const [savedHubName, setSavedHubName] = useState(initialHubName);
  const [savedHubCategory, setSavedHubCategory] = useState<HubRecord["category"]>(hub.category);
  const [savedDescription, setSavedDescription] = useState(hubDescription);
  const [savedLocation, setSavedLocation] = useState(hub.locationLabel);
  const [savedVisibility, setSavedVisibility] = useState<HubRecord["visibility"]>(hub.visibility);
  const [savedDiscoverable, setSavedDiscoverable] = useState(
    "discoverable" in hub ? Boolean((hub as HubRecord & { discoverable?: boolean }).discoverable) : true
  );

  /* ── live (form) state ────────────────────────────────────────── */
  const [settingsHubName, setSettingsHubName] = useState(initialHubName);
  const [settingsCategory, setSettingsCategory] = useState<HubRecord["category"]>(hub.category);
  const [settingsDescription, setSettingsDescription] = useState(hubDescription);
  const [settingsLocation, setSettingsLocation] = useState(hub.locationLabel);
  const [settingsVisibility, setSettingsVisibility] = useState<HubRecord["visibility"]>(hub.visibility);
  const [settingsDiscoverable, setSettingsDiscoverable] = useState(
    "discoverable" in hub ? Boolean((hub as HubRecord & { discoverable?: boolean }).discoverable) : true
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [approvalSetting, setApprovalSetting] = useState(hub.visibility === "Private" ? "Required" : "Open");
  const [whoCanPost, setWhoCanPost] = useState("Admins and members");
  const [whoCanUpload, setWhoCanUpload] = useState("Admins and members");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(null);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState<string | null>(null);

  /* ── dirty check — any field changed? ─────────────────────────── */
  const isDirty =
    settingsHubName.trim() !== savedHubName.trim() ||
    settingsCategory !== savedHubCategory ||
    settingsDescription.trim() !== savedDescription.trim() ||
    settingsLocation.trim() !== savedLocation.trim() ||
    settingsVisibility !== savedVisibility ||
    settingsDiscoverable !== savedDiscoverable;

  /* ── sync from props when hub object changes ──────────────────── */
  useEffect(() => {
    setSavedHubName(initialHubName);
    setSettingsHubName(initialHubName);
    setSavedHubCategory(hub.category);
    setSettingsCategory(hub.category);
    setSavedDescription(hubDescription);
    setSettingsDescription(hubDescription);
    setSavedLocation(hub.locationLabel);
    setSettingsLocation(hub.locationLabel);
    setSavedVisibility(hub.visibility);
    setSettingsVisibility(hub.visibility);
    const disc = "discoverable" in hub ? Boolean((hub as HubRecord & { discoverable?: boolean }).discoverable) : true;
    setSavedDiscoverable(disc);
    setSettingsDiscoverable(disc);
    setApprovalSetting(hub.visibility === "Private" ? "Required" : "Open");
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
  }, [
    hub,
    hub.category,
    hub.visibility,
    hub.locationLabel,
    hubDescription,
    initialHubName,
  ]);

  /* ── unsaved-changes guard ────────────────────────────────────── */
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  /* ── field updaters (clear status on edit) ────────────────────── */
  const clearStatus = () => {
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
  };

  const updateSettingsHubName = (value: string) => {
    setSettingsHubName(value);
    clearStatus();
  };

  const updateSettingsCategory = (value: HubRecord["category"]) => {
    setSettingsCategory(value);
    clearStatus();
  };

  const updateSettingsVisibility = (value: HubRecord["visibility"]) => {
    setSettingsVisibility(value);
    // auto-toggle approval: private → Required, public → Open
    setApprovalSetting(value === "Private" ? "Required" : "Open");
    clearStatus();
  };

  const updateSettingsDescription = (value: string) => {
    setSettingsDescription(value);
    clearStatus();
  };

  const updateSettingsLocation = (value: string) => {
    setSettingsLocation(value);
    clearStatus();
  };

  const updateSettingsDiscoverable = (value: boolean) => {
    setSettingsDiscoverable(value);
    clearStatus();
  };

  /* ── save all changed fields ──────────────────────────────────── */
  const saveSettings = async () => {
    if (!isCreatorAdmin || !isDirty) return;
    setIsSavingSettings(true);
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
    try {
      // Build payload with only changed fields
      const payload: Parameters<typeof updateHub>[1] = {};

      if (settingsHubName.trim() !== savedHubName.trim()) {
        payload.name = settingsHubName;
      }
      if (settingsCategory !== savedHubCategory) {
        payload.category = settingsCategory;
      }
      if (settingsDescription.trim() !== savedDescription.trim()) {
        payload.description = settingsDescription;
      }
      if (settingsVisibility !== savedVisibility) {
        payload.visibility = settingsVisibility.toLowerCase() as HubVisibility;
      }
      if (settingsLocation.trim() !== savedLocation.trim()) {
        // Location is stored as city in the DB; we send the whole string as city
        payload.city = settingsLocation;
      }

      const updatedHub = await updateHub(hub.id, payload);

      // Sync saved snapshots
      setSavedHubName(updatedHub.name);
      setSettingsHubName(updatedHub.name);
      setSavedHubCategory(updatedHub.category);
      setSettingsCategory(updatedHub.category);
      const newDesc = updatedHub.description || "";
      setSavedDescription(newDesc);
      setSettingsDescription(newDesc);
      const newVis = updatedHub.visibility === "private" ? "Private" as const : "Public" as const;
      setSavedVisibility(newVis);
      setSettingsVisibility(newVis);
      const newLoc = [updatedHub.city, updatedHub.state, updatedHub.country].filter(Boolean).join(", ");
      setSavedLocation(newLoc);
      setSettingsLocation(newLoc);

      setSettingsSaveSuccess("Hub settings saved.");
      onAfterSave?.(updatedHub.category);
    } catch (error) {
      setSettingsSaveError(error instanceof Error ? error.message : "Hub settings could not be saved.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  /* ── reset to saved values ────────────────────────────────────── */
  const resetSettings = () => {
    setSettingsHubName(savedHubName);
    setSettingsCategory(savedHubCategory);
    setSettingsDescription(savedDescription);
    setSettingsLocation(savedLocation);
    setSettingsVisibility(savedVisibility);
    setSettingsDiscoverable(savedDiscoverable);
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
  };

  return {
    savedHubName,
    savedHubCategory,
    settingsHubName,
    settingsCategory,
    settingsDescription,
    settingsLocation,
    settingsVisibility,
    settingsDiscoverable,
    notificationsEnabled,
    approvalSetting,
    whoCanPost,
    whoCanUpload,
    isSavingSettings,
    settingsSaveError,
    settingsSaveSuccess,
    isDirty,
    setSettingsDescription: updateSettingsDescription,
    setSettingsLocation: updateSettingsLocation,
    setSettingsVisibility: updateSettingsVisibility,
    setSettingsDiscoverable: updateSettingsDiscoverable,
    setNotificationsEnabled,
    setApprovalSetting,
    setWhoCanPost,
    setWhoCanUpload,
    updateSettingsHubName,
    updateSettingsCategory,
    saveSettings,
    resetSettings,
  };
}
