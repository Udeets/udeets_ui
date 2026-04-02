"use client";

export const dynamic = "force-dynamic";

import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { MyPostCard } from "./components/MyPostCard";
import { WorkflowStatCard } from "./components/WorkflowStatCard";
import { MY_POSTS, WORKFLOW_STATS } from "./data";

export default function MyPostsPage() {
  return (
    <MockAppShell activeNav="home">
      <section className="mb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">My Posts</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Manage the mock posts you have created for communities, events, and updates.
        </p>
      </section>

      <div className="space-y-4">
        {MY_POSTS.map((post) => <MyPostCard key={post.id} post={post} />)}
      </div>

      <section className={cardClass("mt-6 p-5 sm:p-6")}>
        <h2 className={sectionTitleClass()}>Post Workflow</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {WORKFLOW_STATS.map((stat) => <WorkflowStatCard key={stat.label} stat={stat} />)}
        </div>
      </section>
    </MockAppShell>
  );
}
