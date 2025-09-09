// Historical Data Processing Infrastructure
import { 
  FinancialMetric, 
  InsightSentryQuarterlyResponse,
  MappingError,
  MappingErrorType
} from '../../components/QuarterlyResults/types';

/**
 * Configuration for historical data processing
 */
export interface HistoricalDataConfig {
  maxAnnualYears: number; // Up to 20 years
  maxQuarterlyPeriods: number; // Up to 32 quarters (8 years)
  nullValueHandling: 'skip' | 'interpolate' | 'zero';
  validateDataConsistency: boolean;
}

/**
 * Growth calculation result
 */
export interface GrowthCalculation {
  value: number | null;
  period: string;
  isValid: boolean;
  baseValue: number | null;
  currentValue: number | null;
}

/**
 * Historical data processing result
 */
export interface HistoricalProcessingResult {
  processedData: (number | null)[];
  validDataPoints: number;
  nullCount: number;
  errors: MappingError[];
  warnings: MappingError[];
}

/**
 * Class responsible for processing historical financial data arrays
 */
export class HistoricalDataProcessor {
  private config: HistoricalDataConfig;
  private errors: MappingError[] = [];
  private warnings: MappingError[] = [];

  constructor(config: Partial<HistoricalDataConfig> = {}) {
    this.config = {
      maxAnnualYears: 20,
      maxQuarterlyPeriods: 32,
      nullValueHandling: 'skip',
      validateDataConsistency: true,
      ...config
    };
  }

  /**
   * Process annual historical data array
   */
  processAnnualData(
    data: (number | null)[] | undefined,
    fieldName: string
  ): HistoricalProcessingResult {
    this.resetErrors();

    if (!data || !Array.isArray(data)) {
      return this.createEmptyResult(fieldName, 'Annual data is not an array or is undefined');
    }

    // Limit to maximum years
    const limitedData = data.slice(0, this.config.maxAnnualYears);
    
    // Clean and validate array values first
    const cleanedData = this.cleanArrayValues(limitedData, fieldName);
    
    // Process null values
    const processedData = this.handleNullValues(cleanedData, fieldName, 'annual');
    
    // Validate data consistency
    if (this.config.validateDataConsistency) {
      this.validateDataConsistency(processedData, fieldName, 'annual');
    }

    const validDataPoints = processedData.filter(value => value !== null).length;
    const nullCount = processedData.length - validDataPoints;

    return {
      processedData,
      validDataPoints,
      nullCount,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  /**
   * Process quarterly historical data array
   */
  processQuarterlyData(
    data: (number | null)[] | undefined,
    fieldName: string
  ): HistoricalProcessingResult {
    this.resetErrors();

    if (!data || !Array.isArray(data)) {
      return this.createEmptyResult(fieldName, 'Quarterly data is not an array or is undefined');
    }

    // Limit to maximum quarters
    const limitedData = data.slice(0, this.config.maxQuarterlyPeriods);
    
    // Clean and validate array values first
    const cleanedData = this.cleanArrayValues(limitedData, fieldName);
    
    // Process null values
    const processedData = this.handleNullValues(cleanedData, fieldName, 'quarterly');
    
    // Validate data consistency
    if (this.config.validateDataConsistency) {
      this.validateDataConsistency(processedData, fieldName, 'quarterly');
    }

    const validDataPoints = processedData.filter(value => value !== null).length;
    const nullCount = processedData.length - validDataPoints;

    return {
      processedData,
      validDataPoints,
      nullCount,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  /**
   * Extract and process historical data from API response
   */
  extractHistoricalData(
    apiResponse: InsightSentryQuarterlyResponse,
    fieldName: string,
    period: 'FY' | 'FQ'
  ): HistoricalProcessingResult {
    const historicalFieldName = `${fieldName}_${period.toLowerCase()}_h`;
    const rawData = apiResponse[historicalFieldName as keyof InsightSentryQuarterlyResponse] as (number | null)[] | undefined;

    if (period === 'FY') {
      return this.processAnnualData(rawData, historicalFieldName);
    } else {
      return this.processQuarterlyData(rawData, historicalFieldName);
    }
  }

  /**
   * Clean and validate array values, converting invalid values to null
   */
  private cleanArrayValues(
    data: (number | null | undefined | string | any)[],
    fieldName: string
  ): (number | null)[] {
    return data.map((value, index) => {
      if (value === null || value === undefined) {
        return null;
      }
      
      if (typeof value === 'number' && !isNaN(value)) {
        return value;
      }
      
      if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
      
      this.warnings.push({
        type: MappingErrorType.INVALID_DATA_TYPE,
        field: fieldName,
        message: `Invalid value at index ${index}: ${value}`,
        originalValue: value
      });
      
      return null;
    });
  }

  /**
   * Handle null values in historical arrays based on configuration
   */
  private handleNullValues(
    data: (number | null)[],
    fieldName: string,
    period: 'annual' | 'quarterly'
  ): (number | null)[] {
    const result = [...data];

    switch (this.config.nullValueHandling) {
      case 'skip':
        // Keep nulls as is - they will be filtered out during processing
        break;

      case 'zero':
        // Replace nulls with zero
        for (let i = 0; i < result.length; i++) {
          if (result[i] === null || result[i] === undefined) {
            result[i] = 0;
            this.warnings.push({
              type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
              field: fieldName,
              message: `Null value at index ${i} replaced with zero`,
              context: { period }
            });
          }
        }
        break;

      case 'interpolate':
        // Simple linear interpolation for null values
        result.forEach((value, index) => {
          if (value === null || value === undefined) {
            const interpolated = this.interpolateValue(result, index);
            if (interpolated !== null) {
              result[index] = interpolated;
              this.warnings.push({
                type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
                field: fieldName,
                message: `Null value at index ${index} interpolated to ${interpolated}`,
                context: { period }
              });
            }
          }
        });
        break;
    }

    return result;
  }

  /**
   * Simple linear interpolation for missing values
   */
  private interpolateValue(data: (number | null)[], index: number): number | null {
    // Find previous non-null value
    let prevValue: number | null = null;
    let prevIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (data[i] !== null && data[i] !== undefined) {
        prevValue = data[i];
        prevIndex = i;
        break;
      }
    }

    // Find next non-null value
    let nextValue: number | null = null;
    let nextIndex = -1;
    for (let i = index + 1; i < data.length; i++) {
      if (data[i] !== null && data[i] !== undefined) {
        nextValue = data[i];
        nextIndex = i;
        break;
      }
    }

    // Interpolate if we have both previous and next values
    if (prevValue !== null && nextValue !== null && prevIndex !== -1 && nextIndex !== -1) {
      const ratio = (index - prevIndex) / (nextIndex - prevIndex);
      return prevValue + (nextValue - prevValue) * ratio;
    }

    // Use previous value if available
    if (prevValue !== null) {
      return prevValue;
    }

    // Use next value if available
    if (nextValue !== null) {
      return nextValue;
    }

    return null;
  }

  /**
   * Validate data consistency (detect outliers, negative values where inappropriate, etc.)
   */
  private validateDataConsistency(
    data: (number | null)[],
    fieldName: string,
    period: 'annual' | 'quarterly'
  ): void {
    const validValues = data.filter(value => value !== null && !isNaN(value as number)) as number[];
    
    if (validValues.length === 0) {
      this.warnings.push({
        type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
        field: fieldName,
        message: 'No valid data points found in historical array',
        context: { period }
      });
      return;
    }

    // Check for extreme outliers (values more than 10x the median)
    const sortedValues = [...validValues].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(sortedValues.length / 2)];
    
    if (median > 0) {
      const outliers = validValues.filter(value => Math.abs(value) > median * 10);
      if (outliers.length > 0) {
        this.warnings.push({
          type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
          field: fieldName,
          message: `Found ${outliers.length} potential outliers in historical data`,
          context: { period, outliers: outliers.slice(0, 3) } // Show first 3 outliers
        });
      }
    }

    // Check for unexpected negative values in typically positive fields
    const typicallyPositiveFields = [
      'revenue', 'total_revenue', 'total_assets', 'total_deposits', 'loans_gross'
    ];
    
    if (typicallyPositiveFields.some(field => fieldName.includes(field))) {
      const negativeValues = validValues.filter(value => value < 0);
      if (negativeValues.length > 0) {
        this.warnings.push({
          type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
          field: fieldName,
          message: `Found ${negativeValues.length} negative values in typically positive field`,
          context: { period }
        });
      }
    }
  }

  /**
   * Get the most recent non-null value from historical array
   */
  getMostRecentValue(historicalArray: (number | null)[]): number | null {
    for (const value of historicalArray) {
      if (value !== null && value !== undefined && !isNaN(value)) {
        return value;
      }
    }
    return null;
  }

  /**
   * Get the oldest non-null value from historical array
   */
  getOldestValue(historicalArray: (number | null)[]): number | null {
    for (let i = historicalArray.length - 1; i >= 0; i--) {
      const value = historicalArray[i];
      if (value !== null && value !== undefined && !isNaN(value)) {
        return value;
      }
    }
    return null;
  }

  /**
   * Get value at specific index with fallback to nearest valid value
   */
  getValueAtIndex(historicalArray: (number | null)[], index: number): number | null {
    if (index < 0 || index >= historicalArray.length) {
      return null;
    }

    const value = historicalArray[index];
    if (value !== null && value !== undefined && !isNaN(value)) {
      return value;
    }

    // Try to find nearest valid value
    for (let offset = 1; offset <= Math.max(index, historicalArray.length - index - 1); offset++) {
      // Check forward
      if (index + offset < historicalArray.length) {
        const forwardValue = historicalArray[index + offset];
        if (forwardValue !== null && forwardValue !== undefined && !isNaN(forwardValue)) {
          return forwardValue;
        }
      }

      // Check backward
      if (index - offset >= 0) {
        const backwardValue = historicalArray[index - offset];
        if (backwardValue !== null && backwardValue !== undefined && !isNaN(backwardValue)) {
          return backwardValue;
        }
      }
    }

    return null;
  }

  /**
   * Create empty result for error cases
   */
  private createEmptyResult(fieldName: string, errorMessage: string): HistoricalProcessingResult {
    this.errors.push({
      type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
      field: fieldName,
      message: errorMessage
    });

    return {
      processedData: [],
      validDataPoints: 0,
      nullCount: 0,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  /**
   * Reset error and warning arrays
   */
  private resetErrors(): void {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Get current configuration
   */
  getConfig(): HistoricalDataConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HistoricalDataConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Growth Calculation Utilities

  /**
   * Calculate year-over-year growth for annual data
   */
  calculateYearOverYearGrowth(
    historicalData: (number | null)[],
    fieldName: string
  ): GrowthCalculation[] {
    const results: GrowthCalculation[] = [];

    if (!historicalData || historicalData.length < 2) {
      return results;
    }

    for (let i = 0; i < historicalData.length - 1; i++) {
      const currentValue = historicalData[i];
      const previousValue = historicalData[i + 1]; // Historical data is in reverse chronological order

      const growth = this.calculateGrowthRate(previousValue, currentValue, fieldName);
      results.push({
        ...growth,
        period: `Year ${i + 1} vs Year ${i + 2}`
      });
    }

    return results;
  }

  /**
   * Calculate quarter-over-quarter growth for quarterly data
   */
  calculateQuarterOverQuarterGrowth(
    historicalData: (number | null)[],
    fieldName: string
  ): GrowthCalculation[] {
    const results: GrowthCalculation[] = [];

    if (!historicalData || historicalData.length < 2) {
      return results;
    }

    for (let i = 0; i < historicalData.length - 1; i++) {
      const currentValue = historicalData[i];
      const previousValue = historicalData[i + 1]; // Historical data is in reverse chronological order

      const growth = this.calculateGrowthRate(previousValue, currentValue, fieldName);
      results.push({
        ...growth,
        period: `Q${i + 1} vs Q${i + 2}`
      });
    }

    return results;
  }

  /**
   * Calculate year-over-year growth for the same quarter (e.g., Q1 2024 vs Q1 2023)
   */
  calculateSameQuarterYearOverYearGrowth(
    historicalData: (number | null)[],
    fieldName: string
  ): GrowthCalculation[] {
    const results: GrowthCalculation[] = [];

    if (!historicalData || historicalData.length < 4) {
      return results;
    }

    // Compare each quarter with the same quarter from previous year (4 quarters ago)
    for (let i = 0; i < historicalData.length - 4; i++) {
      const currentValue = historicalData[i];
      const sameQuarterPreviousYear = historicalData[i + 4];

      const growth = this.calculateGrowthRate(sameQuarterPreviousYear, currentValue, fieldName);
      results.push({
        ...growth,
        period: `Q${(i % 4) + 1} YoY (${Math.floor(i / 4) + 1} years)`
      });
    }

    return results;
  }

  /**
   * Calculate compound annual growth rate (CAGR)
   */
  calculateCAGR(
    historicalData: (number | null)[],
    fieldName: string,
    years?: number
  ): GrowthCalculation {
    if (!historicalData || historicalData.length < 2) {
      return {
        value: null,
        period: 'CAGR',
        isValid: false,
        baseValue: null,
        currentValue: null
      };
    }

    const actualYears = years || historicalData.length - 1;
    const endValue = this.getMostRecentValue(historicalData);
    const startValue = this.getValueAtIndex(historicalData, Math.min(actualYears, historicalData.length - 1));

    if (endValue === null || startValue === null || startValue <= 0 || actualYears <= 0) {
      return {
        value: null,
        period: `CAGR (${actualYears} years)`,
        isValid: false,
        baseValue: startValue,
        currentValue: endValue
      };
    }

    try {
      const cagr = (Math.pow(endValue / startValue, 1 / actualYears) - 1) * 100;
      
      return {
        value: cagr,
        period: `CAGR (${actualYears} years)`,
        isValid: !isNaN(cagr) && isFinite(cagr),
        baseValue: startValue,
        currentValue: endValue
      };
    } catch (error) {
      this.errors.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: fieldName,
        message: `Error calculating CAGR: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        value: null,
        period: `CAGR (${actualYears} years)`,
        isValid: false,
        baseValue: startValue,
        currentValue: endValue
      };
    }
  }

  /**
   * Calculate growth rate between two values
   */
  private calculateGrowthRate(
    baseValue: number | null,
    currentValue: number | null,
    fieldName: string
  ): Omit<GrowthCalculation, 'period'> {
    if (baseValue === null || currentValue === null) {
      return {
        value: null,
        isValid: false,
        baseValue,
        currentValue
      };
    }

    // Handle division by zero
    if (baseValue === 0) {
      if (currentValue === 0) {
        return {
          value: 0,
          isValid: true,
          baseValue,
          currentValue
        };
      } else {
        // When base is zero but current is not, growth is infinite
        // We'll return null and log a warning
        this.warnings.push({
          type: MappingErrorType.CALCULATION_ERROR,
          field: fieldName,
          message: 'Cannot calculate growth rate when base value is zero and current value is non-zero'
        });
        return {
          value: null,
          isValid: false,
          baseValue,
          currentValue
        };
      }
    }

    try {
      const growthRate = ((currentValue - baseValue) / Math.abs(baseValue)) * 100;
      
      return {
        value: growthRate,
        isValid: !isNaN(growthRate) && isFinite(growthRate),
        baseValue,
        currentValue
      };
    } catch (error) {
      this.errors.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: fieldName,
        message: `Error calculating growth rate: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        value: null,
        isValid: false,
        baseValue,
        currentValue
      };
    }
  }

  /**
   * Calculate moving average for historical data
   */
  calculateMovingAverage(
    historicalData: (number | null)[],
    windowSize: number,
    fieldName: string
  ): (number | null)[] {
    if (!historicalData || historicalData.length === 0 || windowSize <= 0) {
      return [];
    }

    const result: (number | null)[] = [];

    for (let i = 0; i < historicalData.length; i++) {
      if (i < windowSize - 1) {
        result.push(null); // Not enough data points for moving average
        continue;
      }

      const window = historicalData.slice(i - windowSize + 1, i + 1);
      const validValues = window.filter(value => value !== null && !isNaN(value as number)) as number[];

      if (validValues.length === 0) {
        result.push(null);
      } else if (validValues.length < windowSize * 0.5) {
        // If less than 50% of window has valid data, return null
        result.push(null);
        this.warnings.push({
          type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
          field: fieldName,
          message: `Insufficient valid data points for moving average at index ${i}`
        });
      } else {
        const average = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
        result.push(average);
      }
    }

    return result;
  }

  /**
   * Calculate volatility (standard deviation) of historical data
   */
  calculateVolatility(
    historicalData: (number | null)[],
    fieldName: string
  ): number | null {
    const validValues = historicalData.filter(value => value !== null && !isNaN(value as number)) as number[];

    if (validValues.length < 2) {
      this.warnings.push({
        type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
        field: fieldName,
        message: 'Insufficient data points to calculate volatility'
      });
      return null;
    }

    try {
      const mean = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
      const squaredDifferences = validValues.map(value => Math.pow(value - mean, 2));
      const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / (validValues.length - 1);
      const standardDeviation = Math.sqrt(variance);

      return standardDeviation;
    } catch (error) {
      this.errors.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: fieldName,
        message: `Error calculating volatility: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return null;
    }
  }

  /**
   * Find trend direction in historical data
   */
  calculateTrend(
    historicalData: (number | null)[],
    fieldName: string
  ): 'increasing' | 'decreasing' | 'stable' | 'volatile' | 'insufficient-data' {
    const validValues = historicalData.filter(value => value !== null && !isNaN(value as number)) as number[];

    if (validValues.length < 3) {
      return 'insufficient-data';
    }

    // Calculate simple linear regression slope
    const n = validValues.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = validValues.reduce((sum, y) => sum + y, 0) / n;

    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (validValues[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

    if (denominator === 0) {
      return 'stable';
    }

    const slope = numerator / denominator;
    const slopeThreshold = yMean * 0.01; // 1% of mean as threshold

    // Calculate R-squared to determine if trend is reliable
    const yPredicted = xValues.map(x => yMean + slope * (x - xMean));
    const ssRes = validValues.reduce((sum, y, i) => sum + Math.pow(y - yPredicted[i], 2), 0);
    const ssTot = validValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

    // If R-squared is low, data is volatile
    if (rSquared < 0.3) {
      return 'volatile';
    }

    if (Math.abs(slope) < slopeThreshold) {
      return 'stable';
    } else if (slope > 0) {
      return 'increasing';
    } else {
      return 'decreasing';
    }
  }
}