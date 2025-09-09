// Main Data Mapping Orchestrator
import { 
  CompanyFinancialData,
  InsightSentryQuarterlyResponse,
  DataMappingResult,
  CompanyType,
  MappingError,
  MappingErrorType
} from '../../components/QuarterlyResults/types';
import { CompanyTypeDetector, CompanyTypeDetectionResult } from './company-type-detector';
import { BankingDataMapper } from './banking-mapper';
import { NonBankingDataMapper } from './non-banking-mapper';
import { BANKING_MAPPING_CONFIG, NON_BANKING_MAPPING_CONFIG } from './mapping-configs';
import { DataMappingErrorHandler, ErrorAggregationResult } from './error-handler';

/**
 * Cache entry for processed data
 */
interface CacheEntry {
  data: CompanyFinancialData;
  timestamp: number;
  hash: string;
}

/**
 * Configuration for the FinancialDataMapper
 */
interface FinancialDataMapperConfig {
  cacheEnabled: boolean;
  cacheTTL: number; // Time to live in milliseconds
  maxCacheSize: number;
  fallbackCompanyType: CompanyType;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Main orchestrator for financial data mapping
 * Integrates company type detection with appropriate mapper selection
 */
export class FinancialDataMapper {
  private companyTypeDetector: CompanyTypeDetector;
  private bankingMapper: BankingDataMapper;
  private nonBankingMapper: NonBankingDataMapper;
  private cache: Map<string, CacheEntry>;
  private config: FinancialDataMapperConfig;
  private errorHandler: DataMappingErrorHandler;

  constructor(config?: Partial<FinancialDataMapperConfig>) {
    this.config = {
      cacheEnabled: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      maxCacheSize: 100,
      fallbackCompanyType: 'non-banking',
      enableRetry: true,
      maxRetries: 2,
      retryDelay: 1000,
      ...config
    };

    this.companyTypeDetector = new CompanyTypeDetector();
    this.bankingMapper = new BankingDataMapper();
    this.nonBankingMapper = new NonBankingDataMapper();
    this.cache = new Map();
    this.errorHandler = new DataMappingErrorHandler();
  }

  /**
   * Main method to map financial data with company type detection
   */
  public async mapFinancialData(
    symbol: string,
    apiResponse: InsightSentryQuarterlyResponse,
    sector?: string,
    industry?: string,
    forceCompanyType?: CompanyType
  ): Promise<DataMappingResult> {
    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cachedResult = this.getCachedData(symbol, apiResponse);
        if (cachedResult) {
          return {
            success: true,
            data: cachedResult,
            errors: [],
            warnings: [{
              type: MappingErrorType.API_PARSING_ERROR,
              field: 'cache',
              message: 'Data retrieved from cache'
            }]
          };
        }
      }

      // Detect company type if not forced
      let companyType: CompanyType;
      let detectionResult: CompanyTypeDetectionResult | null = null;
      const errors: MappingError[] = [];
      const warnings: MappingError[] = [];

      if (forceCompanyType) {
        companyType = forceCompanyType;
        warnings.push({
          type: MappingErrorType.COMPANY_TYPE_DETECTION_FAILED,
          field: 'company_type',
          message: `Company type forced to: ${forceCompanyType}`
        });
      } else {
        detectionResult = this.companyTypeDetector.detectCompanyType(sector, industry, apiResponse);
        companyType = detectionResult.companyType;
        
        // Add detection warnings
        warnings.push(...detectionResult.warnings);
        
        // Log detection details
        if (detectionResult.confidence === 'low') {
          warnings.push({
            type: MappingErrorType.COMPANY_TYPE_DETECTION_FAILED,
            field: 'company_type',
            message: `Low confidence company type detection (${detectionResult.score}): ${detectionResult.reasons.join(', ')}`
          });
        }
      }

      // Select appropriate mapper
      const mapper = this.selectMapper(companyType);
      
      // Attempt mapping with comprehensive error handling
      let mappingResult: DataMappingResult;
      const mappingContext = { symbol, companyType, operation: 'financial_data_mapping' };
      
      if (this.config.enableRetry) {
        mappingResult = await this.mapWithRetry(mapper, apiResponse, symbol);
      } else {
        mappingResult = mapper.mapData(apiResponse);
      }

      // Analyze errors and determine recovery strategy
      if (!mappingResult.success) {
        const errorAggregation = this.errorHandler.aggregateErrors(
          mappingResult.errors,
          mappingResult.warnings || [],
          mappingContext
        );

        // Try fallback mapper if detection was uncertain or errors suggest wrong type
        if (detectionResult && detectionResult.confidence === 'low' || this.shouldTryFallback(errorAggregation)) {
          const fallbackType = companyType === 'banking' ? 'non-banking' : 'banking';
          const fallbackMapper = this.selectMapper(fallbackType);
          
          warnings.push({
            type: MappingErrorType.COMPANY_TYPE_DETECTION_FAILED,
            field: 'company_type',
            message: `Primary mapping failed, attempting fallback to ${fallbackType}`,
            context: { ...mappingContext, fallbackReason: 'error_analysis' }
          });

          const fallbackResult = fallbackMapper.mapData(apiResponse);
          if (fallbackResult.success && fallbackResult.data) {
            mappingResult = fallbackResult;
            companyType = fallbackType;
            
            // Log successful fallback
            warnings.push({
              type: MappingErrorType.COMPANY_TYPE_DETECTION_FAILED,
              field: 'company_type',
              message: `Fallback to ${fallbackType} mapping succeeded`
            });
          }
        }
      }

      // Generate comprehensive error report if still failed
      if (!mappingResult.success || !mappingResult.data) {
        const finalErrorAggregation = this.errorHandler.aggregateErrors(
          [...errors, ...mappingResult.errors],
          [...warnings, ...mappingResult.warnings || []],
          mappingContext
        );

        const recoveryPlan = this.errorHandler.createRecoveryPlan(mappingResult, mappingContext);
        const errorReport = this.errorHandler.generateErrorReport(finalErrorAggregation, mappingContext);

        // Log detailed error report in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Financial Data Mapping Failed:', errorReport);
          console.error('Recovery Plan:', recoveryPlan);
        }

        return {
          success: false,
          errors: [...errors, ...mappingResult.errors],
          warnings: [...warnings, ...mappingResult.warnings || []]
        };
      }

      // Enhance data with metadata
      const enhancedData: CompanyFinancialData = {
        ...mappingResult.data,
        companyType,
        symbol,
        lastUpdated: new Date().toISOString(),
        metadata: {
          ...mappingResult.data.metadata,
          sector,
          industry
        }
      };

      // Cache the result
      if (this.config.cacheEnabled) {
        this.cacheData(symbol, apiResponse, enhancedData);
      }

      return {
        success: true,
        data: enhancedData,
        errors: [...errors, ...mappingResult.errors],
        warnings: [...warnings, ...mappingResult.warnings]
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          type: MappingErrorType.CALCULATION_ERROR,
          field: 'orchestrator',
          message: `Unexpected error in financial data mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
          context: { companyType: this.config.fallbackCompanyType }
        }],
        warnings: []
      };
    }
  }

  /**
   * Select appropriate mapper based on company type
   */
  private selectMapper(companyType: CompanyType) {
    return companyType === 'banking' ? this.bankingMapper : this.nonBankingMapper;
  }

  /**
   * Map data with retry logic for failed mappings
   */
  private async mapWithRetry(
    mapper: BankingDataMapper | NonBankingDataMapper,
    apiResponse: InsightSentryQuarterlyResponse,
    symbol: string
  ): Promise<DataMappingResult> {
    let lastResult: DataMappingResult | null = null;
    const mappingContext = { symbol, operation: 'mapping_with_retry' };
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = mapper.mapData(apiResponse);
        
        if (result.success) {
          if (attempt > 0) {
            // Add warning about retry success
            result.warnings = result.warnings || [];
            result.warnings.push({
              type: MappingErrorType.API_PARSING_ERROR,
              field: 'retry',
              message: `Mapping succeeded on attempt ${attempt + 1}`,
              context: { ...mappingContext, attemptNumber: attempt + 1 }
            });
          }
          return result;
        }
        
        lastResult = result;
        
        // Use error handler to determine if we should retry
        const retryDecision = this.errorHandler.shouldRetry(result, {
          ...mappingContext,
          attemptNumber: attempt + 1,
          maxAttempts: this.config.maxRetries + 1
        });
        
        if (!retryDecision.shouldRetry) {
          // Log why we're not retrying
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Not retrying mapping for ${symbol}: ${retryDecision.reason}`);
          }
          break;
        }
        
        // Don't retry on the last attempt
        if (attempt < this.config.maxRetries) {
          const delay = retryDecision.suggestedDelay || this.config.retryDelay * (attempt + 1);
          await this.delay(delay);
          
          // Log retry attempt
          if (process.env.NODE_ENV === 'development') {
            console.log(`Retrying mapping for ${symbol} (attempt ${attempt + 2}): ${retryDecision.reason}`);
            if (retryDecision.modifications) {
              console.log('Suggested modifications:', retryDecision.modifications);
            }
          }
        }
        
      } catch (error) {
        const errorResult: DataMappingResult = {
          success: false,
          errors: [{
            type: MappingErrorType.CALCULATION_ERROR,
            field: 'mapper',
            message: `Mapping attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            context: { ...mappingContext, attemptNumber: attempt + 1 }
          }],
          warnings: []
        };
        
        lastResult = errorResult;
        
        // Check if this type of error is retryable
        const retryDecision = this.errorHandler.shouldRetry(errorResult, {
          ...mappingContext,
          attemptNumber: attempt + 1,
          maxAttempts: this.config.maxRetries + 1
        });
        
        if (!retryDecision.shouldRetry || attempt >= this.config.maxRetries) {
          break;
        }
        
        const delay = retryDecision.suggestedDelay || this.config.retryDelay * (attempt + 1);
        await this.delay(delay);
      }
    }

    // All retries failed - generate comprehensive error report
    if (lastResult) {
      const errorAggregation = this.errorHandler.aggregateErrors(
        lastResult.errors,
        lastResult.warnings || [],
        mappingContext
      );
      
      const recoveryPlan = this.errorHandler.createRecoveryPlan(lastResult, mappingContext);
      
      // Add final retry failure error
      lastResult.errors.push({
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'retry_exhausted',
        message: `All ${this.config.maxRetries + 1} mapping attempts failed`,
        context: {
          ...mappingContext,
          totalAttempts: this.config.maxRetries + 1,
          fallbackReason: recoveryPlan.canRecover ? 'recovery_available' : 'no_recovery'
        }
      });
    }

    return lastResult || {
      success: false,
      errors: [{
        type: MappingErrorType.CALCULATION_ERROR,
        field: 'mapper',
        message: 'All mapping attempts failed with unknown error'
      }],
      warnings: []
    };
  }

  /**
   * Generate cache key for data
   */
  private generateCacheKey(symbol: string, apiResponse: InsightSentryQuarterlyResponse): string {
    // Create a simple hash of the API response for cache key
    const dataString = JSON.stringify(apiResponse);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${symbol}_${Math.abs(hash)}`;
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(symbol: string, apiResponse: InsightSentryQuarterlyResponse): CompanyFinancialData | null {
    const cacheKey = this.generateCacheKey(symbol, apiResponse);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache processed data
   */
  private cacheData(symbol: string, apiResponse: InsightSentryQuarterlyResponse, data: CompanyFinancialData): void {
    const cacheKey = this.generateCacheKey(symbol, apiResponse);
    
    // Clean up old entries if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      this.cleanupCache();
    }
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      hash: cacheKey
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        expiredKeys.push(key);
      }
    }
    
    // Remove expired entries
    expiredKeys.forEach(key => this.cache.delete(key));
    
    // If still too many entries, remove oldest ones
    if (this.cache.size >= this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.config.maxCacheSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    const entries = Array.from(this.cache.values());
    const oldestTimestamp = entries.length > 0 
      ? Math.min(...entries.map(e => e.timestamp))
      : null;
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      oldestEntry: oldestTimestamp
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<FinancialDataMapperConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Clear cache if caching was disabled
    if (!this.config.cacheEnabled) {
      this.clearCache();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): FinancialDataMapperConfig {
    return { ...this.config };
  }

  /**
   * Determine if we should try fallback mapper based on error analysis
   */
  private shouldTryFallback(errorAggregation: ErrorAggregationResult): boolean {
    // Try fallback if we have many missing required fields (might be wrong company type)
    const missingFieldErrors = errorAggregation.errorsByType[MappingErrorType.MISSING_REQUIRED_FIELD] || 0;
    if (missingFieldErrors > 3) {
      return true;
    }
    
    // Try fallback if we have critical errors that might be type-related
    const criticalTypeRelatedErrors = errorAggregation.criticalErrors.filter(error =>
      error.type === MappingErrorType.MISSING_REQUIRED_FIELD ||
      error.type === MappingErrorType.COMPANY_TYPE_DETECTION_FAILED
    );
    
    return criticalTypeRelatedErrors.length > 0;
  }

  /**
   * Get comprehensive error statistics for debugging
   */
  public getErrorStatistics(symbol?: string): {
    totalMappingAttempts: number;
    successRate: number;
    commonErrors: Array<{ type: MappingErrorType; count: number }>;
    errorHistory: any[];
  } {
    const history = symbol ? this.errorHandler.getErrorHistory(symbol) : [];
    
    // This is a simplified version - in a real implementation,
    // you'd track more detailed statistics
    return {
      totalMappingAttempts: 0, // Would need to track this
      successRate: 0, // Would need to track this
      commonErrors: [], // Would aggregate from history
      errorHistory: history.slice(-10) // Last 10 errors
    };
  }

  /**
   * Generate detailed debugging report
   */
  public generateDebugReport(
    symbol: string,
    apiResponse: InsightSentryQuarterlyResponse,
    result: DataMappingResult
  ): string {
    const lines: string[] = [];
    
    lines.push('=== Financial Data Mapper Debug Report ===');
    lines.push(`Symbol: ${symbol}`);
    lines.push(`Timestamp: ${new Date().toISOString()}`);
    lines.push(`Success: ${result.success}`);
    lines.push('');
    
    // API Response Analysis
    lines.push('API Response Analysis:');
    const validation = this.validateApiResponse(apiResponse);
    lines.push(`  Valid: ${validation.isValid}`);
    lines.push(`  Total Fields: ${Object.keys(apiResponse).length}`);
    lines.push(`  Non-null Fields: ${Object.keys(apiResponse).filter(key => apiResponse[key as keyof InsightSentryQuarterlyResponse] !== null).length}`);
    
    // Company Type Detection
    const detectionResult = this.companyTypeDetector.detectCompanyType(
      apiResponse.sector,
      apiResponse.industry,
      apiResponse
    );
    lines.push('');
    lines.push('Company Type Detection:');
    lines.push(`  Detected Type: ${detectionResult.companyType}`);
    lines.push(`  Confidence: ${detectionResult.confidence} (${detectionResult.score})`);
    lines.push(`  Reasons: ${detectionResult.reasons.join(', ')}`);
    
    // Error Analysis
    if (result.errors.length > 0 || (result.warnings && result.warnings.length > 0)) {
      const errorAggregation = this.errorHandler.aggregateErrors(
        result.errors,
        result.warnings || [],
        { symbol, operation: 'debug_report' }
      );
      
      lines.push('');
      lines.push('Error Analysis:');
      lines.push(`  Total Errors: ${errorAggregation.totalErrors}`);
      lines.push(`  Total Warnings: ${errorAggregation.totalWarnings}`);
      lines.push(`  Critical Errors: ${errorAggregation.criticalErrors.length}`);
      lines.push(`  Recoverable Errors: ${errorAggregation.recoverableErrors.length}`);
      
      if (errorAggregation.suggestions.length > 0) {
        lines.push('');
        lines.push('Suggestions:');
        errorAggregation.suggestions.forEach((suggestion, index) => {
          lines.push(`  ${index + 1}. ${suggestion}`);
        });
      }
    }
    
    // Cache Statistics
    const cacheStats = this.getCacheStats();
    lines.push('');
    lines.push('Cache Statistics:');
    lines.push(`  Size: ${cacheStats.size}/${cacheStats.maxSize}`);
    lines.push(`  Oldest Entry: ${cacheStats.oldestEntry ? new Date(cacheStats.oldestEntry).toISOString() : 'None'}`);
    
    return lines.join('\n');
  }

  /**
   * Utility method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API response before processing
   */
  public validateApiResponse(apiResponse: InsightSentryQuarterlyResponse): {
    isValid: boolean;
    errors: MappingError[];
    warnings: MappingError[];
  } {
    const errors: MappingError[] = [];
    const warnings: MappingError[] = [];

    // Basic validation
    if (!apiResponse || typeof apiResponse !== 'object') {
      errors.push({
        type: MappingErrorType.INVALID_DATA_TYPE,
        field: 'root',
        message: 'API response is null or not an object'
      });
      return { isValid: false, errors, warnings };
    }

    // Check for any data
    const hasData = Object.keys(apiResponse).some(key => 
      apiResponse[key as keyof InsightSentryQuarterlyResponse] !== null &&
      apiResponse[key as keyof InsightSentryQuarterlyResponse] !== undefined
    );

    if (!hasData) {
      errors.push({
        type: MappingErrorType.INVALID_DATA_TYPE,
        field: 'root',
        message: 'API response contains no valid data'
      });
      return { isValid: false, errors, warnings };
    }

    // Check for historical data consistency
    const fyFields = Object.keys(apiResponse).filter(key => key.endsWith('_fy_h'));
    const fqFields = Object.keys(apiResponse).filter(key => key.endsWith('_fq_h'));

    if (fyFields.length === 0 && fqFields.length === 0) {
      warnings.push({
        type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
        field: 'historical_data',
        message: 'No historical data arrays found in API response'
      });
    }

    return { isValid: true, errors, warnings };
  }
}

// Export singleton instance for convenience
export const financialDataMapper = new FinancialDataMapper();