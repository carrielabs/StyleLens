import { NextResponse } from 'next/server'
import type { StyleReport } from '@/lib/types'
import { buildDembrandtDrift } from '@/lib/integrations/dembrandt'

export const maxDuration = 30

type DriftRequestBody = {
  baseline?: StyleReport
  candidate?: StyleReport
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DriftRequestBody

    if (!body.baseline || !body.candidate) {
      return NextResponse.json(
        { success: false, error: '缺少 baseline 或 candidate 报告' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      drift: buildDembrandtDrift(body.baseline, body.candidate),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'drift 计算失败'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
