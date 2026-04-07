"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { MyPostCard } from "./components/MyPostCard";
import { WorkflowStatCard } from "./components/WorkflowStatCard";
import type { MyPost, WorkflowStat } from "./types";

export default function MyPostsPage() {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [stats, setStats] = useState<WorkflowStat[]>([
    { label: "Total Posts", value: "0" },
    { label: "Hubs Active In", value: "0" },
    { label: "Total Likes", value: "0" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      // Fetch user's deets
      const { data: deets, error } = await supabase
        .from("deets")
        .select("id, hub_id, title, body, kind, created_at, like_count, comment_count, view_count")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error || cancelled) {
        console.error("[my-posts] Failed to load:", error);
        setLoading(false);
        return;
      }

      // Fetch hub names for each unique hub
      const hubIds = [...new Set((deets ?? []).map((d) => d.hub_id))];
      let hubMap: Record<string, string> = {};
      if (hubIds.length) {
        const { data: hubs } = await supabase
          .from("hubs")
          .select("id, name")
          .in("id", hubIds);
        hubMap = Object.fromEntries((hubs ?? []).map((h) => [h.id, h.name]));
      }

      if (cancelled) return;

      const mapped: MyPost[] = (deets ?? []).map((d) => ({
        id: d.id,
        title: d.title || "(Untitled)",
        type: d.kind ?? "Posts",
        status: "Published",
        audience: hubMap[d.hub_id] || "Unknown Hub",
        dateLabel: formatRelativeDate(d.created_at),
        body: stripHtml(d.body || ""),
        likeCount: d.like_count ?? 0,
        commentCount: d.comment_count ?? 0,
        viewCount: d.view_count ?? 0,
      }));

      setPosts(mapped);

      const totalLikes = mapped.reduce((sum, p) => sum + p.likeCount, 0);
      setStats([
        { label: "Total Posts", value: String(mapped.length) },
        { label: "Hubs Active In", value: String(hubIds.length) },
        { label: "Total Likes", value: String(totalLikes) },
      ]);
      setLoading(false);
    }

    void loadPosts();
    return () => { cancelled = true; };
  }, []);

  return (
    <AuthGuard>
      <MockAppShell activeNav="home">
        <section className="mb-4">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)]">My Posts</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
            All the deets you have posted across your hubs.
          </p>
        </section>

        {loading ? (
          <div className={cardClass("p-8 text-center")}>
            <p className="text-sm text-[var(--ud-text-muted)]">Loading your posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={cardClass("p-8 text-center")}>
            <h3 className="text-lg font-semibold text-[var(--ud-text-primary)]">No posts yet</h3>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              Posts you create in your hubs will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <MyPostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <section className={cardClass("mt-6 p-5 sm:p-6")}>
          <h2 className={sectionTitleClass()}>Post Stats</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <WorkflowStatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </section>
      </MockAppShell>
    </AuthGuard>
  );
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
