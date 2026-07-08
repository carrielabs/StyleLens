import { NextResponse } from 'next/server'
import { generateProductWebsiteHtml } from '@/lib/publisher'

export const maxDuration = 60

const MAX_TEXT_BYTES = 200 * 1024

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sourceText = String(body.sourceText || '')
    const templateId = String(body.templateId || 'website-01-fui')
    const pageType = String(body.pageType || 'product-website')

    if (pageType !== 'product-website') {
      return NextResponse.json(
        { success: false, error: '第一版只支持生成产品官网' },
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
      pageType: 'product-website',
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
