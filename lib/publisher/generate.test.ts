import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
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

const DASHBOARD_TEMPLATES = [
  'dashboard-01-blue-business',
  'dashboard-02-premium-dark',
  'dashboard-03-lean-cyber-analytics',
  'dashboard-04-premium-midnight',
  'dashboard-05-premium-cyber-dark',
  'dashboard-06-warm-paper-analytics',
  'dashboard-07-dark-bento-analytics',
  'dashboard-08-saas-executive-analytics',
  'dashboard-09-editorial-corporate-analytics',
  'dashboard-10-executive-logic-report',
  'dashboard-11-saas-growth-health-report',
  'dashboard-12-atomic-bento-strategy-report',
  'dashboard-13-corporate-blue-analytics-report',
  'dashboard-14-financial-blue-analytics-report',
  'dashboard-15-consulting-data-report',
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

function expectEditingRuntime(html: string) {
  expect(html).toContain('data-ahp-runtime')
  expect(html).toContain('data-style="moduleUp"')
  expect(html).toContain('data-style="moduleDown"')
  expect(html).toContain('data-style="moduleToggle"')
  expect(html).toContain('data-style="moduleDuplicate"')
  expect(html).toContain('data-style="moduleDelete"')
}

const originalBaseUrl = process.env.AHP_TEMPLATE_RAW_BASE_URL
const originalForceRemote = process.env.AHP_TEMPLATE_FORCE_REMOTE
const originalToken = process.env.AHP_TEMPLATE_GITHUB_TOKEN
const originalFetch = globalThis.fetch
const originalCwd = process.cwd()

afterEach(async () => {
  process.chdir(originalCwd)
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
    expectEditingRuntime(result.html)
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

  it('generates when the runtime cwd has no node_modules bin directory', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'stylelens-vercel-runtime-'))

    process.env.AHP_TEMPLATE_RAW_BASE_URL = 'https://raw.githubusercontent.com/carrielabs/StyleLens/main'
    process.env.AHP_TEMPLATE_FORCE_REMOTE = 'true'
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const relativePath = String(url).split('/main/')[1]
      const text = await readFile(path.join(originalCwd, relativePath), 'utf8')
      return new Response(text, { status: 200 })
    }) as typeof fetch

    try {
      process.chdir(tempDir)

      const result = await generateProductWebsiteHtml({ sourceText, templateId: 'website-01-fui' })

      expect(result.html).toContain('data-ahp-inlined-tailwind="true"')
      expect(result.html).not.toContain('cdn.tailwindcss.com')
    } finally {
      process.chdir(originalCwd)
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('generates dashboard HTML from a dashboard template', async () => {
    const result = await generateProductWebsiteHtml({
      sourceText: '# 经营数据看板\n\n用于查看核心指标、图表和业务结论。',
      templateId: 'dashboard-01-blue-business',
      pageType: 'dashboard',
    })

    expect(result.title).toBe('经营数据看板')
    expect(result.templateId).toBe('dashboard-01-blue-business')
    expect(result.html).toContain('经营数据看板')
    expect(result.html).toContain('window.REPORT_DATA')
    expectEditingRuntime(result.html)
    expect(result.html).toContain('dashboard-01-blue-business')
  })

  it.each(DASHBOARD_TEMPLATES)('generates dashboard HTML for %s', async templateId => {
    const result = await generateProductWebsiteHtml({
      sourceText: '# 经营数据看板\n\n用于查看核心指标、图表和业务结论。',
      templateId,
      pageType: 'dashboard',
    })

    expect(result.title).toBe('经营数据看板')
    expect(result.templateId).toBe(templateId)
    expect(result.html).toContain('经营数据看板')
    expectEditingRuntime(result.html)
  })
})
