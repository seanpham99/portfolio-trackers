/**
 * Get the API base URL from environment
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

/**
 * Get authorization headers for API requests
 * Fetches the current session token from Supabase
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  // Standard client-side implementation using dynamic import for cleaner code splitting
  // or just use standard import if we are sure it's client-only.
  // Given previous issues, dynamic import is safer if we want to avoid any server-side leakage
  // but standard import is fine if 'supabase/client' is pure.

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Authenticated fetch wrapper for API calls
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
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
