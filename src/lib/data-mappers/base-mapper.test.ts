// Base Data Mapper Tests
import { BaseDataMapper } from './base-mapper';
import { DataTransformationUtils } from './data-transformation-utils';
import {
  MappingConfig,
  FieldMapping,
  InsightSentryQuarterlyResponse,
  MappingErrorType
} from '../../components/QuarterlyResults/types';

// Test implementation of BaseDataMapper
class TestDataMapper extends BaseDataMapper {
  mapData(apiResponse: InsightSentryQuarterlyResponse) {
    this.resetErrors();

    if (!this.validateApiResponse(apiResponse)) {
      return this.createFailureResult();
    }

    const sections = this.buildSections(apiResponse);

    return this.createSuccessResult({
      companyType: this.config.companyType,
      symbol: 'TEST',
      sections,
      lastUpdated: new Date().toISOString(),
      metadata: {
        maxHistoricalYears: 20,
        maxQuarterlyPeriods: 32
      }
    });
  }
}

describe('BaseDataMapper', () => {
  let mapper: TestDataMapper;
  let mockConfig: MappingConfig;
  let mockApiResponse: InsightSentryQuarterlyResponse;

  beforeEach(() => {
    mockConfig = {
      companyType: 'non-banking',
      sections: {
        profitability: {
          name: 'Profitability',
          fields: [
            {
              apiField: 'revenue_fy',
              historicalField: 'revenue_fy_h',
              displayName: 'Revenue',
              unit: 'currency',
              category: 'profitability',
              section: 'profitability',
              required: true
            } as FieldMapping
          ]
        }
      }
    };

    mockApiResponse = {
      revenue_fy: 1000000000,
      revenue_fy_h: [800000000, 900000000, 1000000000]
    };

    mapper = new TestDataMapper(mockConfig);
  });

  describe('extractMetric', () => {
    it('should extract metric with current value and historical data', () => {
      const fieldMapping: FieldMapping = {
        apiField: 'revenue_fy',
        historicalField: 'revenue_fy_h',
        displayName: 'Revenue',
        unit: 'currency',
        category: 'profitability',
        section: 'profitability',
        required: true
      };

      const result = (mapper as any).extractMetric(mockApiResponse, fieldMapping, 'profitability');

      expect(result).toBeTruthy();
      expect(result.name).toBe('Revenue');
      expect(result.currentValue).toBe(1000000000);
      expect(result.historicalValues).toEqual([800000000, 900000000, 1000000000]);
      expect(result.unit).toBe('currency');
      expect(result.category).toBe('profitability');
    });

    it('should handle missing required field', () => {
      const fieldMapping: FieldMapping = {
        apiField: 'missing_field',
        displayName: 'Missing Field',
        unit: 'currency',
        category: 'profitability',
        section: 'profitability',
        required: true
      };

      const result = (mapper as any).extractMetric(mockApiResponse, fieldMapping, 'profitability');

      expect(result).toBeNull();
      expect((mapper as any).errors).toHaveLength(1);
      expect((mapper as any).errors[0].type).toBe(MappingErrorType.MISSING_REQUIRED_FIELD);
    });

    it('should handle calculation functions', () => {
      const fieldMapping: FieldMapping = {
        apiField: 'calculated_field',
        displayName: 'Calculated Field',
        unit: 'percentage',
        category: 'profitability',
        section: 'profitability',
        required: false,
        calculation: (data) => (data.revenue_fy || 0) * 0.1
      };

      const result = (mapper as any).extractMetric(mockApiResponse, fieldMapping, 'profitability');

      expect(result).toBeTruthy();
      expect(result.currentValue).toBe(100000000); // 10% of revenue
    });
  });

  describe('extractHistoricalData', () => {
    it('should extract valid historical array', () => {
      const result = (mapper as any).extractHistoricalData(mockApiResponse, 'revenue_fy_h');

      expect(result).toEqual([800000000, 900000000, 1000000000]);
    });

    it('should handle non-array data', () => {
      const result = (mapper as any).extractHistoricalData({ revenue_fy: 1000 }, 'revenue_fy');

      expect(result).toEqual([]);
    });

    it('should handle invalid values in array', () => {
      const dataWithInvalidValues = {
        test_field: [100, null, 'invalid', 300, undefined]
      };

      const result = (mapper as any).extractHistoricalData(dataWithInvalidValues, 'test_field');

      expect(result).toEqual([100, null, null, 300, null]);
      expect((mapper as any).warnings).toHaveLength(1);
    });
  });

  describe('validateApiResponse', () => {
    it('should validate valid API response', () => {
      const result = (mapper as any).validateApiResponse(mockApiResponse);

      expect(result).toBe(true);
      expect((mapper as any).errors).toHaveLength(0);
    });

    it('should reject null API response', () => {
      const result = (mapper as any).validateApiResponse(null);

      expect(result).toBe(false);
      expect((mapper as any).errors).toHaveLength(1);
      expect((mapper as any).errors[0].type).toBe(MappingErrorType.INVALID_DATA_TYPE);
    });

    it('should reject empty API response', () => {
      const result = (mapper as any).validateApiResponse({});

      expect(result).toBe(false);
      expect((mapper as any).errors).toHaveLength(1);
    });
  });

  describe('mapData integration', () => {
    it('should successfully map valid data', () => {
      const result = mapper.mapData(mockApiResponse);

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.data?.companyType).toBe('non-banking');
      expect(result.data?.sections).toHaveLength(1);
      expect(result.data?.sections[0].metrics).toHaveLength(1);
    });

    it('should fail with invalid data', () => {
      const result = mapper.mapData(null as any);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});

describe('DataTransformationUtils', () => {
  describe('formatCurrency', () => {
    it('should convert to crores', () => {
      const result = DataTransformationUtils.formatCurrency(100000000, 'crores');
      expect(result).toBe(10); // 10 crores
    });

    it('should handle null values', () => {
      const result = DataTransformationUtils.formatCurrency(null);
      expect(result).toBeNull();
    });

    it('should handle NaN values', () => {
      const result = DataTransformationUtils.formatCurrency(NaN);
      expect(result).toBeNull();
    });
  });

  describe('formatPercentage', () => {
    it('should round to 2 decimal places', () => {
      const result = DataTransformationUtils.formatPercentage(0.123456, 'decimal', 2);
      expect(result).toBe(12.35);
    });

    it('should handle null values', () => {
      const result = DataTransformationUtils.formatPercentage(null);
      expect(result).toBeNull();
    });
  });

  describe('formatRatio', () => {
    it('should round to 3 decimal places', () => {
      const result = DataTransformationUtils.formatRatio(1.23456, 'decimal', 3);
      expect(result).toBe(1.235);
    });

    it('should handle null values', () => {
      const result = DataTransformationUtils.formatRatio(null);
      expect(result).toBeNull();
    });
  });

  describe('handleNullValue', () => {
    it('should return value if not null', () => {
      const result = DataTransformationUtils.handleNullValue(42);
      expect(result).toBe(42);
    });

    it('should return fallback for null', () => {
      const result = DataTransformationUtils.handleNullValue(null, 0);
      expect(result).toBe(0);
    });

    it('should return default fallback (null) when no fallback provided', () => {
      const result = DataTransformationUtils.handleNullValue(null);
      expect(result).toBeNull();
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate positive change', () => {
      const result = DataTransformationUtils.calculatePercentageChange(110, 100);
      expect(result).toBe(10);
    });

    it('should calculate negative change', () => {
      const result = DataTransformationUtils.calculatePercentageChange(90, 100);
      expect(result).toBe(-10);
    });

    it('should handle null values', () => {
      const result = DataTransformationUtils.calculatePercentageChange(null, 100);
      expect(result).toBeNull();
    });

    it('should handle zero previous value', () => {
      const result = DataTransformationUtils.calculatePercentageChange(100, 0);
      expect(result).toBeNull();
    });
  });

  describe('calculateCAGR', () => {
    it('should calculate CAGR correctly', () => {
      const result = DataTransformationUtils.calculateCAGR(100, 121, 2);
      expect(result).toBeCloseTo(10, 1); // ~10% CAGR
    });

    it('should handle null values', () => {
      const result = DataTransformationUtils.calculateCAGR(null, 121, 2);
      expect(result).toBeNull();
    });

    it('should handle zero start value', () => {
      const result = DataTransformationUtils.calculateCAGR(0, 121, 2);
      expect(result).toBeNull();
    });

    it('should handle zero periods', () => {
      const result = DataTransformationUtils.calculateCAGR(100, 121, 0);
      expect(result).toBeNull();
    });
  });
});