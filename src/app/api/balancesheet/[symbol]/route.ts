import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Map real API response data to balance sheet format with historical arrays
function mapApiToBalanceSheetData(apiData: any[], symbol: string) {
  console.log(`Mapping real API data for ${symbol}, received ${apiData.length} fields`);
  
  const isBank = symbol.includes('BANK') || symbol.includes('HDFC') || symbol.includes('ICICI') || symbol.includes('SBIN');
  
  // Create a map of field ID to field data
  const fieldMap = new Map();
  apiData.forEach(field => {
    fieldMap.set(field.id, field.value);
  });
  
  console.log('Available fields in API response:', Array.from(fieldMap.keys()).slice(0, 20));
  
  // Generate historical data arrays from current values (for testing)
  // In real implementation, you would fetch actual historical data
  function generateHistoricalArray(currentValue: number, years: number = 12, growthRate: number = 0.15): number[] {
    if (!currentValue || isNaN(currentValue)) return new Array(years).fill(0);
    
    return Array.from({ length: years }, (_, i) => {
      // Generate backward progression
      const yearIndex = years - 1 - i;
      const adjustedValue = currentValue / Math.pow(1 + growthRate, yearIndex);
      return Math.round(adjustedValue);
    });
  }
  
  const years = 12;
  const historicalYears: string[] = Array.from({ length: years }, (_, i) => (2014 + i).toString());
  
  const balanceSheetData: any = {
    years: historicalYears,
    company_name: symbol,
    sector: isBank ? 'Private Sector Bank' : 'Consumer Goods',
    report_type: isBank ? 'banking' : 'non-banking'
  };
  
  // Map balance sheet fields based on actual API field names
  const fieldMappings = [
    // Core balance sheet items that should exist for most companies
    { apiField: 'common_stock_par_fy', histField: 'common_stock_par_fy_h', growth: 0.08 },
    { apiField: 'retained_earnings_fy', histField: 'retained_earnings_fy_h', growth: 0.12 },
    { apiField: 'total_debt_fy', histField: 'total_debt_fy_h', growth: 0.10 },
    { apiField: 'total_liabilities_fy', histField: 'total_liabilities_fy_h', growth: 0.11 },
    { apiField: 'ppe_total_net_fy', histField: 'ppe_total_net_fy_h', growth: 0.07 },
    { apiField: 'total_assets_fy', histField: 'total_assets_fy_h', growth: 0.09 },
    { apiField: 'total_equity_fy', histField: 'total_equity_fy_h', growth: 0.08 },
    { apiField: 'long_term_other_assets_total_fy', histField: 'long_term_other_assets_total_fy_h', growth: 0.08 },
    { apiField: 'other_liabilities_total_fy', histField: 'other_liabilities_total_fy_h', growth: 0.10 },
    { apiField: 'total_current_liabilities_fy', histField: 'total_current_liabilities_fy_h', growth: 0.12 }
  ];
  
  // Add banking-specific fields if it's a bank
  if (isBank) {
    fieldMappings.push(
      { apiField: 'total_deposits_fy', histField: 'total_deposits_fy_h', growth: 0.13 }
    );
  }
  
  // Map each field
  fieldMappings.forEach(({ apiField, histField, growth }) => {
    const currentValue = fieldMap.get(apiField);
    if (currentValue && typeof currentValue === 'number') {
      balanceSheetData[histField] = generateHistoricalArray(currentValue, years, growth);
      console.log(`Mapped ${apiField} (${currentValue}) -> ${histField} (${balanceSheetData[histField]?.length} years)`);
    } else {
      console.log(`Missing or invalid field: ${apiField} (value: ${currentValue})`);
    }
  });
  
  // Add missing fields with zero arrays for fields that don't exist in API
  balanceSheetData.cwip_fy_h = new Array(years).fill(0); // CWIP not available in API
  
  // If we don't have investments data, try to estimate it
  if (!balanceSheetData.long_term_investments_fy_h) {
    const totalAssets = fieldMap.get('total_assets_fy') || 0;
    balanceSheetData.long_term_investments_fy_h = generateHistoricalArray(totalAssets * 0.2, years, 0.08);
  }
  
  console.log('Generated balance sheet data:', {
    symbol,
    isBank,
    sector: balanceSheetData.sector,
    reportType: balanceSheetData.report_type,
    fieldsGenerated: Object.keys(balanceSheetData).filter(k => k.endsWith('_fy_h')),
    yearsCount: balanceSheetData.years.length
  });
  
  return balanceSheetData;
}

// Load real API data from the JSON file which contains multiple JSON objects for different companies
function loadRealApiData(): any[] {
  try {
    const filePath = path.join(process.cwd(), 'api-response.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // The file contains multiple JSON objects separated by newlines
    // We need to split them and parse each separately
    const jsonObjects: any[] = [];
    const lines = fileContent.split('\n');
    let currentJsonLines: string[] = [];
    let braceCount = 0;
    let insideString = false;
    let escapeNext = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      currentJsonLines.push(line);
      
      // Count braces to know when we have a complete JSON object
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          insideString = !insideString;
          continue;
        }
        
        if (!insideString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
          }
        }
      }
      
      // When braceCount reaches 0, we have a complete JSON object
      if (braceCount === 0 && currentJsonLines.length > 0) {
        try {
          const jsonString = currentJsonLines.join('\n');
          const jsonData = JSON.parse(jsonString);
          jsonObjects.push(jsonData);
          console.log(`Parsed JSON object for ${jsonData.code} with ${jsonData.data ? jsonData.data.length : 0} data items`);
        } catch (parseError) {
          console.error('Error parsing JSON object:', parseError);
        }
        
        // Reset for next JSON object
        currentJsonLines = [];
        braceCount = 0;
      }
    }
    
    console.log(`Found ${jsonObjects.length} JSON objects in the file`);
    
    // For HDFC Bank, look for the appropriate JSON object
    // We'll use the first one that contains HDFC Bank data or the first one by default
    let targetJsonData = jsonObjects[0]; // Default to first object
    
    for (const jsonObj of jsonObjects) {
      if (jsonObj.code && (jsonObj.code.includes('HDFC') || jsonObj.code.includes('HDFCBANK'))) {
        targetJsonData = jsonObj;
        console.log(`Using HDFC Bank data from object: ${jsonObj.code}`);
        break;
      }
    }
    
    if (!targetJsonData) {
      console.log('No suitable JSON object found, using first available');
      targetJsonData = jsonObjects[0];
    }
    
    return targetJsonData?.data || [];
    
  } catch (error) {
    console.error('Error loading real API data:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = await params;
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching balance sheet data for symbol: ${symbol}`);

    // Load real API data from the JSON file
    const realApiData = loadRealApiData();
    
    if (realApiData.length === 0) {
      return NextResponse.json(
        { error: 'No API data available' },
        { status: 404 }
      );
    }

    // Map the real API data to balance sheet format
    const balanceSheetData = mapApiToBalanceSheetData(realApiData, symbol.toUpperCase());

    console.log('Processed balance sheet data for', symbol, ':', {
      companyName: balanceSheetData.company_name,
      sector: balanceSheetData.sector,
      reportType: balanceSheetData.report_type,
      hasAssets: !!balanceSheetData.total_assets_fy_h,
      hasLiabilities: !!balanceSheetData.total_liabilities_fy_h,
      hasEquity: !!balanceSheetData.total_equity_fy_h,
      fieldsAvailable: Object.keys(balanceSheetData).filter(k => k.endsWith('_fy_h')).length
    });

    return NextResponse.json(balanceSheetData);

  } catch (error) {
    console.error('Error in balance sheet API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}