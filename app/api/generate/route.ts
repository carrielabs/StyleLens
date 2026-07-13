import { NextResponse } from 'next/server'
import { generateProductWebsiteHtml } from '@/lib/publisher'

export const maxDuration = 60

const MAX_TEXT_BYTES = 200 * 1024

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sourceText = String(body.sourceText || '')
    const pageType = String(body.pageType || 'product-website')
    const templateId = String(body.templateId || (pageType === 'dashboard' ? 'dashboard-01-blue-business' : 'website-01-fui'))
    const backgroundColor = normalizeHexColor(body.backgroundColor)

    if (!['product-website', 'dashboard'].includes(pageType)) {
      return NextResponse.json(
        { success: false, error: `暂不支持的页面类型：${pageType}` },
        { status: 400 }
      )
    }

    if (!sourceText.trim()) {
      return NextResponse.json(
        { success: false, error: '请先输入文本材料' },
        { status: 400 }
      )
    }

    if (Buffer.byteLength(sourceText, 'utf8') > MAX_TEXT_BYTES) {
      return NextResponse.json(
        { success: false, error: '文本过长，请控制在 200KB 以内' },
        { status: 413 }
      )
    }

    const result = await generateProductWebsiteHtml({
      sourceText,
      templateId,
      pageType: pageType as 'product-website' | 'dashboard',
      backgroundColor,
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成失败，请重试'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

function normalizeHexColor(value: unknown) {
  const text = String(value || '').trim()
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : undefined
}
