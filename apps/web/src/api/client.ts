import {
  type PortfolioSummaryDto,
  type HoldingDto,
  type AssetDetailsResponseDto,
  type ConnectionDto,
  type CreateConnectionDto,
  type ValidationResultDto,
  type UserSettingsDto,
  type UpdateUserSettingsDto,
  type ApiResponse,
} from "@workspace/shared-types/api";
import {
  type Assets,
  type InsertTransactions,
  type Transactions,
  DiscoverableAssetClass,
} from "@workspace/shared-types/database";
import { apiFetch } from "@/lib/api";

export * from "@/lib/api";

/**
 * Fetch all portfolios with summary data
 */
export async function getPortfolios(options?: {
  refresh?: boolean;
}): Promise<ApiResponse<PortfolioSummaryDto[]>> {
  const query = options?.refresh ? "?refresh=true" : "";
  const response = await apiFetch(`/portfolios${query}`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolios");
  }
  return response.json();
}

/**
 * Fetch a specific portfolio by ID
 */
export async function getPortfolio(
  id: string,
  options?: { refresh?: boolean }
): Promise<ApiResponse<PortfolioSummaryDto>> {
  const query = options?.refresh ? "?refresh=true" : "";
  const response = await apiFetch(`/portfolios/${id}${query}`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio");
  }
  return response.json();
}

/**
 * Fetch holdings for a specific portfolio
 */
export async function getPortfolioHoldings(
  portfolioId: string,
  options?: { refresh?: boolean }
): Promise<ApiResponse<HoldingDto[]>> {
  const query = options?.refresh ? "?refresh=true" : "";
  const response = await apiFetch(`/portfolios/${portfolioId}/holdings${query}`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio holdings");
  }
  return response.json();
}

/**
 * Fetch all holdings across all portfolios
 */
export async function getAllHoldings(options?: {
  refresh?: boolean;
}): Promise<ApiResponse<HoldingDto[]>> {
  const query = options?.refresh ? "?refresh=true" : "";
  const response = await apiFetch(`/portfolios/holdings${query}`);
  if (!response.ok) {
    throw new Error("Failed to fetch holdings");
  }
  return response.json();
}

/**
 * Fetch detailed asset performance and history
 */
export async function getAssetDetails(
  portfolioId: string,
  symbol: string,
  options?: { refresh?: boolean }
): Promise<ApiResponse<AssetDetailsResponseDto>> {
  const query = options?.refresh ? "?refresh=true" : "";
  const response = await apiFetch(`/portfolios/${portfolioId}/assets/${symbol}/details${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset details for ${symbol}`);
  }
  return response.json();
}

/**
 * Fetch portfolio history
 */
export async function getPortfolioHistory(
  portfolioId: string,
  range: "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL"
): Promise<ApiResponse<any[]>> {
  const response = await apiFetch(`/portfolios/${portfolioId}/history?range=${range}`);
  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }
  return response.json();
}

/**
 * Search for assets by symbol or name
 */
export async function searchAssets(query: string): Promise<Assets[]> {
  const response = await apiFetch(`/assets/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("Failed to search assets");
  }
  return response.json();
}

// ============ Discovery API ============

/**
 * Discovered asset from external providers
 */
export interface DiscoveredAsset {
  symbol: string;
  name_en: string;
  name_local?: string | null;
  asset_class: string;
  market?: string | null;
  exchange?: string | null;
  currency?: string;
  logo_url?: string | null;
  source: string;
}

/**
 * Asset request response
 */
export interface AssetRequestResponse {
  id: string;
  symbol: string;
  status: string;
  message: string;
}

/**
 * Union type for assets that can be selected in the AddAssetModal
 * Includes both internal registry assets and externally discovered assets
 */
export type SelectableAsset = Assets | DiscoveredAsset;

/**
 * Type guard to check if an asset is from internal registry
 */
export function isInternalAsset(asset: SelectableAsset): asset is Assets {
  return "id" in asset && typeof asset.id === "string";
}

/**
 * Common interface for assets that can be displayed in the UI
 * Works across internal Assets, PopularAssetDto, and DiscoveredAsset
 */
export interface DisplayableAsset {
  id?: string;
  symbol: string;
  name_en: string;
  name_local?: string | null;
  asset_class: string;
  logo_url?: string | null;
  market?: string | null;
  currency?: string;
}

// Re-export DiscoverableAssetClass for convenience
export { DiscoverableAssetClass };

/**
 * Discover assets from external providers (Yahoo Finance, CoinGecko)
 * Used when asset is not found in internal registry
 */
export async function discoverAssets(
  query: string,
  assetClass: DiscoverableAssetClass
): Promise<DiscoveredAsset[]> {
  const params = new URLSearchParams({
    q: query,
    assetClass,
  });
  const response = await apiFetch(`/assets/discover?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to discover assets");
  }
  return response.json();
}

/**
 * Submit an asset tracking request to the pending queue
 */
export async function submitAssetRequest(
  symbol: string,
  assetClass: DiscoverableAssetClass
): Promise<AssetRequestResponse> {
  const response = await apiFetch("/assets/request", {
    method: "POST",
    body: JSON.stringify({ symbol, assetClass }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit asset request");
  }
  return response.json();
}

/**
 * Fetch asset by exact symbol match
 */
export async function getAsset(symbol: string, token?: string): Promise<Assets | null> {
  const options: RequestInit = {};
  if (token) {
    options.headers = { Authorization: `Bearer ${token}` };
  }

  const response = await apiFetch(`/assets/${encodeURIComponent(symbol)}`, options);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${symbol}`);
  }
  return response.json();
}

/**
 * Add a transaction to a portfolio
 */
export async function addTransaction(
  portfolioId: string,
  transaction: InsertTransactions
): Promise<Transactions> {
  const response = await apiFetch(`/portfolios/${portfolioId}/transactions`, {
    method: "POST",
    body: JSON.stringify(transaction),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to add transaction");
  }
  return response.json();
}

// ============ Connections API ============

/**
 * Fetch all user connections
 */
export async function getConnections(): Promise<ConnectionDto[]> {
  const response = await apiFetch("/connections");
  if (!response.ok) {
    throw new Error("Failed to fetch connections");
  }
  return response.json();
}

/**
 * Create a new connection
 */
export async function createConnection(data: CreateConnectionDto): Promise<ConnectionDto> {
  const response = await apiFetch("/connections", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create connection");
  }
  return response.json();
}

/**
 * Validate connection credentials (dry-run)
 */
export async function validateConnection(data: CreateConnectionDto): Promise<ValidationResultDto> {
  const response = await apiFetch("/connections/validate", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to validate connection");
  }
  return response.json();
}

/**
 * Delete a connection
 */
export async function deleteConnection(id: string): Promise<void> {
  const response = await apiFetch(`/connections/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete connection");
  }
}

// ============ Market Data API ============

/**
 * Get historical exchange rate
 */
export async function getExchangeRate(
  from: string,
  to: string,
  date: string
): Promise<{ rate: number | null }> {
  const params = new URLSearchParams({
    from,
    to,
    date,
  });
  const response = await apiFetch(`/market-data/exchange-rate?${params.toString()}`);
  if (!response.ok) {
    // Return null mostly, but let's conform to API contract
    if (response.status === 404) return { rate: null };
    throw new Error("Failed to fetch exchange rate");
  }
  return response.json();
}

// ============ User Settings API ============

/**
 * Get current user settings
 */
export async function getUserSettings(): Promise<UserSettingsDto> {
  const response = await apiFetch("/users/me/settings");
  if (!response.ok) {
    throw new Error("Failed to fetch user settings");
  }
  return response.json();
}

/**
 * Update user settings
 */
export async function updateUserSettings(data: UpdateUserSettingsDto): Promise<UserSettingsDto> {
  const response = await apiFetch("/users/me/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update user settings");
  }
  return response.json();
}
