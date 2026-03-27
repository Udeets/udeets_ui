import { HubsTestPanel } from "@/components/dev/HubsTestPanel";

export default function HubsTestPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold">Hubs Service Test</h1>
        <p className="mt-2 text-sm text-slate-300">
          Temporary development page for verifying hub creation and loading.
        </p>
        <div className="mt-8">
          <HubsTestPanel />
        </div>
      </div>
    </main>
  );
}
