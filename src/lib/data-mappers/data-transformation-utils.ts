/**
 * Data Transformation Utilities for Financial Data Mapping
 * 
 * This module provides comprehensive utilities for transforming financial data
 * including currency formatting, percentage formatting, ratio formatting,
 * and null value handling with fallback logic.
 */

export type CurrencyUnit = 'basic' | 'thousands' | 'lakhs' | 'crores';
export type PercentageFormat = 'decimal' | 'percentage';
export type RatioFormat = 'decimal' | 'ratio' | 'times';

/**
 * Currency formatting utilities
 */
export class CurrencyFormatter {
  /**
   * Format currency values with appropriate unit conversion
   * @param value - Raw currency value
   * @param targetUnit - Target unit for display (crores, lakhs, etc.)
   * @param decimalPlaces - Number of decimal places to show
   * @returns Formatted currency value or null if invalid
   */
  static formatCurrency(
    value: number | null | undefined,
    targetUnit: CurrencyUnit = 'crores',
    decimalPlaces: number = 2
  ): number | null {
    if (!this.isValidNumber(value)) {
      return null;
    }

    const numValue = value as number;
    let convertedValue: number;

    switch (targetUnit) {
      case 'crores':
        convertedValue = numValue / 10000000; // 1 crore = 10,000,000
        break;
      case 'lakhs':
        convertedValue = numValue / 100000; // 1 lakh = 100,000
        break;
      case 'thousands':
        convertedValue = numValue / 1000; // 1 thousand = 1,000
        break;
      case 'basic':
      default:
        convertedValue = numValue;
        break;
    }

    return Math.round(convertedValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  /**
   * Auto-format currency based on magnitude
   * @param value - Raw currency value
   * @param decimalPlaces - Number of decimal places
   * @returns Object with formatted value and unit
   */
  static autoFormatCurrency(
    value: number | null | undefined,
    decimalPlaces: number = 2
  ): { value: number | null; unit: CurrencyUnit } | null {
    if (!this.isValidNumber(value)) {
      return null;
    }

    const numValue = Math.abs(value as number);

    if (numValue >= 10000000) {
      return {
        value: this.formatCurrency(value, 'crores', decimalPlaces),
        unit: 'crores'
      };
    } else if (numValue >= 100000) {
      return {
        value: this.formatCurrency(value, 'lakhs', decimalPlaces),
        unit: 'lakhs'
      };
    } else if (numValue >= 1000) {
      return {
        value: this.formatCurrency(value, 'thousands', decimalPlaces),
        unit: 'thousands'
      };
    } else {
      return {
        value: this.formatCurrency(value, 'basic', decimalPlaces),
        unit: 'basic'
      };
    }
  }

  /**
   * Format currency for display with unit suffix
   * @param value - Raw currency value
   * @param targetUnit - Target unit
   * @param includeSymbol - Whether to include currency symbol
   * @returns Formatted string with unit
   */
  static formatCurrencyWithUnit(
    value: number | null | undefined,
    targetUnit: CurrencyUnit = 'crores',
    includeSymbol: boolean = true
  ): string {
    const formatted = this.formatCurrency(value, targetUnit);
    
    if (formatted === null) {
      return 'N/A';
    }

    const symbol = includeSymbol ? '₹' : '';
    const unitSuffix = targetUnit === 'basic' ? '' : ` ${targetUnit}`;
    
    return `${symbol}${formatted.toLocaleString('en-US')}${unitSuffix}`;
  }

  private static isValidNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
}

/**
 * Percentage formatting utilities
 */
export class PercentageFormatter {
  /**
   * Format percentage values
   * @param value - Raw percentage value (can be decimal or already percentage)
   * @param inputFormat - Whether input is decimal (0.15) or percentage (15)
   * @param decimalPlaces - Number of decimal places to show
   * @returns Formatted percentage value or null if invalid
   */
  static formatPercentage(
    value: number | null | undefined,
    inputFormat: PercentageFormat = 'decimal',
    decimalPlaces: number = 2
  ): number | null {
    if (!this.isValidNumber(value)) {
      return null;
    }

    const numValue = value as number;
    let percentageValue: number;

    if (inputFormat === 'decimal') {
      percentageValue = numValue * 100;
    } else {
      percentageValue = numValue;
    }

    return Math.round(percentageValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  /**
   * Format percentage for display with % symbol
   * @param value - Raw percentage value
   * @param inputFormat - Input format
   * @param decimalPlaces - Decimal places
   * @returns Formatted percentage string
   */
  static formatPercentageWithSymbol(
    value: number | null | undefined,
    inputFormat: PercentageFormat = 'decimal',
    decimalPlaces: number = 2
  ): string {
    const formatted = this.formatPercentage(value, inputFormat, decimalPlaces);
    
    if (formatted === null) {
      return 'N/A';
    }

    return `${formatted}%`;
  }

  /**
   * Format growth rate with appropriate sign and color indication
   * @param value - Growth rate value
   * @param inputFormat - Input format
   * @returns Object with formatted value and trend indication
   */
  static formatGrowthRate(
    value: number | null | undefined,
    inputFormat: PercentageFormat = 'decimal'
  ): { value: string; trend: 'positive' | 'negative' | 'neutral' } | null {
    const formatted = this.formatPercentage(value, inputFormat);
    
    if (formatted === null) {
      return null;
    }

    const sign = formatted > 0 ? '+' : '';
    const trend = formatted > 0 ? 'positive' : formatted < 0 ? 'negative' : 'neutral';

    return {
      value: `${sign}${formatted}%`,
      trend
    };
  }

  private static isValidNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
}

/**
 * Ratio formatting utilities
 */
export class RatioFormatter {
  /**
   * Format ratio values
   * @param value - Raw ratio value
   * @param format - Output format (decimal, ratio, times)
   * @param decimalPlaces - Number of decimal places
   * @returns Formatted ratio value or null if invalid
   */
  static formatRatio(
    value: number | null | undefined,
    format: RatioFormat = 'decimal',
    decimalPlaces: number = 2
  ): number | null {
    if (!this.isValidNumber(value)) {
      return null;
    }

    const numValue = value as number;
    return Math.round(numValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  /**
   * Format ratio for display with appropriate suffix
   * @param value - Raw ratio value
   * @param format - Output format
   * @param decimalPlaces - Decimal places
   * @returns Formatted ratio string
   */
  static formatRatioWithSuffix(
    value: number | null | undefined,
    format: RatioFormat = 'decimal',
    decimalPlaces: number = 2
  ): string {
    const formatted = this.formatRatio(value, format, decimalPlaces);
    
    if (formatted === null) {
      return 'N/A';
    }

    switch (format) {
      case 'times':
        return `${formatted}x`;
      case 'ratio':
        return `${formatted}:1`;
      case 'decimal':
      default:
        return formatted.toString();
    }
  }

  /**
   * Format financial ratios with context-appropriate formatting
   * @param value - Raw ratio value
   * @param ratioType - Type of ratio for context-specific formatting
   * @returns Formatted ratio string
   */
  static formatFinancialRatio(
    value: number | null | undefined,
    ratioType: 'debt_equity' | 'current' | 'quick' | 'price_earnings' | 'price_book' | 'generic' = 'generic'
  ): string {
    if (!this.isValidNumber(value)) {
      return 'N/A';
    }

    const numValue = value as number;

    switch (ratioType) {
      case 'debt_equity':
      case 'current':
      case 'quick':
        return this.formatRatioWithSuffix(numValue, 'decimal', 2);
      case 'price_earnings':
      case 'price_book':
        return this.formatRatioWithSuffix(numValue, 'times', 2);
      case 'generic':
      default:
        return this.formatRatioWithSuffix(numValue, 'decimal', 2);
    }
  }

  private static isValidNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
}

/**
 * Null value handling and fallback utilities
 */
export class NullValueHandler {
  /**
   * Handle null values with fallback logic
   * @param value - Primary value to check
   * @param fallback - Fallback value if primary is null
   * @param defaultValue - Default value if both primary and fallback are null
   * @returns First non-null value or default
   */
  static handleNullValue<T>(
    value: T | null | undefined,
    fallback: T | null | undefined = null,
    defaultValue: T | null = null
  ): T | null {
    if (this.isValidValue(value)) {
      return value as T;
    }
    
    if (this.isValidValue(fallback)) {
      return fallback as T;
    }
    
    return defaultValue;
  }

  /**
   * Handle null values in arrays with fallback logic
   * @param values - Array of values to process
   * @param fallbackValue - Value to use for null entries
   * @param removeNulls - Whether to remove null values entirely
   * @returns Processed array
   */
  static handleNullArray<T>(
    values: (T | null | undefined)[],
    fallbackValue: T | null = null,
    removeNulls: boolean = false
  ): (T | null)[] {
    if (!Array.isArray(values)) {
      return [];
    }

    const processed = values.map(value => 
      this.isValidValue(value) ? value as T : fallbackValue
    );

    if (removeNulls) {
      return processed.filter(value => value !== null) as T[];
    }

    return processed;
  }

  /**
   * Get the most recent non-null value from an array
   * @param values - Array of values (typically historical data)
   * @param fallback - Fallback value if no valid values found
   * @returns Most recent valid value or fallback
   */
  static getMostRecentValue<T>(
    values: (T | null | undefined)[],
    fallback: T | null = null
  ): T | null {
    if (!Array.isArray(values) || values.length === 0) {
      return fallback;
    }

    // Search from the beginning (most recent) to find first valid value
    for (const value of values) {
      if (this.isValidValue(value)) {
        return value as T;
      }
    }

    return fallback;
  }

  /**
   * Calculate percentage of non-null values in array (data completeness)
   * @param values - Array to analyze
   * @returns Percentage of non-null values (0-100)
   */
  static calculateDataCompleteness<T>(values: (T | null | undefined)[]): number {
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }

    const validCount = values.filter(value => this.isValidValue(value)).length;
    return (validCount / values.length) * 100;
  }

  /**
   * Interpolate missing values in numerical arrays
   * @param values - Array with potential null values
   * @param method - Interpolation method
   * @returns Array with interpolated values
   */
  static interpolateNullValues(
    values: (number | null | undefined)[],
    method: 'linear' | 'forward_fill' | 'backward_fill' = 'linear'
  ): (number | null)[] {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }

    const result = [...values] as (number | null)[];

    switch (method) {
      case 'forward_fill':
        return this.forwardFill(result);
      case 'backward_fill':
        return this.backwardFill(result);
      case 'linear':
      default:
        return this.linearInterpolate(result);
    }
  }

  private static isValidValue<T>(value: T | null | undefined): value is T {
    if (value === null || value === undefined) {
      return false;
    }
    
    if (typeof value === 'number') {
      return !isNaN(value) && isFinite(value);
    }
    
    return true;
  }

  private static forwardFill(values: (number | null)[]): (number | null)[] {
    const result = [...values];
    let lastValid: number | null = null;

    for (let i = 0; i < result.length; i++) {
      if (this.isValidValue(result[i])) {
        lastValid = result[i];
      } else if (lastValid !== null) {
        result[i] = lastValid;
      }
    }

    return result;
  }

  private static backwardFill(values: (number | null)[]): (number | null)[] {
    const result = [...values];
    let nextValid: number | null = null;

    for (let i = result.length - 1; i >= 0; i--) {
      if (this.isValidValue(result[i])) {
        nextValid = result[i];
      } else if (nextValid !== null) {
        result[i] = nextValid;
      }
    }

    return result;
  }

  private static linearInterpolate(values: (number | null)[]): (number | null)[] {
    const result = [...values];

    for (let i = 0; i < result.length; i++) {
      if (result[i] === null || result[i] === undefined) {
        // Find previous and next valid values
        let prevIndex = -1;
        let nextIndex = -1;

        for (let j = i - 1; j >= 0; j--) {
          if (this.isValidValue(result[j])) {
            prevIndex = j;
            break;
          }
        }

        for (let j = i + 1; j < result.length; j++) {
          if (this.isValidValue(result[j])) {
            nextIndex = j;
            break;
          }
        }

        // Interpolate if both boundaries exist
        if (prevIndex !== -1 && nextIndex !== -1) {
          const prevValue = result[prevIndex] as number;
          const nextValue = result[nextIndex] as number;
          const ratio = (i - prevIndex) / (nextIndex - prevIndex);
          result[i] = prevValue + (nextValue - prevValue) * ratio;
        }
      }
    }

    return result;
  }
}

/**
 * Combined data transformation utilities class
 * Provides a unified interface for all transformation operations
 */
export class DataTransformationUtils {
  // Currency formatting
  static formatCurrency(
    value: number | null | undefined,
    targetUnit: CurrencyUnit = 'crores',
    decimalPlaces: number = 2
  ): number | null {
    return CurrencyFormatter.formatCurrency(value, targetUnit, decimalPlaces);
  }

  static autoFormatCurrency(
    value: number | null | undefined,
    decimalPlaces: number = 2
  ): { value: number | null; unit: CurrencyUnit } | null {
    return CurrencyFormatter.autoFormatCurrency(value, decimalPlaces);
  }

  static formatCurrencyWithUnit(
    value: number | null | undefined,
    targetUnit: CurrencyUnit = 'crores',
    includeSymbol: boolean = true
  ): string {
    return CurrencyFormatter.formatCurrencyWithUnit(value, targetUnit, includeSymbol);
  }

  // Percentage formatting
  static formatPercentage(
    value: number | null | undefined,
    inputFormat: PercentageFormat = 'decimal',
    decimalPlaces: number = 2
  ): number | null {
    return PercentageFormatter.formatPercentage(value, inputFormat, decimalPlaces);
  }

  static formatPercentageWithSymbol(
    value: number | null | undefined,
    inputFormat: PercentageFormat = 'decimal',
    decimalPlaces: number = 2
  ): string {
    return PercentageFormatter.formatPercentageWithSymbol(value, inputFormat, decimalPlaces);
  }

  static formatGrowthRate(
    value: number | null | undefined,
    inputFormat: PercentageFormat = 'decimal'
  ): { value: string; trend: 'positive' | 'negative' | 'neutral' } | null {
    return PercentageFormatter.formatGrowthRate(value, inputFormat);
  }

  // Ratio formatting
  static formatRatio(
    value: number | null | undefined,
    format: RatioFormat = 'decimal',
    decimalPlaces: number = 2
  ): number | null {
    return RatioFormatter.formatRatio(value, format, decimalPlaces);
  }

  static formatRatioWithSuffix(
    value: number | null | undefined,
    format: RatioFormat = 'decimal',
    decimalPlaces: number = 2
  ): string {
    return RatioFormatter.formatRatioWithSuffix(value, format, decimalPlaces);
  }

  static formatFinancialRatio(
    value: number | null | undefined,
    ratioType: 'debt_equity' | 'current' | 'quick' | 'price_earnings' | 'price_book' | 'generic' = 'generic'
  ): string {
    return RatioFormatter.formatFinancialRatio(value, ratioType);
  }

  // Null value handling
  static handleNullValue<T>(
    value: T | null | undefined,
    fallback: T | null | undefined = null,
    defaultValue: T | null = null
  ): T | null {
    return NullValueHandler.handleNullValue(value, fallback, defaultValue);
  }

  static handleNullArray<T>(
    values: (T | null | undefined)[],
    fallbackValue: T | null = null,
    removeNulls: boolean = false
  ): (T | null)[] {
    return NullValueHandler.handleNullArray(values, fallbackValue, removeNulls);
  }

  static getMostRecentValue<T>(
    values: (T | null | undefined)[],
    fallback: T | null = null
  ): T | null {
    return NullValueHandler.getMostRecentValue(values, fallback);
  }

  static calculateDataCompleteness<T>(values: (T | null | undefined)[]): number {
    return NullValueHandler.calculateDataCompleteness(values);
  }

  static interpolateNullValues(
    values: (number | null | undefined)[],
    method: 'linear' | 'forward_fill' | 'backward_fill' = 'linear'
  ): (number | null)[] {
    return NullValueHandler.interpolateNullValues(values, method);
  }

  /**
   * Calculate percentage change between two values
   * @param current - Current value
   * @param previous - Previous value
   * @returns Percentage change or null if calculation not possible
   */
  static calculatePercentageChange(current: number | null, previous: number | null): number | null {
    if (current === null || previous === null || previous === 0) {
      return null;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  /**
   * Calculate compound annual growth rate (CAGR)
   * @param startValue - Starting value
   * @param endValue - Ending value
   * @param periods - Number of periods
   * @returns CAGR percentage or null if calculation not possible
   */
  static calculateCAGR(
    startValue: number | null, 
    endValue: number | null, 
    periods: number
  ): number | null {
    if (startValue === null || endValue === null || startValue === 0 || periods <= 0) {
      return null;
    }
    return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
  }

  /**
   * Transform a financial metric value based on its unit type
   * @param value - Raw value
   * @param unit - Unit type from FinancialMetric
   * @param options - Formatting options
   * @returns Transformed value or null
   */
  static transformMetricValue(
    value: number | null | undefined,
    unit: 'currency' | 'percentage' | 'ratio' | 'count',
    options: {
      currencyUnit?: CurrencyUnit;
      percentageFormat?: PercentageFormat;
      ratioFormat?: RatioFormat;
      decimalPlaces?: number;
    } = {}
  ): number | null {
    const {
      currencyUnit = 'crores',
      percentageFormat = 'decimal',
      ratioFormat = 'decimal',
      decimalPlaces = 2
    } = options;

    switch (unit) {
      case 'currency':
        return this.formatCurrency(value, currencyUnit, decimalPlaces);
      case 'percentage':
        return this.formatPercentage(value, percentageFormat, decimalPlaces);
      case 'ratio':
        return this.formatRatio(value, ratioFormat, decimalPlaces);
      case 'count':
        return this.formatRatio(value, 'decimal', 0); // No decimals for counts
      default:
        return this.handleNullValue(value);
    }
  }

  /**
   * Transform a financial metric value for display
   * @param value - Raw value
   * @param unit - Unit type
   * @param options - Display options
   * @returns Formatted display string
   */
  static transformMetricForDisplay(
    value: number | null | undefined,
    unit: 'currency' | 'percentage' | 'ratio' | 'count',
    options: {
      currencyUnit?: CurrencyUnit;
      percentageFormat?: PercentageFormat;
      ratioFormat?: RatioFormat;
      includeSymbols?: boolean;
    } = {}
  ): string {
    const {
      currencyUnit = 'crores',
      percentageFormat = 'decimal',
      ratioFormat = 'decimal',
      includeSymbols = true
    } = options;

    switch (unit) {
      case 'currency':
        return this.formatCurrencyWithUnit(value, currencyUnit, includeSymbols);
      case 'percentage':
        return this.formatPercentageWithSymbol(value, percentageFormat);
      case 'ratio':
        return this.formatRatioWithSuffix(value, ratioFormat);
      case 'count':
        const formatted = this.formatRatio(value, 'decimal', 0);
        return formatted !== null ? formatted.toLocaleString('en-US') : 'N/A';
      default:
        return 'N/A';
    }
  }
}