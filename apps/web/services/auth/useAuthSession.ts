"use client";

import { useEffect, useState } from "react";
import type { AuthSession, AuthUser } from "@/lib/auth/session";
import { AUTH_SESSION_CHANGED_EVENT } from "@/lib/auth/auth-session-events";
import { getCurrentSession } from "@/services/auth/getCurrentSession";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthSessionState = {
  status: AuthStatus;
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
};

export function useAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    status: "loading",
    session: null,
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session = await getCurrentSession();

        if (cancelled) return;

        setState({
          status: session ? "authenticated" : "unauthenticated",
          session,
          user: session?.user ?? null,
          isAuthenticated: Boolean(session),
        });
      } catch {
        if (cancelled) return;

        setState({
          status: "unauthenticated",
          session: null,
          user: null,
          isAuthenticated: false,
        });
      }
    }

    void loadSession();

    const onSessionChanged = () => {
      void loadSession();
    };
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);
    };
  }, []);

  return state;
}
