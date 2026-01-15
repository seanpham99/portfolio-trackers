import { createClient } from "@/lib/supabase/server";
import { getApiUrl } from "@/lib/api";
import { PortfolioSummaryDto } from "@workspace/shared-types/api";

// Server-side apiFetch wrapper
async function serverApiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const url = `${getApiUrl()}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

/**
 * Fetch all portfolios (Server Side)
 */
export async function getPortfolios(): Promise<PortfolioSummaryDto[]> {
  const response = await serverApiFetch("/portfolios");
  if (!response.ok) {
    throw new Error("Failed to fetch portfolios");
  }
  return response.json();
}
