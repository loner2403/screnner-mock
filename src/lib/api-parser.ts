// API Response Parser for complex nested InsightSentry API structure
import {
    RawInsightSentryResponse,
    RawApiDataPoint,
    InsightSentryQuarterlyResponse,
    MappingError,
    MappingErrorType
} from '../components/QuarterlyResults/types';

/**
 * Parse complex nested API response into flat structure
 * Handles extraction of both current values and historical arrays from nested objects
 */
export class ApiResponseParser {
    private errors: MappingError[] = [];
    private warnings: MappingError[] = [];

    /**
     * Parse raw API response into flattened structure
     */
    public parseApiResponse(rawResponse: RawInsightSentryResponse): {
        data: InsightSentryQuarterlyResponse;
        errors: MappingError[];
        warnings: MappingError[];
    } {
        this.errors = [];
        this.warnings = [];

        try {
            const flattenedData = this.flattenApiData(rawResponse.data);

            // Add metadata
            if (rawResponse.metadata) {
                flattenedData.sector = rawResponse.metadata.sector;
                flattenedData.industry = rawResponse.metadata.industry;
            }

            // Generate quarter information if not present
            this.generateQuarterInfo(flattenedData);

            return {
                data: flattenedData,
                errors: this.errors,
                warnings: this.warnings
            };
        } catch (error) {
            this.errors.push({
                type: MappingErrorType.API_PARSING_ERROR,
                field: 'root',
                message: `Failed to parse API response: ${error instanceof Error ? error.message : 'Unknown error'}`,
                originalValue: rawResponse
            });

            return {
                data: {} as InsightSentryQuarterlyResponse,
                errors: this.errors,
                warnings: this.warnings
            };
        }
    }

    /**
     * Flatten nested API data points into key-value structure
     */
    private flattenApiData(dataPoints: RawApiDataPoint[]): InsightSentryQuarterlyResponse {
        const flattened: any = {};
        const quarterlyData: { [key: string]: number[] } = {};
        const annualData: { [key: string]: number[] } = {};
        const currentData: { [key: string]: number } = {};

        for (const item of dataPoints) {
            try {
                if (!item.id || item.value === null || item.value === undefined) {
                    continue;
                }

                const fieldName = item.id;
                const value = item.value;

                // Handle historical arrays
                if (Array.isArray(value)) {
                    const cleanValues = this.cleanHistoricalArray(value, fieldName);

                    if (fieldName.endsWith('_fq_h')) {
                        // Quarterly historical data (up to 32 quarters)
                        quarterlyData[fieldName] = cleanValues.slice(0, 32);
                    } else if (fieldName.endsWith('_fy_h')) {
                        // Annual historical data (up to 20 years)
                        annualData[fieldName] = cleanValues.slice(0, 20);
                    } else {
                        // Other array data
                        flattened[fieldName] = cleanValues;
                    }
                } else if (typeof value === 'number') {
                    // Current values
                    if (fieldName.endsWith('_fy') || fieldName.endsWith('_fq') || fieldName.endsWith('_ttm')) {
                        currentData[fieldName] = value;
                    } else {
                        flattened[fieldName] = value;
                    }
                } else if (typeof value === 'string') {
                    // String metadata
                    flattened[fieldName] = value;
                }
            } catch (error) {
                this.warnings.push({
                    type: MappingErrorType.INVALID_DATA_TYPE,
                    field: item.id,
                    message: `Failed to process data point: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    originalValue: item.value
                });
            }
        }

        // Merge all data
        return {
            ...flattened,
            ...quarterlyData,
            ...annualData,
            ...currentData
        };
    }

    /**
     * Clean historical array by filtering out invalid values
     */
    private cleanHistoricalArray(array: any[], fieldName: string): number[] {
        const cleaned: number[] = [];

        for (let i = 0; i < array.length; i++) {
            const value = array[i];

            if (value === null || value === undefined) {
                cleaned.push(null as any); // Keep nulls for proper indexing
            } else if (typeof value === 'number' && !isNaN(value)) {
                cleaned.push(value);
            } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                cleaned.push(parseFloat(value));
            } else {
                cleaned.push(null as any);
                this.warnings.push({
                    type: MappingErrorType.INVALID_DATA_TYPE,
                    field: fieldName,
                    message: `Invalid value at index ${i}: ${value}`,
                    originalValue: value
                });
            }
        }

        return cleaned;
    }

    /**
     * Generate quarter information from historical data
     */
    private generateQuarterInfo(data: InsightSentryQuarterlyResponse): void {
        // Find the longest quarterly array to determine number of quarters
        const quarterlyFields = Object.keys(data).filter(key => key.endsWith('_fq_h'));

        if (quarterlyFields.length === 0) {
            return;
        }

        const maxLength = Math.max(
            ...quarterlyFields.map(field => {
                const array = data[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
                return array?.length || 0;
            })
        );

        if (maxLength === 0) {
            return;
        }

        // Generate quarter dates and periods
        const quarterDates: string[] = [];
        const quarterPeriods: string[] = [];
        const currentDate = new Date();

        for (let i = 0; i < maxLength; i++) {
            const quarterDate = new Date(currentDate);
            quarterDate.setMonth(quarterDate.getMonth() - (i * 3));
            quarterDates.push(quarterDate.toISOString());

            const month = quarterDate.getMonth();
            const year = quarterDate.getFullYear();
            let quarter: string;

            if (month >= 0 && month <= 2) {
                quarter = `Mar ${year}`;
            } else if (month >= 3 && month <= 5) {
                quarter = `Jun ${year}`;
            } else if (month >= 6 && month <= 8) {
                quarter = `Sep ${year}`;
            } else {
                quarter = `Dec ${year}`;
            }

            quarterPeriods.push(quarter);
        }

        data.quarters_info = {
            dates: quarterDates,
            periods: quarterPeriods
        };
    }

    /**
     * Validate that historical arrays have consistent lengths
     */
    public validateHistoricalConsistency(data: InsightSentryQuarterlyResponse): MappingError[] {
        const errors: MappingError[] = [];

        // Check quarterly data consistency
        const quarterlyFields = Object.keys(data).filter(key => key.endsWith('_fq_h'));
        const quarterlyLengths = quarterlyFields.map(field => {
            const array = data[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
            return { field, length: array?.length || 0 };
        });

        if (quarterlyLengths.length > 1) {
            const maxLength = Math.max(...quarterlyLengths.map(item => item.length));
            const inconsistentFields = quarterlyLengths.filter(item => item.length !== maxLength && item.length > 0);

            for (const item of inconsistentFields) {
                errors.push({
                    type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
                    field: item.field,
                    message: `Quarterly historical array length (${item.length}) doesn't match expected length (${maxLength})`,
                    context: { section: 'quarterly-validation' }
                });
            }
        }

        // Check annual data consistency
        const annualFields = Object.keys(data).filter(key => key.endsWith('_fy_h'));
        const annualLengths = annualFields.map(field => {
            const array = data[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
            return { field, length: array?.length || 0 };
        });

        if (annualLengths.length > 1) {
            const maxLength = Math.max(...annualLengths.map(item => item.length));
            const inconsistentFields = annualLengths.filter(item => item.length !== maxLength && item.length > 0);

            for (const item of inconsistentFields) {
                errors.push({
                    type: MappingErrorType.HISTORICAL_DATA_MISMATCH,
                    field: item.field,
                    message: `Annual historical array length (${item.length}) doesn't match expected length (${maxLength})`,
                    context: { section: 'annual-validation' }
                });
            }
        }

        return errors;
    }

    /**
     * Extract current value from historical array (most recent)
     */
    public extractCurrentValue(historicalArray: number[] | undefined): number | null {
        if (!historicalArray || historicalArray.length === 0) {
            return null;
        }

        // Return the most recent non-null value
        for (let i = 0; i < historicalArray.length; i++) {
            const value = historicalArray[i];
            if (value !== null && value !== undefined && !isNaN(value)) {
                return value;
            }
        }

        return null;
    }

    /**
     * Pad historical arrays to ensure consistent length
     */
    public padHistoricalArrays(data: InsightSentryQuarterlyResponse, targetLength: number): InsightSentryQuarterlyResponse {
        const paddedData = { ...data };

        // Pad quarterly arrays
        const quarterlyFields = Object.keys(paddedData).filter(key => key.endsWith('_fq_h'));
        for (const field of quarterlyFields) {
            const array = paddedData[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
            if (array && array.length < targetLength) {
                const paddedArray = new Array(targetLength).fill(null);
                for (let i = 0; i < Math.min(array.length, targetLength); i++) {
                    paddedArray[i] = array[i];
                }
                (paddedData as any)[field] = paddedArray;
            }
        }

        // Pad annual arrays
        const annualFields = Object.keys(paddedData).filter(key => key.endsWith('_fy_h'));
        for (const field of annualFields) {
            const array = paddedData[field as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
            if (array && array.length < targetLength) {
                const paddedArray = new Array(targetLength).fill(null);
                for (let i = 0; i < Math.min(array.length, targetLength); i++) {
                    paddedArray[i] = array[i];
                }
                (paddedData as any)[field] = paddedArray;
            }
        }

        return paddedData;
    }
}

// Utility functions for backward compatibility
export function parseNestedApiResponse(rawResponse: RawInsightSentryResponse): InsightSentryQuarterlyResponse {
    const parser = new ApiResponseParser();
    const result = parser.parseApiResponse(rawResponse);

    if (result.errors.length > 0) {
        console.warn('API parsing errors:', result.errors);
    }

    if (result.warnings.length > 0) {
        console.warn('API parsing warnings:', result.warnings);
    }

    return result.data;
}

export function extractHistoricalData(apiResponse: any, field: string): number[] | null {
    const parser = new ApiResponseParser();

    if (!apiResponse || !field) {
        return null;
    }

    // Handle both flat and nested structures
    if (Array.isArray(apiResponse[field])) {
        return parser['cleanHistoricalArray'](apiResponse[field], field);
    }

    // Look for nested structure
    if (apiResponse.data && Array.isArray(apiResponse.data)) {
        const dataPoint = apiResponse.data.find((item: any) => item.id === field);
        if (dataPoint && Array.isArray(dataPoint.value)) {
            return parser['cleanHistoricalArray'](dataPoint.value, field);
        }
    }

    return null;
}