# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

BullScreen is a Next.js-based Indian stock market screener application that provides real-time stock data, financial metrics, and analysis tools for NSE/BSE stocks. The application uses the InsightSentry API via RapidAPI for fetching stock market data.

## Commands

### Development
```bash
# Start development server with Turbopack
npm run dev

# Start development server on specific port
npm run dev -- --port 3001
```

### Build & Production
```bash
# Build the application for production
npm run build

# Start production server (after build)
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for specific file/pattern
npm test -- --testPathPattern=currency
npm test -- --testPathPattern=banking-mapper
```

### Code Quality
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.4.6 with App Router
- **UI Components**: Custom components using Radix UI primitives
- **Styling**: Tailwind CSS with class-variance-authority
- **Data Visualization**: Recharts for financial charts
- **Language**: TypeScript with strict mode
- **Testing**: Jest with Testing Library

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   │   ├── stocks/        # Stock listing and search
│   │   ├── balancesheet/  # Balance sheet data endpoints
│   │   ├── charts/        # Chart data endpoints
│   │   └── quarterly/     # Quarterly results endpoints
│   ├── stock/[symbol]/    # Dynamic stock detail pages
│   └── page.tsx           # Home page with stock search
├── components/            # React components
│   ├── ui/               # Reusable UI components (Button, Card, etc.)
│   ├── BalanceSheet/     # Balance sheet display components
│   ├── QuarterlyResults/ # Quarterly results components
│   └── StockChart.tsx    # Stock price chart component
└── lib/                  # Core business logic
    ├── api.ts            # API client for stock data
    ├── currency.ts       # Currency conversion utilities
    └── data-mappers/     # Data transformation layer
        ├── banking-mapper.ts      # Banking sector specific mapping
        ├── financial-data-mapper.ts # Financial metrics mapping
        └── company-type-detector.ts # Detects company type from data
```

### Data Flow Architecture

1. **API Layer** (`/api/*`): Next.js API routes that fetch data from InsightSentry API using RapidAPI credentials
2. **Data Mappers** (`/lib/data-mappers/*`): Transform raw API responses into domain-specific formats, especially for banking/financial companies
3. **Client Components**: React components consume data via the internal API layer
4. **State Management**: Local component state with React hooks

### Key Data Models

- **StockData**: Core stock information (price, volume, market cap, change)
- **QuarterlyDataResponse**: Historical quarterly financial data (up to 32 quarters)
- **ScreenerResponse**: Paginated stock listing with filtering capabilities

### API Integration

The app integrates with InsightSentry API for:
- Real-time stock prices and market data
- Historical financial statements (P&L, Balance Sheet, Cash Flow)
- Banking-specific metrics (NPA, NIM, CASA ratios)
- Up to 20 years of annual data and 8 years of quarterly data

### Environment Variables

Required in `.env.local`:
```
RAPIDAPI_KEY=<your_rapidapi_key>
```

## Key Architectural Decisions

### Data Mapping Strategy
The application uses a sophisticated data mapping layer (`/lib/data-mappers/`) that:
- Detects company type (Banking, Manufacturing, Services) automatically
- Applies sector-specific field mappings for accurate financial data representation
- Handles banking-specific metrics like GNPA, NNPA, NIM
- Provides fallback values and error handling for missing data

### Currency Handling
- All monetary values are converted to INR for Indian stocks
- Market cap formatting uses Crores (Cr) and Lakhs (L) notation
- Support for USD conversion when needed

### Testing Strategy
- Unit tests for all data mappers and utilities
- Integration tests for complete data transformation pipeline
- Jest configuration with TypeScript support

## Performance Considerations

- Uses Next.js Turbopack for faster development builds
- Client-side caching for stock data
- Pagination for large stock lists
- Lazy loading for chart components

## Data Sources

The application primarily serves Indian stock market data from NSE/BSE, with special focus on:
- NIFTY 50 index constituents
- Banking and financial services companies
- Real-time price updates during market hours

## Error Handling

- Fallback mock data when API is unavailable
- Graceful degradation for missing financial metrics
- User-friendly error states with retry options
