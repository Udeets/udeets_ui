"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getCurrentSession } from "@/services/auth/getCurrentSession";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthSessionState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
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
    const supabase = createClient();

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;

      setState({
        status: session ? "authenticated" : "unauthenticated",
        session,
        user: session?.user ?? null,
        isAuthenticated: Boolean(session),
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
