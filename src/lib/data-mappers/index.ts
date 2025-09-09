// Data Mappers - Main Export File
export { BaseDataMapper } from './base-mapper';
export { BankingDataMapper } from './banking-mapper';
export { NonBankingDataMapper } from './non-banking-mapper';
export { 
  DataTransformationUtils,
  CurrencyFormatter,
  PercentageFormatter,
  RatioFormatter,
  NullValueHandler
} from './data-transformation-utils';
export { CompanyTypeDetector, detectCompanyType } from './company-type-detector';
export { FinancialDataMapper, financialDataMapper } from './financial-data-mapper';
export { DataMappingErrorHandler, errorHandler, ErrorSeverity } from './error-handler';
export { 
  BANKING_MAPPING_CONFIG, 
  NON_BANKING_MAPPING_CONFIG,
  getMappingConfig,
  getAllFieldMappings,
  getRequiredFieldMappings,
  getFieldMappingByApiField
} from './mapping-configs';
export { ApiResponseParser, parseNestedApiResponse, extractHistoricalData } from '../api-parser';
export { 
  HistoricalDataProcessor,
  type HistoricalDataConfig,
  type GrowthCalculation,
  type HistoricalProcessingResult
} from './historical-data-processor';

// Re-export types for convenience
export type {
  FinancialMetric,
  FinancialSection,
  CompanyFinancialData,
  MappingConfig,
  FieldMapping,
  MappingError,
  MappingErrorType,
  DataMappingResult,
  RawApiDataPoint,
  RawInsightSentryResponse,
  CompanyType
} from '../../components/QuarterlyResults/types';

export type { CompanyTypeDetectionResult } from './company-type-detector';
export type { CurrencyUnit, PercentageFormat, RatioFormat } from './data-transformation-utils';
export type { EnhancedMappingError, ErrorAggregationResult } from './error-handler';