// Banking-Specific Data Mapper
import { BaseDataMapper } from './base-mapper';
import { BANKING_MAPPING_CONFIG } from './mapping-configs';
import {
  InsightSentryQuarterlyResponse,
  CompanyFinancialData,
  DataMappingResult,
  MappingError,
  MappingErrorType,
  FinancialMetric
} from '../../components/QuarterlyResults/types';

/**
 * Banking-specific data mapper that extends BaseDataMapper
 * Handles banking-specific calculations and validations
 */
export class BankingDataMapper extends BaseDataMapper {
  constructor() {
    super(BANKING_MAPPING_CONFIG);
  }

  /**
   * Map API data to structured banking financial data
   */
  mapData(apiResponse: InsightSentryQuarterlyResponse): DataMappingResult {
    this.resetErrors();

    // Validate API response
    if (!this.validateApiResponse(apiResponse)) {
      return this.createFailureResult();
    }

    // Validate banking-specific required fields
    if (!this.validateBankingRequiredFields(apiResponse)) {
      return this.createFailureResult();
    }

    // Enhanced banking field validation
    if (!this.validateRequiredBankingFields(apiResponse)) {
      return this.createFailureResult();
    }

    // Handle banking-specific errors
    this.handleBankingSpecificErrors(apiResponse);

    // Perform comprehensive banking data validation
    const validationErrors = this.validateBankingMetrics(apiResponse);
    this.errors.push(...validationErrors);

    // Log missing critical banking metrics
    this.logMissingCriticalMetrics(apiResponse);

    // Validate data consistency
    this.validateDataConsistency(apiResponse);

    try {
      // Calculate derived banking metrics before building sections
      this.calculateDerivedMetrics(apiResponse);

      // Build financial sections from mapping configuration
      const sections = this.buildSections(apiResponse);

      // Validate that we have meaningful sections
      if (sections.length === 0) {
        this.errors.push({
          type: MappingErrorType.MISSING_REQUIRED_FIELD,
          field: 'sections',
          message: 'No valid banking sections could be created from the provided data',
          context: {
            companyType: 'banking'
          }
        });
        return this.createFailureResult();
      }

      // Create company financial data
      const companyData: CompanyFinancialData = {
        companyType: 'banking',
        symbol: apiResponse.quarters_info?.periods?.[0]?.split(' ')[0] || 'UNKNOWN',
        sections,
        lastUpdated: new Date().toISOString(),
        metadata: {
          sector: apiResponse.sector || 'Banking',
          industry: apiResponse.industry || 'Banking',
          maxHistoricalYears: this.getMaxHistoricalLength(apiResponse, 'FY'),
          maxQuarterlyPeriods: this.getMaxHistoricalLength(apiResponse, 'FQ')
        }
      };

      return this.createSuccessResult(companyData);

    } catch (error) {
      this.errors.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'banking_mapper',
        message: `Banking data mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: {
          companyType: 'banking'
        }
      });
      return this.createFailureResult();
    }
  }

  /**
   * Validate banking-specific required fields
   */
  private validateBankingRequiredFields(apiResponse: InsightSentryQuarterlyResponse): boolean {
    const criticalBankingFields = [
      { current: 'interest_income_fy', historical: 'interest_income_fy_h' },
      { current: 'net_income_fy', historical: 'net_income_fy_h' },
      { current: null, historical: 'total_deposits_fy_h' },
      { current: null, historical: 'loans_net_fy_h' }
    ];

    let hasValidData = false;

    for (const field of criticalBankingFields) {
      // Check current value if it exists
      if (field.current) {
        const value = apiResponse[field.current as keyof InsightSentryQuarterlyResponse];
        if (value !== null && value !== undefined && !isNaN(value as number)) {
          hasValidData = true;
          break;
        }
      }

      // Check historical data
      const historical = apiResponse[field.historical as keyof InsightSentryQuarterlyResponse];
      if (Array.isArray(historical) && historical.some(v => v !== null && !isNaN(v as number))) {
        hasValidData = true;
        break;
      }
    }

    if (!hasValidData) {
      this.errors.push({
        type: MappingErrorType.MISSING_REQUIRED_FIELD,
        field: 'banking_critical_fields',
        message: 'No valid banking data found. Missing critical fields: interest income, deposits, loans, or net income',
        context: {
          companyType: 'banking'
        }
      });
      return false;
    }

    return true;
  }

  /**
   * Calculate banking-specific derived metrics
   */
  protected calculateDerivedMetrics(apiResponse: InsightSentryQuarterlyResponse): void {
    // Calculate Net NPA Ratio
    this.calculateNetNPARatio(apiResponse);

    // Calculate CASA Ratio if not available
    this.calculateCASARatio(apiResponse);

    // Calculate Credit to Deposit Ratio if not available
    this.calculateCreditDepositRatio(apiResponse);

    // Calculate Provision Coverage Ratio
    this.calculateProvisionCoverageRatio(apiResponse);

    // Calculate Cost to Income Ratio (Efficiency Ratio)
    this.calculateEfficiencyRatio(apiResponse);
  }

  /**
   * Calculate Net NPA Ratio from Gross NPA and Provisions
   */
  private calculateNetNPARatio(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical Net NPA ratio (no current values available for these fields)
      const grossNPLHistory = apiResponse.nonperf_loans_fy_h;
      const provisionsHistory = apiResponse.loan_loss_allowances_fy_h;
      const netLoansHistory = apiResponse.loans_net_fy_h;

      if (grossNPLHistory && provisionsHistory && netLoansHistory) {
        const length = Math.min(grossNPLHistory.length, provisionsHistory.length, netLoansHistory.length);
        const netNPAHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const gross = grossNPLHistory[i];
          const provision = provisionsHistory[i];
          const loans = netLoansHistory[i];

          if (gross !== null && provision !== null && loans !== null && loans !== 0) {
            const netNPL = gross - provision;
            const netNPAPercent = Math.max(0, (netNPL / loans) * 100);
            netNPAHistory.push(netNPAPercent);
          } else {
            netNPAHistory.push(null as any);
          }
        }

        (apiResponse as any).calculated_net_npa_h = netNPAHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(netNPAHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_net_npa = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'net_npa_calculation',
        message: `Failed to calculate Net NPA ratio: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate CASA Ratio if not available
   */
  private calculateCASARatio(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical CASA ratio (no current values available for these fields)
      if (!apiResponse.demand_deposits_total_deposits_fy_h &&
        apiResponse.demand_deposits_fy_h &&
        apiResponse.total_deposits_fy_h) {

        const demandHistory = apiResponse.demand_deposits_fy_h;
        const totalHistory = apiResponse.total_deposits_fy_h;
        const length = Math.min(demandHistory.length, totalHistory.length);
        const casaHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const demand = demandHistory[i];
          const total = totalHistory[i];

          if (demand !== null && total !== null && total !== 0) {
            casaHistory.push((demand / total) * 100);
          } else {
            casaHistory.push(null as any);
          }
        }

        (apiResponse as any).calculated_casa_ratio_h = casaHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(casaHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_casa_ratio = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'casa_ratio_calculation',
        message: `Failed to calculate CASA ratio: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Credit to Deposit Ratio
   */
  private calculateCreditDepositRatio(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical Credit to Deposit ratio (no current values available for these fields)
      if (!apiResponse.loans_net_total_deposits_fy_h &&
        apiResponse.loans_net_fy_h &&
        apiResponse.total_deposits_fy_h) {

        const loansHistory = apiResponse.loans_net_fy_h;
        const depositsHistory = apiResponse.total_deposits_fy_h;
        const length = Math.min(loansHistory.length, depositsHistory.length);
        const cdHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const loans = loansHistory[i];
          const deposits = depositsHistory[i];

          if (loans !== null && deposits !== null && deposits !== 0) {
            cdHistory.push((loans / deposits) * 100);
          } else {
            cdHistory.push(null as any);
          }
        }

        (apiResponse as any).calculated_cd_ratio_h = cdHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(cdHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_cd_ratio = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'cd_ratio_calculation',
        message: `Failed to calculate Credit to Deposit ratio: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Provision Coverage Ratio
   */
  private calculateProvisionCoverageRatio(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical provision coverage ratio (no current values available for these fields)
      if (!apiResponse.loan_loss_coverage_fy_h &&
        apiResponse.loan_loss_allowances_fy_h &&
        apiResponse.nonperf_loans_fy_h) {

        const allowancesHistory = apiResponse.loan_loss_allowances_fy_h;
        const nplHistory = apiResponse.nonperf_loans_fy_h;
        const length = Math.min(allowancesHistory.length, nplHistory.length);
        const coverageHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const allowances = allowancesHistory[i];
          const npl = nplHistory[i];

          if (allowances !== null && npl !== null && npl !== 0) {
            coverageHistory.push((allowances / npl) * 100);
          } else {
            coverageHistory.push(null as any);
          }
        }

        (apiResponse as any).calculated_provision_coverage_h = coverageHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(coverageHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_provision_coverage = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'provision_coverage_calculation',
        message: `Failed to calculate Provision Coverage ratio: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Calculate Efficiency Ratio (Cost to Income)
   */
  private calculateEfficiencyRatio(apiResponse: InsightSentryQuarterlyResponse): void {
    try {
      // Calculate historical efficiency ratio (no current values available for these fields)
      if (!apiResponse.efficiency_ratio_fy_h &&
        apiResponse.non_interest_expense_fy_h &&
        apiResponse.interest_income_net_fy_h &&
        apiResponse.non_interest_income_fy_h) {

        const expenseHistory = apiResponse.non_interest_expense_fy_h;
        const netIntIncomeHistory = apiResponse.interest_income_net_fy_h;
        const nonIntIncomeHistory = apiResponse.non_interest_income_fy_h;
        const length = Math.min(expenseHistory.length, netIntIncomeHistory.length, nonIntIncomeHistory.length);
        const efficiencyHistory: number[] = [];

        for (let i = 0; i < length; i++) {
          const expense = expenseHistory[i];
          const netIntIncome = netIntIncomeHistory[i];
          const nonIntIncome = nonIntIncomeHistory[i];

          if (expense !== null && netIntIncome !== null && nonIntIncome !== null) {
            const totalIncome = netIntIncome + nonIntIncome;
            if (totalIncome !== 0) {
              efficiencyHistory.push((expense / totalIncome) * 100);
            } else {
              efficiencyHistory.push(null as any);
            }
          } else {
            efficiencyHistory.push(null as any);
          }
        }

        (apiResponse as any).calculated_efficiency_ratio_h = efficiencyHistory;
        
        // Set current value as most recent historical value
        const mostRecent = this.getMostRecentValue(efficiencyHistory);
        if (mostRecent !== null) {
          (apiResponse as any).calculated_efficiency_ratio = mostRecent;
        }
      }
    } catch (error) {
      this.warnings.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'efficiency_ratio_calculation',
        message: `Failed to calculate Efficiency ratio: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Validate specific banking metrics for data quality
   */
  validateBankingMetrics(apiResponse: InsightSentryQuarterlyResponse): MappingError[] {
    const validationErrors: MappingError[] = [];

    // Validate Net Interest Margin is reasonable (typically 1-5% for banks) - check quarterly data
    if (apiResponse.net_interest_margin_fq !== null && apiResponse.net_interest_margin_fq !== undefined) {
      if (apiResponse.net_interest_margin_fq < 0 || apiResponse.net_interest_margin_fq > 20) {
        validationErrors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'net_interest_margin_fq',
          message: `Net Interest Margin appears unrealistic: ${apiResponse.net_interest_margin_fq}%`,
          originalValue: apiResponse.net_interest_margin_fq,
          context: { companyType: 'banking' }
        });
      }
    }

    // Validate GNPA ratio is reasonable (typically 0-15% for banks) - check quarterly data
    if (apiResponse.nonperf_loans_loans_gross_fq !== null && apiResponse.nonperf_loans_loans_gross_fq !== undefined) {
      if (apiResponse.nonperf_loans_loans_gross_fq < 0 || apiResponse.nonperf_loans_loans_gross_fq > 50) {
        validationErrors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'nonperf_loans_loans_gross_fq',
          message: `Gross NPA ratio appears unrealistic: ${apiResponse.nonperf_loans_loans_gross_fq}%`,
          originalValue: apiResponse.nonperf_loans_loans_gross_fq,
          context: { companyType: 'banking' }
        });
      }
    }

    // Validate that deposits are positive - check quarterly data
    if (apiResponse.total_deposits_fq !== null && apiResponse.total_deposits_fq !== undefined) {
      if (apiResponse.total_deposits_fq <= 0) {
        validationErrors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'total_deposits_fq',
          message: `Total deposits should be positive: ${apiResponse.total_deposits_fq}`,
          originalValue: apiResponse.total_deposits_fq,
          context: { companyType: 'banking' }
        });
      }
    }

    // Validate historical data ranges
    this.validateHistoricalBankingMetrics(apiResponse, validationErrors);

    return validationErrors;
  }

  /**
   * Validate historical banking metrics for reasonable ranges
   */
  private validateHistoricalBankingMetrics(apiResponse: InsightSentryQuarterlyResponse, validationErrors: MappingError[]): void {
    // Validate historical Net Interest Margin
    if (apiResponse.net_interest_margin_fy_h) {
      apiResponse.net_interest_margin_fy_h.forEach((value, index) => {
        if (value !== null && (value < 0 || value > 20)) {
          validationErrors.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'net_interest_margin_fy_h',
            message: `Historical Net Interest Margin appears unrealistic at index ${index}: ${value}%`,
            originalValue: value,
            context: { companyType: 'banking' }
          });
        }
      });
    }

    // Validate historical GNPA ratio
    if (apiResponse.nonperf_loans_loans_gross_fy_h) {
      apiResponse.nonperf_loans_loans_gross_fy_h.forEach((value, index) => {
        if (value !== null && (value < 0 || value > 50)) {
          validationErrors.push({
            type: MappingErrorType.INVALID_DATA_TYPE,
            field: 'nonperf_loans_loans_gross_fy_h',
            message: `Historical Gross NPA ratio appears unrealistic at index ${index}: ${value}%`,
            originalValue: value,
            context: { companyType: 'banking' }
          });
        }
      });
    }
  }

  /**
   * Log missing critical banking metrics
   */
  logMissingCriticalMetrics(apiResponse: InsightSentryQuarterlyResponse): void {
    const criticalMetrics = [
      { current: 'interest_income_fy', historical: 'interest_income_fy_h', name: 'Interest Income' },
      { current: 'net_income_fy', historical: 'net_income_fy_h', name: 'Net Income' },
      { current: null, historical: 'total_deposits_fy_h', name: 'Total Deposits' },
      { current: null, historical: 'loans_net_fy_h', name: 'Net Loans' },
      { current: null, historical: 'nonperf_loans_fy_h', name: 'Non-Performing Loans' },
      { current: null, historical: 'loan_loss_allowances_fy_h', name: 'Loan Loss Allowances' }
    ];

    for (const metric of criticalMetrics) {
      let hasCurrentValue = false;
      let hasHistoricalValue = false;

      // Check current value if it exists
      if (metric.current) {
        const value = apiResponse[metric.current as keyof InsightSentryQuarterlyResponse];
        hasCurrentValue = value !== null && value !== undefined && !isNaN(value as number);
      }

      // Check historical data
      const historical = apiResponse[metric.historical as keyof InsightSentryQuarterlyResponse];
      hasHistoricalValue = Array.isArray(historical) && historical.some(v => v !== null && !isNaN(v as number));

      if (!hasCurrentValue && !hasHistoricalValue) {
        this.warnings.push({
          type: MappingErrorType.MISSING_REQUIRED_FIELD,
          field: metric.historical,
          message: `Critical banking metric '${metric.name}' is missing both current and historical data`,
          context: {
            companyType: 'banking'
          }
        });
      }
    }
  }

  /**
   * Validate data consistency across related banking metrics
   */
  private validateDataConsistency(apiResponse: InsightSentryQuarterlyResponse): void {
    // Validate quarterly data consistency
    this.validateQuarterlyDataConsistency(apiResponse);

    // Validate historical data consistency
    this.validateHistoricalDataConsistency(apiResponse);
  }

  /**
   * Validate quarterly data consistency
   */
  private validateQuarterlyDataConsistency(apiResponse: InsightSentryQuarterlyResponse): void {
    // Validate that Total Assets >= Total Liabilities (quarterly)
    if (apiResponse.total_assets_fq && apiResponse.total_liabilities_fq) {
      if (apiResponse.total_assets_fq < apiResponse.total_liabilities_fq) {
        this.errors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'balance_sheet_consistency',
          message: `Total assets (${apiResponse.total_assets_fq}) should be greater than or equal to total liabilities (${apiResponse.total_liabilities_fq})`,
          context: { companyType: 'banking' }
        });
      }
    }

    // Validate that Interest Income >= Net Interest Income (quarterly)
    if (apiResponse.interest_income_fq && apiResponse.interest_income_net_fq) {
      if (apiResponse.interest_income_fq < apiResponse.interest_income_net_fq) {
        this.errors.push({
          type: MappingErrorType.INVALID_DATA_TYPE,
          field: 'interest_income_consistency',
          message: `Interest income (${apiResponse.interest_income_fq}) should be greater than or equal to net interest income (${apiResponse.interest_income_net_fq})`,
          context: { companyType: 'banking' }
        });
      }
    }
  }

  /**
   * Validate consistency in historical data arrays
   */
  private validateHistoricalDataConsistency(apiResponse: InsightSentryQuarterlyResponse): void {
    // Check that historical arrays have reasonable lengths
    const historicalFields = [
      'interest_income_fy_h',
      'total_deposits_fy_h',
      'loans_net_fy_h',
      'net_income_fy_h'
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
          context: { companyType: 'banking' }
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
            context: { companyType: 'banking' }
          });
        }
      }
    }
  }

  /**
   * Validate that required banking fields are present and have valid values
   */
  validateRequiredBankingFields(apiResponse: InsightSentryQuarterlyResponse): boolean {
    const requiredFields = [
      { current: 'interest_income_fy', historical: 'interest_income_fy_h', name: 'Interest Income', allowZero: false },
      { current: null, historical: 'total_deposits_fy_h', name: 'Total Deposits', allowZero: false },
      { current: null, historical: 'loans_net_fy_h', name: 'Net Loans', allowZero: false },
      { current: 'net_income_fy', historical: 'net_income_fy_h', name: 'Net Income', allowZero: true }
    ];

    let validFieldCount = 0;

    for (const { current, historical, name, allowZero } of requiredFields) {
      let hasValidCurrentValue = false;
      let hasValidHistoricalValue = false;

      // Check current value if it exists
      if (current) {
        const value = apiResponse[current as keyof InsightSentryQuarterlyResponse] as number | undefined;
        hasValidCurrentValue = value !== null && value !== undefined && !isNaN(value) && (allowZero || value !== 0);
      }

      // Check historical data
      const historicalData = apiResponse[historical as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
      hasValidHistoricalValue = Array.isArray(historicalData) &&
        historicalData.some(v => v !== null && v !== undefined && !isNaN(v) && (allowZero || v !== 0));

      if (hasValidCurrentValue || hasValidHistoricalValue) {
        validFieldCount++;
      } else {
        this.errors.push({
          type: MappingErrorType.MISSING_REQUIRED_FIELD,
          field: historical,
          message: `Required banking field '${name}' is missing or invalid`,
          context: { companyType: 'banking' }
        });
      }
    }

    // Require at least 3 out of 4 critical fields to be valid
    return validFieldCount >= 3;
  }

  /**
   * Enhanced banking-specific error handling
   */
  handleBankingSpecificErrors(apiResponse: InsightSentryQuarterlyResponse): void {
    // Check for common banking data issues

    // Issue 1: Missing deposit data
    if (!apiResponse.total_deposits_fq && !apiResponse.total_deposits_fy_h) {
      this.errors.push({
        type: MappingErrorType.MISSING_REQUIRED_FIELD,
        field: 'deposits',
        message: 'Banking company missing deposit data - this is critical for banking analysis',
        context: { companyType: 'banking' }
      });
    }

    // Issue 2: Missing loan data
    if (!apiResponse.loans_net_fy_h && !apiResponse.loans_gross_fy_h) {
      this.errors.push({
        type: MappingErrorType.MISSING_REQUIRED_FIELD,
        field: 'loans',
        message: 'Banking company missing loan data - this is critical for banking analysis',
        context: { companyType: 'banking' }
      });
    }

    // Issue 3: Missing asset quality data
    if (!apiResponse.nonperf_loans_fy_h && !apiResponse.nonperf_loans_loans_gross_fy_h &&
      !apiResponse.nonperf_loans_fq && !apiResponse.nonperf_loans_loans_gross_fq) {
      this.warnings.push({
        type: MappingErrorType.MISSING_REQUIRED_FIELD,
        field: 'asset_quality',
        message: 'Banking company missing asset quality data (NPA) - important for risk assessment',
        context: { companyType: 'banking' }
      });
    }

    // Issue 4: Missing interest income data
    if (!apiResponse.interest_income_fy && !apiResponse.interest_income_fy_h &&
      !apiResponse.interest_income_net_fy_h && !apiResponse.interest_income_fq && !apiResponse.interest_income_net_fq) {
      this.errors.push({
        type: MappingErrorType.MISSING_REQUIRED_FIELD,
        field: 'interest_income',
        message: 'Banking company missing interest income data - this is fundamental for banking analysis',
        context: { companyType: 'banking' }
      });
    }
  }
}