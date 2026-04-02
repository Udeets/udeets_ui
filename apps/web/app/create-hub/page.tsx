"use client";

export const dynamic = "force-dynamic";

import confetti from "canvas-confetti";
import { ArrowLeft, CheckCircle, X } from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createHub } from "@/lib/services/hubs/create-hub";
import { categoryFor, cn, descriptionFor, slugify } from "./helpers";
import type { Visibility } from "./types";

type Step = 1 | 2 | 3;
type PostingPerm = "broadcast" | "admin_members" | "open";

function StepDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {([1, 2, 3] as const).map((s) => (
        <div
          key={s}
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            s <= current ? "bg-[#0C5C57]" : "bg-gray-300"
          )}
        />
      ))}
    </div>
  );
}

function CreateHubPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoPreview = searchParams.get("demo_preview") === "1";

  const [step, setStep] = useState<Step>(1);
  const [hubName, setHubName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Public");
  const [postingPerm, setPostingPerm] = useState<PostingPerm>("admin_members");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdHubHref, setCreatedHubHref] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const trimmedName = hubName.trim();
  const isNameValid = trimmedName.length > 0 && trimmedName.length <= 50;

  const close = () => router.push("/dashboard");

  const handleCreate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isDemoPreview) {
        setCreatedHubHref("/hubs/communities/demo-hub");
        setShowSuccess(true);
                // Staggered "pop pop pop" confetti bursts from multiple origins
        const confettiColors = ["#0C5C57", "#A9D1CA", "#E3F1EF", "#ffffff", "#1a8a82", "#FFD700", "#FFC107"];
        confetti({ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.6 }, colors: confettiColors });
        setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.3, y: 0.5 }, colors: confettiColors }), 150);
        setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.7, y: 0.5 }, colors: confettiColors }), 300);
        setTimeout(() => confetti({ particleCount: 40, spread: 120, origin: { x: 0.5, y: 0.4 }, colors: confettiColors }), 500);
        return;
      }

      const timestamp = Date.now();
      const slug = `${slugify(trimmedName)}-${timestamp}`;
      const category = categoryFor([]);
      const createdHub = await createHub({
        name: trimmedName,
        slug,
        category,
        tagline: `${trimmedName} on uDeets`,
        description: descriptionFor([]),
      });

      setCreatedHubHref(`/hubs/${createdHub.category}/${createdHub.slug}`);
      setShowSuccess(true);
              // Staggered "pop pop pop" confetti bursts from multiple origins
        const confettiColors = ["#0C5C57", "#A9D1CA", "#E3F1EF", "#ffffff", "#1a8a82", "#FFD700", "#FFC107"];
        confetti({ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.6 }, colors: confettiColors });
        setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.3, y: 0.5 }, colors: confettiColors }), 150);
        setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.7, y: 0.5 }, colors: confettiColors }), 300);
        setTimeout(() => confetti({ particleCount: 40, spread: 120, origin: { x: 0.5, y: 0.4 }, colors: confettiColors }), 500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create hub.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md animate-[scaleIn_150ms_ease-out] rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header row */}
        <div className="mb-5 flex items-center justify-between">
          {step > 1 && !showSuccess ? (
            <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="text-gray-400 transition hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}
          <StepDots current={showSuccess ? 3 : step} />
          <button type="button" onClick={close} className="text-gray-400 transition hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SUCCESS STATE */}
        {showSuccess ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF6F3]">
              <CheckCircle className="h-8 w-8 text-[#0C5C57]" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">{trimmedName} is ready!</h2>
            <div className="mt-6 flex w-full flex-col gap-3">
              {createdHubHref ? (
                <button
                  type="button"
                  onClick={() => router.push(createdHubHref)}
                  className="w-full rounded-xl bg-[#0C5C57] py-3 text-sm font-semibold text-white transition hover:bg-[#094a46]"
                >
                  Go to Hub
                </button>
              ) : null}
              <button
                type="button"
                onClick={close}
                className="text-sm font-medium text-gray-500 transition hover:text-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : null}

        {/* STEP 1 — Hub Name */}
        {!showSuccess && step === 1 ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create a Hub</h2>
            <div className="mt-5">
              <input
                value={hubName}
                onChange={(e) => setHubName(e.target.value.slice(0, 50))}
                placeholder="e.g. HCV Temple, Richmond Foodies..."
                autoFocus
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#A9D1CA] focus:ring-2 focus:ring-[#A9D1CA]"
              />
              <p className="mt-2 text-right text-xs text-gray-400">{hubName.length}/50</p>
            </div>
            {errorMessage ? <p className="mt-3 text-sm text-rose-600">{errorMessage}</p> : null}
            <button
              type="button"
              disabled={!isNameValid}
              onClick={() => setStep(2)}
              className={cn(
                "mt-4 w-full rounded-xl py-3 text-sm font-semibold transition",
                isNameValid
                  ? "bg-[#0C5C57] text-white hover:bg-[#094a46]"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
              )}
            >
              Next →
            </button>
          </div>
        ) : null}

        {/* STEP 2 — Visibility */}
        {!showSuccess && step === 2 ? (
          <div>
            <p className="text-sm text-gray-400">{trimmedName}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">Who can find this hub?</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {([
                { value: "Public" as const, icon: "🌐", label: "Public", desc: "Anyone can find and join this hub" },
                { value: "Private" as const, icon: "🔒", label: "Private", desc: "Only invited members can join" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVisibility(opt.value)}
                  className={cn(
                    "flex flex-col items-center rounded-xl border px-4 py-5 text-center transition",
                    visibility === opt.value
                      ? "border-[#0C5C57] bg-[#f0faf8]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="mt-2 text-sm font-semibold text-gray-900">{opt.label}</span>
                  <span className="mt-1 text-xs text-gray-500">{opt.desc}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="mt-5 w-full rounded-xl bg-[#0C5C57] py-3 text-sm font-semibold text-white transition hover:bg-[#094a46]"
            >
              Next →
            </button>
          </div>
        ) : null}

        {/* STEP 3 — Posting Permissions */}
        {!showSuccess && step === 3 ? (
          <div>
            <p className="text-sm text-gray-400">{trimmedName}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">Who can post in this hub?</h2>
            <div className="mt-5 space-y-3">
              {([
                { value: "broadcast" as const, icon: "📢", label: "Broadcast Only", desc: "Only admins can post. Members read and react." },
                { value: "admin_members" as const, icon: "👥", label: "Admin + Members", desc: "Admins and members can both post." },
                { value: "open" as const, icon: "🌍", label: "Open Community", desc: "Everyone can post, comment, and share freely." },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPostingPerm(opt.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition",
                    postingPerm === opt.value
                      ? "border-[#0C5C57] bg-[#f0faf8]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <span className="mt-0.5 text-xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {errorMessage ? <p className="mt-3 text-sm text-rose-600">{errorMessage}</p> : null}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCreate}
              className={cn(
                "mt-5 w-full rounded-xl py-3 text-sm font-semibold transition",
                isSubmitting
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "bg-[#0C5C57] text-white hover:bg-[#094a46]"
              )}
            >
              {isSubmitting ? "Creating..." : "Create Hub →"}
            </button>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function CreateHubPage() {
  return (
    <Suspense fallback={null}>
      <CreateHubPageContent />
    </Suspense>
  );
}
