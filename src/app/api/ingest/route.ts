import { NextRequest, NextResponse } from 'next/server'
import { ComprehensiveDataIngestionService } from '@/lib/data-ingestion/comprehensive-ingestion-service'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'

// Request schema for manual data ingestion
const IngestionRequestSchema = z.object({
  data: z.array(z.unknown()).optional(),
  apiUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  source: z.enum(['manual', 'api', 'file']).default('manual')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedRequest = IngestionRequestSchema.parse(body)

    const ingestionService = new ComprehensiveDataIngestionService()

    if (!validatedRequest.data || validatedRequest.data.length === 0) {
      return NextResponse.json(
        { error: 'Data array is required for ingestion' },
        { status: 400 }
      )
    }

    console.log(`🚀 Starting ${validatedRequest.source} ingestion for ${validatedRequest.data.length} records`)

    const result = await ingestionService.ingestBalanceSheetData(validatedRequest.data)

    // Clean up Prisma connection
    await ingestionService.disconnect()

    console.log('✅ Ingestion completed:', {
      success: result.success,
      processed: result.processed,
      errors: result.errors.length,
      stats: result.stats
    })

    return NextResponse.json({
      message: 'Data ingestion completed',
      ...result
    })

  } catch (error) {
    console.error('Data ingestion error:', error)

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
        error: 'Data ingestion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to test the ingestion service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const test = searchParams.get('test')

    if (test === 'sample') {
      try {
        // Use async file operations with proper path resolution
        const dataPath = path.join(process.cwd(), 'data.json')
        const fileContent = await fs.readFile(dataPath, 'utf8')
        const sampleData = JSON.parse(fileContent)

        const ingestionService = new ComprehensiveDataIngestionService()
        const result = await ingestionService.ingestBalanceSheetData(sampleData)

        // Clean up Prisma connection
        await ingestionService.disconnect()

        return NextResponse.json({
          message: 'Test completed with sample data',
          ...result
        })
      } catch (fileError) {
        console.error('Failed to read sample data file:', fileError)
        return NextResponse.json(
          {
            error: 'Failed to read sample data file',
            details: fileError instanceof Error ? fileError.message : 'Unknown file error'
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: 'Data Ingestion API',
      endpoints: {
        'POST /api/ingest': 'Ingest balance sheet data',
        'GET /api/ingest?test=sample': 'Test with sample data'
      },
      usage: {
        manual: {
          method: 'POST',
          body: {
            source: 'manual',
            data: [/* array of balance sheet objects */]
          }
        },
        api: {
          method: 'POST',
          body: {
            source: 'api',
            apiUrl: 'https://your-api.com/data',
            apiKey: 'optional-api-key'
          }
        }
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}