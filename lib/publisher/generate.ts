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

const DASHBOARD_TEMPLATES = new Set([
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
  'dashboard-16-executive-muted-dashboard',
  'dashboard-17-dark-enterprise-analytics',
  'dashboard-18-enterprise-green-analytics-report',
  'dashboard-19-warm-soft-enterprise-dashboard',
  'dashboard-20-live-commerce-dark-analytics',
  'dashboard-21-corporate-operating-analysis-report',
  'dashboard-22-glassmorphism-analytics-dashboard',
  'dashboard-23-enterprise-teal-report',
  'dashboard-24-cream-macaron-medical-analytics',
  'dashboard-25-space-cyber-charging-safety-dashboard',
  'dashboard-26-emerald-b2b-analytics-dashboard',
  'dashboard-27-powerbi-hr-operations-report',
  'dashboard-28-macos-glass-transaction-dashboard',
])

type WebsiteEngine = {
  buildHtmlFromText(options: {
    text: string
    type: 'product-website' | 'dashboard'
    template: string
  }): Promise<string>
}

export async function buildProductWebsiteHtml(options: {
  sourceText: string
  templateId: string
  pageType?: 'product-website' | 'dashboard'
}): Promise<PublisherResult> {
  const pageType = options.pageType || 'product-website'
  const templateId = options.templateId || (pageType === 'dashboard' ? 'dashboard-01-blue-business' : 'website-01-fui')

  if (pageType === 'product-website' && !WEBSITE_TEMPLATES.has(templateId)) {
    throw new Error('产品官网只能使用官网模板')
  }
  if (pageType === 'dashboard' && !DASHBOARD_TEMPLATES.has(templateId)) {
    throw new Error('dashboard 只能使用 dashboard 模板')
  }

  const { buildHtmlFromText } = await import('./website-engine.mjs') as WebsiteEngine
  const html = await buildHtmlFromText({
    text: options.sourceText,
    type: pageType,
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
