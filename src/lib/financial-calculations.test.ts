import { calculateFinancialMetrics, calculateROCE, calculateBookValue } from './financial-calculations';

// Mock stock data for testing (using actual API field names)
const mockStockData = {
  symbol_code: 'TEST',
  close: 100,
  change: 5,
  market_cap: 1000000000000, // 1 trillion
  volume: 1000000,
  price_book_fq: 2.5,
  return_on_equity_fq: 16.67,
  return_on_assets_fq: 8.33,
  total_debt_fq: 500000000000, // 500 billion
  total_equity_fq: 400000000000, // 400 billion
  total_assets_fq: 900000000000, // 900 billion
  oper_income_ttm: 150000000000, // 150 billion
  net_income_ttm: 100000000000, // 100 billion
  total_shares_outstanding_current: 10000000000, // 10 billion shares
};

describe('Financial Calculations', () => {
  test('should calculate ROCE using Method 1 (Operating Income)', () => {
    const result = calculateROCE(mockStockData);
    
    // Expected ROCE = Operating Income / (Total Equity + Total Debt)
    // = 150B / (400B + 500B) = 150B / 900B = 16.67%
    expect(result).toBeCloseTo(16.67, 1);
  });

  test('should calculate Book Value using Method 1 (Total Equity)', () => {
    const result = calculateBookValue(mockStockData);
    
    // Expected Book Value = Total Equity / Total Shares Outstanding
    // = 400B / 10B = 40
    expect(result).toBeCloseTo(40, 1);
  });

  test('should fallback to Method 2 for ROCE when operating income is missing', () => {
    const dataWithoutOperatingIncome = {
      ...mockStockData,
      oper_income_ttm: undefined,
    };
    
    const result = calculateROCE(dataWithoutOperatingIncome);
    
    // Expected ROCE = (Net Income × 1.4) / (Total Equity + Total Debt)
    // = (100B × 1.4) / (400B + 500B) = 140B / 900B = 15.56%
    expect(result).toBeCloseTo(15.56, 1);
  });

  test('should fallback to Method 2 for Book Value when equity is missing', () => {
    const dataWithoutEquity = {
      ...mockStockData,
      total_equity_fq: undefined,
    };
    
    const result = calculateBookValue(dataWithoutEquity);
    
    // Expected Book Value = Stock Price / P/B Ratio
    // = 100 / 2.5 = 40
    expect(result).toBeCloseTo(40, 1);
  });

  test('should handle missing data gracefully', () => {
    const minimalData = {
      symbol_code: 'MIN',
      close: 50,
      change: 1,
      market_cap: 1000000000,
      volume: 100000,
    };
    
    const roceResult = calculateROCE(minimalData);
    const bookValueResult = calculateBookValue(minimalData);
    
    // Should return null for calculations that can't be performed
    expect(roceResult).toBeNull();
    expect(bookValueResult).toBeNull();
  });

  test('should enrich stock data with calculated metrics', () => {
    const dataWithoutROCE = {
      ...mockStockData,
      return_on_invested_capital_fq: undefined, // Missing ROCE
      book_value: undefined, // Missing book value
    };
    
    const result = calculateFinancialMetrics(dataWithoutROCE);
    
    // Should add calculated ROCE
    expect(result.return_on_invested_capital_fq).toBeCloseTo(16.67, 1);
    expect(result.roce_calculated).toBe(true);
    
    // Should add calculated Book Value
    expect(result.book_value).toBeCloseTo(40, 1);
    expect(result.book_value_calculated).toBe(true);
  });
});