type RequestOptions = Omit<RequestInit, "body"> & {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const configuredBase = (process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ?? "http://localhost:8000").replace(
    /\/$/,
    "",
  );
  const browserSide = typeof window !== "undefined";
  // Browser requests stay same-origin and go through the Next proxy (/api/v1/*).
  const base = browserSide ? "" : configuredBase;
  const routePrefix = "/api/v1";
  const url = new URL(`${base}${routePrefix}${path}`, "http://localhost");

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return base ? `${base}${routePrefix}${path}${url.search}` : `${routePrefix}${path}${url.search}`;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, headers, method, ...rest } = options;
  const url = buildUrl(path, query);
  const defaultHeaders: Record<string, string> = {};
  if (body !== undefined) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...rest,
    method: method ?? (body ? "POST" : "GET"),
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
