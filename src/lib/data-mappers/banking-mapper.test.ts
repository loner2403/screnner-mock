// Banking Data Mapper Tests
import { BankingDataMapper } from './banking-mapper';
import { InsightSentryQuarterlyResponse, MappingErrorType } from '../../components/QuarterlyResults/types';

describe('BankingDataMapper', () => {
  let mapper: BankingDataMapper;

  beforeEach(() => {
    mapper = new BankingDataMapper();
  });

  describe('mapData', () => {
    it('should successfully map valid banking data', () => {
      const mockApiResponse: Partial<InsightSentryQuarterlyResponse> = {
        interest_income_fy: 50000,
        net_income_fy: 15000,
        interest_income_fy_h: [45000, 48000, 50000],
        interest_income_net_fy_h: [25000, 28000, 30000],
        total_deposits_fy_h: [900000, 950000, 1000000],
        loans_net_fy_h: [750000, 775000, 800000],
        net_income_fy_h: [12000, 14000, 15000],
        nonperf_loans_fy_h: [8000, 9000, 10000],
        loan_loss_allowances_fy_h: [6000, 7000, 8000],
        quarters_info: {
          dates: ['2024-03-31'],
          periods: ['Q4 FY24']
        }
      };

      const result = mapper.mapData(mockApiResponse as InsightSentryQuarterlyResponse);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.companyType).toBe('banking');
      expect(result.data?.sections).toBeDefined();
      expect(result.data?.sections.length).toBeGreaterThan(0);
    });

    it('should fail when critical banking fields are missing', () => {
      const mockApiResponse: Partial<InsightSentryQuarterlyResponse> = {
        // Missing all critical banking fields
        revenue_fy: 100000,
        net_income_fy: 5000
      };

      const result = mapper.mapData(mockApiResponse as InsightSentryQuarterlyResponse);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.some(e => e.type === MappingErrorType.MISSING_REQUIRED_FIELD)).toBe(true);
    });

    it('should calculate derived metrics correctly', () => {
      const mockApiResponse: Partial<InsightSentryQuarterlyResponse> = {
        interest_income_fy: 50000,
        net_income_fy: 15000,
        interest_income_fy_h: [45000, 48000, 50000],
        interest_income_net_fy_h: [25000, 28000, 30000],
        non_interest_income_fy_h: [8000, 9000, 10000],
        non_interest_expense_fy_h: [20000, 22000, 25000],
        total_deposits_fy_h: [900000, 950000, 1000000],
        demand_deposits_fy_h: [350000, 375000, 400000],
        loans_net_fy_h: [750000, 775000, 800000],
        loans_gross_fy_h: [770000, 795000, 820000],
        nonperf_loans_fy_h: [12000, 13000, 15000],
        loan_loss_allowances_fy_h: [10000, 11000, 12000],
        quarters_info: {
          dates: ['2024-03-31'],
          periods: ['Q4 FY24']
        }
      };

      const result = mapper.mapData(mockApiResponse as InsightSentryQuarterlyResponse);

      expect(result.success).toBe(true);
      
      // Check if derived metrics were calculated
      const apiResponseWithCalculated = mockApiResponse as any;
      expect(apiResponseWithCalculated.calculated_casa_ratio).toBeDefined();
      expect(apiResponseWithCalculated.calculated_cd_ratio).toBeDefined();
      expect(apiResponseWithCalculated.calculated_efficiency_ratio).toBeDefined();
    });

    it('should validate data consistency', () => {
      const mockApiResponse: Partial<InsightSentryQuarterlyResponse> = {
        interest_income_fy: 50000,
        interest_income_fq: 50000,
        interest_income_net_fq: 60000, // Invalid: net > gross
        total_assets_fq: 1000000,
        total_liabilities_fq: 1200000, // Invalid: liabilities > assets
        net_income_fy: 15000,
        interest_income_fy_h: [45000, 48000, 50000],
        total_deposits_fy_h: [900000, 950000, 1000000],
        loans_net_fy_h: [750000, 775000, 800000],
        quarters_info: {
          dates: ['2024-03-31'],
          periods: ['Q4 FY24']
        }
      };

      const result = mapper.mapData(mockApiResponse as InsightSentryQuarterlyResponse);

      expect(result.errors.some(e => e.field === 'balance_sheet_consistency')).toBe(true);
      expect(result.errors.some(e => e.field === 'interest_income_consistency')).toBe(true);
    });

    it('should handle missing historical data gracefully', () => {
      const mockApiResponse: Partial<InsightSentryQuarterlyResponse> = {
        interest_income_fy: 50000,
        net_income_fy: 15000,
        // No historical data
        quarters_info: {
          dates: ['2024-03-31'],
          periods: ['Q4 FY24']
        }
      };

      const result = mapper.mapData(mockApiResponse as InsightSentryQuarterlyResponse);

      expect(result.success).toBe(false); // Should fail due to missing critical data
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateBankingMetrics', () => {
    it('should validate reasonable banking ratios', () => {
      const mockApiResponse: Partial<InsightSentryQuarterlyResponse> = {
        net_interest_margin_fq: 3.5, // Reasonable
        nonperf_loans_loans_gross_fq: 2.1, // Reasonable
        total_deposits_fq: 1000000 // Positive
      };

      const errors = mapper.validateBankingMetrics(mockApiResponse as InsightSentryQuarterlyResponse);
      expect(errors).toHaveLength(0);
    });

    it('should flag unrealistic banking ratios', () => {
      const mockApiResponse: Partial<InsightSentryQuarterlyResponse> = {
        net_interest_margin_fq: 25, // Unrealistic
        nonperf_loans_loans_gross_fq: 60, // Unrealistic
        total_deposits_fq: -1000000 // Invalid
      };

      const errors = mapper.validateBankingMetrics(mockApiResponse as InsightSentryQuarterlyResponse);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'net_interest_margin_fq')).toBe(true);
      expect(errors.some(e => e.field === 'nonperf_loans_loans_gross_fq')).toBe(true);
      expect(errors.some(e => e.field === 'total_deposits_fq')).toBe(true);
    });
  });

  describe('derived metric calculations', () => {
    it('should calculate Net NPA ratio correctly', () => {
      const mockApiResponse: any = {
        nonperf_loans_fy_h: [10000, 12000, 15000],
        loan_loss_allowances_fy_h: [8000, 10000, 12000],
        loans_net_fy_h: [750000, 775000, 800000]
      };

      mapper['calculateNetNPARatio'](mockApiResponse);

      expect(mockApiResponse.calculated_net_npa).toBeDefined();
      expect(mockApiResponse.calculated_net_npa_h).toBeDefined();
      expect(mockApiResponse.calculated_net_npa_h).toHaveLength(3);
      
      // Check individual calculations
      // Index 0: (10000-8000)/750000 * 100 = 0.267
      expect(mockApiResponse.calculated_net_npa_h[0]).toBeCloseTo(0.267, 1);
      // Index 1: (12000-10000)/775000 * 100 = 0.258
      expect(mockApiResponse.calculated_net_npa_h[1]).toBeCloseTo(0.258, 1);
      // Index 2: (15000-12000)/800000 * 100 = 0.375
      expect(mockApiResponse.calculated_net_npa_h[2]).toBeCloseTo(0.375, 1);
      
      // Current value should be the first non-null value (index 0)
      expect(mockApiResponse.calculated_net_npa).toBeCloseTo(0.267, 1);
    });

    it('should calculate CASA ratio correctly', () => {
      const mockApiResponse: any = {
        demand_deposits_fy_h: [350000, 375000, 400000],
        total_deposits_fy_h: [900000, 950000, 1000000]
      };

      mapper['calculateCASARatio'](mockApiResponse);

      expect(mockApiResponse.calculated_casa_ratio).toBeDefined();
      expect(mockApiResponse.calculated_casa_ratio_h).toBeDefined();
      expect(mockApiResponse.calculated_casa_ratio_h).toHaveLength(3);
      
      // Check individual calculations
      // Index 0: 350000/900000 * 100 = 38.89
      expect(mockApiResponse.calculated_casa_ratio_h[0]).toBeCloseTo(38.89, 1);
      // Index 1: 375000/950000 * 100 = 39.47
      expect(mockApiResponse.calculated_casa_ratio_h[1]).toBeCloseTo(39.47, 1);
      // Index 2: 400000/1000000 * 100 = 40
      expect(mockApiResponse.calculated_casa_ratio_h[2]).toBeCloseTo(40, 1);
      
      // Current value should be the first non-null value (index 0)
      expect(mockApiResponse.calculated_casa_ratio).toBeCloseTo(38.89, 1);
    });

    it('should calculate efficiency ratio correctly', () => {
      const mockApiResponse: any = {
        non_interest_expense_fy_h: [20000, 22000, 25000],
        interest_income_net_fy_h: [25000, 28000, 30000],
        non_interest_income_fy_h: [8000, 9000, 10000]
      };

      mapper['calculateEfficiencyRatio'](mockApiResponse);

      expect(mockApiResponse.calculated_efficiency_ratio).toBeDefined();
      expect(mockApiResponse.calculated_efficiency_ratio_h).toBeDefined();
      expect(mockApiResponse.calculated_efficiency_ratio_h).toHaveLength(3);
      
      // Check individual calculations
      // Index 0: 20000/(25000+8000) * 100 = 60.61
      expect(mockApiResponse.calculated_efficiency_ratio_h[0]).toBeCloseTo(60.61, 1);
      // Index 1: 22000/(28000+9000) * 100 = 59.46
      expect(mockApiResponse.calculated_efficiency_ratio_h[1]).toBeCloseTo(59.46, 1);
      // Index 2: 25000/(30000+10000) * 100 = 62.5
      expect(mockApiResponse.calculated_efficiency_ratio_h[2]).toBeCloseTo(62.5, 1);
      
      // Current value should be the first non-null value (index 0)
      expect(mockApiResponse.calculated_efficiency_ratio).toBeCloseTo(60.61, 1);
    });
  });
});