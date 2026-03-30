"use client";

import { useEffect, useState } from "react";
import type { HubRecord } from "@/lib/hubs";
import { updateHub } from "@/lib/services/hubs/update-hub";
import type { ConnectLinks } from "../components/hubTypes";

function connectLinksFromHub(hub: HubRecord): ConnectLinks {
  return {
    website: hub.website ?? "",
    facebook: hub.facebookUrl ?? "",
    instagram: hub.instagramUrl ?? "",
    youtube: hub.youtubeUrl ?? "",
    phone: hub.phoneNumber ?? "",
  };
}

export function useHubConnectFlow(hub: HubRecord) {
  const [isConnectEditorOpen, setIsConnectEditorOpen] = useState(false);
  const [isSavingConnect, setIsSavingConnect] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const [connectLinks, setConnectLinks] = useState<ConnectLinks>(() => connectLinksFromHub(hub));
  const [connectDraft, setConnectDraft] = useState<ConnectLinks>(() => connectLinksFromHub(hub));

  useEffect(() => {
    const nextLinks = connectLinksFromHub(hub);
    setConnectLinks(nextLinks);
    setConnectDraft(nextLinks);
  }, [hub, hub.facebookUrl, hub.instagramUrl, hub.phoneNumber, hub.website, hub.youtubeUrl]);

  const openConnectEditor = () => {
    setConnectDraft(connectLinks);
    setConnectError(null);
    setConnectSuccess(null);
    setIsConnectEditorOpen(true);
  };

  const closeConnectEditor = () => {
    setIsConnectEditorOpen(false);
  };

  const handleConnectChange =
    (field: keyof ConnectLinks) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setConnectDraft((current) => ({ ...current, [field]: event.target.value }));
    };

  const saveConnect = async () => {
    setIsSavingConnect(true);
    setConnectError(null);
    setConnectSuccess(null);
    try {
      const updatedHub = await updateHub(hub.id, {
        websiteUrl: connectDraft.website,
        facebookUrl: connectDraft.facebook,
        instagramUrl: connectDraft.instagram,
        youtubeUrl: connectDraft.youtube,
        phoneNumber: connectDraft.phone,
      });

      const nextConnectLinks = {
        website: updatedHub.website_url ?? "",
        facebook: updatedHub.facebook_url ?? "",
        instagram: updatedHub.instagram_url ?? "",
        youtube: updatedHub.youtube_url ?? "",
        phone: updatedHub.phone_number ?? "",
      };

      setConnectLinks(nextConnectLinks);
      setConnectDraft(nextConnectLinks);
      setConnectSuccess("Connect links updated.");
      setIsConnectEditorOpen(false);
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : "Connect links could not be saved.");
    } finally {
      setIsSavingConnect(false);
    }
  };

  return {
    isConnectEditorOpen,
    isSavingConnect,
    connectError,
    connectSuccess,
    connectLinks,
    connectDraft,
    openConnectEditor,
    closeConnectEditor,
    handleConnectChange,
    saveConnect,
  };
}
