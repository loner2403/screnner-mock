
import { NextResponse } from 'next/server';
import apiResponse from '../../../../../api-response.json';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  // In a real application, you would fetch data from an external API using the symbol.
  // For this example, we're using the mock api-response.json file.
  
  // The mock data is a large array of all data points. We will return the whole thing
  // and let the frontend process and filter it.
  const data = apiResponse.data;

  // The historical data is in fields ending with _h, which are arrays of values.
  // We need to transform this flat structure into a more usable format.
  // For now, we will just return the data as is.

  return NextResponse.json(data);
}
