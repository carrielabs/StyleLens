import Papa from 'papaparse'
import { readSheet } from 'read-excel-file/node'
import * as cheerio from 'cheerio'
import type { Element } from 'domhandler'
import type { PublisherResult } from './types'
import { buildProductWebsiteHtml } from './generate'

type FieldType = 'date' | 'number' | 'category' | 'text'
type FieldRole = 'date' | 'dimension' | 'currency' | 'count' | 'ratio' | 'metric' | 'text'
type DashboardModuleKind = 'key-takeaways' | 'kpi' | 'trend' | 'ranking' | 'share' | 'detail-table' | 'summary'
type DataValue = string | number | null
type DataRow = Record<string, DataValue>

export interface DataField {
  name: string
  type: FieldType
}

export interface DashboardField extends DataField {
  role: FieldRole
}

export interface ParsedDataset {
  name: string
  fields: DataField[]
  rows: DataRow[]
}

export interface DataFileInput {
  fileName: string
  contentType: string
  bytes: Uint8Array
  backgroundColor?: string
}

interface DashboardKpi {
  label: string
  value: string
  trend: string
}

interface DashboardPoint {
  label: string
  value: number
}

export interface DashboardDataModel {
  title: string
  fields: DashboardField[]
  primaryMetric: {
    name: string
    total: number
  }
  kpis: DashboardKpi[]
  trend: DashboardPoint[]
  categoryBreakdown: DashboardPoint[]
  modules: DashboardModule[]
  sections: DashboardSection[]
}

export interface DashboardModule {
  id: string
  kind: DashboardModuleKind
  title: string
  visible: boolean
  description?: string
  chartType?: 'cards' | 'line' | 'bar' | 'pie' | 'table' | 'text'
}

export interface DashboardSection {
  id: string
  title: string
  moduleIds: string[]
}

const DATA_DASHBOARD_TEMPLATE_IDS = [
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
] as const
const DEFAULT_DATA_DASHBOARD_TEMPLATE_ID = 'dashboard-15-consulting-data-report'
const MAX_ROWS = 1000

type DataDashboardTemplateId = typeof DATA_DASHBOARD_TEMPLATE_IDS[number]
type DataDashboardAdapter = (html: string, model: DashboardDataModel, fileName: string, templateId: DataDashboardTemplateId) => string

const DATA_DASHBOARD_ADAPTERS: Record<DataDashboardTemplateId, DataDashboardAdapter> = Object.fromEntries(
  DATA_DASHBOARD_TEMPLATE_IDS.map(templateId => [templateId, injectDataDashboard])
) as Record<DataDashboardTemplateId, DataDashboardAdapter>

export async function parseDataFile(input: DataFileInput): Promise<ParsedDataset> {
  const fileName = input.fileName.toLowerCase()
  if (fileName.endsWith('.csv') || input.contentType === 'text/csv') {
    return parseCsv(input)
  }
  if (fileName.endsWith('.json') || input.contentType === 'application/json') {
    return parseJson(input)
  }
  if (fileName.endsWith('.xlsx') || input.contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return parseXlsx(input)
  }
  throw new Error('暂不支持的数据文件类型，请上传 .csv、.json 或 .xlsx')
}

export function buildDashboardDataModel(dataset: ParsedDataset): DashboardDataModel {
  if (!dataset.rows.length) throw new Error('数据文件没有可用记录')

  const fields = dataset.fields.map(field => ({ ...field, role: inferFieldRole(field) }))
  const numberFields = fields.filter(field => field.type === 'number')
  const dateField = dataset.fields.find(field => field.type === 'date')
  const categoryField = dataset.fields.find(field => field.type === 'category')
  const primary = numberFields[0]
  if (!primary) throw new Error('数据文件里没有可用于生成指标的数值列')

  const primaryValues = dataset.rows.map(row => toNumber(row[primary.name])).filter(value => value !== null)
  const total = sum(primaryValues)
  const kpis: DashboardKpi[] = [
    { label: `${primary.name} 合计`, value: formatNumber(total), trend: `${dataset.rows.length} 条记录` },
    { label: `${primary.name} 平均`, value: formatNumber(total / Math.max(primaryValues.length, 1)), trend: `${primaryValues.length} 个有效值` },
    { label: '字段数量', value: formatNumber(dataset.fields.length), trend: `${numberFields.length} 个数值列` },
  ]

  return {
    title: `${dataset.name} 数据看板`,
    fields,
    primaryMetric: {
      name: primary.name,
      total,
    },
    kpis,
    trend: buildTrend(dataset.rows, primary.name, dateField?.name),
    categoryBreakdown: buildCategoryBreakdown(dataset.rows, primary.name, categoryField?.name),
    modules: buildAnalysisModules(primary.name, Boolean(categoryField), Boolean(dateField)),
    sections: buildAnalysisSections(primary.name),
  }
}

export async function generateDashboardHtmlFromDataFile(
  options: DataFileInput & { templateId?: string }
): Promise<PublisherResult & { sourceFileName: string }> {
  const templateId = normalizeDashboardTemplateId(options.templateId)
  const adapter = DATA_DASHBOARD_ADAPTERS[templateId]

  const dataset = await parseDataFile(options)
  const model = buildDashboardDataModel(dataset)
  const base = await buildProductWebsiteHtml({
    sourceText: `# ${model.title}\n\n基于 ${options.fileName} 自动生成。`,
    templateId,
    pageType: 'dashboard',
    backgroundColor: options.backgroundColor,
  })
  const html = adapter(base.html, model, options.fileName, templateId)

  return {
    html,
    title: model.title,
    templateId,
    sourceFileName: options.fileName,
    backgroundColor: options.backgroundColor,
  }
}

function normalizeDashboardTemplateId(templateId?: string): DataDashboardTemplateId {
  const nextTemplateId = templateId || DEFAULT_DATA_DASHBOARD_TEMPLATE_ID
  if (DATA_DASHBOARD_TEMPLATE_IDS.includes(nextTemplateId as DataDashboardTemplateId)) {
    return nextTemplateId as DataDashboardTemplateId
  }
  throw new Error('数据文件生成 Dashboard 只能使用已支持的 28 个 Dashboard 模板')
}

async function parseCsv(input: DataFileInput): Promise<ParsedDataset> {
  const text = new TextDecoder().decode(input.bytes)
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })
  if (result.errors.length) throw new Error(`CSV 解析失败：${result.errors[0].message}`)
  return normalizeRows(input.fileName, result.data)
}

function parseJson(input: DataFileInput): ParsedDataset {
  const raw = JSON.parse(new TextDecoder().decode(input.bytes))
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : null
  if (!rows) throw new Error('JSON 数据需要是数组，或包含 data 数组')
  return normalizeRows(input.fileName, rows)
}

async function parseXlsx(input: DataFileInput): Promise<ParsedDataset> {
  const sheetRows = await readSheet(Buffer.from(input.bytes))
  if (!sheetRows.length) throw new Error('XLSX 文件没有工作表')
  const headers = sheetRows[0].map(value => String(value || '').trim()).filter(Boolean)
  const rows = sheetRows.slice(1, MAX_ROWS + 1).map(row => {
    const item: DataRow = {}
    headers.forEach((header, index) => {
      item[header] = normalizeCellValue(row[index])
    })
    return item
  })

  return normalizeRows(input.fileName, rows)
}

function normalizeRows(fileName: string, rawRows: unknown[]): ParsedDataset {
  const rows = rawRows
    .slice(0, MAX_ROWS)
    .map(row => normalizeRow(row))
    .filter(row => Object.keys(row).length > 0)
  if (!rows.length) throw new Error('数据文件没有可用记录')

  const fieldNames = Object.keys(rows[0])
  return {
    name: fileBaseName(fileName),
    rows,
    fields: fieldNames.map(name => ({ name, type: inferFieldType(rows, name) })),
  }
}

function normalizeRow(row: unknown): DataRow {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return {}
  const normalized: DataRow = {}
  Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
    const cleanKey = key.trim()
    if (!cleanKey) return
    normalized[cleanKey] = normalizeCellValue(value)
  })
  return normalized
}

function normalizeCellValue(value: unknown): DataValue {
  if (value === undefined || value === null) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'object' && 'text' in value) return String(value.text || '').trim()
  if (typeof value === 'object' && 'result' in value) return normalizeCellValue(value.result)
  const text = String(value).trim()
  if (!text) return null
  const numeric = Number(text.replace(/,/g, ''))
  if (Number.isFinite(numeric) && /^-?\d+(?:,\d{3})*(?:\.\d+)?$|^-?\d+(?:\.\d+)?$/.test(text)) return numeric
  return text
}

function inferFieldType(rows: DataRow[], name: string): FieldType {
  const values = rows.map(row => row[name]).filter(value => value !== null && value !== '')
  if (!values.length) return 'text'
  const dateMatches = values.filter(value => typeof value === 'string' && !Number.isFinite(Number(value)) && !Number.isNaN(Date.parse(value)))
  if (dateMatches.length / values.length >= 0.8) return 'date'
  const numberMatches = values.filter(value => typeof value === 'number')
  if (numberMatches.length / values.length >= 0.8) return 'number'
  const unique = new Set(values.map(String)).size
  return unique <= Math.max(20, values.length * 0.5) ? 'category' : 'text'
}

function inferFieldRole(field: DataField): FieldRole {
  const name = field.name.toLowerCase()
  if (field.type === 'date') return 'date'
  if (field.type === 'category') return 'dimension'
  if (field.type === 'text') return 'text'
  if (/rate|ratio|percent|percentage|占比|比例|转化|率/.test(name)) return 'ratio'
  if (/revenue|sales|amount|price|cost|profit|gmv|收入|销售额|金额|价格|成本|利润/.test(name)) return 'currency'
  if (/order|count|qty|quantity|number|volume|uv|pv|订单|数量|人数|次数|件数/.test(name)) return 'count'
  return 'metric'
}

function buildAnalysisModules(metricName: string, hasCategory: boolean, hasDate: boolean): DashboardModule[] {
  return [
    {
      id: 'module-key-takeaways',
      kind: 'key-takeaways',
      title: 'Key Takeaways',
      visible: true,
      description: `自动提炼 ${metricName} 的关键结论`,
      chartType: 'text',
    },
    {
      id: 'module-kpi',
      kind: 'kpi',
      title: 'KPI 指标卡',
      visible: true,
      description: `展示 ${metricName} 合计、平均和字段规模`,
      chartType: 'cards',
    },
    {
      id: 'module-trend',
      kind: 'trend',
      title: hasDate ? '趋势图' : '记录趋势图',
      visible: true,
      description: `按时间或记录顺序观察 ${metricName}`,
      chartType: 'line',
    },
    {
      id: 'module-ranking',
      kind: 'ranking',
      title: hasCategory ? '排行图' : 'Top 记录',
      visible: true,
      description: `按分类汇总 ${metricName} 并排序`,
      chartType: 'bar',
    },
    {
      id: 'module-share',
      kind: 'share',
      title: hasCategory ? '占比图' : '分布图',
      visible: true,
      description: `查看 ${metricName} 的分类占比`,
      chartType: 'pie',
    },
    {
      id: 'module-detail-table',
      kind: 'detail-table',
      title: '明细表',
      visible: true,
      description: '保留原始数据明细入口',
      chartType: 'table',
    },
    {
      id: 'module-summary',
      kind: 'summary',
      title: '总结',
      visible: true,
      description: '输出规则生成的分析摘要',
      chartType: 'text',
    },
  ]
}

function buildAnalysisSections(metricName: string): DashboardSection[] {
  return [
    {
      id: 'section-key-takeaways',
      title: 'Key Takeaways',
      moduleIds: ['module-key-takeaways', 'module-kpi'],
    },
    {
      id: 'section-revenue',
      title: `${metricName} 分析`,
      moduleIds: ['module-trend', 'module-ranking', 'module-share'],
    },
    {
      id: 'section-detail',
      title: '数据明细与总结',
      moduleIds: ['module-detail-table', 'module-summary'],
    },
  ]
}

function buildTrend(rows: DataRow[], metricName: string, dateName?: string): DashboardPoint[] {
  if (!dateName) {
    return rows.slice(0, 12).map((row, index) => ({
      label: `记录 ${index + 1}`,
      value: toNumber(row[metricName]) || 0,
    }))
  }
  const grouped = new Map<string, number>()
  rows.forEach(row => {
    const label = String(row[dateName] || '').slice(0, 10)
    if (!label) return
    grouped.set(label, (grouped.get(label) || 0) + (toNumber(row[metricName]) || 0))
  })
  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(0, 12)
    .map(([label, value]) => ({ label, value }))
}

function buildCategoryBreakdown(rows: DataRow[], metricName: string, categoryName?: string): DashboardPoint[] {
  if (!categoryName) return []
  const grouped = new Map<string, number>()
  rows.forEach(row => {
    const label = String(row[categoryName] || '未分类')
    grouped.set(label, (grouped.get(label) || 0) + (toNumber(row[metricName]) || 0))
  })
  return [...grouped.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }))
}

function injectDataDashboard(html: string, model: DashboardDataModel, fileName: string, templateId: DataDashboardTemplateId): string {
  const $ = cheerio.load(html)
  $('title').text(`${model.title} - AI HTML Publisher`)
  $('body')
    .attr('data-ahp-dashboard-template', templateId)
    .attr('data-ahp-real-data', 'true')

  injectGenericDashboardText($, model, fileName)
  setSlot($, 'text.header.02', model.title)
  setSlot($, 'text.header.03', `基于 ${fileName} 自动识别 ${model.primaryMetric.name} 等字段，生成真实数据看板。`)
  setSlot($, 'text.summary.02', `${model.primaryMetric.name} 是当前数据集的核心指标`)
  model.kpis.forEach((kpi, index) => {
    const offset = 4 + index * 3
    setSlot($, `text.summary.${String(offset).padStart(2, '0')}`, kpi.label)
    setSlot($, `text.summary.${String(offset + 1).padStart(2, '0')}`, kpi.value)
    setSlot($, `text.summary.${String(offset + 2).padStart(2, '0')}`, kpi.trend)
  })
  setSlot($, 'text.trend.02', `${model.primaryMetric.name} 趋势来自上传文件的真实记录`)
  setSlot($, 'text.segment.02', '分类占比按上传文件中的分类字段自动汇总')
  bindDashboardDataNodes($, model)
  markDashboardModules($, model)

  const nextChartData = buildChartDataLiteral(model)
  $('script:not([src])').each((_, element) => {
    const node = $(element)
    const script = node.html() || ''
    if (!isDashboardChartScript(script)) return
    const nextScript = script.includes('const chartData =')
      ? script.replace(/const chartData = \{[\s\S]*?\n        \};/, `const chartData = ${nextChartData};`)
      : injectGenericChartArrays(script, model)
    node.html(nextScript)
  })

  const runtimeScripts = $('body script[data-ahp-runtime]').toArray().map(element => $.html(element)).join('\n')
  $('body script[data-ahp-runtime]').remove()
  $('script[data-ahp-dashboard-data]').remove()
  const dashboardPayload = safeJson({
    templateId,
    fileName,
    title: model.title,
    fields: model.fields,
    primaryMetric: model.primaryMetric,
    kpis: model.kpis,
    trend: model.trend,
    categoryBreakdown: model.categoryBreakdown,
    modules: model.modules,
    sections: model.sections,
  })
  $('body').append(`<script data-ahp-dashboard-data="true">window.AHP_DASHBOARD_DATA = ${dashboardPayload};</script>`)
  if (runtimeScripts) $('body').append(runtimeScripts)

  return $.html()
}

function markDashboardModules($: cheerio.CheerioAPI, model: DashboardDataModel) {
  const sections = $('[data-section]').toArray()
  model.modules.forEach((module, index) => {
    const section = sections[index]
    if (!section) return
    $(section)
      .attr('data-ahp-dashboard-module-id', module.id)
      .attr('data-ahp-dashboard-module-kind', module.kind)
  })
}

function injectGenericDashboardText($: cheerio.CheerioAPI, model: DashboardDataModel, fileName: string) {
  const values = [
    model.title,
    `基于 ${fileName} 自动识别字段并生成真实数据看板`,
    `${model.primaryMetric.name} 是当前核心指标`,
    ...model.kpis.flatMap(kpi => [kpi.label, kpi.value, kpi.trend]),
    `${model.primaryMetric.name} 趋势来自上传文件的真实记录`,
    model.trend.map(point => `${point.label}: ${formatNumber(point.value)}`).join(' / '),
    '分类占比按上传文件中的分类字段自动汇总',
    model.categoryBreakdown.map(point => `${point.label}: ${formatNumber(point.value)}`).join(' / '),
  ].filter(Boolean)

  const nodes: Element[] = []
  $('[data-editable="true"][data-slot], [contenteditable="true"][data-slot]').each((_, element) => {
    if (!nodes.includes(element)) nodes.push(element)
  })

  values.forEach((value, index) => {
    const node = nodes[index]
    if (!node) return
    $(node).text(value)
  })
}

function bindDashboardDataNodes($: cheerio.CheerioAPI, model: DashboardDataModel) {
  const bindText = (value: string, bind: string) => {
    const text = String(value || '').trim()
    if (!text) return
    $('[data-editable="true"], [contenteditable="true"]').each((_, element) => {
      const node = $(element)
      if (node.attr('data-ahp-dashboard-bind')) return
      if (node.text().trim() === text) node.attr('data-ahp-dashboard-bind', bind)
    })
  }

  bindText(model.title, 'title')
  bindText(model.primaryMetric.name, 'primaryMetric.name')
  model.kpis.forEach((kpi, index) => {
    bindText(kpi.label, `kpi.${index}.label`)
    bindText(kpi.value, `kpi.${index}.value`)
    bindText(kpi.trend, `kpi.${index}.trend`)
  })
  model.trend.forEach((point, index) => {
    bindText(point.label, `trend.${index}.label`)
    bindText(formatNumber(point.value), `trend.${index}.value`)
  })
  model.categoryBreakdown.forEach((point, index) => {
    bindText(point.label, `category.${index}.label`)
    bindText(formatNumber(point.value), `category.${index}.value`)
  })
}

function isDashboardChartScript(script: string): boolean {
  return /const chartData\s*=|new Chart\(|echarts\.init|window\.REPORT_DATA/.test(script)
}

function injectGenericChartArrays(script: string, model: DashboardDataModel): string {
  const labels = [
    jsArray(model.trend.map(point => point.label)),
    jsArray(model.categoryBreakdown.map(point => point.label)),
  ]
  const values = [
    jsArray(model.trend.map(point => point.value)),
    jsArray(model.categoryBreakdown.map(point => point.value)),
  ]
  let labelIndex = 0
  let valueIndex = 0

  return script
    .replace(/labels\s*:\s*\[[^\]]*]/g, () => `labels: ${labels[labelIndex++ % labels.length]}`)
    .replace(/data\s*:\s*\[(?:[^\][{}]|\{[^{}]*})*]/g, () => `data: ${values[valueIndex++ % values.length]}`)
}

function buildChartDataLiteral(model: DashboardDataModel): string {
  const trendLabels = model.trend.map(point => point.label)
  const trendValues = model.trend.map(point => point.value)
  const categoryLabels = model.categoryBreakdown.map(point => point.label)
  const categoryValues = model.categoryBreakdown.map(point => point.value)
  return `{
            newEquip: {
                labels: [''],
                datasets: [
                    { label: '${escapeJs(model.primaryMetric.name)}', data: [100], backgroundColor: '#0F2C59' }
                ]
            },
            usedEquip: {
                labels: [''],
                datasets: [
                    { label: '${escapeJs(model.primaryMetric.name)}', data: [100], backgroundColor: '#0F2C59' }
                ]
            },
            competitiveScatter: {
                datasets: [
                    { label: '${escapeJs(model.primaryMetric.name)}', data: [{ x: 8, y: 6, r: 18 }], backgroundColor: '#00B4D8', borderColor: '#0F2C59', borderWidth: 2 }
                ]
            },
            funnel: {
                labels: ${jsArray(trendLabels)},
                datasets: [
                    { label: '${escapeJs(model.primaryMetric.name)}', data: ${jsArray(trendValues)}, backgroundColor: '#0F2C59' }
                ]
            },
            revenuePie: {
                labels: ${jsArray(categoryLabels)},
                datasets: [{ data: ${jsArray(categoryValues)}, backgroundColor: ['#0F2C59', '#00B4D8', '#E5E7EB', '#9CA3AF'], borderWidth: 0 }]
            },
            trendCombo: {
                labels: ${jsArray(trendLabels)},
                datasets: [
                    { type: 'line', label: '${escapeJs(model.primaryMetric.name)}', data: ${jsArray(trendValues)}, borderColor: '#00B4D8', backgroundColor: '#00B4D8', yAxisID: 'y1', tension: 0.3, fill: false, borderWidth: 3 },
                    { type: 'bar', label: '${escapeJs(model.primaryMetric.name)}', data: ${jsArray(trendValues)}, backgroundColor: '#E5E7EB', yAxisID: 'y' }
                ]
            },
            demographics: {
                labels: ${jsArray(categoryLabels)},
                datasets: [
                    { label: '${escapeJs(model.primaryMetric.name)}', data: ${jsArray(categoryValues)}, backgroundColor: '#0F2C59' }
                ]
            },
            costStack: {
                labels: ${jsArray(trendLabels)},
                datasets: [
                    { label: '${escapeJs(model.primaryMetric.name)}', data: ${jsArray(trendValues)}, backgroundColor: '#0F2C59' }
                ]
            }
        }`
}

function setSlot($: cheerio.CheerioAPI, slot: string, value: string) {
  const node = $(`[data-slot="${slot}"]`).first()
  if (node.length) node.text(value)
}

function toNumber(value: DataValue): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

function fileBaseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || '数据文件'
}

function jsArray(values: Array<string | number>): string {
  return `[${values.map(value => typeof value === 'number' ? String(value) : `'${escapeJs(value)}'`).join(', ')}]`
}

function escapeJs(value: string): string {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
