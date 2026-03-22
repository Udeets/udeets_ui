"use client";

import { useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function inputClass(multiline?: boolean) {
  return multiline
    ? "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#0C5C57]"
    : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#0C5C57]";
}

export default function CreateHubPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <MockAppShell activeNav="home">
      <section className="mb-4">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-[#111111]">Create Hub</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Set up a new mock community, business, or local place page for the uDeets frontend flow.
        </p>
      </section>

      <section className={cardClass("p-6 sm:p-8")}>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Hub Name">
              <input defaultValue="Richmond Weekend Market" className={inputClass()} />
            </Field>
            <Field label="Category">
              <select defaultValue="communities" className={inputClass()}>
                <option value="communities">Communities</option>
                <option value="restaurants">Restaurants</option>
                <option value="fitness">Fitness</option>
                <option value="pet-clubs">Pet Clubs</option>
                <option value="religious-places">Religious Places</option>
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              defaultValue="A local market hub for weekly vendor updates, timing changes, and featured community events."
              className={inputClass(true)}
            />
          </Field>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Location">
              <input defaultValue="Richmond, VA" className={inputClass()} />
            </Field>
            <Field label="Contact Email">
              <input defaultValue="market@udeets-demo.com" className={inputClass()} />
            </Field>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Website">
              <input defaultValue="https://example.com" className={inputClass()} />
            </Field>
            <Field label="Contact Phone">
              <input defaultValue="(804) 555-0144" className={inputClass()} />
            </Field>
          </div>

          <Field label="Images">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-[#F7FBFA] px-4 py-8 text-center text-sm text-slate-500">
              Drag image files here or browse to upload hero, gallery, and profile photos.
            </div>
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="rounded-full bg-[#0C5C57] px-6 py-3 text-sm font-medium text-white hover:bg-[#094a46]"
            >
              Save Mock Hub
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Preview Draft
            </button>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Mock hub saved locally for the current frontend session. No backend data was created.
            </div>
          ) : null}
        </form>
      </section>

      <section className={cardClass("mt-6 p-5 sm:p-6")}>
        <h2 className={sectionTitleClass()}>Create Checklist</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#F7FBFA] p-4 text-sm text-slate-600">Add a clear hub description and value proposition.</div>
          <div className="rounded-2xl bg-[#F7FBFA] p-4 text-sm text-slate-600">Upload a profile photo plus at least one hero image.</div>
          <div className="rounded-2xl bg-[#F7FBFA] p-4 text-sm text-slate-600">Share contact details so followers know how to stay connected.</div>
        </div>
      </section>
    </MockAppShell>
  );
}
