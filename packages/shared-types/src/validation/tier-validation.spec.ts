import {
  validatePortfolioCount,
  validateAssetCount,
} from './tier-validation';

describe('Tier Validation', () => {
  describe('validatePortfolioCount', () => {
    it('should return valid for free tier below limit', () => {
      const result = validatePortfolioCount(0, 'free');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for free tier at limit', () => {
      const result = validatePortfolioCount(1, 'free');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('TIER_LIMIT_EXCEEDED');
    });

    it('should return invalid for free tier above limit', () => {
      const result = validatePortfolioCount(2, 'free');
      expect(result.valid).toBe(false);
    });

    it('should return valid for pro tier', () => {
      const result = validatePortfolioCount(100, 'pro');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAssetCount', () => {
    it('should return valid for free tier below limit', () => {
      const result = validateAssetCount(19, 'free');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for free tier at limit', () => {
      const result = validateAssetCount(20, 'free');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('TIER_LIMIT_EXCEEDED');
    });

    it('should return invalid for free tier above limit', () => {
      const result = validateAssetCount(21, 'free');
      expect(result.valid).toBe(false);
    });

    it('should return valid for pro tier', () => {
      const result = validateAssetCount(1000, 'pro');
      expect(result.valid).toBe(true);
    });
  });
});
