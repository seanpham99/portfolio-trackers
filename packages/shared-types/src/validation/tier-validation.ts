import { z } from 'zod';
import { FREE_TIER, PRO_TIER } from './tier-limits';

export const TierValidationError = z.object({
  code: z.literal('TIER_LIMIT_EXCEEDED'),
  message: z.string(),
  limit: z.number(),
  current: z.number(),
});

export type TierValidationError = z.infer<typeof TierValidationError>;

export function validatePortfolioCount(
  currentCount: number,
  tier: 'free' | 'pro',
): { valid: boolean; error?: TierValidationError } {
  const limits = tier === 'pro' ? PRO_TIER : FREE_TIER;

  if (currentCount >= limits.maxPortfolios) {
    return {
      valid: false,
      error: {
        code: 'TIER_LIMIT_EXCEEDED',
        message: `${tier.toUpperCase()} tier allows maximum ${
          limits.maxPortfolios
        } portfolio(s). Upgrade to PRO for unlimited.`,
        limit: limits.maxPortfolios,
        current: currentCount,
      },
    };
  }

  return { valid: true };
}

export function validateAssetCount(
  currentCount: number,
  tier: 'free' | 'pro',
): { valid: boolean; error?: TierValidationError } {
  const limits = tier === 'pro' ? PRO_TIER : FREE_TIER;

  if (currentCount >= limits.maxAssets) {
    return {
      valid: false,
      error: {
        code: 'TIER_LIMIT_EXCEEDED',
        message: `${tier.toUpperCase()} tier allows maximum ${
          limits.maxAssets
        } assets. Upgrade to PRO for unlimited.`,
        limit: limits.maxAssets,
        current: currentCount,
      },
    };
  }

  return { valid: true };
}