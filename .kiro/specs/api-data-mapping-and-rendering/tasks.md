# Implementation Plan

- [x] 1. Update core data interfaces and types for actual API structure





  - Update existing types to handle the complex nested API response structure (id, name, category, type, period, value)
  - Extend FinancialMetric interface to support both current values and historical arrays
  - Create mapping configuration interfaces that work with the actual API field structure
  - Define error types and company type enums compatible with existing code
  - _Requirements: 1.2, 5.1, 5.2_

- [x] 1.1 Create API response parser for nested structure


  - Create utility to parse the complex nested API response into a flat structure
  - Handle extraction of both current values and historical arrays from nested objects
  - Support both annual (_fy_h) and quarterly (_fq_h) historical data
  - Maintain compatibility with existing quarterly results processing
  - _Requirements: 1.1, 1.5_

- [x] 2. Extend existing mapping configuration for comprehensive data





  - [x] 2.1 Enhance banking mapping configuration


    - Extend existing BANKING_METRICS config to include annual data fields from hdfc-bank-data-mapping.md
    - Add banking-specific sections (Interest Income, Deposits, Asset Quality, Loans) with both FY and FQ data
    - Update calculation functions for derived metrics (Net NPA, CASA ratio, etc.) to work with actual API structure
    - _Requirements: 1.3, 2.1_



  - [x] 2.2 Enhance non-banking mapping configuration  





    - Extend existing NON_BANKING_METRICS config to include annual data fields from historical_data_mapping.md
    - Add comprehensive financial sections (P&L, Balance Sheet, Cash Flow, Ratios) with both FY and FQ data
    - Update standard financial calculations to work with nested API response structure
    - _Requirements: 1.4, 2.2_

- [-] 3. Implement company type detection system



  - [x] 3.1 Create CompanyTypeDetector class


    - Implement banking company detection logic based on presence of banking-specific fields
    - Add fallback logic for ambiguous cases
    - Include confidence scoring for detection accuracy
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 3.2 Add detection validation and testing





    - Write unit tests for various company types
    - Test edge cases and fallback scenarios
    - Validate detection accuracy with real data samples
    - _Requirements: 6.3, 6.5_

- [x] 4. Create base data mapper infrastructure





  - [x] 4.1 Implement BaseDataMapper abstract class


    - Create extractMetric method for individual field processing
    - Implement extractHistoricalData method for array handling
    - Add error handling and validation logic
    - _Requirements: 1.1, 1.5, 5.3_



  - [x] 4.2 Add data transformation utilities





    - Create utility functions for currency formatting
    - Implement percentage and ratio formatting
    - Add null value handling and fallback logic
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 5. Implement banking-specific data mapper





  - [x] 5.1 Create BankingDataMapper class


    - Extend BaseDataMapper with banking-specific logic
    - Implement banking metric calculations (Net NPA, CASA ratio, etc.)
    - Handle banking-specific historical data arrays
    - _Requirements: 1.3, 2.1, 3.1_

  - [x] 5.2 Add banking data validation


    - Validate required banking fields are present
    - Implement banking-specific error handling
    - Add logging for missing critical banking metrics
    - _Requirements: 1.5, 5.3, 5.4_

- [x] 6. Implement non-banking data mapper





  - [x] 6.1 Create NonBankingDataMapper class


    - Extend BaseDataMapper with standard financial logic
    - Implement standard financial calculations (margins, ratios, etc.)
    - Handle standard historical data processing
    - _Requirements: 1.4, 2.2, 3.2_



  - [x] 6.2 Add non-banking data validation






    - Validate standard financial fields
    - Implement fallback calculations for missing data
    - Add comprehensive error reporting
    - _Requirements: 1.5, 5.3, 5.4_

- [x] 7. Create main data mapping orchestrator





  - [x] 7.1 Implement FinancialDataMapper class


    - Integrate company type detection with appropriate mapper selection
    - Handle mapper switching and data transformation
    - Implement caching for processed data
    - _Requirements: 6.1, 6.5, 1.1_

  - [x] 7.2 Add comprehensive error handling


    - Implement error aggregation and reporting
    - Add retry logic for failed mappings
    - Create detailed error messages for debugging
    - _Requirements: 5.3, 5.4, 1.5_

- [x] 8. Implement historical data processing





  - [x] 8.1 Create HistoricalDataProcessor class


    - Handle historical arrays up to 20 years for annual data
    - Process quarterly arrays up to 32 quarters
    - Implement null value handling in historical arrays
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 8.2 Add growth calculation utilities


    - Implement year-over-year growth calculations
    - Add quarter-over-quarter growth calculations
    - Handle edge cases with missing historical data
    - _Requirements: 3.5, 3.4_

- [-] 9. Create dynamic rendering components



  - [ ] 9.1 Implement SectionRenderer component



    - Create dynamic section rendering based on company type
    - Handle section visibility based on data availability
    - Implement consistent section layout and styling
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 9.2 Implement MetricRenderer component
    - Create dynamic metric display with proper formatting
    - Handle different metric types (currency, percentage, ratio)
    - Implement hierarchical metric display for subsections
    - _Requirements: 4.4, 4.5, 2.3, 2.4_

- [ ] 10. Add comprehensive testing suite
  - [ ] 10.1 Create unit tests for data mappers
    - Test field extraction with various data types
    - Test historical data processing
    - Test error handling and edge cases
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 10.2 Create integration tests
    - Test end-to-end data mapping flow
    - Test company type detection with real data
    - Test rendering with mapped data
    - _Requirements: 1.1, 6.1, 2.1, 2.2_

- [ ] 11. Implement performance optimizations
  - [ ] 11.1 Add data caching and memoization
    - Implement processed data caching
    - Add memoization for expensive calculations
    - Create cache invalidation strategies
    - _Requirements: 1.1, 3.1_

  - [ ] 11.2 Optimize large data processing
    - Implement chunked processing for large historical arrays
    - Add lazy loading for historical data
    - Optimize memory usage for large datasets
    - _Requirements: 3.1, 3.2_

- [ ] 12. Update existing API integration layer
  - [ ] 12.1 Enhance quarterly results API endpoint
    - Update existing /api/quarterly/[symbol]/route.ts to handle the complex nested API response structure
    - Modify data processing to extract both current values and historical arrays from nested objects
    - Enhance error handling for the new API structure while maintaining backward compatibility
    - _Requirements: 1.1, 1.5_

  - [ ] 12.2 Enhance existing quarterly results components
    - Update existing QuarterlyResults components to work with enhanced data mapping
    - Extend BankingMetricsTable and NonBankingMetricsTable to display additional metrics from comprehensive mapping
    - Maintain backward compatibility while adding new functionality
    - _Requirements: 2.1, 2.2, 4.1_

- [ ] 13. Add configuration validation and tooling
  - [ ] 13.1 Create mapping configuration validator
    - Validate mapping configurations at build time
    - Check for required fields and proper typing
    - Generate warnings for potential mapping issues
    - _Requirements: 5.1, 5.4_

  - [ ] 13.2 Add development tooling
    - Create debugging utilities for data mapping
    - Add configuration testing tools
    - Implement mapping coverage reports
    - _Requirements: 5.3, 5.4_