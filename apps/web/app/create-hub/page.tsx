"use client";

export const dynamic = "force-dynamic";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MockAppShell, { cardClass } from "@/components/mock-app-shell";
import { createHub } from "@/lib/services/hubs/create-hub";

const CATEGORY_GROUPS = [
  {
    title: "Community",
    items: ["Community Group", "Cultural Association", "Religious Place", "HOA", "Parent Group", "Nonprofit"],
  },
  {
    title: "Local Business",
    items: ["Restaurant", "Grocery", "Fitness", "Salon", "Retail", "Professional Services"],
  },
  {
    title: "Interest & Clubs",
    items: ["Sports Club", "Pet Club", "Book Club", "Volunteer Group", "Arts & Music", "Networking"],
  },
] as const;

type Step = 1 | 2 | 3;
type Visibility = "Private" | "Public";
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "new-hub"
  );
}

function categoryFor(categories: string[]) {
  if (categories.includes("Religious Place")) return "religious-places";
  if (categories.includes("HOA")) return "hoa";
  if (categories.includes("Fitness")) return "fitness";
  if (categories.includes("Pet Club")) return "pet-clubs";
  if (
    categories.some((category) =>
      ["Restaurant", "Grocery", "Salon", "Retail", "Professional Services"].includes(category)
    )
  ) {
    return "restaurants";
  }

  return "communities";
}

function descriptionFor(categories: string[]) {
  if (!categories.length) return "A new uDeets hub for local updates, events, and community connection.";
  if (categories.length === 1) return `${categories[0]} updates, events, and community details in one place.`;
  return `${categories.slice(0, 2).join(" and ")} updates, events, and community details in one place.`;
}

function StepPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-17rem)] max-w-3xl items-center justify-center">
      <div className={cardClass("w-full max-w-2xl p-6 sm:p-8")}>
        <div className="text-center">
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-[#111111]">{title}</h1>
          {subtitle ? <p className="mt-3 text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function CreateHubPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoPreview = searchParams.get("demo_preview") === "1";
  const initialStep = Number(searchParams.get("demo_step")) as Step;
  const initialVisibility = searchParams.get("demo_visibility");
  const initialCategories = searchParams.get("demo_categories");
  const [step, setStep] = useState<Step>(initialStep === 2 || initialStep === 3 ? initialStep : 1);
  const [hubName, setHubName] = useState(searchParams.get("demo_hub_name") ?? "");
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility === "Public" ? "Public" : "Private");
  const [discoverable, setDiscoverable] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategories ? initialCategories.split(",").filter(Boolean) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdHubHref, setCreatedHubHref] = useState<string | null>(null);

  const isNameValid = hubName.trim().length > 0;
  const canContinueCategories = selectedCategories.length > 0;
  const selectedVisibilityDescription = useMemo(
    () =>
      visibility === "Private"
        ? "Only approved members can view posts, updates, and files."
        : "Anyone can discover and view this hub's public updates.",
    [visibility]
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  };

  const handleCreate = async () => {
    const normalizedName = hubName.trim();

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCreatedHubHref(null);

    try {
      const timestamp = Date.now();
      const slug = `${slugify(normalizedName)}-${timestamp}`;
      const createdHub = await createHub({
        name: normalizedName,
        slug,
        category: categoryFor(selectedCategories),
        tagline: `${normalizedName} on uDeets`,
        description: descriptionFor(selectedCategories),
        city: undefined,
        state: undefined,
        country: undefined,
        coverImageUrl: undefined,
        dpImageUrl: undefined,
      });

      setSuccessMessage(`Hub created successfully for your account. Slug: ${createdHub.slug}`);
      setCreatedHubHref(`/hubs/${createdHub.category}/${createdHub.slug}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create hub.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MockAppShell activeNav="home">
      {step === 1 ? (
        <StepPanel title="Create a Hub">
          <div data-demo-target="create-hub-name-section" className="rounded-[1.75rem] bg-[#F7FBFA] p-4 sm:p-5">
            <label className="block">
              <span className="mb-3 block text-sm font-semibold tracking-tight text-[#111111]">Hub Name</span>
              <input
                value={hubName}
                onChange={(event) => setHubName(event.target.value)}
                placeholder="Enter your hub name"
                data-demo-target="create-hub-name"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#A9D1CA] transition focus:ring-2"
              />
            </label>

          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={!isNameValid}
              onClick={() => setStep(2)}
              data-demo-target="create-hub-name-next"
              className={cn(
                "rounded-full px-6 py-3 text-sm font-semibold transition",
                isNameValid
                  ? "bg-[#0C5C57] text-white hover:bg-[#094a46]"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              )}
            >
              Next
            </button>
          </div>
        </StepPanel>
      ) : null}

      {step === 2 ? (
        <StepPanel title="Hub Visibility" subtitle="Choose how people can access your hub on uDeets.">
          <div data-demo-target="create-hub-visibility-section" className="rounded-[1.75rem] bg-[#F7FBFA] p-4 sm:p-5">
            <div className="space-y-4">
              {[
                {
                  title: "Private Hub",
                  value: "Private" as const,
                  description: "Only approved members can view posts, updates, and files.",
                },
                {
                  title: "Public Hub",
                  value: "Public" as const,
                  description: "Anyone can discover and view this hub's public updates.",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  data-demo-target={
                    option.value === "Private"
                      ? "create-hub-private"
                      : option.value === "Public"
                        ? "create-hub-public"
                        : undefined
                  }
                  className={cn(
                    "w-full rounded-3xl border px-5 py-5 text-left transition",
                    visibility === option.value
                      ? "border-[#0C5C57] bg-[#EAF6F3] shadow-sm"
                      : "border-slate-200 bg-white hover:border-[#A9D1CA] hover:bg-[#F7FBFA]"
                  )}
                >
                  <p className="text-lg font-serif font-semibold text-[#111111]">{option.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{option.description}</p>
                </button>
              ))}
            </div>

            <label className="mt-5 flex items-center justify-between rounded-2xl bg-[#F7FBFA] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#111111]">Show this hub in Discover</p>
                <p className="mt-1 text-xs text-slate-500">{selectedVisibilityDescription}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={discoverable}
                onClick={() => setDiscoverable((current) => !current)}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-200",
                  discoverable ? "bg-[#A9D1CA] ring-1 ring-[#0C5C57]/15" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
                    discoverable ? "left-6" : "left-1"
                  )}
                />
              </button>
            </label>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                data-demo-target="create-hub-visibility-next"
                className="rounded-full bg-[#0C5C57] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#094a46]"
              >
                Next
              </button>
            </div>
          </div>
        </StepPanel>
      ) : null}

      {step === 3 ? (
        <StepPanel
          title="Choose hub categories"
          subtitle="Select the categories that best describe your hub."
        >
          <div data-demo-target="create-hub-category-section" className="rounded-[1.75rem] bg-[#F7FBFA] p-4 sm:p-5">
            <div className="space-y-6">
              {CATEGORY_GROUPS.map((group) => (
                <section key={group.title}>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{group.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {group.items.map((category) => {
                      const selected = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          data-demo-target={category === "Restaurant" ? "create-hub-restaurant" : undefined}
                          className={cn(
                            "rounded-full px-4 py-2.5 text-sm font-semibold transition",
                            selected
                              ? "bg-[#A9D1CA] text-[#0C5C57]"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-[#F7FBFA] hover:text-[#0C5C57]"
                          )}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canContinueCategories}
                onClick={handleCreate}
                data-demo-target="create-hub-save"
                className={cn(
                  "rounded-full px-6 py-3 text-sm font-semibold transition",
                  canContinueCategories
                    ? "bg-[#0C5C57] text-white hover:bg-[#094a46]"
                    : "cursor-not-allowed bg-slate-200 text-slate-400"
                )}
              >
                {isSubmitting ? "Saving..." : "Save & Continue"}
              </button>
            </div>

            {errorMessage || successMessage ? (
              <div
                className={cn(
                  "mt-6 rounded-2xl border px-4 py-3 text-sm",
                  errorMessage
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : successMessage
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600"
                )}
              >
                {errorMessage || successMessage}

                {successMessage && createdHubHref ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push(createdHubHref)}
                      className="rounded-full bg-[#0C5C57] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#094a46]"
                    >
                      View Hub
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </StepPanel>
      ) : null}
    </MockAppShell>
  );
}

export default function CreateHubPage() {
  return (
    <Suspense fallback={null}>
      <CreateHubPageContent />
    </Suspense>
  );
}
