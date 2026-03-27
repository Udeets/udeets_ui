"use client";

import { useState } from "react";

import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { signInWithGoogle } from "@/services/auth/signInWithGoogle";
import { signOut } from "@/services/auth/signOut";

type ResultState =
  | { type: "idle"; message: string; data: null }
  | { type: "success"; message: string; data: unknown }
  | { type: "error"; message: string; data: null };

const initialState: ResultState = {
  type: "idle",
  message: "Run an auth action to see results.",
  data: null,
};

export function AuthTestPanel() {
  const [result, setResult] = useState<ResultState>(initialState);
  const [isPending, setIsPending] = useState(false);

  async function handleSignInWithGoogle() {
    setIsPending(true);
    setResult({
      type: "idle",
      message: "Starting Google sign-in...",
      data: null,
    });

    try {
      await signInWithGoogle();
      setResult({
        type: "success",
        message: "Redirecting to Google sign-in...",
        data: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to sign in with Google.";

      setResult({
        type: "error",
        message,
        data: null,
      });
      setIsPending(false);
    }
  }

  async function handleGetCurrentSession() {
    setIsPending(true);
    setResult({
      type: "idle",
      message: "Loading current session...",
      data: null,
    });

    try {
      const session = await getCurrentSession();
      setResult({
        type: "success",
        message: session ? "Session loaded." : "No active session found.",
        data: session,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load session.";

      setResult({
        type: "error",
        message,
        data: null,
      });
    } finally {
      setIsPending(false);
    }
  }

  async function handleSignOut() {
    setIsPending(true);
    setResult({
      type: "idle",
      message: "Signing out...",
      data: null,
    });

    try {
      await signOut();
      setResult({
        type: "success",
        message: "Signed out successfully.",
        data: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sign out.";

      setResult({
        type: "error",
        message,
        data: null,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:bg-cyan-800"
          disabled={isPending}
          onClick={handleSignInWithGoogle}
          type="button"
        >
          Sign in with Google
        </button>
        <button
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          onClick={handleGetCurrentSession}
          type="button"
        >
          Get Current Session
        </button>
        <button
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          onClick={handleSignOut}
          type="button"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6">
        <p
          className={`text-sm ${
            result.type === "error" ? "text-rose-300" : "text-slate-300"
          }`}
        >
          {result.message}
        </p>
        <pre className="mt-4 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      </div>
    </section>
  );
}
