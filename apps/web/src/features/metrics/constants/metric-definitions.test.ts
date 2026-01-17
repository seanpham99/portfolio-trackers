import { describe, it, expect } from "vitest";
import {
  METRIC_DEFINITIONS,
  MetricKeys,
  getMetricDefinition,
  type MetricKey,
} from "./metric-definitions";

describe("metric-definitions", () => {
  describe("METRIC_DEFINITIONS registry", () => {
    it("should have all expected metric keys defined", () => {
      const expectedKeys: MetricKey[] = [
        MetricKeys.NET_WORTH,
        MetricKeys.COST_BASIS,
        MetricKeys.UNREALIZED_PL,
        MetricKeys.REALIZED_PL,
        MetricKeys.DAILY_CHANGE,
        MetricKeys.FX_GAIN,
        MetricKeys.ASSET_GAIN,
        MetricKeys.ALLOCATION_PCT,
        MetricKeys.TOTAL_GAIN,
        MetricKeys.MARKET_VALUE,
      ];

      expectedKeys.forEach((key) => {
        expect(METRIC_DEFINITIONS[key]).toBeDefined();
      });
    });

    it("should have valid structure for each metric definition", () => {
      Object.values(METRIC_DEFINITIONS).forEach((definition) => {
        expect(definition.key).toBeDefined();
        expect(definition.key).toBe(definition.key);
        expect(definition.label).toBeDefined();
        expect(typeof definition.label).toBe("string");
        expect(definition.label.length).toBeGreaterThan(0);
        expect(definition.formula).toBeDefined();
        expect(typeof definition.formula).toBe("string");
        expect(definition.formula.length).toBeGreaterThan(0);
        expect(definition.source).toBeDefined();
        expect(typeof definition.source).toBe("string");
        expect(definition.source.length).toBeGreaterThan(0);
        // methodology is optional
        if (definition.methodology !== undefined) {
          expect(typeof definition.methodology).toBe("string");
        }
      });
    });

    it("should have FIFO methodology for cost basis related metrics", () => {
      const fifoMetrics: MetricKey[] = [
        MetricKeys.COST_BASIS,
        MetricKeys.REALIZED_PL,
        MetricKeys.TOTAL_GAIN,
      ];

      fifoMetrics.forEach((key) => {
        const definition = METRIC_DEFINITIONS[key];
        expect(definition.methodology).toBeDefined();
        expect(definition.methodology).toContain("FIFO");
      });
    });
  });

  describe("getMetricDefinition", () => {
    it("should return correct definition for valid keys", () => {
      const netWorth = getMetricDefinition(MetricKeys.NET_WORTH);
      expect(netWorth).toBeDefined();
      expect(netWorth?.key).toBe(MetricKeys.NET_WORTH);
      expect(netWorth?.label).toBe("Net Worth");
      expect(netWorth?.formula).toContain("∑");
    });

    it("should return undefined for invalid keys", () => {
      // @ts-expect-error - testing runtime behavior with invalid key
      const invalid = getMetricDefinition("INVALID_KEY");
      expect(invalid).toBeUndefined();
    });

    it("should return correct methodology when present", () => {
      const costBasis = getMetricDefinition(MetricKeys.COST_BASIS);
      expect(costBasis?.methodology).toBeDefined();
      expect(costBasis?.methodology).toContain("FIFO");
    });

    it("should return undefined methodology when not present", () => {
      const dailyChange = getMetricDefinition(MetricKeys.DAILY_CHANGE);
      expect(dailyChange?.methodology).toBeUndefined();
    });
  });

  describe("MetricKeys enum", () => {
    it("should have consistent key names", () => {
      // Key name should match the value for consistency
      Object.entries(MetricKeys).forEach(([name, value]) => {
        expect(name).toBe(value);
      });
    });
  });
});
