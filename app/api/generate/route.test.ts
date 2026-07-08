import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/publisher', () => ({
  generateProductWebsiteHtml: vi.fn(async () => ({
    html: '<!DOCTYPE html><html><body>AI HTML Publisher</body></html>',
    title: 'AI HTML Publisher',
    templateId: 'website-01-fui',
  })),
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
      pageType: 'dashboard',
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
})
