"use client";

export const dynamic = "force-dynamic";

import confetti from "canvas-confetti";
import { ArrowLeft, CheckCircle, X } from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { createHub } from "@/lib/services/hubs/create-hub";
import { cn, descriptionFor, slugify } from "./helpers";
import type { Visibility } from "./types";
import { HUB_CATEGORY_OPTIONS } from "./types";

type Step = 1 | 2 | 3 | 4 | 5;
type PostingPerm = "broadcast" | "admin_members" | "open";

const TOTAL_STEPS = 5;

function StepDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {([1, 2, 3, 4, 5] as const).map((s) => (
        <div
          key={s}
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            s <= current ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"
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
  const [customSlug, setCustomSlug] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [visibility, setVisibility] = useState<Visibility>("Public");
  const [postingPerm, setPostingPerm] = useState<PostingPerm>("admin_members");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdHubHref, setCreatedHubHref] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const trimmedName = hubName.trim();
  const isNameValid = trimmedName.length > 0 && trimmedName.length <= 50;

  // Validate custom slug: lowercase, alphanumeric + hyphens
  const isSlugValid = !customSlug || /^[a-z0-9-]+$/.test(customSlug) && !customSlug.startsWith('-') && !customSlug.endsWith('-');

  const close = () => router.push("/dashboard");

  const fireConfetti = () => {
    const confettiColors = ["#0C5C57", "#A9D1CA", "#E3F1EF", "#ffffff", "#1a8a82", "#FFD700", "#FFC107"];
    confetti({ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.6 }, colors: confettiColors });
    setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.3, y: 0.5 }, colors: confettiColors }), 150);
    setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { x: 0.7, y: 0.5 }, colors: confettiColors }), 300);
    setTimeout(() => confetti({ particleCount: 40, spread: 120, origin: { x: 0.5, y: 0.4 }, colors: confettiColors }), 500);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isDemoPreview) {
        setCreatedHubHref("/hubs/communities/demo-hub");
        setShowSuccess(true);
        fireConfetti();
        return;
      }

      const timestamp = Date.now();
      // Use custom slug if provided and valid, otherwise generate from name
      const slug = customSlug && isSlugValid
        ? customSlug
        : `${slugify(trimmedName)}-${timestamp}`;
      const category = selectedCategory || "communities";
      const createdHub = await createHub({
        name: trimmedName,
        slug,
        category,
        visibility: visibility === "Private" ? "private" : "public",
        tagline: `${trimmedName} on uDeets`,
        description: descriptionFor([]),
        websiteUrl: websiteUrl ? `https://${websiteUrl}` : undefined,
      });

      setCreatedHubHref(`/hubs/${createdHub.category}/${createdHub.slug}`);
      setShowSuccess(true);
      fireConfetti();
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
          <StepDots current={showSuccess ? (TOTAL_STEPS as Step) : step} />
          <button type="button" onClick={close} className="text-gray-400 transition hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SUCCESS STATE */}
        {showSuccess ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF6F3]">
              <CheckCircle className="h-8 w-8 text-[var(--ud-brand-primary)]" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">{trimmedName} is ready!</h2>
            <div className="mt-6 flex w-full flex-col gap-3">
              {createdHubHref ? (
                <button
                  type="button"
                  onClick={() => router.push(createdHubHref)}
                  className="w-full rounded-xl bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] py-3 text-sm font-semibold text-white transition hover:opacity-90"
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
                className="w-full rounded-xl border border-[var(--ud-border)] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[var(--ud-border-focus)] focus:ring-2 focus:ring-[var(--ud-border-focus)]"
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
                  ? "bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] text-white hover:opacity-90"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
              )}
            >
              Next →
            </button>
          </div>
        ) : null}

        {/* STEP 2 — Category */}
        {!showSuccess && step === 2 ? (
          <div>
            <p className="text-sm text-gray-400">{trimmedName}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">What type of hub is this?</h2>
            <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {HUB_CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedCategory(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                    selectedCategory === opt.value
                      ? "border-[var(--ud-brand-primary)] bg-[#f0faf8]"
                      : "border-[var(--ud-border)] bg-white hover:border-gray-300"
                  )}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!selectedCategory}
              onClick={() => setStep(3)}
              className={cn(
                "mt-4 w-full rounded-xl py-3 text-sm font-semibold transition",
                selectedCategory
                  ? "bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] text-white hover:opacity-90"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
              )}
            >
              Next →
            </button>
          </div>
        ) : null}

        {/* STEP 3 — Custom URL/Slug */}
        {!showSuccess && step === 3 ? (
          <div>
            <p className="text-sm text-gray-400">{trimmedName}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">Customize your hub URL</h2>
            <p className="mt-3 text-xs text-gray-500">Optional: Create a custom URL like yourname.udeets.com</p>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Custom URL</label>
                <div className="flex items-center rounded-xl border border-[var(--ud-border)] bg-white overflow-hidden">
                  <span className="px-4 py-3 text-sm text-gray-500 bg-gray-50 whitespace-nowrap">https://</span>
                  <input
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
                    placeholder="yourname"
                    className="flex-1 px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-[#A9D1CA] focus:ring-inset"
                  />
                  <span className="px-4 py-3 text-sm text-gray-500 bg-gray-50 whitespace-nowrap">.udeets.com</span>
                </div>
                {customSlug && !isSlugValid ? (
                  <p className="mt-2 text-xs text-red-600">Only lowercase letters, numbers, and hyphens allowed. No leading/trailing hyphens.</p>
                ) : null}
                {customSlug ? (
                  <p className="mt-2 text-xs text-gray-500">Preview: https://{customSlug}.udeets.com</p>
                ) : null}
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold text-gray-600">Default URL:</p>
                <p className="text-xs text-gray-500 mt-1">https://{slugify(trimmedName)}-{Date.now()}.udeets.com</p>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Website URL (optional)</label>
                <div className="flex items-center rounded-xl border border-[var(--ud-border)] bg-white overflow-hidden">
                  <span className="px-4 py-3 text-sm text-gray-500 bg-gray-50 whitespace-nowrap">https://</span>
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value.replace(/^https?:\/\//, ''))}
                    placeholder="www.yourhub.com"
                    className="flex-1 px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-[#A9D1CA] focus:ring-inset"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">This will appear in your hub&apos;s Connect section, editable only by admins.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Next →
            </button>
          </div>
        ) : null}

        {/* STEP 4 — Visibility */}
        {!showSuccess && step === 4 ? (
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
                      ? "border-[var(--ud-brand-primary)] bg-[#f0faf8]"
                      : "border-[var(--ud-border)] bg-white hover:border-gray-300"
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
              onClick={() => setStep(5)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Next →
            </button>
          </div>
        ) : null}

        {/* STEP 5 — Posting Permissions */}
        {!showSuccess && step === 5 ? (
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
                      ? "border-[var(--ud-brand-primary)] bg-[#f0faf8]"
                      : "border-[var(--ud-border)] bg-white hover:border-gray-300"
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
                  : "bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] text-white hover:opacity-90"
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
    <AuthGuard>
      <Suspense fallback={null}>
        <CreateHubPageContent />
      </Suspense>
    </AuthGuard>
  );
}
