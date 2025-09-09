// Non-Banking Data Mapper
import { BaseDataMapper } from './base-mapper';
import { NON_BANKING_MAPPING_CONFIG } from './mapping-configs';
import {
  InsightSentryQuarterlyResponse,
  CompanyFinancialData,
  DataMappingResult,
  MappingError,
  MappingErrorType
} from '../../components/QuarterlyResults/types';

/**
 * Non-banking data mapper that extends BaseDataMapper
 * Handles standard financial calculations and validations for non-banking companies
 */
export class NonBankingDataMapper extends BaseDataMapper {
  constructor() {
    super(NON_BANKING_MAPPING_CONFIG);
  }

  /**
   * Map API data to structured non-banking financial data
   */
  mapData(apiResponse: InsightSentryQuarterlyResponse): DataMappingResult {
    this.resetErrors();

    // Validate API response
    if (!this.validateApiResponse(apiResponse)) {
      return this.createFailureResult();
    }

    // Validate non-banking specific required fields
    if (!this.validateNonBankingRequiredFields(apiResponse)) {
      return this.createFailureResult();
    }

    // Implement fallback calculations for missing data
    this.implementFallbackCalculations(apiResponse);

    // Add comprehensive error reporting
    const validationErrors = this.validateNonBankingMetrics(apiResponse);
    this.errors.push(...validationErrors);

    // Validate data consistency
    this.validateDataConsistency(apiResponse);

    try {
      // Calculate derived non-banking metrics before building sections
      this.calculateDerivedMetrics(apiResponse);

      // Build financial sections from mapping configuration
      const sections = this.buildSections(apiResponse);

      // Validate that we have meaningful sections
      if (sections.length === 0) {
        this.errors.push({
          type: MappingErrorType.MISSING_REQUIRED_FIELD,
          field: 'sections',
          message: 'No valid non-banking sections could be created from the provided data',
          context: {
            companyType: 'non-banking'
          }
        });
        return this.createFailureResult();
      }

      // Create company financial data
      const companyData: CompanyFinancialData = {
        companyType: 'non-banking',
        symbol: apiResponse.quarters_info?.periods?.[0]?.split(' ')[0] || 'UNKNOWN',
        sections,
        lastUpdated: new Date().toISOString(),
        metadata: {
          sector: apiResponse.sector || 'Non-Banking',
          industry: apiResponse.industry || 'Non-Banking',
          maxHistoricalYears: this.getMaxHistoricalLength(apiResponse, 'FY'),
          maxQuarterlyPeriods: this.getMaxHistoricalLength(apiResponse, 'FQ')
        }
      };

      return this.createSuccessResult(companyData);

    } catch (error) {
      this.errors.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'non_banking_mapper',
        message: `Non-banking data mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: {
          companyType: 'non-banking'
        }
      });
      return this.createFailureResult();
    }
  }

  /**
   * Validate non-banking specific required fields
   */
  private validateNonBankingRequiredFields(apiResponse: InsightSentryQuarterlyResponse): boolean {
    const criticalNonBankingFields = [
      { current: 'revenue_fy', historical: 'revenue_fy_h', name: 'Revenue' },
      { current: 'net_income_fy', historical: 'net_income_fy_h', name: 'Net Income' },
      { current: 'total_assets_fy', historical: 'total_assets_fy_h', name: 'Total Assets' },
      { current: 'total_equity_fy', historical: 'total_equity_fy_h', name: 'Total Equity' }
    ];

    let validFieldCount = 0;

    for (const { current, historical, name } of criticalNonBankingFields) {
      let hasValidCurrentValue = false;
      let hasValidHistoricalValue = false;

      // Check current value
      const currentValue = apiResponse[current as keyof InsightSentryQuarterlyResponse] as number | undefined;
      hasValidCurrentValue = currentValue !== null && currentValue !== undefined && !isNaN(currentValue);

      // Check historical data
      const historicalData = apiResponse[historical as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
      hasValidHistoricalValue = Array.isArray(historicalData) &&
        historicalData.some(v => v !== null && v !== undefined && !isNaN(v));

      if (hasValidCurrentValue || hasValidHistoricalValue) {
        validFieldCount++;
      } else {
        this.errors.push({
          type: MappingErrorType.MISSING_REQUIRED_FIELD,
          field: historical,
          message: `Required non-banking field '${name}' is missing or invalid`,
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Require at least 3 out of 4 critical fields to be valid
    return validFieldCount >= 3;
  }

  /**
   * Calculate standard financial calculations (margins, ratios, etc.)
   */
  protected calculateDerivedMetrics(apiResponse: InsightSentryQuarterlyResponse): void {
    // Calculate Gross Margin if not available
    this.calculateGrossMargin(apiResponse);

    // Calculate Operating Margin if not available
    this.calculateOperatingMargin(apiResponse);

    // Calculate Net Margin if not available
    this.calculateNetMargin(apiResponse);

    // Calculate EBITDA if not available
    this.calculateEBITDA(apiResponse);

    // Calculate EBITDA Margin if not available
    this.calculateEBITDAMargin(apiResponse);

    // Calculate Return on Equity if not available
    this.calculateROE(apiResponse);

    // Calculate Return on Assets if not available
    this.calculateROA(apiResponse);

    // Calculate Debt to Equity ratio if not available
    this.calculateDebtToEquity(apiResponse);

    // Calculate Current Ratio if not available
    this.calculateCurrentRatio(apiResponse);

    // Calculate Asset Turnover if not available
    this.calculateAssetTurnover(apiResponse);
  }

  /**
   * Calculate Gross Margin from Revenue and Cost of Goods
   */
  private calculateGrossMargin(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical gross margin if not available
      if (!apiResponse.gross_margin_fy_h &&
        apiResponse.revenue_fy_h &&
        apiResponse.cost_of_goods_fy_h) {

        const revenueHistory = apiResponse.revenue_fy_h;
        const cogHistory = apiResponse.cost_of_goods_fy_h;
        const length = Math.min(revenueHistory.length, cogHistory.length);
        const grossMarginHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const revenue = revenueHistory[i];
          const cog = Math.abs(cogHistory[i] || 0); // COG is typically negative

          if (revenue !== null && revenue !== 0) {
            const grossProfit = revenue - cog;
            const grossMargin = (grossProfit / revenue) * 100;
            grossMarginHistory.push(grossMargin);
          } else {
            grossMarginHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_gross_margin_h = grossMarginHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(grossMarginHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_gross_margin = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'gross_margin_calculation',
        message: `Failed to calculate Gross Margin: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Operating Margin from Operating Income and Revenue
   */
  private calculateOperatingMargin(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical operating margin if not available
      if (!apiResponse.operating_margin_fy_h &&
        apiResponse.oper_income_fy_h &&
        apiResponse.revenue_fy_h) {

        const operIncomeHistory = apiResponse.oper_income_fy_h;
        const revenueHistory = apiResponse.revenue_fy_h;
        const length = Math.min(operIncomeHistory.length, revenueHistory.length);
        const operMarginHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const operIncome = operIncomeHistory[i];
          const revenue = revenueHistory[i];

          if (operIncome !== null && revenue !== null && revenue !== 0) {
            const operMargin = (operIncome / revenue) * 100;
            operMarginHistory.push(operMargin);
          } else {
            operMarginHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_operating_margin_h = operMarginHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(operMarginHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_operating_margin = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'operating_margin_calculation',
        message: `Failed to calculate Operating Margin: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Net Margin from Net Income and Revenue
   */
  private calculateNetMargin(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical net margin if not available
      if (!apiResponse.net_margin_fy_h &&
        apiResponse.net_income_fy_h &&
        apiResponse.revenue_fy_h) {

        const netIncomeHistory = apiResponse.net_income_fy_h;
        const revenueHistory = apiResponse.revenue_fy_h;
        const length = Math.min(netIncomeHistory.length, revenueHistory.length);
        const netMarginHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const netIncome = netIncomeHistory[i];
          const revenue = revenueHistory[i];

          if (netIncome !== null && revenue !== null && revenue !== 0) {
            const netMargin = (netIncome / revenue) * 100;
            netMarginHistory.push(netMargin);
          } else {
            netMarginHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_net_margin_h = netMarginHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(netMarginHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_net_margin = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'net_margin_calculation',
        message: `Failed to calculate Net Margin: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate EBITDA from Operating Income and Depreciation
   */
  private calculateEBITDA(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical EBITDA if not available
      if (!apiResponse.ebitda_fy_h &&
        apiResponse.oper_income_fy_h &&
        apiResponse.depreciation_fy_h) {

        const operIncomeHistory = apiResponse.oper_income_fy_h;
        const depreciationHistory = apiResponse.depreciation_fy_h;
        const length = Math.min(operIncomeHistory.length, depreciationHistory.length);
        const ebitdaHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const operIncome = operIncomeHistory[i];
          const depreciation = Math.abs(depreciationHistory[i] || 0); // Depreciation is typically negative

          if (operIncome !== null) {
            const ebitda = operIncome + depreciation;
            ebitdaHistory.push(ebitda);
          } else {
            ebitdaHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_ebitda_h = ebitdaHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(ebitdaHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_ebitda = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'ebitda_calculation',
        message: `Failed to calculate EBITDA: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate EBITDA Margin from EBITDA and Revenue
   */
  private calculateEBITDAMargin(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical EBITDA margin if not available
      const ebitdaHistory = apiResponse.ebitda_fy_h || (apiResponse as any).calculated_ebitda_h;
      
      if (!apiResponse.ebitda_margin_fy_h &&
        ebitdaHistory &&
        apiResponse.revenue_fy_h) {

        const revenueHistory = apiResponse.revenue_fy_h;
        const length = Math.min(ebitdaHistory.length, revenueHistory.length);
        const ebitdaMarginHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const ebitda = ebitdaHistory[i];
          const revenue = revenueHistory[i];

          if (ebitda !== null && revenue !== null && revenue !== 0) {
            const ebitdaMargin = (ebitda / revenue) * 100;
            ebitdaMarginHistory.push(ebitdaMargin);
          } else {
            ebitdaMarginHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_ebitda_margin_h = ebitdaMarginHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(ebitdaMarginHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_ebitda_margin = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'ebitda_margin_calculation',
        message: `Failed to calculate EBITDA Margin: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Return on Equity from Net Income and Total Equity
   */
  private calculateROE(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical ROE if not available
      if (!apiResponse.return_on_equity_fy_h &&
        apiResponse.net_income_fy_h &&
        apiResponse.total_equity_fy_h) {

        const netIncomeHistory = apiResponse.net_income_fy_h;
        const equityHistory = apiResponse.total_equity_fy_h;
        const length = Math.min(netIncomeHistory.length, equityHistory.length);
        const roeHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const netIncome = netIncomeHistory[i];
          const equity = equityHistory[i];

          if (netIncome !== null && equity !== null && equity !== 0) {
            const roe = (netIncome / equity) * 100;
            roeHistory.push(roe);
          } else {
            roeHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_roe_h = roeHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(roeHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_roe = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'roe_calculation',
        message: `Failed to calculate Return on Equity: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Return on Assets from Net Income and Total Assets
   */
  private calculateROA(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical ROA if not available
      if (!apiResponse.return_on_assets_fy_h &&
        apiResponse.net_income_fy_h &&
        apiResponse.total_assets_fy_h) {

        const netIncomeHistory = apiResponse.net_income_fy_h;
        const assetsHistory = apiResponse.total_assets_fy_h;
        const length = Math.min(netIncomeHistory.length, assetsHistory.length);
        const roaHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const netIncome = netIncomeHistory[i];
          const assets = assetsHistory[i];

          if (netIncome !== null && assets !== null && assets !== 0) {
            const roa = (netIncome / assets) * 100;
            roaHistory.push(roa);
          } else {
            roaHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_roa_h = roaHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(roaHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_roa = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'roa_calculation',
        message: `Failed to calculate Return on Assets: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Debt to Equity ratio from Total Debt and Total Equity
   */
  private calculateDebtToEquity(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical debt to equity if not available
      if (!apiResponse.debt_to_equity_fy_h &&
        apiResponse.total_debt_fy_h &&
        apiResponse.total_equity_fy_h) {

        const debtHistory = apiResponse.total_debt_fy_h;
        const equityHistory = apiResponse.total_equity_fy_h;
        const length = Math.min(debtHistory.length, equityHistory.length);
        const debtToEquityHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const debt = debtHistory[i];
          const equity = equityHistory[i];

          if (debt !== null && equity !== null && equity !== 0) {
            const debtToEquity = debt / equity;
            debtToEquityHistory.push(debtToEquity);
          } else {
            debtToEquityHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_debt_to_equity_h = debtToEquityHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(debtToEquityHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_debt_to_equity = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'debt_to_equity_calculation',
        message: `Failed to calculate Debt to Equity: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Current Ratio from Current Assets and Current Liabilities
   */
  private calculateCurrentRatio(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Note: total_current_assets_fy_h doesn't exist in the interface
      // This calculation is skipped as the required fields are not available
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'current_ratio_calculation',
        message: 'Current ratio calculation skipped: required fields not available in interface'
      });
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'current_ratio_calculation',
        message: `Failed to calculate Current Ratio: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Asset Turnover from Revenue and Total Assets
   */
  private calculateAssetTurnover(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical asset turnover if not available
      if (!apiResponse.asset_turnover_fy_h &&
        apiResponse.revenue_fy_h &&
        apiResponse.total_assets_fy_h) {

        const revenueHistory = apiResponse.revenue_fy_h;
        const assetsHistory = apiResponse.total_assets_fy_h;
        const length = Math.min(revenueHistory.length, assetsHistory.length);
        const assetTurnoverHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const revenue = revenueHistory[i];
          const assets = assetsHistory[i];

          if (revenue !== null && assets !== null && assets !== 0) {
            const assetTurnover = revenue / assets;
            assetTurnoverHistory.push(assetTurnover);
          } else {
            assetTurnoverHistory.push(null as unknown as number);
          }
        }

        (apiResponse as any).calculated_asset_turnover_h = assetTurnoverHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(assetTurnoverHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_asset_turnover = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'asset_turnover_calculation',
        message: `Failed to calculate Asset Turnover: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Implement fallback calculations for missing data
   */
  private implementFallbackCalculations(apiResponse: InsightSentryQuarterlyResponse): void {
    // Calculate missing current values from historical data
    this.calculateCurrentFromHistorical(apiResponse);
    
    // Calculate missing fields from related fields
    this.calculateMissingBasicFields(apiResponse);
    
    // Calculate missing balance sheet items
    this.calculateMissingBalanceSheetItems(apiResponse);
    
    // Calculate missing P&L items
    this.calculateMissingProfitLossItems(apiResponse);
  }

  /**
   * Calculate current values from historical data when missing
   */
  private calculateCurrentFromHistorical(apiResponse: InsightSentryQuarterlyResponse): void {
    const fieldsToCalculate = [
      { current: 'revenue_fy', historical: 'revenue_fy_h' },
      { current: 'net_income_fy', historical: 'net_income_fy_h' },
      { current: 'total_assets_fy', historical: 'total_assets_fy_h' },
      { current: 'total_equity_fy', historical: 'total_equity_fy_h' },
      { current: 'total_liabilities_fy', historical: 'total_liabilities_fy_h' },
      { current: 'gross_profit_fy', historical: 'gross_profit_fy_h' },
      { current: 'oper_income_fy', historical: 'oper_income_fy_h' },
      { current: 'ebitda_fy', historical: 'ebitda_fy_h' },
      { current: 'total_debt_fy', historical: 'total_debt_fy_h' }
    ];

    for (const { current, historical } of fieldsToCalculate) {
      const currentValue = (apiResponse as any)[current];
      const historicalArray = apiResponse[historical as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
      
      if ((currentValue === null || currentValue === undefined) && 
          Array.isArray(historicalArray) && historicalArray.length > 0) {
        const mostRecent = this.getMostRecentValue(historicalArray);
        if (mostRecent !== null) {
          (apiResponse as any)[current] = mostRecent;
        }
      }
    }
  }

  /**
   * Calculate missing basic financial fields from related fields
   */
  private calculateMissingBasicFields(apiResponse: InsightSentryQuarterlyResponse): void {
    // Calculate Gross Profit from Revenue and Cost of Goods
    if (!(apiResponse as any).gross_profit_fy && 
        apiResponse.revenue_fy && 
        (apiResponse as any).cost_of_goods_fy) {
      const revenue = apiResponse.revenue_fy;
      const cogs = Math.abs((apiResponse as any).cost_of_goods_fy || 0); // COGS is typically negative
      (apiResponse as any).gross_profit_fy = revenue - cogs;
    }

    // Calculate Operating Income from Gross Profit and Operating Expenses
    if (!(apiResponse as any).oper_income_fy && 
        (apiResponse as any).gross_profit_fy && 
        (apiResponse as any).operating_expenses_fy) {
      const grossProfit = (apiResponse as any).gross_profit_fy;
      const opEx = Math.abs((apiResponse as any).operating_expenses_fy || 0); // OpEx is typically negative
      (apiResponse as any).oper_income_fy = grossProfit - opEx;
    }

    // Calculate EBITDA from Operating Income and Depreciation
    if (!(apiResponse as any).ebitda_fy && 
        (apiResponse as any).oper_income_fy && 
        (apiResponse as any).depreciation_fy) {
      const operIncome = (apiResponse as any).oper_income_fy;
      const depreciation = Math.abs((apiResponse as any).depreciation_fy || 0); // Depreciation is typically negative
      (apiResponse as any).ebitda_fy = operIncome + depreciation;
    }
  }

  /**
   * Calculate missing balance sheet items
   */
  private calculateMissingBalanceSheetItems(apiResponse: InsightSentryQuarterlyResponse): void {
    // Calculate Total Equity from Assets minus Liabilities
    if (!(apiResponse as any).total_equity_fy && 
        (apiResponse as any).total_assets_fy && 
        (apiResponse as any).total_liabilities_fy) {
      const assets = (apiResponse as any).total_assets_fy;
      const liabilities = (apiResponse as any).total_liabilities_fy;
      (apiResponse as any).total_equity_fy = assets - liabilities;
    }

    // Calculate Total Liabilities from Assets minus Equity
    if (!(apiResponse as any).total_liabilities_fy && 
        (apiResponse as any).total_assets_fy && 
        (apiResponse as any).total_equity_fy) {
      const assets = (apiResponse as any).total_assets_fy;
      const equity = (apiResponse as any).total_equity_fy;
      (apiResponse as any).total_liabilities_fy = assets - equity;
    }

    // Calculate Total Assets from Liabilities plus Equity
    if (!(apiResponse as any).total_assets_fy && 
        (apiResponse as any).total_liabilities_fy && 
        (apiResponse as any).total_equity_fy) {
      const liabilities = (apiResponse as any).total_liabilities_fy;
      const equity = (apiResponse as any).total_equity_fy;
      (apiResponse as any).total_assets_fy = liabilities + equity;
    }
  }

  /**
   * Calculate missing P&L items
   */
  private calculateMissingProfitLossItems(apiResponse: InsightSentryQuarterlyResponse): void {
    // Calculate Cost of Goods from Revenue and Gross Profit
    if (!(apiResponse as any).cost_of_goods_fy && 
        apiResponse.revenue_fy && 
        (apiResponse as any).gross_profit_fy) {
      const revenue = apiResponse.revenue_fy;
      const grossProfit = (apiResponse as any).gross_profit_fy;
      (apiResponse as any).cost_of_goods_fy = -(revenue - grossProfit); // Negative as typical
    }

    // Calculate Operating Expenses from Gross Profit and Operating Income
    if (!(apiResponse as any).operating_expenses_fy && 
        (apiResponse as any).gross_profit_fy && 
        (apiResponse as any).oper_income_fy) {
      const grossProfit = (apiResponse as any).gross_profit_fy;
      const operIncome = (apiResponse as any).oper_income_fy;
      (apiResponse as any).operating_expenses_fy = -(grossProfit - operIncome); // Negative as typical
    }
  }

  /**
   * Validate standard financial fields and add comprehensive error reporting
   */
  private validateNonBankingMetrics(apiResponse: InsightSentryQuarterlyResponse): MappingError[] {
    const validationErrors: MappingError[] = [];

    // Validate current values (if they exist)
    this.validateCurrentValues(apiResponse, validationErrors);

    // Validate historical data ranges and consistency
    this.validateHistoricalNonBankingMetrics(apiResponse, validationErrors);

    // Validate financial ratios and margins
    this.validateFinancialRatios(apiResponse, validationErrors);

    // Validate balance sheet consistency
    this.validateBalanceSheetConsistency(apiResponse, validationErrors);

    // Validate profit hierarchy consistency
    this.validateProfitHierarchyConsistency(apiResponse, validationErrors);

    return validationErrors;
  }

  /**
   * Validate current financial values
   */
  private validateCurrentValues(apiResponse: InsightSentryQuarterlyResponse, validationErrors: MappingError[]): void {
    // Validate Revenue is positive (only if it exists)
    if (apiResponse.revenue_fy !== null && apiResponse.revenue_fy !== undefined) {
      if (apiResponse.revenue_fy <= 0) {
        validationErrors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'revenue_fy',
          message: `Revenue should be positive: ${apiResponse.revenue_fy}`,
          originalValue: apiResponse.revenue_fy,
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Validate Total Assets are positive
    const totalAssets = (apiResponse as any).total_assets_fy;
    if (totalAssets !== null && totalAssets !== undefined) {
      if (totalAssets <= 0) {
        validationErrors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'total_assets_fy',
          message: `Total Assets should be positive: ${totalAssets}`,
          originalValue: totalAssets,
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Validate Total Equity is reasonable (can be negative but not extremely so)
    const totalEquity = (apiResponse as any).total_equity_fy;
    if (totalEquity !== null && totalEquity !== undefined && totalAssets) {
      const equityToAssetsRatio = totalEquity / totalAssets;
      if (equityToAssetsRatio < -0.5) { // Equity is more than 50% negative of assets
        validationErrors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'total_equity_fy',
          message: `Total Equity appears extremely negative relative to assets: ${totalEquity} (${(equityToAssetsRatio * 100).toFixed(1)}% of assets)`,
          originalValue: totalEquity,
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Validate Net Income is reasonable relative to Revenue
    if (apiResponse.net_income_fy !== null && apiResponse.net_income_fy !== undefined && 
        apiResponse.revenue_fy !== null && apiResponse.revenue_fy !== undefined && apiResponse.revenue_fy > 0) {
      const netMargin = (apiResponse.net_income_fy / apiResponse.revenue_fy) * 100;
      if (netMargin < -100 || netMargin > 100) {
        this.warnings.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'net_income_fy',
          message: `Net margin appears unrealistic: ${netMargin.toFixed(1)}%`,
          originalValue: apiResponse.net_income_fy,
          context: { companyType: 'non-banking' }
        });
      }
    }
  }

  /**
   * Validate financial ratios and margins
   */
  private validateFinancialRatios(apiResponse: InsightSentryQuarterlyResponse, validationErrors: MappingError[]): void {
    // Validate Gross Margin if available
    if (apiResponse.gross_margin_fy_h) {
      apiResponse.gross_margin_fy_h.forEach((value, index) => {
        if (value !== null && (value < -100 || value > 100)) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'gross_margin_fy_h',
            message: `Historical Gross Margin appears unrealistic at index ${index}: ${value}%`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }

    // Validate Operating Margin if available
    if (apiResponse.operating_margin_fy_h) {
      apiResponse.operating_margin_fy_h.forEach((value, index) => {
        if (value !== null && (value < -100 || value > 100)) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'operating_margin_fy_h',
            message: `Historical Operating Margin appears unrealistic at index ${index}: ${value}%`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }

    // Validate Net Margin if available
    if (apiResponse.net_margin_fy_h) {
      apiResponse.net_margin_fy_h.forEach((value, index) => {
        if (value !== null && (value < -100 || value > 100)) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'net_margin_fy_h',
            message: `Historical Net Margin appears unrealistic at index ${index}: ${value}%`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }

    // Validate Return on Equity if available
    if (apiResponse.return_on_equity_fy_h) {
      apiResponse.return_on_equity_fy_h.forEach((value, index) => {
        if (value !== null && (value < -200 || value > 200)) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'return_on_equity_fy_h',
            message: `Historical ROE appears unrealistic at index ${index}: ${value}%`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }

    // Validate Return on Assets if available
    if (apiResponse.return_on_assets_fy_h) {
      apiResponse.return_on_assets_fy_h.forEach((value, index) => {
        if (value !== null && (value < -100 || value > 100)) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'return_on_assets_fy_h',
            message: `Historical ROA appears unrealistic at index ${index}: ${value}%`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }

    // Validate Debt to Equity ratio if available
    if (apiResponse.debt_to_equity_fy_h) {
      apiResponse.debt_to_equity_fy_h.forEach((value, index) => {
        if (value !== null && (value < 0 || value > 20)) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'debt_to_equity_fy_h',
            message: `Historical Debt-to-Equity ratio appears unrealistic at index ${index}: ${value}`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }
  }

  /**
   * Validate balance sheet consistency
   */
  private validateBalanceSheetConsistency(apiResponse: InsightSentryQuarterlyResponse, validationErrors: MappingError[]): void {
    const totalAssets = (apiResponse as any).total_assets_fy;
    const totalLiabilities = (apiResponse as any).total_liabilities_fy;
    const totalEquity = (apiResponse as any).total_equity_fy;

    // Check Assets = Liabilities + Equity (with some tolerance for rounding)
    if (totalAssets !== null && totalAssets !== undefined &&
        totalLiabilities !== null && totalLiabilities !== undefined &&
        totalEquity !== null && totalEquity !== undefined) {
      
      const calculatedAssets = totalLiabilities + totalEquity;
      const difference = Math.abs(totalAssets - calculatedAssets);
      const tolerance = Math.max(totalAssets * 0.01, 1000); // 1% or 1000, whichever is larger

      if (difference > tolerance) {
        validationErrors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'balance_sheet_consistency',
          message: `Balance sheet equation doesn't balance: Assets (${totalAssets}) ≠ Liabilities (${totalLiabilities}) + Equity (${totalEquity}). Difference: ${difference}`,
          originalValue: { totalAssets, totalLiabilities, totalEquity },
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Check that Assets >= Liabilities (basic solvency check)
    if (totalAssets !== null && totalAssets !== undefined &&
        totalLiabilities !== null && totalLiabilities !== undefined) {
      
      if (totalAssets < totalLiabilities) {
        validationErrors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'balance_sheet_consistency',
          message: `Assets (${totalAssets}) are less than Liabilities (${totalLiabilities}), indicating potential insolvency`,
          originalValue: { totalAssets, totalLiabilities },
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Validate historical balance sheet consistency
    this.validateHistoricalBalanceSheetConsistency(apiResponse, validationErrors);
  }

  /**
   * Validate profit hierarchy consistency (Revenue >= Gross Profit >= Operating Income >= Net Income)
   */
  private validateProfitHierarchyConsistency(apiResponse: InsightSentryQuarterlyResponse, validationErrors: MappingError[]): void {
    const revenue = apiResponse.revenue_fy;
    const grossProfit = (apiResponse as any).gross_profit_fy;
    const operatingIncome = (apiResponse as any).oper_income_fy;
    const netIncome = apiResponse.net_income_fy;

    // Check Revenue >= Gross Profit
    if (revenue !== null && revenue !== undefined &&
        grossProfit !== null && grossProfit !== undefined) {
      if (grossProfit > revenue) {
        this.warnings.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'profit_hierarchy_consistency',
          message: `Gross Profit (${grossProfit}) is greater than Revenue (${revenue}), which is unusual`,
          originalValue: { revenue, grossProfit },
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Check Gross Profit >= Operating Income (allowing for some flexibility)
    if (grossProfit !== null && grossProfit !== undefined &&
        operatingIncome !== null && operatingIncome !== undefined) {
      if (operatingIncome > grossProfit * 1.1) { // Allow 10% tolerance for different accounting methods
        this.warnings.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'profit_hierarchy_consistency',
          message: `Operating Income (${operatingIncome}) is significantly greater than Gross Profit (${grossProfit}), which is unusual`,
          originalValue: { grossProfit, operatingIncome },
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Check Operating Income and Net Income relationship (more flexible as there can be non-operating items)
    if (operatingIncome !== null && operatingIncome !== undefined &&
        netIncome !== null && netIncome !== undefined) {
      const difference = Math.abs(netIncome - operatingIncome);
      const operatingIncomeAbs = Math.abs(operatingIncome);
      
      // If the difference is more than 200% of operating income, it might be unusual
      if (operatingIncomeAbs > 0 && difference > operatingIncomeAbs * 2) {
        this.warnings.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'profit_hierarchy_consistency',
          message: `Large difference between Operating Income (${operatingIncome}) and Net Income (${netIncome}), indicating significant non-operating items`,
          originalValue: { operatingIncome, netIncome },
          context: { companyType: 'non-banking' }
        });
      }
    }
  }

  /**
   * Validate historical balance sheet consistency
   */
  private validateHistoricalBalanceSheetConsistency(apiResponse: InsightSentryQuarterlyResponse, validationErrors: MappingError[]): void {
    const assetsHistory = apiResponse.total_assets_fy_h;
    const liabilitiesHistory = apiResponse.total_liabilities_fy_h;
    const equityHistory = apiResponse.total_equity_fy_h;

    if (assetsHistory && liabilitiesHistory && equityHistory) {
      const minLength = Math.min(assetsHistory.length, liabilitiesHistory.length, equityHistory.length);
      
      for (let i = 0; i < minLength; i++) {
        const assets = assetsHistory[i];
        const liabilities = liabilitiesHistory[i];
        const equity = equityHistory[i];

        if (assets !== null && liabilities !== null && equity !== null) {
          const calculatedAssets = liabilities + equity;
          const difference = Math.abs(assets - calculatedAssets);
          const tolerance = Math.max(assets * 0.02, 1000); // 2% tolerance for historical data

          if (difference > tolerance) {
            this.warnings.push({
              type: MappingErrorType.INVALID_DATA_TYPE,
              field: 'historical_balance_sheet_consistency',
              message: `Historical balance sheet equation doesn't balance at index ${i}: Assets (${assets}) ≠ Liabilities (${liabilities}) + Equity (${equity})`,
              originalValue: { assets, liabilities, equity, index: i },
              context: { companyType: 'non-banking' }
            });
          }
        }
      }
    }
  }

  /**
   * Validate historical non-banking metrics for reasonable ranges
   */
  private validateHistoricalNonBankingMetrics(apiResponse: InsightSentryQuarterlyResponse, validationErrors: MappingError[]): void {
    // Validate historical Revenue
    if (apiResponse.revenue_fy_h) {
      apiResponse.revenue_fy_h.forEach((value, index) => {
        if (value !== null && value <= 0) {
          validationErrors.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'revenue_fy_h',
            message: `Historical Revenue should be positive at index ${index}: ${value}`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }

    // Validate historical Gross Margin
    if (apiResponse.gross_margin_fy_h) {
      apiResponse.gross_margin_fy_h.forEach((value, index) => {
        if (value !== null && (value < -50 || value > 100)) {
          validationErrors.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'gross_margin_fy_h',
            message: `Historical Gross Margin appears unrealistic at index ${index}: ${value}%`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }

    // Validate historical Total Assets
    if (apiResponse.total_assets_fy_h) {
      apiResponse.total_assets_fy_h.forEach((value, index) => {
        if (value !== null && value <= 0) {
          validationErrors.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'total_assets_fy_h',
            message: `Historical Total Assets should be positive at index ${index}: ${value}`,
            originalValue: value,
            context: { companyType: 'non-banking' }
          });
        }
      });
    }
  }

  /**
   * Validate data consistency across related non-banking metrics
   */
  private validateDataConsistency(apiResponse: InsightSentryQuarterlyResponse): void {
    // Validate historical data consistency
    this.validateHistoricalDataConsistency(apiResponse);
    
    // Validate cross-metric relationships
    this.validateCrossMetricRelationships(apiResponse);
    
    // Validate data completeness and quality
    this.validateDataCompletenessAndQuality(apiResponse);
  }

  /**
   * Validate relationships between different metrics
   */
  private validateCrossMetricRelationships(apiResponse: InsightSentryQuarterlyResponse): void {
    // Validate Revenue vs Assets relationship (Asset Turnover should be reasonable)
    if (apiResponse.revenue_fy && (apiResponse as any).total_assets_fy) {
      const assetTurnover = apiResponse.revenue_fy / (apiResponse as any).total_assets_fy;
      if (assetTurnover > 10 || assetTurnover < 0.01) {
        this.warnings.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'asset_turnover_relationship',
          message: `Asset turnover ratio appears unrealistic: ${assetTurnover.toFixed(3)} (Revenue: ${apiResponse.revenue_fy}, Assets: ${(apiResponse as any).total_assets_fy})`,
          originalValue: assetTurnover,
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Validate Debt vs Equity relationship
    if ((apiResponse as any).total_debt_fy && (apiResponse as any).total_equity_fy) {
      const debtToEquity = (apiResponse as any).total_debt_fy / (apiResponse as any).total_equity_fy;
      if (debtToEquity > 20) {
        this.warnings.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'debt_equity_relationship',
          message: `Debt-to-Equity ratio appears extremely high: ${debtToEquity.toFixed(2)}`,
          originalValue: debtToEquity,
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Validate EBITDA vs Revenue relationship
    if ((apiResponse as any).ebitda_fy && apiResponse.revenue_fy) {
      const ebitdaMargin = ((apiResponse as any).ebitda_fy / apiResponse.revenue_fy) * 100;
      if (ebitdaMargin < -100 || ebitdaMargin > 100) {
        this.warnings.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'ebitda_revenue_relationship',
          message: `EBITDA margin appears unrealistic: ${ebitdaMargin.toFixed(1)}%`,
          originalValue: ebitdaMargin,
          context: { companyType: 'non-banking' }
        });
      }
    }
  }

  /**
   * Validate data completeness and quality
   */
  private validateDataCompletenessAndQuality(apiResponse: InsightSentryQuarterlyResponse): void {
    // Check for data completeness across key metrics
    const keyMetrics = [
      { field: 'revenue_fy_h', name: 'Revenue' },
      { field: 'net_income_fy_h', name: 'Net Income' },
      { field: 'total_assets_fy_h', name: 'Total Assets' },
      { field: 'total_equity_fy_h', name: 'Total Equity' }
    ];

    for (const { field, name } of keyMetrics) {
      const array = apiResponse[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
      if (Array.isArray(array) && array.length > 0) {
        const nullCount = array.filter(v => v === null || v === undefined).length;
        const nullPercentage = (nullCount / array.length) * 100;

        if (nullPercentage > 50) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: field,
            message: `${name} historical data has ${nullPercentage.toFixed(1)}% null values, which may affect analysis quality`,
            context: { companyType: 'non-banking' }
          });
        }
      }
    }

    // Check for data trends and anomalies
    this.validateDataTrends(apiResponse);
  }

  /**
   * Validate data trends for anomalies
   */
  private validateDataTrends(apiResponse: InsightSentryQuarterlyResponse): void {
    // Check Revenue trend for extreme volatility
    if (apiResponse.revenue_fy_h && apiResponse.revenue_fy_h.length >= 3) {
      const revenueChanges: number[] = [];
      for (let i = 1; i < apiResponse.revenue_fy_h.length; i++) {
        const current = apiResponse.revenue_fy_h[i - 1]; // Most recent first
        const previous = apiResponse.revenue_fy_h[i];
        if (current !== null && previous !== null && previous !== 0) {
          const change = ((current - previous) / Math.abs(previous)) * 100;
          revenueChanges.push(change);
        }
      }

      if (revenueChanges.length > 0) {
        const extremeChanges = revenueChanges.filter(change => Math.abs(change) > 200);
        if (extremeChanges.length > 0) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'revenue_trend_volatility',
            message: `Revenue shows extreme year-over-year changes: ${extremeChanges.map(c => c.toFixed(1) + '%').join(', ')}`,
            originalValue: extremeChanges,
            context: { companyType: 'non-banking' }
          });
        }
      }
    }

    // Check Net Income trend for extreme volatility
    if (apiResponse.net_income_fy_h && apiResponse.net_income_fy_h.length >= 3) {
      const incomeChanges: number[] = [];
      for (let i = 1; i < apiResponse.net_income_fy_h.length; i++) {
        const current = apiResponse.net_income_fy_h[i - 1]; // Most recent first
        const previous = apiResponse.net_income_fy_h[i];
        if (current !== null && previous !== null && previous !== 0) {
          const change = ((current - previous) / Math.abs(previous)) * 100;
          incomeChanges.push(change);
        }
      }

      if (incomeChanges.length > 0) {
        const extremeChanges = incomeChanges.filter(change => Math.abs(change) > 500);
        if (extremeChanges.length > 0) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'net_income_trend_volatility',
            message: `Net Income shows extreme year-over-year changes: ${extremeChanges.map(c => c.toFixed(1) + '%').join(', ')}`,
            originalValue: extremeChanges,
            context: { companyType: 'non-banking' }
          });
        }
      }
    }
  }

  /**
   * Validate consistency in historical data arrays
   */
  private validateHistoricalDataConsistency(apiResponse: InsightSentryQuarterlyResponse): void {
    // Check that historical arrays have reasonable lengths
    const historicalFields = [
      'revenue_fy_h',
      'net_income_fy_h',
      'total_assets_fy_h',
      'total_equity_fy_h'
    ];

    const lengths: { [key: string]: number } = {};

    for (const field of historicalFields) {
      const array = apiResponse[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
      if (Array.isArray(array)) {
        lengths[field] = array.length;
      }
    }

    // Check if historical arrays have significantly different lengths
    const lengthValues = Object.values(lengths);
    if (lengthValues.length > 1) {
      const minLength = Math.min(...lengthValues);
      const maxLength = Math.max(...lengthValues);

      if (maxLength - minLength > 2) { // Allow some variance
        this.warnings.push({
          type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
          field: 'historical_arrays',
          message: `Historical data arrays have inconsistent lengths: min=${minLength}, max=${maxLength}`,
          context: { companyType: 'non-banking' }
        });
      }
    }

    // Validate that historical data doesn't have too many consecutive nulls
    for (const field of historicalFields) {
      const array = apiResponse[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
      if (Array.isArray(array) && array.length > 0) {
        const nullCount = array.filter(v => v === null || v === undefined).length;
        const nullPercentage = (nullCount / array.length) * 100;

        if (nullPercentage > 80) {
          this.warnings.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: field,
            message: `Historical data array '${field}' has ${nullPercentage.toFixed(1)}% null values`,
            context: { companyType: 'non-banking' }
          });
        }
      }
    }
  }
}