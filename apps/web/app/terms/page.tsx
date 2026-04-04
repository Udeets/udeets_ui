import MockAppShell from "@/components/mock-app-shell";

export default function TermsPage() {
  return (
    <MockAppShell activeNav="home">
      <div className="mx-auto max-w-2xl py-12 px-4">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ud-text-primary)]">Terms & Conditions</h1>
        <p className="mt-4 text-sm text-[var(--ud-text-secondary)] leading-relaxed">
          This page is under construction. Our full Terms & Conditions will be published here soon.
        </p>
        <p className="mt-6 text-xs text-[var(--ud-text-muted)]">Last updated: April 2026</p>
      </div>
    </MockAppShell>
  );
}
