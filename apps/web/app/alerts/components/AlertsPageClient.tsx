"use client";

import { AlertTriangle, Bell, BellOff, Loader2, Megaphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import { listMyMemberships } from "@/lib/services/members/list-my-memberships";
import { listHubs } from "@/lib/services/hubs/list-hubs";
import type { DeetRecord } from "@/lib/services/deets/deet-types";

interface AlertItem {
  id: string;
  title: string;
  body: string;
  source: string;
  hubName: string;
  hubHref: string;
  kind: string;
  time: string;
  isAlert: boolean;
}

function formatAlertTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function resolveAlertKind(deet: DeetRecord): string {
  const kind = deet.kind?.toLowerCase() || "";
  if (kind === "alerts") return "alert";
  if (kind === "notices") return "notice";
  if (kind === "hazards") return "hazard";
  // Check attachments for type hints
  if (deet.attachments?.length) {
    for (const att of deet.attachments) {
      if (att.type === "notice" || att.type === "alert" || att.type === "hazard") return att.type;
    }
  }
  return "announcement";
}

const ALERT_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  alert: { bg: "bg-red-100", text: "text-red-700", label: "Alert" },
  hazard: { bg: "bg-orange-100", text: "text-orange-700", label: "Hazard" },
  notice: { bg: "bg-amber-100", text: "text-amber-700", label: "Notice" },
  announcement: { bg: "bg-blue-100", text: "text-blue-700", label: "Announcement" },
};

export default function AlertsPageClient() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hubMap, setHubMap] = useState<Map<string, { name: string; href: string }>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        // Get user's hub memberships
        const memberships = await listMyMemberships();
        const hubIds = memberships.map((m) => m.hubId);

        if (!hubIds.length) {
          if (!cancelled) {
            setAlerts([]);
            setIsLoading(false);
          }
          return;
        }

        // Fetch hub info for mapping names
        const hubs = await listHubs();
        const hMap = new Map<string, { name: string; href: string }>();
        for (const hub of hubs) {
          hMap.set(hub.id, { name: hub.name, href: `/hubs/${hub.category}/${hub.slug}` });
        }
        if (!cancelled) setHubMap(hMap);

        // Fetch all deets from user's hubs, then filter for alert-like types
        const allDeets = await listDeets({ hubIds, limit: 200 });

        const alertKinds = new Set(["Alerts", "Notices", "Hazards"]);
        const alertDeets = allDeets.filter((d) => {
          // Include deets with alert-like kinds
          if (alertKinds.has(d.kind)) return true;
          // Include deets with alert/notice/hazard attachments
          if (d.attachments?.some((a) => a.type === "notice" || a.type === "alert" || a.type === "hazard")) return true;
          return false;
        });

        if (!cancelled) {
          setAlerts(
            alertDeets.map((d) => {
              const hubInfo = hMap.get(d.hub_id);
              const alertKind = resolveAlertKind(d);
              return {
                id: d.id,
                title: d.title || "Untitled Alert",
                body: d.body || "",
                source: d.author_name || "Hub member",
                hubName: hubInfo?.name || "Hub",
                hubHref: hubInfo?.href || "/dashboard",
                kind: alertKind,
                time: formatAlertTime(d.created_at),
                isAlert: alertKind === "alert" || alertKind === "hazard",
              };
            })
          );
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load alerts:", err);
        if (!cancelled) {
          setAlerts([]);
          setIsLoading(false);
        }
      }
    }

    void loadAlerts();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToDeets(() => {
      void loadAlerts();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const importantCount = alerts.filter((a) => a.isAlert).length;
  const totalCount = alerts.length;

  return (
    <MockAppShell activeNav="alerts">
      <section className="mb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Alerts</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
          Notifications from the hubs and communities you follow.
        </p>
      </section>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--ud-brand-primary)]" />
          </div>
        ) : alerts.length ? (
          alerts.map((alert) => {
            const badge = ALERT_BADGE_STYLES[alert.kind] || ALERT_BADGE_STYLES.announcement;
            return (
              <article key={alert.id} className={cardClass("p-5 sm:p-6")}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  <Link
                    href={alert.hubHref}
                    className="text-xs font-medium text-[var(--ud-brand-primary)] hover:underline"
                  >
                    {alert.hubName}
                  </Link>
                  <span className="text-xs text-[var(--ud-text-muted)]">{alert.time}</span>
                </div>
                {(() => {
                  const genericTitles = new Set(["Notice", "Untitled Alert", "Deet", "News", "Deal", "Hazard", "Alert", "Photo"]);
                  const cleanBody = alert.body ? alert.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
                  const hasOriginalTitle = !!(alert.title && !genericTitles.has(alert.title));
                  const displayTitle = hasOriginalTitle ? alert.title : (cleanBody.slice(0, 80) || badge.label);
                  return (
                    <>
                      <h2 className="mt-3 text-lg font-semibold text-[var(--ud-text-primary)]">{displayTitle}</h2>
                      <p className="mt-1 text-sm font-medium text-[var(--ud-text-muted)]">{alert.source}</p>
                      {hasOriginalTitle && cleanBody && (
                        <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)] line-clamp-3">
                          {cleanBody}
                        </p>
                      )}
                    </>
                  );
                })()}
              </article>
            );
          })
        ) : (
          <article className={cardClass("p-5 text-center sm:p-6")}>
            <div className="flex justify-center">
              <Bell className="h-8 w-8 text-[var(--ud-text-muted)]" />
            </div>
            <h2 className="mt-3 text-xl font-semibold text-[var(--ud-text-primary)]">No alerts yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
              Hub alerts, notices, and hazard warnings will appear here when your hubs publish them.
            </p>
          </article>
        )}
      </div>

      <section className={cardClass("mt-6 p-5 sm:p-6")}>
        <h2 className={sectionTitleClass()}>Summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[var(--ud-bg-subtle)] p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--ud-text-muted)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">Total</p>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--ud-text-primary)]">{totalCount}</p>
          </div>
          <div className="rounded-2xl bg-[var(--ud-bg-subtle)] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--ud-text-muted)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">Important</p>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--ud-text-primary)]">{importantCount}</p>
          </div>
          <div className="rounded-2xl bg-[var(--ud-bg-subtle)] p-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[var(--ud-text-muted)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">Announcements</p>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--ud-text-primary)]">{totalCount - importantCount}</p>
          </div>
        </div>
      </section>
    </MockAppShell>
  );
}
