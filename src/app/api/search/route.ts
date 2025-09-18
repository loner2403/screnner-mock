import { NextRequest, NextResponse } from 'next/server';

const ROIC_API_KEY = process.env.ROIC_API_KEY || 'cb8ab741035240bc813f12cd897a776d';
const ROIC_BASE_URL = process.env.ROIC_BASE_URL || 'https://api.roic.ai';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        const limit = searchParams.get('limit') || '10';

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // Call ROIC API for company name search
        const roicUrl = `${ROIC_BASE_URL}/v2/tickers/search/name?query=${encodeURIComponent(query)}&limit=${limit}&apikey=${ROIC_API_KEY}`;

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

        // Transform the response to match our interface
        const results = (data || []).map((item: any) => ({
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