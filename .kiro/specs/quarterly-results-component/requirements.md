# Requirements Document

## Introduction

This feature will create a dynamic quarterly results component that displays comprehensive quarterly financial data for both banking and non-banking companies. The component will intelligently adapt its display based on the company type, showing banking-specific metrics (like Interest Income, Deposits, GNPA) for banks and traditional metrics (like Sales, Operating Profit) for non-banking companies. The data will be sourced from the InsightSentry API and rendered in a tabular format with historical quarterly data spanning multiple years.

## Requirements

### Requirement 1

**User Story:** As an investor, I want to view quarterly financial results in a structured table format, so that I can analyze a company's financial performance trends over time.

#### Acceptance Criteria

1. WHEN viewing a company's detail page THEN the system SHALL display a "Quarterly Results" section with tabular data
2. WHEN the quarterly results load THEN the system SHALL show data for at least 8-12 quarters (2-3 years) in chronological order
3. WHEN displaying quarterly data THEN the system SHALL format all financial figures in appropriate units (Rs. Crores for Indian companies)
4. WHEN no quarterly data is available THEN the system SHALL display an appropriate message indicating data unavailability

### Requirement 2

**User Story:** As an investor analyzing a banking company, I want to see banking-specific quarterly metrics, so that I can evaluate the bank's core business performance.

#### Acceptance Criteria

1. WHEN viewing quarterly results for a banking company THEN the system SHALL display banking-specific metrics including Revenue, Interest, Expenses, Financing Profit, Financing Margin %, Other Income, Depreciation, Profit before tax, Tax %, Net Profit, EPS, Gross NPA %, and Net NPA %
2. WHEN showing banking metrics THEN the system SHALL use appropriate labels (e.g., "Financing Profit" instead of "Operating Profit", "Interest" for interest income)
3. WHEN displaying NPA percentages THEN the system SHALL show both Gross NPA % and Net NPA % as separate rows
4. WHEN banking data includes margin percentages THEN the system SHALL display "Financing Margin %" with proper percentage formatting

### Requirement 3

**User Story:** As an investor analyzing a non-banking company, I want to see traditional quarterly business metrics, so that I can evaluate the company's operational performance.

#### Acceptance Criteria

1. WHEN viewing quarterly results for a non-banking company THEN the system SHALL display traditional metrics including Sales, Expenses, Operating Profit, OPM %, Other Income, Interest, Depreciation, Profit before tax, Tax %, Net Profit, EPS, and Raw PDF links
2. WHEN showing non-banking metrics THEN the system SHALL use standard business terminology (e.g., "Sales" for revenue, "Operating Profit" for operational earnings)
3. WHEN displaying operational margins THEN the system SHALL show "OPM %" (Operating Profit Margin) with proper percentage formatting
4. WHEN available THEN the system SHALL include Raw PDF download links for detailed quarterly reports

### Requirement 4

**User Story:** As an investor, I want the quarterly results to automatically detect the company type and display appropriate metrics, so that I don't have to manually select different views.

#### Acceptance Criteria

1. WHEN the component loads THEN the system SHALL automatically determine if the company is a bank or non-banking entity based on company data or sector information
2. WHEN company type is determined THEN the system SHALL render the appropriate metric set without user intervention
3. WHEN company type cannot be determined THEN the system SHALL default to non-banking metrics and log the uncertainty
4. WHEN switching between different companies THEN the system SHALL dynamically update the metric display based on each company's type

### Requirement 5

**User Story:** As an investor, I want to see quarterly data with proper formatting and visual hierarchy, so that I can easily scan and compare financial figures across quarters.

#### Acceptance Criteria

1. WHEN displaying quarterly results THEN the system SHALL format all monetary values consistently (e.g., 37,274 for Rs. 37,274 crores)
2. WHEN showing percentage values THEN the system SHALL display them with appropriate decimal places and % symbol
3. WHEN rendering the table THEN the system SHALL use alternating row colors or borders for better readability
4. WHEN displaying negative values THEN the system SHALL use appropriate visual indicators (parentheses or red color)

### Requirement 6

**User Story:** As an investor, I want to access additional product segment information, so that I can understand the company's business diversification.

#### Acceptance Criteria

1. WHEN quarterly results are displayed THEN the system SHALL provide a "PRODUCT SEGMENTS" button or link
2. WHEN the product segments option is available THEN the system SHALL indicate this with appropriate UI elements
3. WHEN product segment data exists THEN the system SHALL make it accessible through the quarterly results interface
4. IF product segment data is unavailable THEN the system SHALL hide or disable the segments option

### Requirement 7

**User Story:** As an investor, I want the quarterly results to load efficiently and handle API errors gracefully, so that I have a reliable experience when analyzing financial data.

#### Acceptance Criteria

1. WHEN loading quarterly results THEN the system SHALL display a loading indicator while fetching data from the InsightSentry API
2. WHEN API calls fail THEN the system SHALL display user-friendly error messages and provide retry options
3. WHEN data is partially available THEN the system SHALL display available quarters and indicate missing data appropriately
4. WHEN the component unmounts THEN the system SHALL cancel any pending API requests to prevent memory leaks

### Requirement 8

**User Story:** As a mobile user, I want the quarterly results table to be responsive and scrollable, so that I can view financial data effectively on smaller screens.

#### Acceptance Criteria

1. WHEN viewing quarterly results on mobile devices THEN the system SHALL make the table horizontally scrollable to accommodate all quarters
2. WHEN scrolling horizontally THEN the system SHALL keep metric names (row headers) visible as sticky columns
3. WHEN displaying on small screens THEN the system SHALL maintain readable font sizes and adequate spacing
4. WHEN interacting with the table on touch devices THEN the system SHALL provide smooth scrolling and touch-friendly interactions

### Requirement 9

**User Story:** As an investor, I want to see the most recent quarters first in the display, so that I can quickly access the latest financial performance data.

#### Acceptance Criteria

1. WHEN quarterly results are displayed THEN the system SHALL arrange quarters in reverse chronological order (most recent first)
2. WHEN new quarterly data becomes available THEN the system SHALL automatically include it in the leftmost position
3. WHEN displaying quarter headers THEN the system SHALL use clear date formatting (e.g., "Jun 2024", "Mar 2024")
4. WHEN quarters span multiple years THEN the system SHALL clearly indicate the year for each quarter

### Requirement 10

**User Story:** As an investor, I want the quarterly results to integrate seamlessly with the existing stock detail page, so that I have a cohesive analysis experience.

#### Acceptance Criteria

1. WHEN viewing a stock detail page THEN the quarterly results SHALL appear as a dedicated section within the page layout
2. WHEN the quarterly results section loads THEN it SHALL maintain consistent styling with other page components
3. WHEN quarterly results are displayed THEN they SHALL not interfere with other page functionality like charts or news
4. WHEN the page layout changes THEN the quarterly results SHALL adapt appropriately to maintain visual consistency