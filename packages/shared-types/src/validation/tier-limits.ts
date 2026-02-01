export interface TierLimits {
  maxPortfolios: number;
  maxAssets: number;
}

export const FREE_TIER: TierLimits = {
  maxPortfolios: 1,
  maxAssets: 20,
};

export const PRO_TIER: TierLimits = {
  maxPortfolios: Infinity,
  maxAssets: Infinity,
};

export function getTierLimits(tier: 'free' | 'pro'): TierLimits {
  return tier === 'pro' ? PRO_TIER : FREE_TIER;
}