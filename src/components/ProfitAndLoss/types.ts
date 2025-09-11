
// Defines the types of companies
export type CompanyType = 'banking' | 'non-banking';

// Defines the types of metrics
export type MetricType = 'currency' | 'percentage' | 'number' | 'link';

// Core profit and loss interfaces (following BalanceSheet pattern)
export interface MetricRow {
  label: string;
  values: string[];
  type: MetricType;
  unit?: string;
  rawValues?: (number | null)[];
}

// Defines the shape of the processed data for the Profit & Loss table
export interface ProcessedProfitAndLossData {
  years: string[];
  rows: MetricRow[];
  companyType: CompanyType;
  lastUpdated: string;
  hasProductSegments: boolean; // Example additional property
}

// Configuration for a single metric in the table
export interface MetricConfig {
  key?: string;
  label: string;
  type: MetricType;
  calculation?: (data: Map<string, any>) => (number | null)[];
  formatValue?: (value: any) => any;
}

// Props for the main ProfitAndLossTable component
export interface ProfitAndLossProps {
  symbol: string;
  companyName?: string;
  sector?: string;
  className?: string;
}

// Shape of the error object for the useProfitAndLossData hook
export interface ProfitAndLossResultsError {
  type: 'network' | 'no-data' | 'invalid-data' | 'not-found' | 'partial-data';
  message: string;
  details?: string;
}

// Represents the raw API response from the InsightSentry API for quarterly data
export interface InsightSentryProfitAndLossResponse {
  [key: string]: any; // Allows flexible key-value pairs
}
