# Design Document

## Overview

The stock detail page will be a comprehensive, single-page application that displays detailed information about individual stocks. It will be built as a Next.js dynamic route at `/stock/[symbol]` and will leverage the existing API infrastructure while extending it with additional endpoints for detailed stock information.

The page will follow a responsive, mobile-first design approach similar to modern financial platforms like Screener.in, MoneyControl, and TradingView, providing both novice and advanced investors with the information they need to make informed decisions.

## Architecture

### Route Structure
- **Primary Route**: `/stock/[symbol]` - Dynamic route for individual stock pages
- **API Endpoints**: 
  - Existing: `/api/charts/[symbol]` - Chart data
  - Existing: `/api/stocks` - Stock search and basic data
  - New: `/api/stocks/[symbol]` - Detailed stock information
  - New: `/api/stocks/[symbol]/news` - Stock-specific news
  - New: `/api/stocks/[symbol]/peers` - Peer comparison data

### Data Flow
1. **Page Load**: Extract symbol from URL parameters
2. **Data Fetching**: Parallel requests to multiple APIs for comprehensive data
3. **Error Handling**: Graceful fallbacks for missing or invalid data
4. **Real-time Updates**: Optional WebSocket connection for live price updates
5. **Caching**: Client-side caching for performance optimization

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Charts**: Recharts library (already in use)
- **State Management**: React hooks with context for complex state
- **API Integration**: Fetch API with error handling and retries
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Components and Interfaces

### Core Components

#### 1. StockDetailPage Component
```typescript
interface StockDetailPageProps {
  params: { symbol: string };
}

interface StockDetailData extends StockData {
  // Extended fields for detail view
  sector: string;
  industry: string;
  employees?: number;
  website?: string;
  description?: string;
  // Financial ratios
  debt_to_equity?: number;
  current_ratio?: number;
  quick_ratio?: number;
  // Valuation metrics
  price_to_sales?: number;
  enterprise_value?: number;
  ev_to_ebitda?: number;
  // Performance metrics
  return_1_week?: number;
  return_1_month?: number;
  return_3_months?: number;
  return_6_months?: number;
  return_1_year?: number;
  return_3_years?: number;
  return_5_years?: number;
  // Volatility and risk
  volatility_1_month?: number;
  volatility_1_year?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
}
```

#### 2. StockHeader Component
- Displays stock name, symbol, current price, and day's change
- Market status indicator (open/closed)
- Add to watchlist functionality
- Share and alert buttons

#### 3. StockMetrics Component
- Key financial ratios in a grid layout
- Color-coded indicators for good/bad values
- Tooltips explaining each metric
- Responsive design for mobile

#### 4. StockChart Component (Enhanced)
- Extends existing StockChart component
- Additional technical indicators
- Volume overlay
- Comparison with benchmark indices
- Full-screen mode

#### 5. StockNews Component
- Recent news articles related to the stock
- Sentiment analysis indicators
- Source attribution
- Infinite scroll for older news

#### 6. PeerComparison Component
- Side-by-side comparison with sector peers
- Key metrics comparison table
- Visual charts for relative performance

#### 7. FinancialResults Component
- Quarterly and annual results
- Revenue, profit, and margin trends
- Interactive charts for financial data

#### 8. CorporateActions Component
- Dividend history and upcoming dividends
- Stock splits, bonuses, and rights issues
- Ex-dividend dates and record dates

### Layout Structure

```
StockDetailPage
├── StockHeader
├── StockMetrics
├── Tabs
│   ├── Overview Tab
│   │   ├── StockChart (Enhanced)
│   │   ├── KeyMetrics Grid
│   │   └── RecentNews
│   ├── Financials Tab
│   │   ├── FinancialResults
│   │   └── FinancialCharts
│   ├── Technical Tab
│   │   ├── AdvancedChart
│   │   └── TechnicalIndicators
│   ├── Peers Tab
│   │   └── PeerComparison
│   └── News Tab
│       └── StockNews (Full)
└── Footer
```

## Data Models

### Extended Stock Data Interface
```typescript
interface DetailedStockData extends StockData {
  // Company Information
  sector: string;
  industry: string;
  employees?: number;
  website?: string;
  description?: string;
  headquarters?: string;
  founded?: string;
  
  // Financial Health
  debt_to_equity?: number;
  current_ratio?: number;
  quick_ratio?: number;
  interest_coverage?: number;
  
  // Valuation Metrics
  price_to_sales?: number;
  enterprise_value?: number;
  ev_to_ebitda?: number;
  ev_to_sales?: number;
  
  // Profitability
  gross_margin?: number;
  operating_margin?: number;
  net_margin?: number;
  
  // Efficiency
  asset_turnover?: number;
  inventory_turnover?: number;
  receivables_turnover?: number;
  
  // Growth Rates
  revenue_growth_1y?: number;
  revenue_growth_3y?: number;
  earnings_growth_1y?: number;
  earnings_growth_3y?: number;
  
  // Performance Returns
  return_1_week?: number;
  return_1_month?: number;
  return_3_months?: number;
  return_6_months?: number;
  return_1_year?: number;
  return_3_years?: number;
  return_5_years?: number;
  
  // Risk Metrics
  volatility_1_month?: number;
  volatility_1_year?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  
  // Dividend Information
  dividend_frequency?: 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Monthly';
  last_dividend_date?: string;
  next_dividend_date?: string;
  dividend_growth_rate?: number;
  
  // Trading Information
  average_volume_30d?: number;
  shares_outstanding?: number;
  float_shares?: number;
  insider_ownership?: number;
  institutional_ownership?: number;
}
```

### News Article Interface
```typescript
interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevance_score?: number;
  image_url?: string;
}
```

### Peer Comparison Interface
```typescript
interface PeerStock {
  symbol: string;
  name: string;
  market_cap: number;
  pe_ratio?: number;
  pb_ratio?: number;
  dividend_yield?: number;
  roe?: number;
  debt_to_equity?: number;
  return_1_year?: number;
}
```

## Error Handling

### Error States
1. **Invalid Symbol**: Display "Stock not found" with search suggestions
2. **API Failures**: Show cached data with "Data may be outdated" warning
3. **Network Issues**: Retry mechanism with exponential backoff
4. **Partial Data**: Display available information with placeholders for missing data

### Fallback Strategies
1. **Primary API Failure**: Use secondary data sources
2. **Chart Data Missing**: Show basic price information
3. **News Unavailable**: Hide news section gracefully
4. **Peer Data Missing**: Show sector information only

### Loading States
- Skeleton loaders for each component section
- Progressive loading of non-critical data
- Smooth transitions between loading and loaded states

## Testing Strategy

### Unit Tests
- Component rendering with various data states
- Utility functions for data formatting
- API response parsing and error handling
- Calculation functions for derived metrics

### Integration Tests
- API endpoint functionality
- Data flow from API to components
- Error handling scenarios
- Mobile responsiveness

### End-to-End Tests
- Complete user journey from stock search to detail page
- Navigation between different tabs
- Chart interactions and timeframe changes
- Watchlist functionality

### Performance Tests
- Page load times with various data sizes
- Chart rendering performance
- Memory usage during extended browsing
- API response time monitoring

## Responsive Design

### Breakpoints
- **Mobile**: < 768px - Single column layout, collapsible sections
- **Tablet**: 768px - 1024px - Two column layout for metrics
- **Desktop**: > 1024px - Full multi-column layout with sidebar

### Mobile Optimizations
- Touch-friendly chart interactions
- Swipeable tabs for navigation
- Collapsible metric sections
- Optimized font sizes and spacing
- Reduced data density for readability

### Performance Considerations
- Lazy loading of non-critical components
- Image optimization for news articles
- Code splitting for tab content
- Efficient re-rendering strategies

## Accessibility

### WCAG Compliance
- Proper heading hierarchy (h1, h2, h3)
- Alt text for all images and charts
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### Interactive Elements
- Focus indicators for all interactive elements
- ARIA labels for complex components
- Semantic HTML structure
- Skip navigation links

## Security Considerations

### Data Protection
- Input sanitization for symbol parameters
- XSS prevention in news content
- CSRF protection for API endpoints
- Rate limiting for API calls

### API Security
- API key management
- Request validation
- Error message sanitization
- Secure data transmission

## Caching Strategy

### Client-Side Caching
- React Query for API response caching
- LocalStorage for user preferences
- SessionStorage for temporary data
- Service Worker for offline functionality

### Cache Invalidation
- Time-based expiration for price data (5 minutes)
- Event-based invalidation for news (30 minutes)
- Manual refresh options for users
- Background updates for critical data

## Monitoring and Analytics

### Performance Monitoring
- Page load time tracking
- API response time monitoring
- Error rate tracking
- User interaction analytics

### Business Metrics
- Most viewed stocks
- Feature usage statistics
- User engagement metrics
- Conversion tracking for watchlist additions