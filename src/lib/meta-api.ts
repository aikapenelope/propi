/**
 * Meta Graph API helper.
 * All calls go through this to centralize error handling and base URL.
 */

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

export interface GraphApiError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

export async function graphApiFetch<T>(
  path: string,
  accessToken: string,
  options?: {
    method?: "GET" | "POST" | "DELETE";
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  },
): Promise<T> {
  const method = options?.method || "GET";
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const fetchOptions: RequestInit = { method };
  if (options?.body && (method === "POST" || method === "DELETE")) {
    fetchOptions.headers = { "Content-Type": "application/json" };
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), fetchOptions);
  const data = await res.json();

  if (!res.ok) {
    const err = data as GraphApiError;
    throw new Error(
      `Graph API error: ${err.error?.message || res.statusText}`,
    );
  }

  return data as T;
}
