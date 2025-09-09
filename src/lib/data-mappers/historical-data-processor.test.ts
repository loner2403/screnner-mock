// Unit tests for HistoricalDataProcessor
import { HistoricalDataProcessor, HistoricalDataConfig } from './historical-data-processor';
import { InsightSentryQuarterlyResponse, MappingErrorType } from '../../components/QuarterlyResults/types';

describe('HistoricalDataProcessor', () => {
  let processor: HistoricalDataProcessor;

  beforeEach(() => {
    processor = new HistoricalDataProcessor();
  });

  describe('processAnnualData', () => {
    it('should process valid annual data correctly', () => {
      const data = [100, 110, 120, 130, 140];
      const result = processor.processAnnualData(data, 'revenue_fy_h');

      expect(result.processedData).toEqual(data);
      expect(result.validDataPoints).toBe(5);
      expect(result.nullCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should limit data to maximum annual years', () => {
      const data = Array.from({ length: 25 }, (_, i) => i * 100);
      const result = processor.processAnnualData(data, 'revenue_fy_h');

      expect(result.processedData).toHaveLength(20); // Max 20 years
      expect(result.processedData).toEqual(data.slice(0, 20));
    });

    it('should handle null values correctly', () => {
      const data = [100, null, 120, null, 140];
      const result = processor.processAnnualData(data, 'revenue_fy_h');

      expect(result.processedData).toEqual(data);
      expect(result.validDataPoints).toBe(3);
      expect(result.nullCount).toBe(2);
    });

    it('should return empty result for invalid data', () => {
      const result = processor.processAnnualData(undefined, 'revenue_fy_h');

      expect(result.processedData).toEqual([]);
      expect(result.validDataPoints).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe(MappingErrorType.HISTORICAL_DATA_MISMATCH);
    });
  });

  describe('processQuarterlyData', () => {
    it('should process valid quarterly data correctly', () => {
      const data = [100, 110, 120, 130];
      const result = processor.processQuarterlyData(data, 'revenue_fq_h');

      expect(result.processedData).toEqual(data);
      expect(result.validDataPoints).toBe(4);
      expect(result.nullCount).toBe(0);
    });

    it('should limit data to maximum quarterly periods', () => {
      const data = Array.from({ length: 40 }, (_, i) => i * 100);
      const result = processor.processQuarterlyData(data, 'revenue_fq_h');

      expect(result.processedData).toHaveLength(32); // Max 32 quarters
      expect(result.processedData).toEqual(data.slice(0, 32));
    });
  });

  describe('extractHistoricalData', () => {
    it('should extract annual historical data from API response', () => {
      const apiResponse: Partial<InsightSentryQuarterlyResponse> = {
        revenue_fy_h: [1000, 1100, 1200, 1300]
      };

      const result = processor.extractHistoricalData(
        apiResponse as InsightSentryQuarterlyResponse,
        'revenue',
        'FY'
      );

      expect(result.processedData).toEqual([1000, 1100, 1200, 1300]);
      expect(result.validDataPoints).toBe(4);
    });

    it('should extract quarterly historical data from API response', () => {
      const apiResponse: Partial<InsightSentryQuarterlyResponse> = {
        revenue_fq_h: [250, 275, 300, 325]
      };

      const result = processor.extractHistoricalData(
        apiResponse as InsightSentryQuarterlyResponse,
        'revenue',
        'FQ'
      );

      expect(result.processedData).toEqual([250, 275, 300, 325]);
      expect(result.validDataPoints).toBe(4);
    });
  });

  describe('null value handling', () => {
    it('should handle null values with skip strategy', () => {
      const config: Partial<HistoricalDataConfig> = {
        nullValueHandling: 'skip'
      };
      processor = new HistoricalDataProcessor(config);

      const data = [100, null, 120, null, 140];
      const result = processor.processAnnualData(data, 'revenue_fy_h');

      expect(result.processedData).toEqual([100, null, 120, null, 140]);
      expect(result.validDataPoints).toBe(3);
    });

    it('should handle null values with zero strategy', () => {
      const config: Partial<HistoricalDataConfig> = {
        nullValueHandling: 'zero'
      };
      processor = new HistoricalDataProcessor(config);

      const data = [100, null, 120, null, 140];
      const result = processor.processAnnualData(data, 'revenue_fy_h');

      expect(result.processedData).toEqual([100, 0, 120, 0, 140]);
      expect(result.validDataPoints).toBe(5);
      expect(result.warnings).toHaveLength(2);
    });

    it('should handle null values with interpolate strategy', () => {
      const config: Partial<HistoricalDataConfig> = {
        nullValueHandling: 'interpolate'
      };
      processor = new HistoricalDataProcessor(config);

      const data = [100, null, 120, null, 140];
      const result = processor.processAnnualData(data, 'revenue_fy_h');

      expect(result.processedData[1]).toBe(110); // Interpolated between 100 and 120
      expect(result.processedData[3]).toBe(130); // Interpolated between 120 and 140
      expect(result.validDataPoints).toBe(5);
    });
  });

  describe('utility methods', () => {
    it('should get most recent value correctly', () => {
      const data = [100, null, 120, null, 140];
      const result = processor.getMostRecentValue(data);
      expect(result).toBe(100);
    });

    it('should get oldest value correctly', () => {
      const data = [100, null, 120, null, 140];
      const result = processor.getOldestValue(data);
      expect(result).toBe(140);
    });

    it('should get value at index with fallback', () => {
      const data = [100, null, 120, null, 140];
      
      expect(processor.getValueAtIndex(data, 0)).toBe(100);
      expect(processor.getValueAtIndex(data, 1)).toBe(120); // Fallback to nearest
      expect(processor.getValueAtIndex(data, 2)).toBe(120);
    });
  });

  describe('growth calculations', () => {
    describe('calculateYearOverYearGrowth', () => {
      it('should calculate YoY growth correctly', () => {
        const data = [120, 110, 100]; // Most recent first
        const results = processor.calculateYearOverYearGrowth(data, 'revenue_fy_h');

        expect(results).toHaveLength(2);
        expect(results[0].value).toBeCloseTo(9.09, 2); // (120-110)/110 * 100
        expect(results[1].value).toBeCloseTo(10, 2); // (110-100)/100 * 100
        expect(results[0].isValid).toBe(true);
      });

      it('should handle insufficient data', () => {
        const data = [100];
        const results = processor.calculateYearOverYearGrowth(data, 'revenue_fy_h');
        expect(results).toHaveLength(0);
      });

      it('should handle null values', () => {
        const data = [120, null, 100];
        const results = processor.calculateYearOverYearGrowth(data, 'revenue_fy_h');

        expect(results).toHaveLength(2);
        expect(results[0].value).toBe(null); // 120 vs null
        expect(results[0].isValid).toBe(false);
      });
    });

    describe('calculateQuarterOverQuarterGrowth', () => {
      it('should calculate QoQ growth correctly', () => {
        const data = [30, 25, 20]; // Most recent first
        const results = processor.calculateQuarterOverQuarterGrowth(data, 'revenue_fq_h');

        expect(results).toHaveLength(2);
        expect(results[0].value).toBe(20); // (30-25)/25 * 100
        expect(results[1].value).toBe(25); // (25-20)/20 * 100
      });
    });

    describe('calculateSameQuarterYearOverYearGrowth', () => {
      it('should calculate same quarter YoY growth correctly', () => {
        const data = [40, 35, 30, 25, 30, 25, 20, 15]; // 8 quarters, most recent first
        const results = processor.calculateSameQuarterYearOverYearGrowth(data, 'revenue_fq_h');

        expect(results).toHaveLength(4);
        expect(results[0].value).toBeCloseTo(33.33, 2); // Q1: (40-30)/30 * 100
        expect(results[1].value).toBe(40); // Q2: (35-25)/25 * 100
      });

      it('should handle insufficient data', () => {
        const data = [30, 25, 20]; // Only 3 quarters
        const results = processor.calculateSameQuarterYearOverYearGrowth(data, 'revenue_fq_h');
        expect(results).toHaveLength(0);
      });
    });

    describe('calculateCAGR', () => {
      it('should calculate CAGR correctly', () => {
        const data = [160, 140, 120, 100]; // 4 years, most recent first
        const result = processor.calculateCAGR(data, 'revenue_fy_h', 3);

        expect(result.value).toBeCloseTo(16.96, 2); // CAGR from 100 to 160 over 3 years
        expect(result.isValid).toBe(true);
        expect(result.baseValue).toBe(100); // 3 years ago (index 3)
        expect(result.currentValue).toBe(160);
      });

      it('should handle zero or negative base values', () => {
        const data = [100, 50, 0]; // Base value is 0
        const result = processor.calculateCAGR(data, 'revenue_fy_h', 2);

        expect(result.value).toBe(null);
        expect(result.isValid).toBe(false);
      });

      it('should use full array length if years not specified', () => {
        const data = [160, 140, 120, 100]; // 4 values = 3 years of growth
        const result = processor.calculateCAGR(data, 'revenue_fy_h');

        expect(result.period).toBe('CAGR (3 years)');
      });
    });
  });

  describe('statistical calculations', () => {
    describe('calculateMovingAverage', () => {
      it('should calculate moving average correctly', () => {
        const data = [10, 20, 30, 40, 50];
        const result = processor.calculateMovingAverage(data, 3, 'revenue_fy_h');

        expect(result).toHaveLength(5);
        expect(result[0]).toBe(null); // Not enough data
        expect(result[1]).toBe(null); // Not enough data
        expect(result[2]).toBe(20); // (10+20+30)/3
        expect(result[3]).toBe(30); // (20+30+40)/3
        expect(result[4]).toBe(40); // (30+40+50)/3
      });

      it('should handle null values in moving average', () => {
        const data = [10, null, 30, 40, 50];
        const result = processor.calculateMovingAverage(data, 3, 'revenue_fy_h');

        expect(result[2]).toBe(20); // (10+30)/2, ignoring null
        expect(result[3]).toBe(35); // (30+40)/2, ignoring null
      });
    });

    describe('calculateVolatility', () => {
      it('should calculate volatility correctly', () => {
        const data = [10, 20, 30, 40, 50];
        const result = processor.calculateVolatility(data, 'revenue_fy_h');

        expect(result).toBeCloseTo(15.81, 2); // Standard deviation
      });

      it('should handle insufficient data', () => {
        const data = [10];
        const result = processor.calculateVolatility(data, 'revenue_fy_h');

        expect(result).toBe(null);
      });
    });

    describe('calculateTrend', () => {
      it('should identify increasing trend', () => {
        const data = [10, 20, 30, 40, 50];
        const result = processor.calculateTrend(data, 'revenue_fy_h');

        expect(result).toBe('increasing');
      });

      it('should identify decreasing trend', () => {
        const data = [50, 40, 30, 20, 10];
        const result = processor.calculateTrend(data, 'revenue_fy_h');

        expect(result).toBe('decreasing');
      });

      it('should identify stable trend', () => {
        const data = [30, 30, 30, 30, 30];
        const result = processor.calculateTrend(data, 'revenue_fy_h');

        expect(result).toBe('stable');
      });

      it('should identify volatile trend', () => {
        const data = [10, 50, 15, 45, 20];
        const result = processor.calculateTrend(data, 'revenue_fy_h');

        expect(result).toBe('volatile');
      });

      it('should handle insufficient data', () => {
        const data = [10, 20];
        const result = processor.calculateTrend(data, 'revenue_fy_h');

        expect(result).toBe('insufficient-data');
      });
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const config: Partial<HistoricalDataConfig> = {
        maxAnnualYears: 10,
        maxQuarterlyPeriods: 16,
        nullValueHandling: 'zero'
      };
      processor = new HistoricalDataProcessor(config);

      const data = Array.from({ length: 15 }, (_, i) => i * 100);
      const result = processor.processAnnualData(data, 'revenue_fy_h');

      expect(result.processedData).toHaveLength(10); // Custom max years
    });

    it('should update configuration', () => {
      processor.updateConfig({ maxAnnualYears: 5 });
      const config = processor.getConfig();

      expect(config.maxAnnualYears).toBe(5);
      expect(config.maxQuarterlyPeriods).toBe(32); // Default unchanged
    });
  });

  describe('error handling', () => {
    it('should handle division by zero in growth calculations', () => {
      const data = [100, 0]; // Base value is 0
      const results = processor.calculateYearOverYearGrowth(data, 'revenue_fy_h');

      expect(results[0].value).toBe(null);
      expect(results[0].isValid).toBe(false);
    });

    it('should validate data consistency', () => {
      const config: Partial<HistoricalDataConfig> = {
        validateDataConsistency: true
      };
      processor = new HistoricalDataProcessor(config);

      // Data with extreme outlier
      const data = [100, 110, 1000000, 120, 130];
      const result = processor.processAnnualData(data, 'revenue_fy_h');

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('outliers'))).toBe(true);
    });
  });
});