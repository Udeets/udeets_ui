"use client";

import { useEffect, useState } from "react";
import type { HubRecord } from "@/lib/hubs";
import { updateHub } from "@/lib/services/hubs/update-hub";

type UseHubSettingsFlowArgs = {
  hub: HubRecord;
  initialHubName: string;
  hubDescription: string;
  isCreatorAdmin: boolean;
  onAfterSave?: () => void;
};

export function useHubSettingsFlow({
  hub,
  initialHubName,
  hubDescription,
  isCreatorAdmin,
  onAfterSave,
}: UseHubSettingsFlowArgs) {
  const [savedHubName, setSavedHubName] = useState(initialHubName);
  const [savedHubCategory, setSavedHubCategory] = useState<HubRecord["category"]>(hub.category);
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

  const isDirty =
    settingsHubName.trim() !== savedHubName.trim() ||
    settingsCategory !== savedHubCategory;

  useEffect(() => {
    setSavedHubName(initialHubName);
    setSettingsHubName(initialHubName);
    setSavedHubCategory(hub.category);
    setSettingsCategory(hub.category);
    setSettingsDescription(hubDescription);
    setSettingsLocation(hub.locationLabel);
    setSettingsVisibility(hub.visibility);
    setSettingsDiscoverable(
      "discoverable" in hub ? Boolean((hub as HubRecord & { discoverable?: boolean }).discoverable) : true
    );
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

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateSettingsHubName = (value: string) => {
    setSettingsHubName(value);
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
  };

  const updateSettingsCategory = (value: HubRecord["category"]) => {
    setSettingsCategory(value);
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
  };

  const saveSettings = async () => {
    if (!isCreatorAdmin || !isDirty) return;
    setIsSavingSettings(true);
    setSettingsSaveError(null);
    setSettingsSaveSuccess(null);
    try {
      const updatedHub = await updateHub(hub.id, {
        name: settingsHubName,
        category: settingsCategory,
      });
      setSavedHubName(updatedHub.name);
      setSettingsHubName(updatedHub.name);
      setSavedHubCategory(updatedHub.category);
      setSettingsCategory(updatedHub.category);
      setSettingsSaveSuccess("Hub settings saved.");
      onAfterSave?.();
    } catch (error) {
      setSettingsSaveError(error instanceof Error ? error.message : "Hub settings could not be saved.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const resetSettings = () => {
    setSettingsHubName(savedHubName);
    setSettingsCategory(savedHubCategory);
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
    setSettingsDescription,
    setSettingsLocation,
    setSettingsVisibility,
    setSettingsDiscoverable,
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
