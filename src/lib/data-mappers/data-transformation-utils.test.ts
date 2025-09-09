/**
 * Unit tests for Data Transformation Utilities
 */

import {
  CurrencyFormatter,
  PercentageFormatter,
  RatioFormatter,
  NullValueHandler,
  DataTransformationUtils
} from './data-transformation-utils';

describe('CurrencyFormatter', () => {
  describe('formatCurrency', () => {
    it('should format currency in crores', () => {
      expect(CurrencyFormatter.formatCurrency(100000000, 'crores')).toBe(10);
      expect(CurrencyFormatter.formatCurrency(50000000, 'crores')).toBe(5);
      expect(CurrencyFormatter.formatCurrency(12345678, 'crores', 3)).toBe(1.235);
    });

    it('should format currency in lakhs', () => {
      expect(CurrencyFormatter.formatCurrency(1000000, 'lakhs')).toBe(10);
      expect(CurrencyFormatter.formatCurrency(500000, 'lakhs')).toBe(5);
      expect(CurrencyFormatter.formatCurrency(123456, 'lakhs', 3)).toBe(1.235);
    });

    it('should format currency in thousands', () => {
      expect(CurrencyFormatter.formatCurrency(10000, 'thousands')).toBe(10);
      expect(CurrencyFormatter.formatCurrency(5000, 'thousands')).toBe(5);
      expect(CurrencyFormatter.formatCurrency(1234, 'thousands', 3)).toBe(1.234);
    });

    it('should handle null and invalid values', () => {
      expect(CurrencyFormatter.formatCurrency(null)).toBe(null);
      expect(CurrencyFormatter.formatCurrency(undefined)).toBe(null);
      expect(CurrencyFormatter.formatCurrency(NaN)).toBe(null);
      expect(CurrencyFormatter.formatCurrency(Infinity)).toBe(null);
    });

    it('should handle negative values', () => {
      expect(CurrencyFormatter.formatCurrency(-100000000, 'crores')).toBe(-10);
      expect(CurrencyFormatter.formatCurrency(-1000000, 'lakhs')).toBe(-10);
    });
  });

  describe('autoFormatCurrency', () => {
    it('should auto-format large values in crores', () => {
      const result = CurrencyFormatter.autoFormatCurrency(100000000);
      expect(result?.value).toBe(10);
      expect(result?.unit).toBe('crores');
    });

    it('should auto-format medium values in lakhs', () => {
      const result = CurrencyFormatter.autoFormatCurrency(1000000);
      expect(result?.value).toBe(10);
      expect(result?.unit).toBe('lakhs');
    });

    it('should auto-format small values in thousands', () => {
      const result = CurrencyFormatter.autoFormatCurrency(10000);
      expect(result?.value).toBe(10);
      expect(result?.unit).toBe('thousands');
    });

    it('should handle very small values in basic units', () => {
      const result = CurrencyFormatter.autoFormatCurrency(500);
      expect(result?.value).toBe(500);
      expect(result?.unit).toBe('basic');
    });

    it('should return null for invalid values', () => {
      expect(CurrencyFormatter.autoFormatCurrency(null)).toBe(null);
      expect(CurrencyFormatter.autoFormatCurrency(NaN)).toBe(null);
    });
  });

  describe('formatCurrencyWithUnit', () => {
    it('should format currency with unit and symbol', () => {
      expect(CurrencyFormatter.formatCurrencyWithUnit(100000000, 'crores')).toBe('₹10 crores');
      expect(CurrencyFormatter.formatCurrencyWithUnit(1000000, 'lakhs')).toBe('₹10 lakhs');
    });

    it('should format currency without symbol', () => {
      expect(CurrencyFormatter.formatCurrencyWithUnit(100000000, 'crores', false)).toBe('10 crores');
    });

    it('should handle null values', () => {
      expect(CurrencyFormatter.formatCurrencyWithUnit(null)).toBe('N/A');
    });

    it('should format basic units without suffix', () => {
      expect(CurrencyFormatter.formatCurrencyWithUnit(1000, 'basic')).toBe('₹1,000');
    });
  });
});

describe('PercentageFormatter', () => {
  describe('formatPercentage', () => {
    it('should format decimal percentages', () => {
      expect(PercentageFormatter.formatPercentage(0.15, 'decimal')).toBe(15);
      expect(PercentageFormatter.formatPercentage(0.1234, 'decimal', 3)).toBe(12.34);
      expect(PercentageFormatter.formatPercentage(-0.05, 'decimal')).toBe(-5);
    });

    it('should format percentage values', () => {
      expect(PercentageFormatter.formatPercentage(15, 'percentage')).toBe(15);
      expect(PercentageFormatter.formatPercentage(12.34, 'percentage', 1)).toBe(12.3);
    });

    it('should handle null and invalid values', () => {
      expect(PercentageFormatter.formatPercentage(null)).toBe(null);
      expect(PercentageFormatter.formatPercentage(undefined)).toBe(null);
      expect(PercentageFormatter.formatPercentage(NaN)).toBe(null);
    });
  });

  describe('formatPercentageWithSymbol', () => {
    it('should format percentage with symbol', () => {
      expect(PercentageFormatter.formatPercentageWithSymbol(0.15, 'decimal')).toBe('15%');
      expect(PercentageFormatter.formatPercentageWithSymbol(15, 'percentage')).toBe('15%');
    });

    it('should handle null values', () => {
      expect(PercentageFormatter.formatPercentageWithSymbol(null)).toBe('N/A');
    });
  });

  describe('formatGrowthRate', () => {
    it('should format positive growth rates', () => {
      const result = PercentageFormatter.formatGrowthRate(0.15, 'decimal');
      expect(result?.value).toBe('+15%');
      expect(result?.trend).toBe('positive');
    });

    it('should format negative growth rates', () => {
      const result = PercentageFormatter.formatGrowthRate(-0.05, 'decimal');
      expect(result?.value).toBe('-5%');
      expect(result?.trend).toBe('negative');
    });

    it('should format zero growth rates', () => {
      const result = PercentageFormatter.formatGrowthRate(0, 'decimal');
      expect(result?.value).toBe('0%');
      expect(result?.trend).toBe('neutral');
    });

    it('should handle null values', () => {
      expect(PercentageFormatter.formatGrowthRate(null)).toBe(null);
    });
  });
});

describe('RatioFormatter', () => {
  describe('formatRatio', () => {
    it('should format ratio values', () => {
      expect(RatioFormatter.formatRatio(1.234, 'decimal', 2)).toBe(1.23);
      expect(RatioFormatter.formatRatio(5.6789, 'decimal', 3)).toBe(5.679);
    });

    it('should handle null and invalid values', () => {
      expect(RatioFormatter.formatRatio(null)).toBe(null);
      expect(RatioFormatter.formatRatio(undefined)).toBe(null);
      expect(RatioFormatter.formatRatio(NaN)).toBe(null);
    });
  });

  describe('formatRatioWithSuffix', () => {
    it('should format ratio with times suffix', () => {
      expect(RatioFormatter.formatRatioWithSuffix(2.5, 'times')).toBe('2.5x');
    });

    it('should format ratio with ratio suffix', () => {
      expect(RatioFormatter.formatRatioWithSuffix(1.5, 'ratio')).toBe('1.5:1');
    });

    it('should format ratio as decimal', () => {
      expect(RatioFormatter.formatRatioWithSuffix(1.23, 'decimal')).toBe('1.23');
    });

    it('should handle null values', () => {
      expect(RatioFormatter.formatRatioWithSuffix(null)).toBe('N/A');
    });
  });

  describe('formatFinancialRatio', () => {
    it('should format debt-equity ratio', () => {
      expect(RatioFormatter.formatFinancialRatio(0.75, 'debt_equity')).toBe('0.75');
    });

    it('should format P/E ratio with times', () => {
      expect(RatioFormatter.formatFinancialRatio(15.5, 'price_earnings')).toBe('15.5x');
    });

    it('should format P/B ratio with times', () => {
      expect(RatioFormatter.formatFinancialRatio(2.3, 'price_book')).toBe('2.3x');
    });

    it('should handle null values', () => {
      expect(RatioFormatter.formatFinancialRatio(null)).toBe('N/A');
    });
  });
});

describe('NullValueHandler', () => {
  describe('handleNullValue', () => {
    it('should return primary value when valid', () => {
      expect(NullValueHandler.handleNullValue(10, 5, 0)).toBe(10);
      expect(NullValueHandler.handleNullValue('test', 'fallback', 'default')).toBe('test');
    });

    it('should return fallback when primary is null', () => {
      expect(NullValueHandler.handleNullValue(null, 5, 0)).toBe(5);
      expect(NullValueHandler.handleNullValue(undefined, 'fallback', 'default')).toBe('fallback');
    });

    it('should return default when both primary and fallback are null', () => {
      expect(NullValueHandler.handleNullValue(null, null, 0)).toBe(0);
      expect(NullValueHandler.handleNullValue(undefined, undefined, 'default')).toBe('default');
    });

    it('should handle invalid numbers', () => {
      expect(NullValueHandler.handleNullValue(NaN, 5, 0)).toBe(5);
      expect(NullValueHandler.handleNullValue(Infinity, 5, 0)).toBe(5);
    });
  });

  describe('handleNullArray', () => {
    it('should handle null values in array with fallback', () => {
      const input = [1, null, 3, undefined, 5];
      const result = NullValueHandler.handleNullArray(input, 0);
      expect(result).toEqual([1, 0, 3, 0, 5]);
    });

    it('should remove nulls when specified', () => {
      const input = [1, null, 3, undefined, 5];
      const result = NullValueHandler.handleNullArray(input, 0, true);
      expect(result).toEqual([1, 0, 3, 0, 5]);
    });

    it('should handle empty array', () => {
      expect(NullValueHandler.handleNullArray([])).toEqual([]);
    });

    it('should handle non-array input', () => {
      expect(NullValueHandler.handleNullArray(null as any)).toEqual([]);
    });
  });

  describe('getMostRecentValue', () => {
    it('should return first valid value', () => {
      expect(NullValueHandler.getMostRecentValue([10, 20, 30])).toBe(10);
      expect(NullValueHandler.getMostRecentValue([null, 20, 30])).toBe(20);
    });

    it('should return fallback when no valid values', () => {
      expect(NullValueHandler.getMostRecentValue([null, undefined], 'fallback')).toBe('fallback');
    });

    it('should handle empty array', () => {
      expect(NullValueHandler.getMostRecentValue([], 'fallback')).toBe('fallback');
    });

    it('should handle invalid numbers', () => {
      expect(NullValueHandler.getMostRecentValue([NaN, Infinity, 10])).toBe(10);
    });
  });

  describe('calculateDataCompleteness', () => {
    it('should calculate completeness percentage', () => {
      expect(NullValueHandler.calculateDataCompleteness([1, 2, 3, 4, 5])).toBe(100);
      expect(NullValueHandler.calculateDataCompleteness([1, null, 3, null, 5])).toBe(60);
      expect(NullValueHandler.calculateDataCompleteness([null, null, null])).toBe(0);
    });

    it('should handle empty array', () => {
      expect(NullValueHandler.calculateDataCompleteness([])).toBe(0);
    });

    it('should handle invalid numbers', () => {
      expect(NullValueHandler.calculateDataCompleteness([1, NaN, 3, Infinity, 5])).toBe(60);
    });
  });

  describe('interpolateNullValues', () => {
    it('should forward fill null values', () => {
      const input = [1, null, null, 4, null];
      const result = NullValueHandler.interpolateNullValues(input, 'forward_fill');
      expect(result).toEqual([1, 1, 1, 4, 4]);
    });

    it('should backward fill null values', () => {
      const input = [null, null, 3, null, 5];
      const result = NullValueHandler.interpolateNullValues(input, 'backward_fill');
      expect(result).toEqual([3, 3, 3, 5, 5]);
    });

    it('should linearly interpolate null values', () => {
      const input = [1, null, null, 4, null];
      const result = NullValueHandler.interpolateNullValues(input, 'linear');
      expect(result).toEqual([1, 2, 3, 4, null]);
    });

    it('should handle empty array', () => {
      expect(NullValueHandler.interpolateNullValues([])).toEqual([]);
    });
  });
});

describe('DataTransformationUtils', () => {
  describe('transformMetricValue', () => {
    it('should transform currency values', () => {
      const result = DataTransformationUtils.transformMetricValue(100000000, 'currency', {
        currencyUnit: 'crores'
      });
      expect(result).toBe(10);
    });

    it('should transform percentage values', () => {
      const result = DataTransformationUtils.transformMetricValue(0.15, 'percentage', {
        percentageFormat: 'decimal'
      });
      expect(result).toBe(15);
    });

    it('should transform ratio values', () => {
      const result = DataTransformationUtils.transformMetricValue(1.234, 'ratio', {
        decimalPlaces: 2
      });
      expect(result).toBe(1.23);
    });

    it('should transform count values', () => {
      const result = DataTransformationUtils.transformMetricValue(1234.56, 'count');
      expect(result).toBe(1235); // No decimals for counts
    });

    it('should handle null values', () => {
      expect(DataTransformationUtils.transformMetricValue(null, 'currency')).toBe(null);
    });
  });

  describe('transformMetricForDisplay', () => {
    it('should transform currency for display', () => {
      const result = DataTransformationUtils.transformMetricForDisplay(100000000, 'currency', {
        currencyUnit: 'crores'
      });
      expect(result).toBe('₹10 crores');
    });

    it('should transform percentage for display', () => {
      const result = DataTransformationUtils.transformMetricForDisplay(0.15, 'percentage', {
        percentageFormat: 'decimal'
      });
      expect(result).toBe('15%');
    });

    it('should transform ratio for display', () => {
      const result = DataTransformationUtils.transformMetricForDisplay(2.5, 'ratio', {
        ratioFormat: 'times'
      });
      expect(result).toBe('2.5x');
    });

    it('should transform count for display', () => {
      const result = DataTransformationUtils.transformMetricForDisplay(1234567, 'count');
      expect(result).toBe('1,234,567');
    });

    it('should handle null values', () => {
      expect(DataTransformationUtils.transformMetricForDisplay(null, 'currency')).toBe('N/A');
      expect(DataTransformationUtils.transformMetricForDisplay(undefined, 'percentage')).toBe('N/A');
    });

    it('should handle currency without symbols', () => {
      const result = DataTransformationUtils.transformMetricForDisplay(100000000, 'currency', {
        currencyUnit: 'crores',
        includeSymbols: false
      });
      expect(result).toBe('10 crores');
    });
  });
});

// Integration tests
describe('Integration Tests', () => {
  it('should handle complex financial data transformation', () => {
    const financialData = {
      revenue: 500000000, // 50 crores
      profitMargin: 0.15, // 15%
      peRatio: 18.5,
      currentRatio: 1.25,
      shares: 10000000 // 1 crore shares
    };

    // Transform all values
    const transformed = {
      revenue: DataTransformationUtils.transformMetricForDisplay(financialData.revenue, 'currency'),
      profitMargin: DataTransformationUtils.transformMetricForDisplay(financialData.profitMargin, 'percentage'),
      peRatio: DataTransformationUtils.transformMetricForDisplay(financialData.peRatio, 'ratio', { ratioFormat: 'times' }),
      currentRatio: DataTransformationUtils.transformMetricForDisplay(financialData.currentRatio, 'ratio'),
      shares: DataTransformationUtils.transformMetricForDisplay(financialData.shares, 'count')
    };

    expect(transformed.revenue).toBe('₹50 crores');
    expect(transformed.profitMargin).toBe('15%');
    expect(transformed.peRatio).toBe('18.5x');
    expect(transformed.currentRatio).toBe('1.25');
    expect(transformed.shares).toBe('10,000,000');
  });

  it('should handle historical data with nulls', () => {
    const historicalRevenue = [null, 400000000, null, 450000000, 500000000];
    
    // Get most recent value
    const mostRecent = NullValueHandler.getMostRecentValue(historicalRevenue);
    expect(mostRecent).toBe(400000000);

    // Calculate data completeness
    const completeness = NullValueHandler.calculateDataCompleteness(historicalRevenue);
    expect(completeness).toBe(60);

    // Interpolate missing values
    const interpolated = NullValueHandler.interpolateNullValues(historicalRevenue, 'linear');
    expect(interpolated[0]).toBe(null); // Can't interpolate first value
    expect(interpolated[2]).toBe(425000000); // Linear interpolation between 400M and 450M
  });
});