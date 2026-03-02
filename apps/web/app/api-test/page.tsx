export default async function ApiTestPage() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";
  const res = await fetch(`${base}/health`, { cache: "no-store" });
  const json = await res.json();

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800 text-white p-8">
      <h1 className="text-2xl font-bold">API Test</h1>
      <p className="mt-2 text-white/80">Fetched from: {base}/health</p>
      <pre className="mt-6 rounded-2xl bg-white/10 p-4 text-sm border border-white/15 overflow-auto">
        {JSON.stringify(json, null, 2)}
      </pre>
    </main>
  );
}
