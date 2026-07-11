import Papa from 'papaparse'
import { readSheet } from 'read-excel-file/node'
import * as cheerio from 'cheerio'
import type { PublisherResult } from './types'
import { buildProductWebsiteHtml } from './generate'

type FieldType = 'date' | 'number' | 'category' | 'text'
type DataValue = string | number | null
type DataRow = Record<string, DataValue>

export interface DataField {
  name: string
  type: FieldType
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
  primaryMetric: {
    name: string
    total: number
  }
  kpis: DashboardKpi[]
  trend: DashboardPoint[]
  categoryBreakdown: DashboardPoint[]
}

const DATA_DASHBOARD_TEMPLATE_ID = 'dashboard-15-consulting-data-report'
const MAX_ROWS = 1000

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

  const numberFields = dataset.fields.filter(field => field.type === 'number')
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
    primaryMetric: {
      name: primary.name,
      total,
    },
    kpis,
    trend: buildTrend(dataset.rows, primary.name, dateField?.name),
    categoryBreakdown: buildCategoryBreakdown(dataset.rows, primary.name, categoryField?.name),
  }
}

export async function generateDashboardHtmlFromDataFile(
  options: DataFileInput & { templateId?: string }
): Promise<PublisherResult & { sourceFileName: string }> {
  const templateId = options.templateId || DATA_DASHBOARD_TEMPLATE_ID
  if (templateId !== DATA_DASHBOARD_TEMPLATE_ID) {
    throw new Error('第一版数据文件生成 Dashboard 仅支持 Consulting Data 模板')
  }

  const dataset = await parseDataFile(options)
  const model = buildDashboardDataModel(dataset)
  const base = await buildProductWebsiteHtml({
    sourceText: `# ${model.title}\n\n基于 ${options.fileName} 自动生成。`,
    templateId,
    pageType: 'dashboard',
  })
  const html = injectDataDashboard(base.html, model, options.fileName)

  return {
    html,
    title: model.title,
    templateId,
    sourceFileName: options.fileName,
  }
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

function injectDataDashboard(html: string, model: DashboardDataModel, fileName: string): string {
  const $ = cheerio.load(html)
  $('title').text(`${model.title} - AI HTML Publisher`)
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

  const nextChartData = buildChartDataLiteral(model)
  $('script:not([src])').each((_, element) => {
    const node = $(element)
    const script = node.html() || ''
    if (!script.includes('const chartData =')) return
    node.html(script.replace(/const chartData = \{[\s\S]*?\n        \};/, `const chartData = ${nextChartData};`))
  })

  return $.html()
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
