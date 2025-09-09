// Base Data Mapper Infrastructure
import { 
  FinancialMetric, 
  FinancialSection, 
  CompanyFinancialData, 
  MappingConfig, 
  FieldMapping,
  InsightSentryQuarterlyResponse,
  MappingError,
  MappingErrorType,
  DataMappingResult,
  CompanyType
} from '../../components/QuarterlyResults/types';
import { DataTransformationUtils } from './data-transformation-utils';
import { HistoricalDataProcessor, HistoricalProcessingResult } from './historical-data-processor';

/**
 * Abstract base class for data mappers
 */
export abstract class BaseDataMapper {
  protected config: MappingConfig;
  protected errors: MappingError[] = [];
  protected warnings: MappingError[] = [];
  protected historicalProcessor: HistoricalDataProcessor;

  constructor(config: MappingConfig) {
    this.config = config;
    this.historicalProcessor = new HistoricalDataProcessor();
  }

  /**
   * Abstract method to map API data to structured financial data
   */
  abstract mapData(apiResponse: InsightSentryQuarterlyResponse): DataMappingResult;

  /**
   * Extract a single metric from API response based on field mapping
   */
  protected extractMetric(
    apiResponse: InsightSentryQuarterlyResponse, 
    mapping: FieldMapping,
    sectionId: string,
    subsectionId?: string
  ): FinancialMetric | null {
    try {
      // Extract current value
      let currentValue: number | null = null;
      if (mapping.calculation) {
        currentValue = mapping.calculation(apiResponse);
      } else {
        const rawValue = apiResponse[mapping.apiField as keyof InsightSentryQuarterlyResponse];
        currentValue = typeof rawValue === 'number' ? rawValue : null;
      }

      // Extract historical values
      let historicalValues: (number | null)[] = [];
      if (mapping.historicalCalculation) {
        const calculated = mapping.historicalCalculation(apiResponse);
        historicalValues = calculated || [];
      } else if (mapping.historicalField) {
        const rawHistorical = apiResponse[mapping.historicalField as keyof InsightSentryQuarterlyResponse];
        historicalValues = Array.isArray(rawHistorical) ? rawHistorical : [];
      }

      // If no current value but have historical, use most recent historical
      if (currentValue === null && historicalValues.length > 0) {
        currentValue = this.getMostRecentValue(historicalValues);
      }

      // Validate required fields
      if (mapping.required && currentValue === null && historicalValues.length === 0) {
        this.errors.push({
          type: MappingErrorType.MISSING_REQUIRED_FIELD,
          field: mapping.apiField,
          message: `Required field '${mapping.displayName}' is missing or null`,
          context: {
            section: sectionId,
            subsection: subsectionId,
            companyType: this.config.companyType
          }
        });
        return null;
      }

      // Determine period from field name
      let period: 'FY' | 'FQ' | 'TTM' = 'FY';
      if (mapping.apiField.includes('_fq') || mapping.historicalField?.includes('_fq')) {
        period = 'FQ';
      } else if (mapping.apiField.includes('_ttm')) {
        period = 'TTM';
      }

      return {
        id: mapping.apiField,
        name: mapping.displayName,
        currentValue,
        historicalValues,
        unit: mapping.unit,
        category: mapping.category,
        period,
        section: sectionId,
        subsection: subsectionId
      };

    } catch (error) {
      this.errors.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: mapping.apiField,
        message: `Error extracting metric: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: {
          section: sectionId,
          subsection: subsectionId,
          companyType: this.config.companyType
        }
      });
      return null;
    }
  }

  /**
   * Extract historical data array from API response using HistoricalDataProcessor
   */
  protected extractHistoricalData(
    apiResponse: InsightSentryQuarterlyResponse, 
    field: string
  ): (number | null)[] {
    const rawData = apiResponse[field as keyof InsightSentryQuarterlyResponse];
    
    if (!Array.isArray(rawData)) {
      return [];
    }

    // Determine period type from field name
    const period: 'FY' | 'FQ' = field.includes('_fq') ? 'FQ' : 'FY';
    
    // Use HistoricalDataProcessor for enhanced processing
    const result: HistoricalProcessingResult = period === 'FY' 
      ? this.historicalProcessor.processAnnualData(rawData, field)
      : this.historicalProcessor.processQuarterlyData(rawData, field);

    // Merge errors and warnings from processor
    this.errors.push(...result.errors);
    this.warnings.push(...result.warnings);

    return result.processedData;
  }

  /**
   * Get the most recent non-null value from historical array
   */
  protected getMostRecentValue(historicalArray: (number | null)[]): number | null {
    for (const value of historicalArray) {
      if (value !== null && value !== undefined && !isNaN(value)) {
        return value;
      }
    }
    return null;
  }

  /**
   * Build financial sections from mapping configuration
   */
  protected buildSections(apiResponse: InsightSentryQuarterlyResponse): FinancialSection[] {
    const sections: FinancialSection[] = [];

    for (const [sectionId, sectionConfig] of Object.entries(this.config.sections)) {
      const sectionMetrics: FinancialMetric[] = [];
      const subsections: FinancialSection[] = [];

      // Process main section fields
      for (const fieldMapping of sectionConfig.fields) {
        const metric = this.extractMetric(apiResponse, fieldMapping, sectionId);
        if (metric) {
          sectionMetrics.push(metric);
        }
      }

      // Process subsections if they exist
      if (sectionConfig.subsections) {
        for (const [subsectionId, subsectionConfig] of Object.entries(sectionConfig.subsections)) {
          const subsectionMetrics: FinancialMetric[] = [];

          for (const fieldMapping of subsectionConfig.fields) {
            const metric = this.extractMetric(apiResponse, fieldMapping, sectionId, subsectionId);
            if (metric) {
              subsectionMetrics.push(metric);
            }
          }

          if (subsectionMetrics.length > 0) {
            subsections.push({
              id: subsectionId,
              name: subsectionConfig.name,
              metrics: subsectionMetrics
            });
          }
        }
      }

      // Only add section if it has metrics or subsections
      if (sectionMetrics.length > 0 || subsections.length > 0) {
        sections.push({
          id: sectionId,
          name: sectionConfig.name,
          metrics: sectionMetrics,
          subsections: subsections.length > 0 ? subsections : undefined
        });
      }
    }

    return sections;
  }

  /**
   * Validate API response has minimum required data
   */
  protected validateApiResponse(apiResponse: InsightSentryQuarterlyResponse): boolean {
    if (!apiResponse || typeof apiResponse !== 'object') {
      this.errors.push({
        type: MappingErrorType.INVALID_DATA_TYPE,
        field: 'root',
        message: 'API response is null or not an object'
      });
      return false;
    }

    // Check if at least some data exists
    const hasData = Object.keys(apiResponse).some(key => 
      apiResponse[key as keyof InsightSentryQuarterlyResponse] !== null &&
      apiResponse[key as keyof InsightSentryQuarterlyResponse] !== undefined
    );

    if (!hasData) {
      this.errors.push({
        type: MappingErrorType.INVALID_DATA_TYPE,
        field: 'root',
        message: 'API response contains no valid data'
      });
      return false;
    }

    return true;
  }

  /**
   * Calculate derived metrics (to be overridden by specific mappers)
   */
  protected calculateDerivedMetrics(apiResponse: InsightSentryQuarterlyResponse): void {
    // Base implementation - can be overridden by specific mappers
  }

  /**
   * Get maximum historical data length
   */
  protected getMaxHistoricalLength(apiResponse: InsightSentryQuarterlyResponse, period: 'FY' | 'FQ'): number {
    const suffix = period === 'FY' ? '_fy_h' : '_fq_h';
    const historicalFields = Object.keys(apiResponse).filter(key => key.endsWith(suffix));
    
    return Math.max(
      ...historicalFields.map(field => {
        const array = apiResponse[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
        return array?.length || 0;
      }),
      0
    );
  }

  /**
   * Reset error and warning arrays
   */
  protected resetErrors(): void {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Create successful mapping result
   */
  protected createSuccessResult(data: CompanyFinancialData): DataMappingResult {
    return {
      success: true,
      data,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  /**
   * Create failed mapping result
   */
  protected createFailureResult(): DataMappingResult {
    return {
      success: false,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }
}

