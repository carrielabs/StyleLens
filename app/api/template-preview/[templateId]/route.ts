import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const SAFE_TEMPLATE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function GET(
  _req: Request,
  context: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await context.params

  if (!SAFE_TEMPLATE_ID.test(templateId)) {
    return new NextResponse('Invalid template id', { status: 400 })
  }

  const baseDir = path.join(process.cwd(), 'templates', '_incoming')
  const templatePath = path.resolve(baseDir, templateId, 'template.html')

  if (!templatePath.startsWith(baseDir + path.sep)) {
    return new NextResponse('Invalid template path', { status: 400 })
  }

  try {
    const html = await fs.readFile(templatePath, 'utf8')
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return new NextResponse('Template preview not found', { status: 404 })
  }
}
