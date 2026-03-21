import { NextResponse } from 'next/server'
import { extractStyleWithAI } from '@/lib/api/aiExtract'
import { saveToLibrary } from '@/lib/storage/libraryStore'
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

    // Attempt to save to library (will only persist if user is logged in)
    try {
      const { createClient: createServerClient } = await import('@/lib/storage/supabaseServer')
      const supabase = await createServerClient()
      await saveToLibrary(report, body.imageBase64, supabase)
    } catch (dbError) {
      console.error('Failed to save to library:', dbError)
      // We don't block the response even if saving fails
    }

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    console.error('Extraction Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract style' },
      { status: 500 }
    )
  }
}
