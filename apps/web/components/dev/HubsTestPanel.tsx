"use client";

import { useState } from "react";

import { getCurrentSession } from "@/services/auth/getCurrentSession";
import { createHub } from "@/services/hubs/createHub";
import { listHubs } from "@/services/hubs/listHubs";
import type { Hub } from "@/types/hub";

type ResultState =
  | { type: "idle"; message: string; data: null }
  | { type: "success"; message: string; data: Hub | Hub[] }
  | { type: "error"; message: string; data: null };

const initialState: ResultState = {
  type: "idle",
  message: "Run a test action to see results.",
  data: null,
};

export function HubsTestPanel() {
  const [result, setResult] = useState<ResultState>(initialState);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreateTestHub() {
    const timestamp = Date.now();
    const slug = `test-hub-${timestamp}`;

    setIsCreating(true);
    setResult({
      type: "idle",
      message: `Creating test hub with slug "${slug}"...`,
      data: null,
    });

    try {
      const session = await getCurrentSession();
      const userId = session?.user.id;

      if (!userId) {
        throw new Error(
          "You must be signed in to create a test hub. Use the auth test page first.",
        );
      }

      const hub = await createHub({
        name: `Test Hub ${timestamp}`,
        slug,
        category: "communities",
        tagline: "Temporary hub created from the dev test page.",
        description: "Used to validate the initial hubs service layer.",
        city: "Richmond",
        state: "VA",
        country: "USA",
        created_by: userId,
      });

      setResult({
        type: "success",
        message: `Test hub created successfully for signed-in user ${userId}.`,
        data: hub,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create test hub.";

      setResult({
        type: "error",
        message,
        data: null,
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleLoadHubs() {
    setIsLoading(true);
    setResult({
      type: "idle",
      message: "Loading hubs...",
      data: null,
    });

    try {
      const session = await getCurrentSession();
      const userId = session?.user.id;

      if (!userId) {
        throw new Error("You must be signed in to load hubs.");
      }

      const hubs = await listHubs();

      setResult({
        type: "success",
        message: `Loaded ${hubs.length} hub${hubs.length === 1 ? "" : "s"}.`,
        data: hubs,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load hubs.";

      setResult({
        type: "error",
        message,
        data: null,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:bg-cyan-800"
          disabled={isCreating || isLoading}
          onClick={handleCreateTestHub}
          type="button"
        >
          {isCreating ? "Creating..." : "Create Test Hub"}
        </button>
        <button
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isCreating || isLoading}
          onClick={handleLoadHubs}
          type="button"
        >
          {isLoading ? "Loading..." : "Load Hubs"}
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
