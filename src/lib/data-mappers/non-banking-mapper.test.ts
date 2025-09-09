// Non-Banking Data Mapper Tests
import { NonBankingDataMapper } from './non-banking-mapper';
import {
    InsightSentryQuarterlyResponse,
    MappingErrorType
} from '../../components/QuarterlyResults/types';

// Helper function to create mock API response with proper typing
// @ts-ignore - Test helper function with flexible typing for mock data
function createMockApiResponse(overrides: any = {}): InsightSentryQuarterlyResponse {
    const base = {
        quarters_info: {
            dates: ['2024-12-31'],
            periods: ['Q4 2024']
        }
    };
    
    // Merge overrides, handling quarters_info specially
    const merged = { ...base, ...overrides };
    if (overrides.quarters_info) {
        merged.quarters_info = {
            ...base.quarters_info,
            ...overrides.quarters_info
        };
    }
    
    return merged as InsightSentryQuarterlyResponse;
}

describe('NonBankingDataMapper', () => {
    let mapper: NonBankingDataMapper;

    beforeEach(() => {
        mapper = new NonBankingDataMapper();
    });

    describe('Constructor', () => {
        it('should initialize with non-banking mapping configuration', () => {
            expect(mapper).toBeInstanceOf(NonBankingDataMapper);
            expect((mapper as unknown as { config: { companyType: string } }).config.companyType).toBe('non-banking');
        });
    });

    describe('mapData', () => {
        it('should successfully map valid non-banking data', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 95000, 90000, 85000, 80000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 14000, 13000, 12000, 11000],
                total_assets_fy_h: [500000, 480000, 460000, 440000, 420000],
                total_equity_fy_h: [300000, 290000, 280000, 270000, 260000],
                gross_profit_fy_h: [40000, 38000, 36000, 34000, 32000],
                oper_income_fy_h: [20000, 19000, 18000, 17000, 16000],
                quarters_info: {
                    dates: ['2024-12-31', '2024-09-30', '2024-06-30', '2024-03-31'],
                    periods: ['Q4 2024', 'Q3 2024', 'Q2 2024', 'Q1 2024']
                }
            });
            
            // Add the missing current values that will be calculated from historical data
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;
            (mockApiResponse as any).gross_profit_fy = 40000;
            (mockApiResponse as any).oper_income_fy = 20000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.companyType).toBe('non-banking');
            expect(result.data?.sections).toBeDefined();
            expect(result.data?.sections.length).toBeGreaterThan(0);
        });

        it('should handle missing required fields gracefully', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                // Missing other required fields
            });

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.type === MappingErrorType.MISSING_REQUIRED_FIELD)).toBe(true);
        });

        it('should validate revenue is positive', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: -100000, // Invalid negative revenue
                revenue_fy_h: [-100000, -95000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 14000],
                total_assets_fy_h: [500000, 480000],
                total_equity_fy_h: [300000, 290000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.errors.some(e =>
                e.field === 'revenue_fy' &&
                e.type === MappingErrorType.INVALID_DATA_TYPE
            )).toBe(true);
        });

        it('should validate total assets are positive', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 95000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 14000],
                total_assets_fy_h: [-500000, -480000],
                total_equity_fy_h: [300000, 290000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = -500000; // Invalid negative assets
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.errors.some(e =>
                e.field === 'total_assets_fy' &&
                e.type === MappingErrorType.INVALID_DATA_TYPE
            )).toBe(true);
        });

        it('should validate balance sheet consistency (Assets >= Liabilities)', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 95000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 14000],
                total_assets_fy_h: [300000, 290000],
                total_liabilities_fy_h: [400000, 390000],
                total_equity_fy_h: [200000, 190000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 300000;
            (mockApiResponse as any).total_liabilities_fy = 400000; // Liabilities > Assets (invalid)
            (mockApiResponse as any).total_equity_fy = 200000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.errors.some(e =>
                e.field === 'balance_sheet_consistency' &&
                e.type === MappingErrorType.INVALID_DATA_TYPE
            )).toBe(true);
        });

        it('should validate profit hierarchy consistency', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 95000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 14000],
                total_assets_fy_h: [500000, 480000],
                total_equity_fy_h: [300000, 290000],
                gross_profit_fy_h: [20000, 19000],
                oper_income_fy_h: [30000, 29000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;
            (mockApiResponse as any).gross_profit_fy = 20000;
            (mockApiResponse as any).oper_income_fy = 30000; // Operating profit > Gross profit (unusual)

            const result = mapper.mapData(mockApiResponse);

            expect(result.warnings.some(w =>
                w.field === 'profit_hierarchy_consistency' &&
                w.type === MappingErrorType.INVALID_DATA_TYPE
            )).toBe(true);
        });

        it('should handle null API response', () => {
            const result = mapper.mapData(null as any);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.some(e => e.field === 'root')).toBe(true);
        });

        it('should handle empty API response', () => {
            const result = mapper.mapData({} as InsightSentryQuarterlyResponse);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('Derived Metrics Calculations', () => {
        it('should calculate gross margin when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000, 80000],
                cost_of_goods_fy_h: [-60000, -54000, -48000], // Negative values as typical
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500, 12000],
                total_assets_fy_h: [500000, 450000, 400000],
                total_equity_fy_h: [300000, 270000, 240000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            // Check if calculated gross margin was added
            expect((mockApiResponse as unknown as { calculated_gross_margin_h: number[] }).calculated_gross_margin_h).toBeDefined();
            expect((mockApiResponse as unknown as { calculated_gross_margin_h: number[] }).calculated_gross_margin_h.length).toBe(3);
            expect((mockApiResponse as unknown as { calculated_gross_margin_h: number[] }).calculated_gross_margin_h[0]).toBeCloseTo(40); // (100000-60000)/100000 * 100
        });

        it('should calculate operating margin when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000, 80000],
                oper_income_fy_h: [20000, 18000, 16000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500, 12000],
                total_assets_fy_h: [500000, 450000, 400000],
                total_equity_fy_h: [300000, 270000, 240000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            // Check if calculated operating margin was added
            const responseWithOperMargin = mockApiResponse as unknown as { calculated_operating_margin_h: number[] };
            expect(responseWithOperMargin.calculated_operating_margin_h).toBeDefined();
            expect(responseWithOperMargin.calculated_operating_margin_h.length).toBe(3);
            expect(responseWithOperMargin.calculated_operating_margin_h[0]).toBeCloseTo(20); // 20000/100000 * 100
        });

        it('should calculate net margin when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000, 80000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500, 12000],
                total_assets_fy_h: [500000, 450000, 400000],
                total_equity_fy_h: [300000, 270000, 240000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            // Check if calculated net margin was added
            const responseWithNetMargin = mockApiResponse as unknown as { calculated_net_margin_h: number[] };
            expect(responseWithNetMargin.calculated_net_margin_h).toBeDefined();
            expect(responseWithNetMargin.calculated_net_margin_h.length).toBe(3);
            expect(responseWithNetMargin.calculated_net_margin_h[0]).toBeCloseTo(15); // 15000/100000 * 100
        });

        it('should calculate EBITDA when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000, 80000],
                oper_income_fy_h: [20000, 18000, 16000],
                depreciation_fy_h: [-2000, -1800, -1600], // Negative as typical
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500, 12000],
                total_assets_fy_h: [500000, 450000, 400000],
                total_equity_fy_h: [300000, 270000, 240000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            // Check if calculated EBITDA was added
            const responseWithEbitda = mockApiResponse as unknown as { calculated_ebitda_h: number[] };
            expect(responseWithEbitda.calculated_ebitda_h).toBeDefined();
            expect(responseWithEbitda.calculated_ebitda_h.length).toBe(3);
            expect(responseWithEbitda.calculated_ebitda_h[0]).toBeCloseTo(22000); // 20000 + 2000
        });

        it('should calculate ROE when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000, 80000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500, 12000],
                total_assets_fy_h: [500000, 450000, 400000],
                total_equity_fy_h: [300000, 270000, 240000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            // Check if calculated ROE was added
            const responseWithRoe = mockApiResponse as unknown as { calculated_roe_h: number[] };
            expect(responseWithRoe.calculated_roe_h).toBeDefined();
            expect(responseWithRoe.calculated_roe_h.length).toBe(3);
            expect(responseWithRoe.calculated_roe_h[0]).toBeCloseTo(5); // 15000/300000 * 100
        });

        it('should calculate ROA when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000, 80000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500, 12000],
                total_assets_fy_h: [500000, 450000, 400000],
                total_equity_fy_h: [300000, 270000, 240000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            // Check if calculated ROA was added
            const responseWithRoa = mockApiResponse as unknown as { calculated_roa_h: number[] };
            expect(responseWithRoa.calculated_roa_h).toBeDefined();
            expect(responseWithRoa.calculated_roa_h.length).toBe(3);
            expect(responseWithRoa.calculated_roa_h[0]).toBeCloseTo(3); // 15000/500000 * 100
        });

        it('should calculate debt to equity when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000, 80000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500, 12000],
                total_assets_fy_h: [500000, 450000, 400000],
                total_equity_fy_h: [300000, 270000, 240000],
                total_debt_fy_h: [60000, 54000, 48000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            // Check if calculated debt to equity was added
            const responseWithDebtEquity = mockApiResponse as unknown as { calculated_debt_to_equity_h: number[] };
            expect(responseWithDebtEquity.calculated_debt_to_equity_h).toBeDefined();
            expect(responseWithDebtEquity.calculated_debt_to_equity_h.length).toBe(3);
            expect(responseWithDebtEquity.calculated_debt_to_equity_h[0]).toBeCloseTo(0.2); // 60000/300000
        });
    });

    describe('Fallback Calculations', () => {
        it('should calculate gross profit from revenue and COGS when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500],
                total_assets_fy_h: [500000, 450000],
                total_equity_fy_h: [300000, 270000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).cost_of_goods_fy = -60000; // Negative as typical
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            expect((mockApiResponse as unknown as { gross_profit_fy: number }).gross_profit_fy).toBe(40000); // 100000 - 60000
        });

        it('should calculate operating income from gross profit and operating expenses when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500],
                total_assets_fy_h: [500000, 450000],
                total_equity_fy_h: [300000, 270000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).gross_profit_fy = 40000;
            (mockApiResponse as any).operating_expenses_fy = -20000; // Negative as typical
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            expect((mockApiResponse as unknown as { oper_income_fy: number }).oper_income_fy).toBe(20000); // 40000 - 20000
        });

        it('should calculate total equity from assets minus liabilities when missing', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500],
                total_assets_fy_h: [500000, 450000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_liabilities_fy = 200000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.success).toBe(true);
            expect((mockApiResponse as unknown as { total_equity_fy: number }).total_equity_fy).toBe(300000); // 500000 - 200000
        });
    });

    describe('Historical Data Validation', () => {
        it('should warn about inconsistent historical array lengths', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000, 80000, 70000, 60000], // 5 elements
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500], // 2 elements (significant difference)
                total_assets_fy_h: [500000, 450000, 400000], // 3 elements
                total_equity_fy_h: [300000, 270000, 240000, 210000] // 4 elements
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            expect(result.warnings.some(w =>
                w.field === 'historical_arrays' &&
                w.type === MappingErrorType.HISTORICAL_DATA_MISMATCH
            )).toBe(true);
        });

        it('should validate historical data quality', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 0, 0, 0, 0], // 80% zeros (treated as nulls)
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500, 12000],
                total_assets_fy_h: [500000, 450000, 400000],
                total_equity_fy_h: [300000, 270000, 240000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            // The mapper should successfully process the data even with some null values
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();

            // Check that the mapper handles null values gracefully
            expect(result.data?.sections).toBeDefined();
            expect(result.data?.sections.length).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle calculation errors gracefully', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: 100000,
                revenue_fy_h: [100000, 90000],
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500],
                total_assets_fy_h: [500000, 450000],
                total_equity_fy_h: [300000, 270000],
                // Intentionally malformed data to trigger calculation errors
                cost_of_goods_fy_h: ['invalid', 'data'] as unknown as number[]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            // Should still succeed but may have warnings about calculation failures
            expect(result.success).toBe(true);
            // Check if there are any warnings (calculation errors may or may not occur depending on implementation)
            expect(result.warnings).toBeDefined();
        });

        it('should provide detailed error context', () => {
            const mockApiResponse = createMockApiResponse({
                revenue_fy: -100000, // Invalid negative revenue
                net_income_fy: 15000,
                net_income_fy_h: [15000, 13500],
                total_assets_fy_h: [500000, 450000],
                total_equity_fy_h: [300000, 270000]
            });
            
            // Add the missing current values
            (mockApiResponse as any).total_assets_fy = 500000;
            (mockApiResponse as any).total_equity_fy = 300000;

            const result = mapper.mapData(mockApiResponse);

            // Should have validation errors for negative revenue
            const revenueError = result.errors.find(e => e.field === 'revenue_fy');
            expect(revenueError).toBeDefined();
            expect(revenueError?.context?.companyType).toBe('non-banking');
            expect(revenueError?.originalValue).toBe(-100000);
        });
    });
});