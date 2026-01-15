import {
  type PortfolioSummaryDto,
  type HoldingDto,
  type AssetDetailsResponseDto,
  type ConnectionDto,
  type CreateConnectionDto,
  type ValidationResultDto,
} from "@workspace/shared-types/api";
import { apiFetch } from "@/lib/api";

export * from "@/lib/api";

/**
 * Fetch all portfolios with summary data
 */
export async function getPortfolios(): Promise<PortfolioSummaryDto[]> {
  const response = await apiFetch("/portfolios");
  if (!response.ok) {
    throw new Error("Failed to fetch portfolios");
  }
  return response.json();
}

/**
 * Fetch a specific portfolio by ID
 */
export async function getPortfolio(id: string): Promise<PortfolioSummaryDto> {
  const response = await apiFetch(`/portfolios/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio");
  }
  return response.json();
}

/**
 * Fetch holdings for a specific portfolio
 */
export async function getPortfolioHoldings(portfolioId: string): Promise<HoldingDto[]> {
  const response = await apiFetch(`/portfolios/${portfolioId}/holdings`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio holdings");
  }
  return response.json();
}

/**
 * Fetch all holdings across all portfolios
 */
export async function getAllHoldings(): Promise<HoldingDto[]> {
  const response = await apiFetch("/portfolios/holdings");
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
  symbol: string
): Promise<AssetDetailsResponseDto> {
  const response = await apiFetch(`/portfolios/${portfolioId}/assets/${symbol}/details`);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset details for ${symbol}`);
  }
  return response.json();
}
/**
 * Search for assets by symbol or name
 */
export async function searchAssets(query: string): Promise<any[]> {
  const response = await apiFetch(`/assets/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("Failed to search assets");
  }
  return response.json();
}

/**
 * Add a transaction to a portfolio
 */
export async function addTransaction(portfolioId: string, transaction: any): Promise<any> {
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
