# Data Transformation Utilities

This module provides comprehensive utilities for transforming financial data including currency formatting, percentage formatting, ratio formatting, and null value handling with fallback logic.

## Overview

The data transformation utilities are designed to handle the complex requirements of financial data mapping and rendering. They provide type-safe, robust methods for formatting different types of financial metrics.

## Main Classes

### DataTransformationUtils

The main utility class that provides a unified interface for all transformation operations.

```typescript
import { DataTransformationUtils } from './data-transformation-utils';

// Currency formatting
const formatted = DataTransformationUtils.formatCurrency(100000000, 'crores'); // 10
const display = DataTransformationUtils.formatCurrencyWithUnit(100000000, 'crores'); // "₹10 crores"

// Percentage formatting
const percentage = DataTransformationUtils.formatPercentage(0.15, 'decimal'); // 15
const display = DataTransformationUtils.formatPercentageWithSymbol(0.15, 'decimal'); // "15%"

// Ratio formatting
const ratio = DataTransformationUtils.formatRatio(2.5, 'decimal'); // 2.5
const display = DataTransformationUtils.formatRatioWithSuffix(2.5, 'times'); // "2.5x"

// Null value handling
const value = DataTransformationUtils.handleNullValue(null, 0, -1); // 0
const recent = DataTransformationUtils.getMostRecentValue([null, 10, 20]); // 10
```

### CurrencyFormatter

Specialized class for currency formatting with support for different units (crores, lakhs, thousands).

```typescript
import { CurrencyFormatter } from './data-transformation-utils';

// Format to specific units
CurrencyFormatter.formatCurrency(100000000, 'crores'); // 10
CurrencyFormatter.formatCurrency(1000000, 'lakhs'); // 10
CurrencyFormatter.formatCurrency(10000, 'thousands'); // 10

// Auto-format based on magnitude
const result = CurrencyFormatter.autoFormatCurrency(100000000);
// { value: 10, unit: 'crores' }

// Format for display
CurrencyFormatter.formatCurrencyWithUnit(100000000, 'crores'); // "₹10 crores"
```

### PercentageFormatter

Specialized class for percentage formatting with support for different input formats.

```typescript
import { PercentageFormatter } from './data-transformation-utils';

// Format decimal percentages (0.15 -> 15%)
PercentageFormatter.formatPercentage(0.15, 'decimal'); // 15

// Format percentage values (15 -> 15%)
PercentageFormatter.formatPercentage(15, 'percentage'); // 15

// Format with symbol
PercentageFormatter.formatPercentageWithSymbol(0.15, 'decimal'); // "15%"

// Format growth rates with trend indication
const growth = PercentageFormatter.formatGrowthRate(0.15, 'decimal');
// { value: "+15%", trend: "positive" }
```

### RatioFormatter

Specialized class for ratio formatting with support for different display formats.

```typescript
import { RatioFormatter } from './data-transformation-utils';

// Basic ratio formatting
RatioFormatter.formatRatio(2.5, 'decimal'); // 2.5

// Format with suffixes
RatioFormatter.formatRatioWithSuffix(2.5, 'times'); // "2.5x"
RatioFormatter.formatRatioWithSuffix(1.5, 'ratio'); // "1.5:1"

// Financial ratio formatting
RatioFormatter.formatFinancialRatio(15.5, 'price_earnings'); // "15.5x"
RatioFormatter.formatFinancialRatio(0.75, 'debt_equity'); // "0.75"
```

### NullValueHandler

Specialized class for handling null values and missing data with various fallback strategies.

```typescript
import { NullValueHandler } from './data-transformation-utils';

// Handle single null values
NullValueHandler.handleNullValue(null, 0, -1); // 0 (fallback)
NullValueHandler.handleNullValue(10, 0, -1); // 10 (original value)

// Handle arrays with nulls
const cleaned = NullValueHandler.handleNullArray([1, null, 3], 0);
// [1, 0, 3]

// Get most recent valid value
const recent = NullValueHandler.getMostRecentValue([null, 10, null, 20]);
// 10 (first non-null value)

// Calculate data completeness
const completeness = NullValueHandler.calculateDataCompleteness([1, null, 3, null, 5]);
// 60 (60% of values are non-null)

// Interpolate missing values
const interpolated = NullValueHandler.interpolateNullValues([1, null, null, 4], 'linear');
// [1, 2, 3, 4]
```

## Usage in Financial Metric Transformation

The utilities are designed to work seamlessly with the financial metric system:

```typescript
import { DataTransformationUtils } from './data-transformation-utils';

// Transform a metric value based on its unit type
const transformedValue = DataTransformationUtils.transformMetricValue(
  100000000, 
  'currency', 
  { currencyUnit: 'crores' }
); // 10

// Transform for display
const displayValue = DataTransformationUtils.transformMetricForDisplay(
  100000000, 
  'currency', 
  { currencyUnit: 'crores' }
); // "₹10 crores"
```

## Type Safety

All utilities are fully typed with TypeScript:

```typescript
type CurrencyUnit = 'basic' | 'thousands' | 'lakhs' | 'crores';
type PercentageFormat = 'decimal' | 'percentage';
type RatioFormat = 'decimal' | 'ratio' | 'times';
```

## Error Handling

All utilities handle edge cases gracefully:

- Null and undefined values return null or appropriate fallbacks
- NaN and Infinity values are treated as invalid
- Invalid input types are handled safely
- Array operations handle mixed valid/invalid data

## Performance Considerations

- All formatting operations are lightweight and fast
- No external dependencies
- Minimal memory allocation
- Suitable for processing large datasets

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.3**: Currency values are formatted appropriately (in Crores/Lakhs)
- **Requirement 2.4**: Percentage values are displayed with appropriate decimal places
- **Requirement 2.5**: Data unavailability is handled with "N/A" or appropriate placeholder text

The utilities provide comprehensive null value handling and fallback logic as specified in the task requirements.
#
# HistoricalDataProcessor

The HistoricalDataProcessor is a specialized class for processing historical financial data arrays and performing growth calculations. It handles arrays up to 20 years for annual data and 32 quarters for quarterly data.

### Key Features

- **Data Processing**: Handles historical arrays with configurable limits
- **Null Value Handling**: Multiple strategies (skip, zero, interpolate)
- **Growth Calculations**: YoY, QoQ, CAGR, and same-quarter YoY growth
- **Statistical Analysis**: Moving averages, volatility, and trend analysis
- **Data Validation**: Outlier detection and consistency checks

### Usage

```typescript
import { HistoricalDataProcessor } from './data-mappers';

// Create processor with custom configuration
const processor = new HistoricalDataProcessor({
  maxAnnualYears: 20,
  maxQuarterlyPeriods: 32,
  nullValueHandling: 'interpolate',
  validateDataConsistency: true
});

// Process historical data
const revenueData = [1000, 1100, 1200, 1300, 1400]; // Most recent first
const result = processor.processAnnualData(revenueData, 'revenue_fy_h');

console.log('Processed data:', result.processedData);
console.log('Valid data points:', result.validDataPoints);
console.log('Null count:', result.nullCount);
```

### Growth Calculations

```typescript
// Year-over-year growth
const yoyGrowth = processor.calculateYearOverYearGrowth(revenueData, 'revenue_fy_h');
yoyGrowth.forEach(growth => {
  console.log(`${growth.period}: ${growth.value}% (${growth.isValid ? 'valid' : 'invalid'})`);
});

// Compound Annual Growth Rate
const cagr = processor.calculateCAGR(revenueData, 'revenue_fy_h', 5);
console.log(`5-year CAGR: ${cagr.value}%`);

// Quarter-over-quarter growth
const quarterlyData = [250, 275, 300, 325, 350, 375, 400, 425];
const qoqGrowth = processor.calculateQuarterOverQuarterGrowth(quarterlyData, 'revenue_fq_h');

// Same quarter year-over-year growth
const sameQuarterYoY = processor.calculateSameQuarterYearOverYearGrowth(quarterlyData, 'revenue_fq_h');
```

### Statistical Analysis

```typescript
// Moving average
const movingAvg = processor.calculateMovingAverage(revenueData, 3, 'revenue_fy_h');

// Volatility (standard deviation)
const volatility = processor.calculateVolatility(revenueData, 'revenue_fy_h');

// Trend analysis
const trend = processor.calculateTrend(revenueData, 'revenue_fy_h');
// Returns: 'increasing' | 'decreasing' | 'stable' | 'volatile' | 'insufficient-data'
```

### Configuration Options

```typescript
interface HistoricalDataConfig {
  maxAnnualYears: number;        // Up to 20 years (default)
  maxQuarterlyPeriods: number;   // Up to 32 quarters (default)
  nullValueHandling: 'skip' | 'interpolate' | 'zero';
  validateDataConsistency: boolean;
}
```

### Null Value Handling Strategies

- **skip**: Keep null values as-is (default)
- **zero**: Replace null values with zero
- **interpolate**: Use linear interpolation to estimate missing values

### Integration with BaseDataMapper

The HistoricalDataProcessor is automatically integrated with the BaseDataMapper class:

```typescript
// BaseDataMapper now uses HistoricalDataProcessor internally
export abstract class BaseDataMapper {
  protected historicalProcessor: HistoricalDataProcessor;
  
  protected extractHistoricalData(
    apiResponse: InsightSentryQuarterlyResponse, 
    field: string
  ): (number | null)[] {
    // Uses HistoricalDataProcessor for enhanced processing
    const period: 'FY' | 'FQ' = field.includes('_fq') ? 'FQ' : 'FY';
    const result = period === 'FY' 
      ? this.historicalProcessor.processAnnualData(rawData, field)
      : this.historicalProcessor.processQuarterlyData(rawData, field);
    
    return result.processedData;
  }
}
```

### Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 3.1**: Display data for up to 20 years for annual metrics
- **Requirement 3.2**: Display data for up to 32 quarters (8 years) for quarterly data
- **Requirement 3.4**: Handle null values gracefully without breaking the display
- **Requirement 3.5**: Compute year-over-year and quarter-over-quarter changes

The HistoricalDataProcessor provides comprehensive historical data processing capabilities as specified in task 8 of the implementation plan.