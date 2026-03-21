import { NextResponse } from 'next/server'
import { extractStyleWithAI } from '@/lib/api/aiExtract'
import type { ExtractRequest } from '@/lib/types'

export const maxDuration = 60 // Allow up to 60s for Vercel Hobby tier function execution

export async function POST(req: Request) {
  try {
    const body: ExtractRequest = await req.json()

    if (!body.imageBase64 && !body.screenshotUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing imageBase64 or screenshotUrl' },
        { status: 400 }
      )
    }

    const report = await extractStyleWithAI(body)

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    console.error('Extraction Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract style' },
      { status: 500 }
    )
  }
}
