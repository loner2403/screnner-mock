import { NextRequest, NextResponse } from 'next/server';

const ROIC_API_KEY = process.env.ROIC_API_KEY;
const ROIC_BASE_URL = process.env.ROIC_BASE_URL || 'https://api.roic.ai';

if (!ROIC_API_KEY) {
  throw new Error('ROIC_API_KEY environment variable is required');
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        const limit = searchParams.get('limit') || '10';

        if (!query || query.length < 2) {
            return NextResponse.json(
                { error: 'Query must be at least 2 characters' },
                { status: 400 }
            );
        }

        // Call ROIC API for company name search with higher limit for better results
        const searchLimit = Math.max(parseInt(limit) * 2, 20); // Get more results to filter from
        const roicUrl = `${ROIC_BASE_URL}/v2/tickers/search/name?query=${encodeURIComponent(query)}&limit=${searchLimit}&apikey=${ROIC_API_KEY}`;

        const response = await fetch(roicUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`ROIC API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform the response to match our interface and filter for NSE companies only
        const results = (data || [])
            .filter((item: any) => {
                const symbol = item.symbol || item.ticker || '';
                // Only include companies with .NS (NSE) extension for Indian market
                return symbol.endsWith('.NS');
            })
            .slice(0, parseInt(limit)) // Limit final results to requested amount
            .map((item: any) => ({
                symbol: item.symbol || item.ticker || '',
                name: item.name || item.company_name || '',
                exchange: item.exchange || ''
            }));

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Failed to search stocks' },
            { status: 500 }
        );
    }
}