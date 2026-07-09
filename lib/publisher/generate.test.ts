import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateProductWebsiteHtml } from './index'
import { loadTemplate } from './templates.mjs'

const WEBSITE_TEMPLATES = [
  'website-01-fui',
  'website-02-soft-surrealism',
  'website-03-red-clay',
  'website-04-premium-midnight',
  'website-05-voltflow-cyber-saas',
  'website-07-blueprint-agent-platform',
  'website-08-editorial-apple-tech',
  'website-09-blue-shift-portfolio',
]

const sourceText = [
  '# AI HTML Publisher',
  '',
  '把已有产品材料稳定转换成高质量、可编辑、可导出的 HTML 页面。',
  '',
  '## 用户痛点',
  '- AI 自由设计页面不稳定',
  '- 反复修改容易重画整页',
  '',
  '## 核心能力',
  '- 只使用已验收模板',
  '- 页面内直接编辑文字',
  '- 导出完整 HTML 文件',
  '',
  '## 使用流程',
  '- 输入材料',
  '- 选择模板',
  '- 生成页面',
  '- 编辑导出',
].join('\n')

const originalBaseUrl = process.env.AHP_TEMPLATE_RAW_BASE_URL
const originalForceRemote = process.env.AHP_TEMPLATE_FORCE_REMOTE
const originalToken = process.env.AHP_TEMPLATE_GITHUB_TOKEN
const originalFetch = globalThis.fetch

afterEach(() => {
  if (originalBaseUrl === undefined) delete process.env.AHP_TEMPLATE_RAW_BASE_URL
  else process.env.AHP_TEMPLATE_RAW_BASE_URL = originalBaseUrl
  if (originalForceRemote === undefined) delete process.env.AHP_TEMPLATE_FORCE_REMOTE
  else process.env.AHP_TEMPLATE_FORCE_REMOTE = originalForceRemote
  if (originalToken === undefined) delete process.env.AHP_TEMPLATE_GITHUB_TOKEN
  else process.env.AHP_TEMPLATE_GITHUB_TOKEN = originalToken
  globalThis.fetch = originalFetch
})

describe('generateProductWebsiteHtml', () => {
  it.each(WEBSITE_TEMPLATES)('generates clean HTML for %s', async templateId => {
    const result = await generateProductWebsiteHtml({ sourceText, templateId })

    expect(result.title).toBe('AI HTML Publisher')
    expect(result.templateId).toBe(templateId)
    expect(result.html).toContain('AI HTML Publisher')
    expect(result.html).toContain('data-ahp-runtime')
    expect(result.html).not.toMatch(/<script[^>]+src="https?:\/\//i)
    expect(result.html).not.toMatch(/<link[^>]+href="https?:\/\//i)
    expect(result.html).not.toMatch(/cdn\.tailwindcss|fonts\.googleapis|localhost|127\.0\.0\.1|onclick=|document\.write|href="#"/i)
  })

  it('can read templates from GitHub raw when remote mode is enabled', async () => {
    process.env.AHP_TEMPLATE_RAW_BASE_URL = 'https://raw.githubusercontent.com/carrielabs/StyleLens/main'
    process.env.AHP_TEMPLATE_FORCE_REMOTE = 'true'
    process.env.AHP_TEMPLATE_GITHUB_TOKEN = 'test-token'

    const urls: string[] = []
    const fetchMock = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
      urls.push(String(url))
      expect(options?.headers).toEqual({ Authorization: 'Bearer test-token' })
      if (String(url).endsWith('/template.html')) {
        return new Response('<!doctype html><html><body>remote template</body></html>', { status: 200 })
      }
      return new Response(JSON.stringify({ id: 'website-01-fui' }), { status: 200 })
    })
    globalThis.fetch = fetchMock as typeof fetch

    const template = await loadTemplate('website-01-fui')

    expect(template.html).toBe('<!doctype html><html><body>remote template</body></html>')
    expect(template.config.id).toBe('website-01-fui')
    expect(urls).toEqual([
      'https://raw.githubusercontent.com/carrielabs/StyleLens/main/templates/_incoming/website-01-fui/template.html',
      'https://raw.githubusercontent.com/carrielabs/StyleLens/main/templates/_incoming/website-01-fui/template.json',
    ])
  })
})
