/**
 * Meta Graph API helper.
 * All calls go through this to centralize error handling, base URL, and timeouts.
 */

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";
const API_TIMEOUT_MS = 15_000; // 15 seconds

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

  // Timeout: abort after 15 seconds
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  fetchOptions.signal = controller.signal;

  try {
    const res = await fetch(url.toString(), fetchOptions);
    const data = await res.json();

    if (!res.ok) {
      const err = data as GraphApiError;
      const code = err.error?.code;
      const message = err.error?.message || res.statusText;

      // Handle specific Meta error codes
      if (code === 190) {
        throw new Error(
          "Token de Meta expirado o invalido. Ve a Configuracion para reconectar tu cuenta.",
        );
      }
      if (code === 4) {
        throw new Error(
          "Limite de API de Meta alcanzado. Intenta de nuevo en unos minutos.",
        );
      }

      throw new Error(`Graph API error: ${message}`);
    }

    return data as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Graph API timeout after ${API_TIMEOUT_MS}ms: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
