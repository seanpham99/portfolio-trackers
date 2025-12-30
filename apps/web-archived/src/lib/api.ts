import { createClient } from "./supabase/client";

/**
 * Get the API base URL from environment
 */
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
}

/**
 * Get authorization headers for API requests
 * Fetches the current session token from Supabase
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Authenticated fetch wrapper for API calls
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${getApiUrl()}${endpoint}`;
  const authHeaders = await getAuthHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}
