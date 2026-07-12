import { describe, expect, it } from 'vitest'
import {
  buildDashboardDataModel,
  generateDashboardHtmlFromDataFile,
  parseDataFile,
} from './dataDashboard'

const csvBytes = new TextEncoder().encode([
  'date,channel,revenue,orders',
  '2026-01-01,Direct,1200,12',
  '2026-01-02,Search,1800,18',
  '2026-01-03,Direct,3000,30',
].join('\n'))

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

const xlsxBytes = Buffer.from(
  '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',
  'base64'
)

const jsonBytes = new TextEncoder().encode(JSON.stringify([
  { date: '2026-01-01', channel: 'Direct', revenue: 1200, orders: 12 },
  { date: '2026-01-02', channel: 'Search', revenue: 1800, orders: 18 },
  { date: '2026-01-03', channel: 'Direct', revenue: 3000, orders: 30 },
]))

const DATA_FILE_CASES = [
  { fileName: 'sales.csv', contentType: 'text/csv', bytes: csvBytes, expectedTotal: '6,000' },
  { fileName: 'sales.json', contentType: 'application/json', bytes: jsonBytes, expectedTotal: '6,000' },
  { fileName: 'sales.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes: xlsxBytes, expectedTotal: '300' },
]

const TEMPLATE_FILE_CASES = DASHBOARD_TEMPLATES.flatMap(templateId =>
  DATA_FILE_CASES.map(file => ({ ...file, templateId }))
)

describe('data dashboard files', () => {
  it('parses csv rows and infers basic field types', async () => {
    const dataset = await parseDataFile({
      fileName: 'sales.csv',
      contentType: 'text/csv',
      bytes: csvBytes,
    })

    expect(dataset.rows).toHaveLength(3)
    expect(dataset.fields).toEqual([
      { name: 'date', type: 'date' },
      { name: 'channel', type: 'category' },
      { name: 'revenue', type: 'number' },
      { name: 'orders', type: 'number' },
    ])
  })

  it('parses json array rows', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify([
      { date: '2026-01-01', channel: 'Direct', revenue: 100 },
      { date: '2026-01-02', channel: 'Search', revenue: 200 },
    ]))

    const dataset = await parseDataFile({
      fileName: 'sales.json',
      contentType: 'application/json',
      bytes,
    })

    expect(dataset.rows).toEqual([
      { date: '2026-01-01', channel: 'Direct', revenue: 100 },
      { date: '2026-01-02', channel: 'Search', revenue: 200 },
    ])
    expect(dataset.fields.find(field => field.name === 'revenue')?.type).toBe('number')
  })

  it('parses the first worksheet from xlsx files', async () => {
    const dataset = await parseDataFile({
      fileName: 'sales.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      bytes: xlsxBytes,
    })

    expect(dataset.rows).toEqual([
      { date: '2026-01-01', channel: 'Direct', revenue: 100 },
      { date: '2026-01-02', channel: 'Search', revenue: 200 },
    ])
  })

  it('builds deterministic dashboard metrics from parsed rows', async () => {
    const dataset = await parseDataFile({
      fileName: 'sales.csv',
      contentType: 'text/csv',
      bytes: csvBytes,
    })

    const model = buildDashboardDataModel(dataset)

    expect(model.title).toBe('sales 数据看板')
    expect(model.primaryMetric.name).toBe('revenue')
    expect(model.primaryMetric.total).toBe(6000)
    expect(model.kpis[0]).toEqual({ label: 'revenue 合计', value: '6,000', trend: '3 条记录' })
    expect(model.categoryBreakdown).toEqual([
      { label: 'Direct', value: 4200 },
      { label: 'Search', value: 1800 },
    ])
    expect(model.trend).toEqual([
      { label: '2026-01-01', value: 1200 },
      { label: '2026-01-02', value: 1800 },
      { label: '2026-01-03', value: 3000 },
    ])
  })

  it('injects real data into the dashboard html', async () => {
    const result = await generateDashboardHtmlFromDataFile({
      fileName: 'sales.csv',
      contentType: 'text/csv',
      bytes: csvBytes,
      templateId: 'dashboard-15-consulting-data-report',
    })

    expect(result.title).toBe('sales 数据看板')
    expect(result.templateId).toBe('dashboard-15-consulting-data-report')
    expect(result.html).toContain('sales 数据看板')
    expect(result.html).toContain('revenue 合计')
    expect(result.html).toContain('6,000')
    expect(result.html).toContain("labels: ['2026-01-01', '2026-01-02', '2026-01-03']")
    expect(result.html).toContain("labels: ['Direct', 'Search']")
    expect(result.html).toContain('data-ahp-runtime')
    expect(result.html.indexOf('data-ahp-dashboard-data')).toBeLessThan(result.html.indexOf('<script data-ahp-runtime'))
    expect(result.html).toContain('data-ahp-dashboard-bind="kpi.0.value"')
    expect(result.html).toContain('data-ahp-dashboard-editor')
  })

  it.each(TEMPLATE_FILE_CASES)('generates real data dashboard html for $templateId from $fileName', async ({ templateId, fileName, contentType, bytes, expectedTotal }) => {
    const result = await generateDashboardHtmlFromDataFile({
      fileName,
      contentType,
      bytes,
      templateId,
    })

    expect(result.templateId).toBe(templateId)
    expect(result.title).toBe('sales 数据看板')
    expect(result.html).toContain('sales 数据看板')
    expect(result.html).toContain('revenue 合计')
    expect(result.html).toContain(expectedTotal)
    expect(result.html).toContain('Direct')
    expect(result.html).toContain('2026-01-01')
    expect(result.html).toContain('data-ahp-dashboard-data')
    expect(result.html).toContain(`"templateId":"${templateId}"`)
    expect(result.html).toContain('data-ahp-runtime')
    expect(result.html.indexOf('data-ahp-dashboard-data')).toBeLessThan(result.html.indexOf('<script data-ahp-runtime'))
    expect(result.html).toContain('data-section=')
    expect(result.html).toContain('data-ahp-dashboard-editor')
  })
})
