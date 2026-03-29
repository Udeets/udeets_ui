import { AuthTestPanel } from "@/components/dev/AuthTestPanel";

export const dynamic = "force-dynamic";

export default function AuthTestPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold">Auth Service Test</h1>
        <p className="mt-2 text-sm text-slate-300">
          Temporary development page for verifying Supabase Auth service calls.
        </p>
        <div className="mt-8">
          <AuthTestPanel />
        </div>
      </div>
    </main>
  );
}
