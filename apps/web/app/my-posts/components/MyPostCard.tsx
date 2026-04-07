"use client";

import { Heart, MessageCircle, Eye } from "lucide-react";
import { cardClass } from "@/components/mock-app-shell";
import type { MyPost } from "../types";

export function MyPostCard({ post }: { post: MyPost }) {
  return (
    <article className={cardClass("p-5 sm:p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--ud-brand-light)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ud-brand-primary)]">
              {post.type}
            </span>
            <span className="text-xs text-[var(--ud-text-muted)]">{post.dateLabel}</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-[var(--ud-text-primary)]">{post.title}</h2>
          {post.body && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--ud-text-secondary)]">{post.body}</p>
          )}
          <p className="mt-3 text-sm text-[var(--ud-text-muted)]">{post.audience}</p>
        </div>

        <div className="flex items-center gap-4 text-[var(--ud-text-muted)]">
          <span className="flex items-center gap-1 text-xs">
            <Heart className="h-3.5 w-3.5" strokeWidth={1.5} /> {post.likeCount}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} /> {post.commentCount}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> {post.viewCount}
          </span>
        </div>
      </div>
    </article>
  );
}
