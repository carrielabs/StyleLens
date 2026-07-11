import { describe, expect, it, vi } from 'vitest'

const generateMock = vi.hoisted(() => vi.fn(async (options: { templateId: string }) => ({
  html: '<!DOCTYPE html><html><body>AI HTML Publisher</body></html>',
  title: 'AI HTML Publisher',
  templateId: options.templateId,
})))

vi.mock('@/lib/publisher', () => ({
  generateProductWebsiteHtml: generateMock,
}))

import { POST } from './route'

async function postJson(body: unknown) {
  return POST(new Request('http://localhost/api/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  }))
}

describe('/api/generate', () => {
  it('rejects empty text', async () => {
    const res = await postJson({ sourceText: '' })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('rejects unsupported page type', async () => {
    const res = await postJson({
      sourceText: '# Demo',
      pageType: 'ppt',
    })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns generated HTML for valid text', async () => {
    const res = await postJson({
      sourceText: '# AI HTML Publisher',
      templateId: 'website-01-fui',
      pageType: 'product-website',
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.result.html).toContain('AI HTML Publisher')
  })

  it('returns generated HTML for dashboard text', async () => {
    const res = await postJson({
      sourceText: '# 经营数据看板',
      templateId: 'dashboard-01-blue-business',
      pageType: 'dashboard',
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.result.templateId).toBe('dashboard-01-blue-business')
    expect(generateMock).toHaveBeenCalledWith({
      sourceText: '# 经营数据看板',
      templateId: 'dashboard-01-blue-business',
      pageType: 'dashboard',
    })
  })
})
