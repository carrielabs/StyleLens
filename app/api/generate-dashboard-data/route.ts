import { NextResponse } from 'next/server'
import { generateDashboardHtmlFromDataFile } from '@/lib/publisher/dataDashboard'

export const maxDuration = 60

const MAX_FILE_BYTES = 2 * 1024 * 1024

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const templateId = String(formData.get('templateId') || 'dashboard-15-consulting-data-report')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: '请上传一个 CSV、JSON 或 XLSX 数据文件' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: '数据文件过大，请控制在 2MB 以内' },
        { status: 413 }
      )
    }

    const bytes = await readFileBytes(file)
    const result = await generateDashboardHtmlFromDataFile({
      fileName: file.name,
      contentType: file.type,
      bytes,
      templateId,
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

async function readFileBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === 'function') {
    return new Uint8Array(await file.arrayBuffer())
  }
  if (typeof file.text === 'function') {
    return new TextEncoder().encode(await file.text())
  }
  throw new Error('无法读取上传文件')
}
