# Chart Data API

This API endpoint provides historical stock price data (OHLCV) for Indian stocks listed on NSE and BSE exchanges.

## Endpoint

```
GET /api/charts/[symbol]
```

## Parameters

### Path Parameters
- `symbol` (required): Stock symbol (e.g., "HDFCBANK", "RELIANCE", "TCS")
  - Can include exchange prefix (e.g., "NSE:HDFCBANK") or just the symbol
  - Exchange prefix will be automatically removed for API calls

### Query Parameters
- `timeframe` (optional): Time period for historical data
  - Valid values: `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `2Y`, `5Y`
  - Default: `1Y`
- `indicators` (optional): Comma-separated list of technical indicators (future feature)
  - Example: `sma,ema,rsi`

## Response Format

### Success Response (200)
```json
{
  "symbol": "HDFCBANK",
  "data": [
    {
      "timestamp": 1672531200000,
      "open": 1650.50,
      "high": 1675.25,
      "low": 1640.75,
      "close": 1668.90,
      "volume": 2500000,
      "date": "2023-01-01T00:00:00.000Z"
    }
  ],
  "metadata": {
    "exchange": "NSE",
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "lastUpdate": "2025-09-05T17:30:00.000Z"
  }
}
```

### Error Response (400)
```json
{
  "error": "Invalid timeframe. Valid options: 1D, 1W, 1M, 3M, 6M, 1Y, 2Y, 5Y"
}
```

### Error Response (500)
```json
{
  "error": "Failed to fetch chart data",
  "message": "Network error or API unavailable"
}
```

## Data Sources

The API uses a fallback mechanism to ensure data availability:

1. **Primary**: RapidAPI (Yahoo Finance) - Real-time and historical data
2. **Fallback**: Alpha Vantage API - Alternative data source
3. **Final Fallback**: Generated mock data - Ensures API always returns data

## Caching

- Chart data is cached for **15 minutes** to improve performance
- Cache key format: `chart:{symbol}:{timeframe}`
- Automatic cache cleanup when cache size exceeds 1000 entries

## Usage Examples

### Basic Usage
```javascript
// Fetch 1-year chart data for HDFC Bank
const response = await fetch('/api/charts/HDFCBANK?timeframe=1Y');
const chartData = await response.json();

console.log(`Symbol: ${chartData.symbol}`);
console.log(`Data points: ${chartData.data.length}`);
```

### Different Timeframes
```javascript
// Fetch different timeframes
const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y'];

for (const timeframe of timeframes) {
  const response = await fetch(`/api/charts/RELIANCE?timeframe=${timeframe}`);
  const data = await response.json();
  console.log(`${timeframe}: ${data.data.length} data points`);
}
```

### Error Handling
```javascript
try {
  const response = await fetch('/api/charts/INVALID_SYMBOL?timeframe=1M');
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error);
    return;
  }
  
  const chartData = await response.json();
  // Process chart data...
  
} catch (error) {
  console.error('Network error:', error);
}
```

## Environment Variables

Required environment variables:

```env
# Primary API (RapidAPI)
RAPIDAPI_KEY=your_rapidapi_key_here

# Fallback API (Alpha Vantage)
ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
```

## Performance Considerations

- **Caching**: Data is cached for 15 minutes to reduce API calls
- **Fallback Strategy**: Multiple data sources ensure high availability
- **Mock Data**: Always returns data even when all APIs fail
- **Memory Management**: Automatic cache cleanup prevents memory leaks

## Rate Limits

- RapidAPI: Depends on your subscription plan
- Alpha Vantage: 5 API requests per minute (free tier)
- Mock data: No limits (generated locally)

## Supported Exchanges

- **NSE** (National Stock Exchange of India)
- **BSE** (Bombay Stock Exchange)

## Data Quality

- **Real Data**: Fetched from reliable financial data providers
- **OHLCV Format**: Open, High, Low, Close, Volume data
- **Indian Market**: Optimized for Indian stock symbols and exchanges
- **Currency**: All prices in Indian Rupees (INR)
- **Timezone**: Asia/Kolkata

## Future Enhancements

- Technical indicators calculation (SMA, EMA, RSI, MACD, Bollinger Bands)
- Intraday data with different intervals (1m, 5m, 15m, 1h)
- WebSocket support for real-time updates
- Additional exchanges support
- Data export functionality