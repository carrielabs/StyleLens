import type { PublisherResult } from './types'

const WEBSITE_TEMPLATES = new Set([
  'website-01-fui',
  'website-02-soft-surrealism',
  'website-03-red-clay',
  'website-04-premium-midnight',
  'website-05-voltflow-cyber-saas',
  'website-07-blueprint-agent-platform',
  'website-08-editorial-apple-tech',
  'website-09-blue-shift-portfolio',
])

type WebsiteEngine = {
  buildHtmlFromText(options: {
    text: string
    type: 'product-website'
    template: string
  }): Promise<string>
}

export async function buildProductWebsiteHtml(options: {
  sourceText: string
  templateId: string
}): Promise<PublisherResult> {
  const templateId = options.templateId || 'website-01-fui'
  if (!WEBSITE_TEMPLATES.has(templateId)) {
    throw new Error('第一版只支持官网模板')
  }

  const { buildHtmlFromText } = await import('./website-engine.mjs') as WebsiteEngine
  const html = await buildHtmlFromText({
    text: options.sourceText,
    type: 'product-website',
    template: templateId,
  })

  return {
    html,
    title: extractTitle(options.sourceText),
    templateId,
  }
}

function extractTitle(sourceText: string): string {
  const lines = sourceText.split(/\r?\n/)
  const heading = lines.find(line => /^#\s+/.test(line.trim()))
  const raw = heading
    ? heading.replace(/^#\s+/, '')
    : lines.find(line => line.trim())

  return String(raw || '生成官网')
    .replace(/[*_`>#]/g, '')
    .trim()
    .slice(0, 28) || '生成官网'
}
