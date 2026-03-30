"use client";

import { cardClass } from "@/components/mock-app-shell";
import type { MyPost } from "../types";

export function MyPostCard({ post }: { post: MyPost }) {
  return (
    <article className={cardClass("p-5 sm:p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#A9D1CA] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111]">
              {post.type}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {post.status}
            </span>
            <span className="text-xs text-slate-500">{post.dateLabel}</span>
          </div>
          <h2 className="mt-3 text-xl font-serif font-semibold text-[#111111]">{post.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.body}</p>
          <p className="mt-3 text-sm text-slate-500">Audience: {post.audience}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
