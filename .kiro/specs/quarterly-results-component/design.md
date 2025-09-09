# Design Document

## Overview

The Quarterly Results Component is a dynamic, data-driven React component that renders quarterly financial data in a tabular format. It intelligently adapts its display based on company type (banking vs non-banking) and sources data from the InsightSentry API. The component will be integrated into the stock detail page and provide investors with a comprehensive view of quarterly financial performance trends.

## Architecture

### Component Structure
```
QuarterlyResultsSection/
├── QuarterlyResultsTable.tsx (Main component)
├── BankingMetricsTable.tsx (Banking-specific table)
├── NonBankingMetricsTable.tsx (Non-banking table)
├── QuarterlyResultsHeader.tsx (Section header with segments button)
├── LoadingState.tsx (Loading skeleton)
├── ErrorState.tsx (Error handling)
└── types.ts (TypeScript interfaces)
```

### Data Flow
1. **Stock Detail Page** → Passes company symbol and sector info
2. **QuarterlyResultsTable** → Determines company type and fetches data
3. **API Service** → Retrieves quarterly data from InsightSentry API
4. **Metric Renderer** → Formats and displays appropriate metrics based on company type

## Components and Interfaces

### 1. Main Component Interface

```typescript
interface QuarterlyResultsProps {
  symbol: string;
  companyName: string;
  sector?: string;
  className?: string;
}

interface QuarterlyData {
  quarters: QuarterInfo[];
  metrics: MetricRow[];
  companyType: 'banking' | 'non-banking';
  hasProductSegments: boolean;
}

interface QuarterInfo {
  quarter: string; // "Jun 2024"
  year: number;
  period: string; // "Q1 FY25"
}

interface MetricRow {
  label: string;
  values: (number | string | null)[];
  type: 'currency' | 'percentage' | 'number' | 'link';
  unit?: string;
}
```

### 2. Banking vs Non-Banking Metric Definitions

#### Banking Metrics Configuration
```typescript
const BANKING_METRICS = [
  { key: 'total_revenue_fq_h', label: 'Revenue +', type: 'currency' },
  { key: 'interest_income_fq_h', label: 'Interest', type: 'currency' },
  { key: 'total_oper_expense_fq_h', label: 'Expenses +', type: 'currency' },
  { key: 'interest_income_net_fq_h', label: 'Financing Profit', type: 'currency' },
  { key: 'net_interest_margin_fq_h', label: 'Financing Margin %', type: 'percentage' },
  { key: 'non_interest_income_fq_h', label: 'Other Income +', type: 'currency' },
  { key: 'depreciation_fq_h', label: 'Depreciation', type: 'currency' },
  { key: 'pretax_income_fq_h', label: 'Profit before tax', type: 'currency' },
  { key: 'tax_rate_fq_h', label: 'Tax %', type: 'percentage' },
  { key: 'net_income_fq_h', label: 'Net Profit +', type: 'currency' },
  { key: 'earnings_per_share_basic_fq_h', label: 'EPS in Rs', type: 'number' },
  { key: 'nonperf_loans_loans_gross_fq_h', label: 'Gross NPA %', type: 'percentage' },
  { key: 'calculated_net_npa', label: 'Net NPA %', type: 'percentage' }
];
```

#### Non-Banking Metrics Configuration
```typescript
const NON_BANKING_METRICS = [
  { key: 'revenue_fq_h', label: 'Sales +', type: 'currency' },
  { key: 'total_oper_expense_fq_h', label: 'Expenses +', type: 'currency' },
  { key: 'oper_income_fq_h', label: 'Operating Profit', type: 'currency' },
  { key: 'operating_margin_fq_h', label: 'OPM %', type: 'percentage' },
  { key: 'non_oper_income_fq_h', label: 'Other Income +', type: 'currency' },
  { key: 'non_oper_interest_income_fq_h', label: 'Interest', type: 'currency' },
  { key: 'depreciation_fq_h', label: 'Depreciation', type: 'currency' },
  { key: 'pretax_income_fq_h', label: 'Profit before tax', type: 'currency' },
  { key: 'tax_rate_fq_h', label: 'Tax %', type: 'percentage' },
  { key: 'net_income_fq_h', label: 'Net Profit +', type: 'currency' },
  { key: 'earnings_per_share_basic_fq_h', label: 'EPS in Rs', type: 'number' },
  { key: 'quarterly_report_pdf', label: 'Raw PDF', type: 'link' }
];
```

### 3. Company Type Detection Logic

```typescript
function detectCompanyType(sector: string, companyData: any): 'banking' | 'non-banking' {
  // Primary detection via sector
  const bankingSectors = [
    'Banks', 'Banking', 'Financial Services', 
    'Private Sector Bank', 'Public Sector Bank'
  ];
  
  if (bankingSectors.some(s => sector?.toLowerCase().includes(s.toLowerCase()))) {
    return 'banking';
  }
  
  // Secondary detection via available fields
  const bankingFields = ['interest_income_fq_h', 'total_deposits_fq_h', 'nonperf_loans_fq_h'];
  const hasBankingFields = bankingFields.some(field => companyData[field]);
  
  return hasBankingFields ? 'banking' : 'non-banking';
}
```

## Data Models

### 1. API Response Structure

```typescript
interface InsightSentryResponse {
  // Quarterly historical arrays (up to 32 quarters)
  revenue_fq_h?: number[];
  total_revenue_fq_h?: number[];
  interest_income_fq_h?: number[];
  net_income_fq_h?: number[];
  operating_margin_fq_h?: number[];
  net_interest_margin_fq_h?: number[];
  earnings_per_share_basic_fq_h?: number[];
  nonperf_loans_loans_gross_fq_h?: number[];
  
  // Quarter metadata
  quarters_info?: {
    dates: string[];
    periods: string[];
  };
  
  // Company metadata
  sector?: string;
  industry?: string;
  company_type?: string;
}
```

### 2. Processed Data Structure

```typescript
interface ProcessedQuarterlyData {
  quarters: QuarterInfo[];
  rows: MetricRow[];
  companyType: 'banking' | 'non-banking';
  hasProductSegments: boolean;
  lastUpdated: string;
}

interface MetricRow {
  label: string;
  values: FormattedValue[];
  rawValues: (number | null)[];
  type: MetricType;
}

interface FormattedValue {
  display: string;
  raw: number | null;
  isNegative?: boolean;
  isZero?: boolean;
}
```

## Error Handling

### 1. API Error Scenarios
- **Network Failure**: Display retry button with exponential backoff
- **Invalid Symbol**: Show "Company not found" message
- **Partial Data**: Display available quarters with missing data indicators
- **Rate Limiting**: Queue requests and show loading state

### 2. Data Validation
- **Missing Quarters**: Fill gaps with null values and appropriate indicators
- **Invalid Numbers**: Convert to null and display "N/A"
- **Inconsistent Data**: Log warnings and use fallback values

### 3. Error UI Components
```typescript
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
  variant: 'network' | 'not-found' | 'partial-data';
}
```

## Testing Strategy

### 1. Unit Tests
- **Metric Configuration**: Test banking vs non-banking metric selection
- **Data Processing**: Test quarterly data transformation and formatting
- **Company Type Detection**: Test sector-based and field-based detection
- **Error Handling**: Test various error scenarios and recovery

### 2. Integration Tests
- **API Integration**: Test with real InsightSentry API responses
- **Component Integration**: Test within stock detail page context
- **Responsive Behavior**: Test table scrolling and mobile layout

### 3. Test Data Sets
```typescript
const TEST_BANKING_DATA = {
  symbol: 'HDFCBANK',
  sector: 'Private Sector Bank',
  mockResponse: { /* banking API response */ }
};

const TEST_NON_BANKING_DATA = {
  symbol: 'HINDUNILVR',
  sector: 'Consumer Goods',
  mockResponse: { /* non-banking API response */ }
};
```

## Implementation Details

### 1. Data Fetching Strategy
```typescript
// Custom hook for quarterly data
function useQuarterlyData(symbol: string) {
  const [data, setData] = useState<ProcessedQuarterlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetchQuarterlyData(symbol)
      .then(processQuarterlyData)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [symbol]);
  
  return { data, loading, error, refetch };
}
```

### 2. Responsive Table Implementation
```typescript
// Horizontal scrolling with sticky headers
const TableContainer = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  table {
    min-width: 800px;
    
    th:first-child,
    td:first-child {
      position: sticky;
      left: 0;
      background: white;
      z-index: 1;
    }
  }
  
  @media (max-width: 768px) {
    table {
      font-size: 0.875rem;
    }
  }
`;
```

### 3. Number Formatting Utilities
```typescript
function formatCurrency(value: number | null, unit: string = 'crores'): string {
  if (value === null || value === undefined) return 'N/A';
  
  // Convert to crores for Indian companies
  const crores = value / 10000000;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(crores);
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}
```

### 4. Performance Optimizations
- **Memoization**: Use React.memo for table rows to prevent unnecessary re-renders
- **Virtual Scrolling**: Implement for companies with extensive historical data
- **Lazy Loading**: Load additional quarters on demand
- **Caching**: Cache processed data to avoid re-computation

## Integration Points

### 1. Stock Detail Page Integration
```typescript
// In stock/[symbol]/page.tsx
<QuarterlyResultsSection 
  symbol={params.symbol}
  companyName={companyData.name}
  sector={companyData.sector}
  className="mt-8"
/>
```

### 2. API Service Integration
```typescript
// Extend existing api.ts
export async function fetchQuarterlyData(symbol: string): Promise<QuarterlyData> {
  const fields = [
    ...BANKING_FIELDS,
    ...NON_BANKING_FIELDS,
    'quarters_info'
  ];
  
  const response = await fetch(`/api/company/${symbol}?fields=${fields.join(',')}`);
  return response.json();
}
```

### 3. Styling Integration
- Use existing Tailwind classes for consistency
- Follow established color scheme (green for positive, red for negative)
- Maintain typography hierarchy with other page sections

## Security Considerations

### 1. Data Sanitization
- Sanitize all API responses before rendering
- Validate numeric values and handle edge cases
- Escape any user-generated content in error messages

### 2. API Security
- Implement rate limiting for API calls
- Use environment variables for API keys
- Add request timeout and retry logic

### 3. Client-Side Security
- Prevent XSS through proper data handling
- Validate props and state before rendering
- Handle malicious or malformed API responses gracefully