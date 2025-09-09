# Requirements Document

## Introduction

This feature focuses on creating a robust data mapping and rendering system that can handle complex nested API responses from the InsightSentry API. The system needs to dynamically map financial data fields according to predefined mapping configurations for both banking and non-banking companies, and render this data in appropriate UI components with proper formatting and historical data support.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a flexible data mapping system that can transform complex nested API responses into structured data objects, so that I can easily work with financial data regardless of the API's complex structure.

#### Acceptance Criteria

1. WHEN the system receives a nested API response THEN it SHALL extract relevant financial fields based on predefined mapping configurations
2. WHEN mapping data THEN the system SHALL support both current values and historical arrays for each metric
3. WHEN processing banking data THEN the system SHALL use banking-specific field mappings from hdfc-bank-data-mapping.md
4. WHEN processing non-banking data THEN the system SHALL use general financial field mappings from historical_data_mapping.md
5. WHEN a field is not available in the API response THEN the system SHALL handle missing data gracefully with appropriate fallback values

### Requirement 2

**User Story:** As a user, I want to see financial data rendered dynamically based on the company type (banking vs non-banking), so that I can view relevant metrics for each type of financial institution.

#### Acceptance Criteria

1. WHEN viewing a banking company THEN the system SHALL display banking-specific metrics like GNPA, NNPA, Net Interest Margin, and Deposits
2. WHEN viewing a non-banking company THEN the system SHALL display standard financial metrics like Revenue, Operating Profit, and EBITDA
3. WHEN displaying metrics THEN the system SHALL format currency values appropriately (in Crores/Lakhs)
4. WHEN showing percentage values THEN the system SHALL display them with appropriate decimal places
5. WHEN data is unavailable THEN the system SHALL show "N/A" or appropriate placeholder text

### Requirement 3

**User Story:** As a user, I want to view historical data trends for financial metrics, so that I can analyze the company's performance over time.

#### Acceptance Criteria

1. WHEN historical data is available THEN the system SHALL display data for up to 20 years for annual metrics
2. WHEN quarterly data is available THEN the system SHALL display data for up to 32 quarters (8 years)
3. WHEN displaying historical data THEN the system SHALL show trends with proper time series formatting
4. WHEN historical arrays contain null values THEN the system SHALL handle them gracefully without breaking the display
5. WHEN calculating growth rates THEN the system SHALL compute year-over-year and quarter-over-quarter changes

### Requirement 4

**User Story:** As a user, I want the financial data to be organized into logical sections (P&L, Balance Sheet, Cash Flow, Ratios), so that I can easily navigate and understand different aspects of the company's financials.

#### Acceptance Criteria

1. WHEN displaying financial data THEN the system SHALL organize metrics into Profit & Loss, Balance Sheet, Cash Flow, and Key Ratios sections
2. WHEN showing each section THEN the system SHALL group related metrics together logically
3. WHEN a section has no available data THEN the system SHALL either hide the section or show an appropriate message
4. WHEN displaying metrics within sections THEN the system SHALL maintain consistent formatting and layout
5. WHEN metrics have sub-categories THEN the system SHALL display them in a hierarchical structure

### Requirement 5

**User Story:** As a developer, I want a type-safe data transformation system, so that I can ensure data integrity and catch mapping errors at compile time.

#### Acceptance Criteria

1. WHEN defining data mappings THEN the system SHALL use TypeScript interfaces for type safety
2. WHEN transforming API data THEN the system SHALL validate data types and structures
3. WHEN mapping fails THEN the system SHALL provide clear error messages indicating which fields failed
4. WHEN adding new metrics THEN the system SHALL enforce proper typing for new field mappings
5. WHEN processing arrays THEN the system SHALL handle both single values and array structures safely

### Requirement 6

**User Story:** As a user, I want the system to automatically detect company type and apply appropriate data mappings, so that I don't need to manually specify whether a company is banking or non-banking.

#### Acceptance Criteria

1. WHEN processing company data THEN the system SHALL automatically detect if it's a banking company based on available metrics
2. WHEN banking-specific fields are present THEN the system SHALL apply banking data mappings
3. WHEN only general financial fields are present THEN the system SHALL apply non-banking data mappings
4. WHEN company type detection fails THEN the system SHALL default to non-banking mappings with appropriate warnings
5. WHEN switching between company types THEN the system SHALL update the display dynamically without page reload