"use client";

import { useEffect, useState } from "react";
import type { CognitoSession, CognitoUser } from "@/lib/auth/cognito-session";
import { getCurrentSession } from "@/services/auth/getCurrentSession";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthSessionState = {
  status: AuthStatus;
  session: CognitoSession | null;
  user: CognitoUser | null;
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

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
