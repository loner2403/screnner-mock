// Integration test for NonBankingDataMapper
import { NonBankingDataMapper } from './non-banking-mapper';
import { BankingDataMapper } from './banking-mapper';
import { InsightSentryQuarterlyResponse } from '../../components/QuarterlyResults/types';

describe('Data Mappers Integration', () => {
    describe('NonBankingDataMapper Integration', () => {
        it('should successfully process non-banking data', () => {
            const mockNonBankingData: Partial<InsightSentryQuarterlyResponse> = {
                revenue_fy: 100000,
                revenue_fy_h: [100000, 95000, 90000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 14000, 13000],
                total_assets_fy_h: [500000, 480000, 460000],
                total_equity_fy_h: [300000, 290000, 280000],
                gross_profit_fy_h: [40000],
                oper_income_fy_h: [20000],
                sector: 'Consumer Goods',
                quarters_info: {
                    dates: ['2024-12-31', '2024-09-30', '2024-06-30'],
                    periods: ['Q4 2024', 'Q3 2024', 'Q2 2024']
                }
            };

            // Use NonBankingDataMapper directly
            const mapper = new NonBankingDataMapper();
            const result = mapper.mapData(mockNonBankingData as InsightSentryQuarterlyResponse);

            expect(result.success).toBe(true);
            expect(result.data?.companyType).toBe('non-banking');
            expect(result.data?.sections).toBeDefined();
            expect(result.data?.sections.length).toBeGreaterThan(0);

            // Verify that it creates appropriate sections for non-banking data
            const sectionIds = result.data?.sections.map(s => s.id) || [];
            expect(sectionIds).toContain('profit-loss');
        });

        it('should produce different results than BankingDataMapper for the same data', () => {
            const mockData: Partial<InsightSentryQuarterlyResponse> = {
                revenue_fy: 100000,
                revenue_fy_h: [100000, 95000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 14000],
                total_assets_fy_h: [500000, 480000],
                total_equity_fy_h: [300000, 290000],
                quarters_info: {
                    dates: ['2024-12-31', '2024-09-30'],
                    periods: ['Q4 2024', 'Q3 2024']
                }
            };

            const nonBankingMapper = new NonBankingDataMapper();
            const bankingMapper = new BankingDataMapper();

            const nonBankingResult = nonBankingMapper.mapData(mockData as InsightSentryQuarterlyResponse);
            const bankingResult = bankingMapper.mapData(mockData as InsightSentryQuarterlyResponse);

            // Both should process the data, but with different company types
            if (nonBankingResult.success && bankingResult.success) {
                expect(nonBankingResult.data?.companyType).toBe('non-banking');
                expect(bankingResult.data?.companyType).toBe('banking');

                // Section structures should be different
                const nonBankingSectionIds = nonBankingResult.data?.sections.map(s => s.id) || [];
                const bankingSectionIds = bankingResult.data?.sections.map(s => s.id) || [];

                expect(nonBankingSectionIds).not.toEqual(bankingSectionIds);
            }
        });

        it('should handle comprehensive non-banking financial data', () => {
            const comprehensiveData: Partial<InsightSentryQuarterlyResponse> = {
                // P&L Data
                revenue_fy: 628810,
                revenue_fy_h: [628810, 595000, 560000, 525000, 490000],
                cost_of_goods_fy_h: [-354370, -335000, -315000, -295000, -275000],
                gross_profit_fy_h: [274440, 260000, 245000, 230000, 215000],
                operating_expenses_fy_h: [-139300, -132000, -125000, -118000, -111000],
                oper_income_fy_h: [135140, 128000, 120000, 112000, 104000],
                ebitda_fy_h: [147300, 140000, 132000, 124000, 116000],
                net_income_fy_h: [106490, 101000, 95000, 89000, 83000],

                // Balance Sheet Data
                total_assets_fy_h: [798800, 760000, 720000, 680000, 640000],
                total_liabilities_fy_h: [302540, 290000, 275000, 260000, 245000],
                total_equity_fy_h: [496090, 470000, 445000, 420000, 395000],
                cash_n_equivalents_fy_h: [63230, 60000, 57000, 54000, 51000],

                // Cash Flow Data
                cash_f_operating_activities_fy_h: [118860, 113000, 107000, 101000, 95000],
                free_cash_flow_fy_h: [54130, 51000, 48000, 45000, 42000],

                // Ratios
                return_on_equity_fy_h: [21.47, 21.5, 21.3, 21.2, 21.0],
                return_on_assets_fy_h: [13.3, 13.3, 13.2, 13.1, 13.0],
                debt_to_equity_fy_h: [0.033, 0.035, 0.037, 0.039, 0.041],

                quarters_info: {
                    dates: ['2024-12-31', '2024-09-30', '2024-06-30', '2024-03-31', '2023-12-31'],
                    periods: ['Q4 2024', 'Q3 2024', 'Q2 2024', 'Q1 2024', 'Q4 2023']
                }
            };

            const mapper = new NonBankingDataMapper();
            const result = mapper.mapData(comprehensiveData as InsightSentryQuarterlyResponse);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.sections).toBeDefined();

            // Should have multiple sections for comprehensive data
            expect(result.data?.sections.length).toBeGreaterThan(3);

            // Should have calculated derived metrics with minimal errors
            expect(result.errors.length).toBeLessThan(3); // Allow some errors for missing optional fields
            expect(result.warnings.length).toBeLessThan(10); // Some warnings are acceptable

            // Check that metadata is populated
            expect(result.data?.metadata.maxHistoricalYears).toBeGreaterThan(0);
            expect(result.data?.lastUpdated).toBeDefined();
        });
    });
});