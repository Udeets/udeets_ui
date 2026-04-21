"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { UserProfileModal } from "./UserProfileModal";

/**
 * App-wide provider for the user profile modal. Any descendant can open the
 * modal by calling useUserProfileModal().openProfileModal(userId, context?).
 *
 * A single <UserProfileModal /> instance is rendered here when open, so we
 * don't duplicate DOM / listeners across the app.
 */

type ProfileContextValue = {
  openProfileModal: (userId: string, context?: string) => void;
  closeProfileModal: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function UserProfileModalProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<{ userId: string; context?: string } | null>(null);

  const openProfileModal = useCallback((userId: string, context?: string) => {
    if (!userId) return;
    setActive({ userId, context });
  }, []);
  const closeProfileModal = useCallback(() => setActive(null), []);

  const value = useMemo<ProfileContextValue>(() => ({ openProfileModal, closeProfileModal }), [openProfileModal, closeProfileModal]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
      {active ? (
        <UserProfileModal
          userId={active.userId}
          context={active.context}
          onClose={closeProfileModal}
        />
      ) : null}
    </ProfileContext.Provider>
  );
}

/**
 * Hook for any component that wants to trigger the profile modal. Safe to
 * call even when the provider isn't mounted (returns no-ops) so tests /
 * isolated renders don't crash.
 */
export function useUserProfileModal(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (ctx) return ctx;
  return {
    openProfileModal: () => {
      // Silently no-op if the provider isn't in the tree. Logging once helps
      // catch accidental unprovided callers in dev.
      if (typeof window !== "undefined") {
        console.warn("[useUserProfileModal] called outside <UserProfileModalProvider>");
      }
    },
    closeProfileModal: () => {},
  };
}
