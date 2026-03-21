import { NextResponse } from 'next/server'
import { captureScreenshot } from '@/lib/api/screenshotter'
import type { ScreenshotRequest } from '@/lib/types'

export const maxDuration = 30 

export async function POST(req: Request) {
  try {
    const body: ScreenshotRequest = await req.json()

    if (!body.url) {
      return NextResponse.json(
        { success: false, error: 'Missing target URL' },
        { status: 400 }
      )
    }

    const result = await captureScreenshot(body.url)

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Screenshot API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to capture screenshot' },
      { status: 500 }
    )
  }
}
