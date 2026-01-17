/**
 * Custom enums for asset types and markets
 * These are application-level constants, not stored in Supabase
 */

/**
 * Canonical asset class types matching database constraint
 * Database constraint: asset_class IN ('STOCK', 'CRYPTO', 'BOND', 'ETF', 'FOREX')
 */
export enum AssetClass {
  STOCK = "STOCK",
  CRYPTO = "CRYPTO",
  BOND = "BOND",
  ETF = "ETF",
  FOREX = "FOREX",
}

/**
 * Market codes for stocks (used with AssetClass.STOCK)
 * VN = Vietnam, US = United States, etc.
 */
export enum MarketCode {
  VN = "VN",
  US = "US",
  HK = "HK",
  JP = "JP",
  UK = "UK",
  DE = "DE",
  AU = "AU",
  CA = "CA",
  SG = "SG",
  KR = "KR",
  TW = "TW",
  CN = "CN",
}

/**
 * Discovery-specific asset class for UI flow
 * Maps to AssetClass.STOCK + MarketCode for stocks
 */
export enum DiscoverableAssetClass {
  VN_STOCK = "VN_STOCK",
  US_STOCK = "US_STOCK",
  GLOBAL_STOCK = "GLOBAL_STOCK",
  CRYPTO = "CRYPTO",
}

/**
 * Helper to map DiscoverableAssetClass to canonical AssetClass
 */
export function toCanonicalAssetClass(discoverable: DiscoverableAssetClass): AssetClass {
  switch (discoverable) {
    case DiscoverableAssetClass.VN_STOCK:
    case DiscoverableAssetClass.US_STOCK:
    case DiscoverableAssetClass.GLOBAL_STOCK:
      return AssetClass.STOCK;
    case DiscoverableAssetClass.CRYPTO:
      return AssetClass.CRYPTO;
    default:
      return AssetClass.STOCK;
  }
}

/**
 * Helper to extract MarketCode from DiscoverableAssetClass
 */
export function toMarketCode(discoverable: DiscoverableAssetClass): MarketCode | null {
  switch (discoverable) {
    case DiscoverableAssetClass.VN_STOCK:
      return MarketCode.VN;
    case DiscoverableAssetClass.US_STOCK:
      return MarketCode.US;
    case DiscoverableAssetClass.GLOBAL_STOCK:
    case DiscoverableAssetClass.CRYPTO:
      return null;
    default:
      return null;
  }
}
