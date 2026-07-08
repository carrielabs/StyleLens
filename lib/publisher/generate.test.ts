import { describe, expect, it } from 'vitest'
import { generateProductWebsiteHtml } from './index'

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
})
