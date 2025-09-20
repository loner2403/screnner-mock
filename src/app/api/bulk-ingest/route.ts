import { NextRequest, NextResponse } from 'next/server'
import { ComprehensiveDataIngestionService } from '@/lib/data-ingestion/comprehensive-ingestion-service'
import { z } from 'zod'

const BulkIngestRequestSchema = z.object({
  filePath: z.string()
    .regex(/^\.\/[a-zA-Z0-9_\-]+\.json$/, 'Invalid file path format')
    .default('./data.json'),
  latestOnly: z.boolean().default(true),
  upsert: z.boolean().default(true)
})  

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const config = BulkIngestRequestSchema.parse(body)

    console.log('🚀 Starting bulk ingestion with config:', config)

    const ingestionService = new ComprehensiveDataIngestionService()

    const result = await ingestionService.ingestFromFile(config.filePath, {
      latestOnly: config.latestOnly,
      upsert: config.upsert
    })

    // Clean up Prisma connection
    await ingestionService.disconnect()

    console.log('✅ Bulk ingestion completed:', result)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      processed: result.processed,
      stats: result.stats
    })

  } catch (error) {
    console.error('Bulk ingestion error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Bulk ingestion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Bulk Ingestion API for Balance Sheet Data',
    endpoints: {
      'POST /api/bulk-ingest': 'Ingest balance sheet data from file'
    },
    usage: {
      method: 'POST',
      body: {
        filePath: './data.json',
        latestOnly: true,
        upsert: true
      }
    },
    notes: [
      'Ingests comprehensive balance sheet data',
      'All values converted to crores',
      'Creates proper indexes for screener performance',
      'latestOnly=true ingests only the most recent year data'
    ]
  })
}