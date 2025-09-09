// Comprehensive Error Handling for Data Mapping
import { 
  MappingError, 
  MappingErrorType, 
  CompanyType,
  DataMappingResult 
} from '../../components/QuarterlyResults/types';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Enhanced error with additional context
 */
export interface EnhancedMappingError extends MappingError {
  severity: ErrorSeverity;
  timestamp: string;
  stackTrace?: string;
  suggestions?: string[];
  recoverable: boolean;
  retryable: boolean;
}

/**
 * Error aggregation result
 */
export interface ErrorAggregationResult {
  totalErrors: number;
  totalWarnings: number;
  errorsByType: Record<MappingErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  criticalErrors: EnhancedMappingError[];
  recoverableErrors: EnhancedMappingError[];
  retryableErrors: EnhancedMappingError[];
  suggestions: string[];
}

/**
 * Error reporting configuration
 */
interface ErrorReportingConfig {
  enableStackTrace: boolean;
  enableSuggestions: boolean;
  maxErrorsPerType: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Comprehensive error handler for data mapping operations
 */
export class DataMappingErrorHandler {
  private config: ErrorReportingConfig;
  private errorHistory: Map<string, EnhancedMappingError[]>;

  constructor(config?: Partial<ErrorReportingConfig>) {
    this.config = {
      enableStackTrace: process.env.NODE_ENV === 'development',
      enableSuggestions: true,
      maxErrorsPerType: 10,
      logLevel: 'warn',
      ...config
    };
    this.errorHistory = new Map();
  }

  /**
   * Enhance a basic mapping error with additional context
   */
  public enhanceError(
    error: MappingError,
    context?: {
      symbol?: string;
      companyType?: CompanyType;
      operation?: string;
      stackTrace?: string;
    }
  ): EnhancedMappingError {
    const severity = this.determineSeverity(error);
    const suggestions = this.config.enableSuggestions ? this.generateSuggestions(error) : [];
    
    return {
      ...error,
      severity,
      timestamp: new Date().toISOString(),
      stackTrace: this.config.enableStackTrace ? (context?.stackTrace || this.captureStackTrace()) : undefined,
      suggestions,
      recoverable: this.isRecoverable(error),
      retryable: this.isRetryable(error),
      context: {
        ...error.context,
        ...context
      }
    };
  }

  /**
   * Aggregate and analyze errors from a mapping result
   */
  public aggregateErrors(
    errors: MappingError[],
    warnings: MappingError[],
    context?: {
      symbol?: string;
      companyType?: CompanyType;
      operation?: string;
    }
  ): ErrorAggregationResult {
    const enhancedErrors = errors.map(error => this.enhanceError(error, context));
    const enhancedWarnings = warnings.map(warning => this.enhanceError(warning, context));
    
    const allIssues = [...enhancedErrors, ...enhancedWarnings];
    
    // Count by type
    const errorsByType: Record<MappingErrorType, number> = {} as Record<MappingErrorType, number>;
    Object.values(MappingErrorType).forEach(type => {
      errorsByType[type] = 0;
    });
    
    // Count by severity
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };
    
    const criticalErrors: EnhancedMappingError[] = [];
    const recoverableErrors: EnhancedMappingError[] = [];
    const retryableErrors: EnhancedMappingError[] = [];
    const allSuggestions: string[] = [];
    
    allIssues.forEach(issue => {
      errorsByType[issue.type]++;
      errorsBySeverity[issue.severity]++;
      
      if (issue.severity === ErrorSeverity.CRITICAL) {
        criticalErrors.push(issue);
      }
      
      if (issue.recoverable) {
        recoverableErrors.push(issue);
      }
      
      if (issue.retryable) {
        retryableErrors.push(issue);
      }
      
      if (issue.suggestions) {
        allSuggestions.push(...issue.suggestions);
      }
    });
    
    // Store in history
    if (context?.symbol) {
      this.storeErrorHistory(context.symbol, allIssues);
    }
    
    return {
      totalErrors: enhancedErrors.length,
      totalWarnings: enhancedWarnings.length,
      errorsByType,
      errorsBySeverity,
      criticalErrors,
      recoverableErrors,
      retryableErrors,
      suggestions: [...new Set(allSuggestions)] // Remove duplicates
    };
  }

  /**
   * Generate detailed error report
   */
  public generateErrorReport(
    aggregation: ErrorAggregationResult,
    context?: {
      symbol?: string;
      companyType?: CompanyType;
      operation?: string;
    }
  ): string {
    const lines: string[] = [];
    
    lines.push('=== Data Mapping Error Report ===');
    lines.push(`Timestamp: ${new Date().toISOString()}`);
    
    if (context) {
      lines.push(`Symbol: ${context.symbol || 'Unknown'}`);
      lines.push(`Company Type: ${context.companyType || 'Unknown'}`);
      lines.push(`Operation: ${context.operation || 'Unknown'}`);
    }
    
    lines.push('');
    lines.push('Summary:');
    lines.push(`  Total Errors: ${aggregation.totalErrors}`);
    lines.push(`  Total Warnings: ${aggregation.totalWarnings}`);
    lines.push(`  Critical Issues: ${aggregation.errorsBySeverity[ErrorSeverity.CRITICAL]}`);
    lines.push(`  Recoverable Issues: ${aggregation.recoverableErrors.length}`);
    lines.push(`  Retryable Issues: ${aggregation.retryableErrors.length}`);
    
    lines.push('');
    lines.push('Errors by Type:');
    Object.entries(aggregation.errorsByType).forEach(([type, count]) => {
      if (count > 0) {
        lines.push(`  ${type}: ${count}`);
      }
    });
    
    lines.push('');
    lines.push('Errors by Severity:');
    Object.entries(aggregation.errorsBySeverity).forEach(([severity, count]) => {
      if (count > 0) {
        lines.push(`  ${severity.toUpperCase()}: ${count}`);
      }
    });
    
    if (aggregation.criticalErrors.length > 0) {
      lines.push('');
      lines.push('Critical Errors:');
      aggregation.criticalErrors.forEach((error, index) => {
        lines.push(`  ${index + 1}. ${error.field}: ${error.message}`);
        if (error.suggestions && error.suggestions.length > 0) {
          lines.push(`     Suggestions: ${error.suggestions.join(', ')}`);
        }
      });
    }
    
    if (aggregation.suggestions.length > 0) {
      lines.push('');
      lines.push('Recommendations:');
      aggregation.suggestions.forEach((suggestion, index) => {
        lines.push(`  ${index + 1}. ${suggestion}`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Determine if an operation should be retried based on error analysis
   */
  public shouldRetry(
    result: DataMappingResult,
    context?: {
      symbol?: string;
      companyType?: CompanyType;
      attemptNumber?: number;
      maxAttempts?: number;
    }
  ): {
    shouldRetry: boolean;
    reason: string;
    suggestedDelay?: number;
    modifications?: string[];
  } {
    if (!result.errors || result.errors.length === 0) {
      return {
        shouldRetry: false,
        reason: 'No errors present'
      };
    }
    
    const aggregation = this.aggregateErrors(result.errors, result.warnings || [], context);
    
    // Don't retry if we've hit max attempts
    if (context?.attemptNumber && context?.maxAttempts && context.attemptNumber >= context.maxAttempts) {
      return {
        shouldRetry: false,
        reason: 'Maximum retry attempts reached'
      };
    }
    
    // Don't retry if there are critical errors that aren't retryable
    const nonRetryableCritical = aggregation.criticalErrors.filter(error => !error.retryable);
    if (nonRetryableCritical.length > 0) {
      return {
        shouldRetry: false,
        reason: `Non-retryable critical errors: ${nonRetryableCritical.map(e => e.field).join(', ')}`
      };
    }
    
    // Retry if there are retryable errors
    if (aggregation.retryableErrors.length > 0) {
      const delay = this.calculateRetryDelay(context?.attemptNumber || 1);
      const modifications = aggregation.retryableErrors
        .flatMap(error => error.suggestions || [])
        .filter((suggestion, index, array) => array.indexOf(suggestion) === index);
      
      return {
        shouldRetry: true,
        reason: `${aggregation.retryableErrors.length} retryable errors found`,
        suggestedDelay: delay,
        modifications: modifications.length > 0 ? modifications : undefined
      };
    }
    
    return {
      shouldRetry: false,
      reason: 'No retryable errors found'
    };
  }

  /**
   * Create recovery suggestions for failed mappings
   */
  public createRecoveryPlan(
    result: DataMappingResult,
    context?: {
      symbol?: string;
      companyType?: CompanyType;
    }
  ): {
    canRecover: boolean;
    recoverySteps: string[];
    fallbackOptions: string[];
    dataQualityIssues: string[];
  } {
    const aggregation = this.aggregateErrors(result.errors || [], result.warnings || [], context);
    
    const recoverySteps: string[] = [];
    const fallbackOptions: string[] = [];
    const dataQualityIssues: string[] = [];
    
    // Analyze recoverable errors
    aggregation.recoverableErrors.forEach(error => {
      switch (error.type) {
        case MappingErrorType.MISSING_REQUIRED_FIELD:
          recoverySteps.push(`Check if field '${error.field}' exists in alternative formats`);
          fallbackOptions.push(`Use historical data or calculated values for '${error.field}'`);
          break;
          
        case MappingErrorType.INVALID_DATA_TYPE:
          recoverySteps.push(`Validate and convert data type for field '${error.field}'`);
          dataQualityIssues.push(`Data type mismatch in field '${error.field}'`);
          break;
          
        case MappingErrorType.CALCULATION_ERROR:
          recoverySteps.push(`Review calculation logic for field '${error.field}'`);
          fallbackOptions.push(`Use raw values instead of calculated values for '${error.field}'`);
          break;
          
        case MappingErrorType.COMPANY_TYPE_DETECTION_FAILED:
          recoverySteps.push('Try manual company type specification');
          fallbackOptions.push('Use fallback company type mapping');
          break;
          
        case MappingErrorType.HISTORICAL_DATA_MISMATCH:
          recoverySteps.push('Validate historical data array lengths');
          dataQualityIssues.push('Inconsistent historical data structure');
          break;
      }
    });
    
    // Add general recovery suggestions
    if (aggregation.totalErrors > aggregation.totalWarnings) {
      fallbackOptions.push('Switch to alternative company type mapping');
      fallbackOptions.push('Use partial data with missing field indicators');
    }
    
    return {
      canRecover: aggregation.recoverableErrors.length > 0,
      recoverySteps: [...new Set(recoverySteps)],
      fallbackOptions: [...new Set(fallbackOptions)],
      dataQualityIssues: [...new Set(dataQualityIssues)]
    };
  }

  /**
   * Get error history for a symbol
   */
  public getErrorHistory(symbol: string): EnhancedMappingError[] {
    return this.errorHistory.get(symbol) || [];
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(symbol?: string): void {
    if (symbol) {
      this.errorHistory.delete(symbol);
    } else {
      this.errorHistory.clear();
    }
  }

  /**
   * Determine error severity based on type and context
   */
  private determineSeverity(error: MappingError): ErrorSeverity {
    switch (error.type) {
      case MappingErrorType.MISSING_REQUIRED_FIELD:
        return ErrorSeverity.HIGH;
      case MappingErrorType.INVALID_DATA_TYPE:
        return ErrorSeverity.MEDIUM;
      case MappingErrorType.CALCULATION_ERROR:
        return ErrorSeverity.HIGH;
      case MappingErrorType.COMPANY_TYPE_DETECTION_FAILED:
        return ErrorSeverity.MEDIUM;
      case MappingErrorType.API_PARSING_ERROR:
        return ErrorSeverity.HIGH;
      case MappingErrorType.HISTORICAL_DATA_MISMATCH:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Generate suggestions for error resolution
   */
  private generateSuggestions(error: MappingError): string[] {
    const suggestions: string[] = [];
    
    switch (error.type) {
      case MappingErrorType.MISSING_REQUIRED_FIELD:
        suggestions.push(`Check if field '${error.field}' exists with different naming`);
        suggestions.push('Verify API response structure');
        suggestions.push('Consider using fallback values');
        break;
        
      case MappingErrorType.INVALID_DATA_TYPE:
        suggestions.push(`Validate data type for field '${error.field}'`);
        suggestions.push('Check for null or undefined values');
        suggestions.push('Implement data type conversion');
        break;
        
      case MappingErrorType.CALCULATION_ERROR:
        suggestions.push(`Review calculation logic for field '${error.field}'`);
        suggestions.push('Check for division by zero or invalid operations');
        suggestions.push('Add input validation before calculations');
        break;
        
      case MappingErrorType.COMPANY_TYPE_DETECTION_FAILED:
        suggestions.push('Provide explicit company type');
        suggestions.push('Check sector and industry information');
        suggestions.push('Review detection criteria');
        break;
        
      case MappingErrorType.HISTORICAL_DATA_MISMATCH:
        suggestions.push('Validate historical data array consistency');
        suggestions.push('Check for missing time periods');
        suggestions.push('Implement data interpolation for gaps');
        break;
    }
    
    return suggestions;
  }

  /**
   * Check if an error is recoverable
   */
  private isRecoverable(error: MappingError): boolean {
    switch (error.type) {
      case MappingErrorType.MISSING_REQUIRED_FIELD:
        return true; // Can use fallback values
      case MappingErrorType.INVALID_DATA_TYPE:
        return true; // Can attempt conversion
      case MappingErrorType.CALCULATION_ERROR:
        return true; // Can use raw values
      case MappingErrorType.COMPANY_TYPE_DETECTION_FAILED:
        return true; // Can use fallback type
      case MappingErrorType.HISTORICAL_DATA_MISMATCH:
        return true; // Can handle partial data
      default:
        return false;
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryable(error: MappingError): boolean {
    switch (error.type) {
      case MappingErrorType.API_PARSING_ERROR:
        return true; // Might be transient
      case MappingErrorType.CALCULATION_ERROR:
        return true; // Might succeed with different approach
      case MappingErrorType.COMPANY_TYPE_DETECTION_FAILED:
        return false; // Won't change on retry
      case MappingErrorType.MISSING_REQUIRED_FIELD:
        return false; // Data won't appear on retry
      case MappingErrorType.INVALID_DATA_TYPE:
        return false; // Data type won't change
      default:
        return false;
    }
  }

  /**
   * Capture current stack trace
   */
  private captureStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(2).join('\n') : 'Stack trace not available';
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attemptNumber: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Store error history for analysis
   */
  private storeErrorHistory(symbol: string, errors: EnhancedMappingError[]): void {
    const existing = this.errorHistory.get(symbol) || [];
    const combined = [...existing, ...errors];
    
    // Keep only recent errors (last 100)
    const recent = combined.slice(-100);
    this.errorHistory.set(symbol, recent);
  }

  /**
   * Log error based on configuration
   */
  private logError(error: EnhancedMappingError): void {
    const message = `[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`;
    
    switch (this.config.logLevel) {
      case 'debug':
        console.debug(message, error);
        break;
      case 'info':
        if (error.severity !== ErrorSeverity.LOW) {
          console.info(message);
        }
        break;
      case 'warn':
        if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
          console.warn(message);
        }
        break;
      case 'error':
        if (error.severity === ErrorSeverity.CRITICAL) {
          console.error(message, error);
        }
        break;
    }
  }
}

// Export singleton instance
export const errorHandler = new DataMappingErrorHandler();