// Company Type Detection System
import { 
  CompanyType, 
  InsightSentryQuarterlyResponse,
  MappingError,
  MappingErrorType 
} from '../../components/QuarterlyResults/types';

/**
 * Company type detection configuration
 */
interface DetectionConfig {
  bankingSectors: string[];
  bankingFieldIndicators: string[];
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Detection result with confidence scoring
 */
export interface CompanyTypeDetectionResult {
  companyType: CompanyType;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  reasons: string[];
  warnings: MappingError[];
}

/**
 * Company Type Detector Class
 */
export class CompanyTypeDetector {
  private config: DetectionConfig;

  constructor() {
    this.config = {
      bankingSectors: [
        'Banks',
        'Banking',
        'Financial Services',
        'Private Sector Bank',
        'Public Sector Bank',
        'Cooperative Bank',
        'Regional Rural Bank',
        'Small Finance Bank',
        'Payments Bank',
        'Development Bank',
        'Investment Bank',
        'Commercial Bank'
      ],
      bankingFieldIndicators: [
        // Interest-related fields
        'interest_income_fy_h',
        'interest_income_fq_h',
        'interest_expense_fy_h',
        'interest_expense_fq_h',
        'interest_income_net_fy_h',
        'interest_income_net_fq_h',
        'net_interest_margin_fy_h',
        'net_interest_margin_fq_h',
        
        // Deposit-related fields
        'total_deposits_fy_h',
        'total_deposits_fq_h',
        'demand_deposits_fy_h',
        'savings_time_deposits_fy_h',
        
        // Loan-related fields
        'loans_net_fy_h',
        'loans_net_fq_h',
        'loans_gross_fy_h',
        'loans_gross_fq_h',
        'nonperf_loans_fy_h',
        'nonperf_loans_fq_h',
        'nonperf_loans_loans_gross_fy_h',
        'nonperf_loans_loans_gross_fq_h',
        'loan_loss_provision_fy_h',
        'loan_loss_provision_fq_h',
        'loan_loss_allowances_fy_h',
        'loan_loss_allowances_fq_h',
        
        // Banking-specific ratios
        'loan_loss_coverage_fy_h',
        'efficiency_ratio_fy_h',
        'demand_deposits_total_deposits_fy_h',
        'loans_net_total_deposits_fy_h'
      ],
      confidenceThresholds: {
        high: 0.8,
        medium: 0.5,
        low: 0.2
      }
    };
  }

  /**
   * Detect company type with confidence scoring
   */
  public detectCompanyType(
    sector: string | undefined,
    industry: string | undefined,
    companyData: InsightSentryQuarterlyResponse
  ): CompanyTypeDetectionResult {
    const warnings: MappingError[] = [];
    const reasons: string[] = [];
    let score = 0;

    // Primary detection via sector (weight: 40%)
    const sectorScore = this.evaluateSector(sector, reasons);
    score += sectorScore * 0.4;

    // Secondary detection via industry (weight: 20%)
    const industryScore = this.evaluateIndustry(industry, reasons);
    score += industryScore * 0.2;

    // Tertiary detection via available fields (weight: 40%)
    const fieldScore = this.evaluateFields(companyData, reasons, warnings);
    score += fieldScore * 0.4;

    // Determine company type and confidence
    const companyType: CompanyType = score >= 0.5 ? 'banking' : 'non-banking';
    const confidence = this.determineConfidence(score);

    // Add warnings for edge cases
    if (score >= 0.4 && score <= 0.6) {
      warnings.push({
        type: MappingErrorType.COMPANY_TYPE_DETECTION_FAILED,
        field: 'company_type',
        message: `Company type detection is ambiguous (score: ${score.toFixed(2)}). Using ${companyType} as default.`,
        context: { companyType }
      });
    }

    return {
      companyType,
      confidence,
      score: Math.round(score * 100) / 100,
      reasons,
      warnings
    };
  }

  /**
   * Evaluate sector information for banking indicators
   */
  private evaluateSector(sector: string | undefined, reasons: string[]): number {
    if (!sector) {
      reasons.push('No sector information available');
      return 0;
    }

    const sectorLower = sector.toLowerCase();
    const matchingBankingSectors = this.config.bankingSectors.filter(bankingSector =>
      sectorLower.includes(bankingSector.toLowerCase()) ||
      bankingSector.toLowerCase().includes(sectorLower)
    );

    if (matchingBankingSectors.length > 0) {
      reasons.push(`Sector "${sector}" matches banking sectors: ${matchingBankingSectors.join(', ')}`);
      return 1;
    }

    // Check for partial matches or related terms
    const bankingKeywords = ['bank', 'financial', 'finance', 'credit', 'lending'];
    const hasPartialMatch = bankingKeywords.some(keyword => sectorLower.includes(keyword));

    if (hasPartialMatch) {
      reasons.push(`Sector "${sector}" contains banking-related keywords`);
      return 0.7;
    }

    reasons.push(`Sector "${sector}" does not indicate banking`);
    return 0;
  }

  /**
   * Evaluate industry information for banking indicators
   */
  private evaluateIndustry(industry: string | undefined, reasons: string[]): number {
    if (!industry) {
      return 0;
    }

    const industryLower = industry.toLowerCase();
    const bankingKeywords = [
      'banking', 'bank', 'financial services', 'finance', 'credit',
      'lending', 'deposits', 'loans', 'mortgage', 'investment banking'
    ];

    const matchingKeywords = bankingKeywords.filter(keyword =>
      industryLower.includes(keyword) || keyword.includes(industryLower)
    );

    if (matchingKeywords.length > 0) {
      reasons.push(`Industry "${industry}" matches banking keywords: ${matchingKeywords.join(', ')}`);
      return Math.min(matchingKeywords.length * 0.3, 1);
    }

    return 0;
  }

  /**
   * Evaluate available data fields for banking indicators
   */
  private evaluateFields(
    companyData: InsightSentryQuarterlyResponse,
    reasons: string[],
    warnings: MappingError[]
  ): number {
    const availableFields = Object.keys(companyData).filter(key =>
      companyData[key as keyof InsightSentryQuarterlyResponse] !== null &&
      companyData[key as keyof InsightSentryQuarterlyResponse] !== undefined
    );

    if (availableFields.length === 0) {
      warnings.push({
        type: MappingErrorType.INVALID_DATA_TYPE,
        field: 'data_fields',
        message: 'No valid data fields available for company type detection'
      });
      return 0;
    }

    // Check for banking-specific fields
    const bankingFieldsPresent = this.config.bankingFieldIndicators.filter(field =>
      availableFields.includes(field) && this.hasValidData(companyData, field)
    );

    const bankingFieldScore = bankingFieldsPresent.length / this.config.bankingFieldIndicators.length;

    if (bankingFieldsPresent.length > 0) {
      reasons.push(`Found ${bankingFieldsPresent.length} banking-specific fields: ${bankingFieldsPresent.slice(0, 5).join(', ')}${bankingFieldsPresent.length > 5 ? '...' : ''}`);
    }

    // Check for non-banking specific fields that are rare in banking
    const nonBankingIndicators = [
      'cost_of_goods_fy_h',
      'cost_of_goods_fq_h',
      'inventory_fy_h',
      'inventory_fq_h',
      'accounts_receivable_fy_h',
      'accounts_payable_fy_h'
    ];

    const nonBankingFieldsPresent = nonBankingIndicators.filter(field =>
      availableFields.includes(field) && this.hasValidData(companyData, field)
    );

    if (nonBankingFieldsPresent.length > 0) {
      reasons.push(`Found ${nonBankingFieldsPresent.length} non-banking specific fields: ${nonBankingFieldsPresent.join(', ')}`);
      return Math.max(0, bankingFieldScore - (nonBankingFieldsPresent.length * 0.1));
    }

    return bankingFieldScore;
  }

  /**
   * Check if a field has valid data (not null/empty arrays)
   */
  private hasValidData(companyData: InsightSentryQuarterlyResponse, field: string): boolean {
    const value = companyData[field as keyof InsightSentryQuarterlyResponse];
    
    if (value === null || value === undefined) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0 && value.some(item => item !== null && item !== undefined);
    }

    return true;
  }

  /**
   * Determine confidence level based on score
   */
  private determineConfidence(score: number): 'high' | 'medium' | 'low' {
    if (score >= this.config.confidenceThresholds.high) {
      return 'high';
    } else if (score >= this.config.confidenceThresholds.medium) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Validate detection result and provide fallback
   */
  public validateDetection(
    result: CompanyTypeDetectionResult,
    fallbackType: CompanyType = 'non-banking'
  ): CompanyTypeDetectionResult {
    // If confidence is very low, use fallback
    if (result.confidence === 'low' && result.score < this.config.confidenceThresholds.low) {
      return {
        companyType: fallbackType,
        confidence: 'low',
        score: 0,
        reasons: [`Detection confidence too low (${result.score}), using fallback: ${fallbackType}`],
        warnings: [
          ...result.warnings,
          {
            type: MappingErrorType.COMPANY_TYPE_DETECTION_FAILED,
            field: 'company_type',
            message: `Company type detection failed, using fallback: ${fallbackType}`,
            context: { companyType: fallbackType }
          }
        ]
      };
    }

    return result;
  }

  /**
   * Get detection statistics for debugging
   */
  public getDetectionStats(companyData: InsightSentryQuarterlyResponse): {
    totalFields: number;
    bankingFields: number;
    nonBankingFields: number;
    availableFields: string[];
    bankingFieldsFound: string[];
  } {
    const availableFields = Object.keys(companyData).filter(key =>
      companyData[key as keyof InsightSentryQuarterlyResponse] !== null &&
      companyData[key as keyof InsightSentryQuarterlyResponse] !== undefined
    );

    const bankingFieldsFound = this.config.bankingFieldIndicators.filter(field =>
      availableFields.includes(field) && this.hasValidData(companyData, field)
    );

    const nonBankingIndicators = [
      'cost_of_goods_fy_h', 'cost_of_goods_fq_h',
      'inventory_fy_h', 'inventory_fq_h',
      'accounts_receivable_fy_h', 'accounts_payable_fy_h'
    ];

    const nonBankingFieldsFound = nonBankingIndicators.filter(field =>
      availableFields.includes(field) && this.hasValidData(companyData, field)
    );

    return {
      totalFields: availableFields.length,
      bankingFields: bankingFieldsFound.length,
      nonBankingFields: nonBankingFieldsFound.length,
      availableFields,
      bankingFieldsFound
    };
  }
}

// Utility function for backward compatibility
export function detectCompanyType(
  sector: string | undefined,
  companyData: InsightSentryQuarterlyResponse
): CompanyType {
  const detector = new CompanyTypeDetector();
  const result = detector.detectCompanyType(sector, undefined, companyData);
  return result.companyType;
}