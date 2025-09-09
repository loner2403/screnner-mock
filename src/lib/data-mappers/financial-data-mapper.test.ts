// Tests for FinancialDataMapper
import { FinancialDataMapper } from './financial-data-mapper';
import { InsightSentryQuarterlyResponse, MappingErrorType } from '../../components/QuarterlyResults/types';

describe('FinancialDataMapper', () => {
  let mapper: FinancialDataMapper;

  beforeEach(() => {
    mapper = new FinancialDataMapper({
      cacheEnabled: false, // Disable cache for testing
      enableRetry: false   // Disable retry for faster tests
    });
  });

  describe('mapFinancialData', () => {
    it('should successfully map banking data', async () => {
      const mockBankingData: InsightSentryQuarterlyResponse = {
        sector: 'Banks',
        interest_income_fy_h: [1000, 1100, 1200],
        interest_expense_fy_h: [400, 450, 500],
        total_deposits_fy_h: [50000, 55000, 60000],
        loans_net_fy_h: [40000, 44000, 48000],
        net_income_fy_h: [500, 550, 600]
      };

      const result = await mapper.mapFinancialData('HDFC', mockBankingData, 'Banks');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.companyType).toBe('banking');
      expect(result.data?.symbol).toBe('HDFC');
      expect(result.data?.sections).toBeDefined();
      expect(result.data?.sections.length).toBeGreaterThan(0);
    });

    it('should successfully map non-banking data', async () => {
      const mockNonBankingData: InsightSentryQuarterlyResponse = {
        sector: 'Technology',
        revenue_fy_h: [10000, 11000, 12000],
        gross_profit_fy_h: [6000, 6600, 7200],
        net_income_fy_h: [2000, 2200, 2400],
        total_assets_fy_h: [50000, 55000, 60000],
        total_equity_fy_h: [30000, 33000, 36000]
      };

      const result = await mapper.mapFinancialData('TCS', mockNonBankingData, 'Technology');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.companyType).toBe('non-banking');
      expect(result.data?.symbol).toBe('TCS');
      expect(result.data?.sections).toBeDefined();
      expect(result.data?.sections.length).toBeGreaterThan(0);
    });

    it('should handle empty API response gracefully', async () => {
      const emptyData: InsightSentryQuarterlyResponse = {};

      const result = await mapper.mapFinancialData('EMPTY', emptyData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.type === MappingErrorType.INVALID_DATA_TYPE)).toBe(true);
    });

    it('should force company type when specified', async () => {
      const mockData: InsightSentryQuarterlyResponse = {
        // Add required banking fields
        interest_income_fy_h: [1000, 1100, 1200],
        total_deposits_fy_h: [50000, 55000, 60000],
        loans_net_fy_h: [40000, 44000, 48000],
        revenue_fy_h: [10000, 11000, 12000],
        net_income_fy_h: [2000, 2200, 2400]
      };

      const result = await mapper.mapFinancialData('TEST', mockData, undefined, undefined, 'banking');

      expect(result.success).toBe(true);
      expect(result.data?.companyType).toBe('banking');
      expect(result.warnings?.some(warning => 
        warning.message.includes('Company type forced to: banking')
      )).toBe(true);
    });

    it('should attempt fallback when primary mapping fails', async () => {
      const ambiguousData: InsightSentryQuarterlyResponse = {
        sector: 'Financial Services', // Ambiguous sector
        revenue_fy_h: [10000], // Minimal data that might fail banking mapping
        net_income_fy_h: [1000]
      };

      const result = await mapper.mapFinancialData('AMBIGUOUS', ambiguousData, 'Financial Services');

      // Should either succeed with fallback or fail with appropriate errors
      if (result.success) {
        expect(result.data?.companyType).toBeDefined();
      } else {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateApiResponse', () => {
    it('should validate valid API response', () => {
      const validData: InsightSentryQuarterlyResponse = {
        revenue_fy_h: [1000, 1100, 1200],
        net_income_fy_h: [100, 110, 120]
      };

      const validation = mapper.validateApiResponse(validData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should reject null API response', () => {
      const validation = mapper.validateApiResponse(null as any);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].type).toBe(MappingErrorType.INVALID_DATA_TYPE);
    });

    it('should reject empty API response', () => {
      const validation = mapper.validateApiResponse({});

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].type).toBe(MappingErrorType.INVALID_DATA_TYPE);
    });
  });

  describe('cache functionality', () => {
    beforeEach(() => {
      mapper = new FinancialDataMapper({
        cacheEnabled: true,
        cacheTTL: 1000, // 1 second for testing
        maxCacheSize: 2
      });
    });

    it('should cache successful results', async () => {
      const mockData: InsightSentryQuarterlyResponse = {
        sector: 'Technology',
        // Add required non-banking fields
        revenue_fy_h: [10000, 11000, 12000],
        net_income_fy_h: [2000, 2200, 2400],
        total_assets_fy_h: [50000, 55000, 60000],
        total_equity_fy_h: [30000, 33000, 36000]
      };

      // First call
      const result1 = await mapper.mapFinancialData('CACHE_TEST', mockData, 'Technology');
      expect(result1.success).toBe(true);

      // Second call should use cache
      const result2 = await mapper.mapFinancialData('CACHE_TEST', mockData, 'Technology');
      expect(result2.success).toBe(true);
      expect(result2.warnings?.some(warning => 
        warning.message.includes('Data retrieved from cache')
      )).toBe(true);
    });

    it('should provide cache statistics', () => {
      const stats = mapper.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('oldestEntry');
    });

    it('should clear cache when requested', async () => {
      const mockData: InsightSentryQuarterlyResponse = {
        sector: 'Technology',
        revenue_fy_h: [10000],
        net_income_fy_h: [2000],
        total_assets_fy_h: [50000],
        total_equity_fy_h: [30000]
      };

      await mapper.mapFinancialData('CLEAR_TEST', mockData, 'Technology');
      
      let stats = mapper.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      mapper.clearCache();
      
      stats = mapper.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = {
        cacheEnabled: false,
        maxRetries: 5
      };

      mapper.updateConfig(newConfig);
      
      const currentConfig = mapper.getConfig();
      expect(currentConfig.cacheEnabled).toBe(false);
      expect(currentConfig.maxRetries).toBe(5);
    });

    it('should clear cache when caching is disabled', () => {
      mapper.updateConfig({ cacheEnabled: false });
      
      const stats = mapper.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('error handling integration', () => {
    it('should generate debug report', async () => {
      const mockData: InsightSentryQuarterlyResponse = {
        revenue_fy_h: [10000]
      };

      const result = await mapper.mapFinancialData('DEBUG_TEST', mockData);
      const debugReport = mapper.generateDebugReport('DEBUG_TEST', mockData, result);

      expect(debugReport).toContain('Financial Data Mapper Debug Report');
      expect(debugReport).toContain('Symbol: DEBUG_TEST');
      expect(debugReport).toContain('API Response Analysis');
      expect(debugReport).toContain('Company Type Detection');
    });

    it('should provide error statistics', () => {
      const stats = mapper.getErrorStatistics('TEST_SYMBOL');
      
      expect(stats).toHaveProperty('totalMappingAttempts');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('commonErrors');
      expect(stats).toHaveProperty('errorHistory');
    });
  });
});