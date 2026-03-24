import { NextResponse } from 'next/server'
import { extractStyleWithAI } from '@/lib/api/aiExtract'
import type { ExtractRequest } from '@/lib/types'

export const maxDuration = 60 // Allow up to 60s for Vercel Hobby tier function execution

function toUserFacingExtractError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('location is not supported for the api use')
    || normalized.includes('user location is not supported')
    || normalized.includes('当前 ai 解析服务在此网络环境下暂不可用')) {
    return '当前网络环境暂时无法使用 AI 解析，请切换网络环境后重试。'
  }

  if (normalized.includes('all gemini keys failed')) {
    return 'AI 解析暂时不可用，请稍后再试。'
  }

  return message || '提取失败，请重试'
}

export async function POST(req: Request) {
  try {
    const body: ExtractRequest = await req.json()

    console.log('[font-debug] /api/extract received pageAnalysis', {
      hasPageAnalysis: Boolean(body.pageAnalysis),
      typographyCandidates: body.pageAnalysis?.typographyCandidates?.length || 0,
      typographyTokens: body.pageAnalysis?.typographyTokens?.length || 0,
      candidateSizes: (body.pageAnalysis?.typographyCandidates || [])
        .slice(0, 8)
        .map(candidate => candidate.fontSize),
      tokenSizes: (body.pageAnalysis?.typographyTokens || [])
        .slice(0, 8)
        .map(token => token.fontSize),
    })

    if (!body.imageBase64 && !body.screenshotUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing imageBase64 or screenshotUrl' },
        { status: 400 }
      )
    }

    // Guard against oversized uploads (20MB base64 ≈ ~15MB raw image)
    const MAX_BASE64_BYTES = 20 * 1024 * 1024
    if (body.imageBase64 && Buffer.byteLength(body.imageBase64, 'utf8') > MAX_BASE64_BYTES) {
      return NextResponse.json(
        { success: false, error: '图片文件过大，请上传 20MB 以内的图片' },
        { status: 413 }
      )
    }

    const report = await extractStyleWithAI(body)

    return NextResponse.json({ success: true, report })
  } catch (error: unknown) {
    console.error('Final Extraction Error Interface:', error)
    const message = error instanceof Error ? error.message : '提取失败，请重试'
    return NextResponse.json(
      { success: false, error: toUserFacingExtractError(message) },
      { status: 500 }
    )
  }
}
