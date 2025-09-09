# Implementation Plan

- [x] 1. Set up component structure and TypeScript interfaces


  - Create the quarterly results component directory structure
  - Define TypeScript interfaces for quarterly data, metrics, and component props
  - Set up barrel exports for clean imports
  - _Requirements: 1.1, 4.1_



- [ ] 2. Create data processing utilities and company type detection
  - Implement company type detection logic (banking vs non-banking)
  - Create metric configuration objects for banking and non-banking companies
  - Build data transformation utilities to process API responses into component-ready format
  - Write number formatting utilities for currency, percentages, and regular numbers


  - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [ ] 3. Implement API integration and data fetching
  - Extend existing API service to fetch quarterly data from InsightSentry API
  - Create custom React hook for quarterly data fetching with loading and error states


  - Implement proper error handling for network failures and invalid responses
  - Add data caching mechanism to improve performance
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Build the main QuarterlyResultsTable component


  - Create the main component that orchestrates data fetching and rendering
  - Implement automatic company type detection and metric selection
  - Add loading state with skeleton UI
  - Implement error state with retry functionality
  - _Requirements: 1.1, 1.2, 4.2, 7.1_

- [ ] 5. Create banking-specific metrics table component
  - Build BankingMetricsTable component with banking-specific rows
  - Implement proper labeling (Financing Profit, Interest, etc.)
  - Add support for NPA percentages and banking ratios
  - Include proper formatting for banking-specific metrics
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Create non-banking metrics table component


  - Build NonBankingMetricsTable component with traditional business metrics
  - Implement standard business terminology (Sales, Operating Profit, etc.)
  - Add support for Raw PDF links when available
  - Include OPM% and other non-banking specific calculations
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Implement responsive table layout and mobile optimization
  - Create responsive table container with horizontal scrolling
  - Implement sticky column headers for metric names
  - Add touch-friendly interactions for mobile devices
  - Optimize font sizes and spacing for different screen sizes
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 8. Add quarter header and data organization
  - Implement quarter header generation with proper date formatting
  - Add reverse chronological ordering (most recent first)
  - Create quarter info display with clear year indicators
  - Handle quarter spanning across multiple years
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 9. Implement data formatting and visual indicators
  - Add consistent monetary value formatting (Rs. Crores)
  - Implement percentage formatting with appropriate decimal places
  - Add visual indicators for negative values and missing data
  - Create alternating row colors for better readability
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Add product segments integration
  - Implement product segments button/link in the header
  - Add conditional rendering based on segment data availability
  - Create placeholder for future segment data integration
  - Handle cases where segment data is unavailable
  - _Requirements: 6.1, 6.2, 6.3, 6.4_




- [ ] 11. Integrate component into stock detail page
  - Add QuarterlyResultsSection to the stock detail page layout
  - Ensure consistent styling with existing page components
  - Test integration with different company types
  - Verify proper data flow from page to component
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 12. Write comprehensive tests for the component
  - Create unit tests for data processing utilities and company type detection
  - Write integration tests for API data fetching and error handling
  - Add component tests for both banking and non-banking metric displays
  - Test responsive behavior and mobile interactions
  - _Requirements: 7.4, 8.4_

- [ ] 13. Add error handling and edge case management
  - Implement graceful handling of missing or partial quarterly data
  - Add proper error messages for different failure scenarios
  - Create fallback displays for companies with insufficient data
  - Test and handle API rate limiting and timeout scenarios
  - _Requirements: 1.4, 7.2, 7.3_

- [ ] 14. Performance optimization and final polish
  - Implement React.memo for table rows to prevent unnecessary re-renders
  - Add loading skeletons that match the final table structure
  - Optimize bundle size by code splitting if necessary
  - Add proper accessibility attributes for screen readers
  - _Requirements: 7.4, 8.3_