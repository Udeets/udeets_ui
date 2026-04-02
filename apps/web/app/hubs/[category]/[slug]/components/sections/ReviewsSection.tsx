"use client";

import { MessageSquare, Star } from "lucide-react";
import { SectionShell } from "../SectionShell";

export function ReviewsSection({
  hubName,
  isCreatorAdmin,
}: {
  hubName: string;
  isCreatorAdmin: boolean;
}) {
  // TODO: Wire to real reviews from DB
  const reviews: Array<{
    id: string;
    author: string;
    rating: number;
    text: string;
    date: string;
  }> = [];

  return (
    <SectionShell title="Reviews" description={`Community feedback and reviews for ${hubName}.`}>
      {reviews.length === 0 ? (
        <div className="grid min-h-[280px] w-full place-items-center text-center">
          <div className="w-full max-w-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6F3]">
              <Star className="h-7 w-7 text-[#0C5C57]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#111111]">No reviews yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Reviews from members and visitors will appear here.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0C5C57] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#094a46]"
            >
              <MessageSquare className="h-4 w-4" />
              Write a Review
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#111111]">{review.author}</p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{review.text}</p>
              <p className="mt-2 text-xs text-slate-400">{review.date}</p>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
