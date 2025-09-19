// Simple utility functions for quarterly data formatting

// Format currency values (data is already in crores from API)
export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  // Use Indian number formatting
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(Math.abs(value));
}

// Format percentage values
export function formatPercentage(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  return `${Math.round(value)}%`;
}

// Format number values (like EPS)
export function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  return value.toFixed(2);
}

// Generate quarter labels from API dates
export function generateQuarterLabels(dates: string[]): string[] {
  return dates.map(dateStr => {
    const date = new Date(dateStr);
    const month = date.getMonth(); // 0-based
    const year = date.getFullYear();

    if (month >= 0 && month <= 2) {
      return `Mar ${year}`;
    } else if (month >= 3 && month <= 5) {
      return `Jun ${year}`;
    } else if (month >= 6 && month <= 8) {
      return `Sep ${year}`;
    } else {
      return `Dec ${year}`;
    }
  });
}

// Format value based on type
export function formatValue(value: number | null, type: 'currency' | 'percentage' | 'number'): string {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
      return formatNumber(value);
    default:
      return '-';
  }
}