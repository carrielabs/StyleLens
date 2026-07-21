import type {
  AnalysisFailureReason,
  AnalysisQualityCheck,
  AnalysisQualityGate,
  StyleReport,
} from '@/lib/types'
import { generateCssVariables } from '@/lib/exporters/cssExporter'
import { generateJsonToken } from '@/lib/exporters/jsonExporter'
import { generateMarkdown } from '@/lib/exporters/markdownExporter'
import { generatePrompt } from '@/lib/exporters/promptExporter'
import { generateTailwindConfig } from '@/lib/exporters/tailwindExporter'

export type GeneratedStyleExports = {
  css: string
  tailwind: string
  json: string
  prompt: string
  markdown: string
}

export function buildExportQualityGate(report: StyleReport): AnalysisQualityGate {
  return validateGeneratedExports({
    css: generateCssVariables(report),
    tailwind: generateTailwindConfig(report),
    json: generateJsonToken(report),
    prompt: generatePrompt(report, 'en'),
    markdown: generateMarkdown(report, 'zh'),
  })
}

export function validateGeneratedExports(exports: GeneratedStyleExports): AnalysisQualityGate {
  const checks: AnalysisQualityCheck[] = [
    validateCssExport(exports.css),
    validateTailwindExport(exports.tailwind),
    validateJsonExport(exports.json),
    validatePromptExport(exports.prompt),
    validateMarkdownExport(exports.markdown),
  ]
  const score = checks.reduce((sum, check) => sum + check.score, 0)
  const failureReasons = checks
    .filter(check => check.status !== 'pass')
    .map(check => ({
      checkId: check.id,
      label: check.label,
      severity: check.blocking || check.status === 'fail' ? 'blocking' : 'warning',
      message: check.details,
    } satisfies AnalysisFailureReason))

  return {
    score,
    status: checks.some(check => check.blocking) || score < 80 ? 'fail' : 'pass',
    checks,
    failureReasons,
  }
}

function validateCssExport(css: string): AnalysisQualityCheck {
  const problems: string[] = []
  if (!css.includes(':root')) problems.push('missing :root block')
  if (!hasBalancedBraces(css)) problems.push('unbalanced braces')

  const declarations = [...css.matchAll(/--[a-z0-9-_]+:\s*([^;]+);/gi)]
  if (!declarations.length) problems.push('missing CSS custom properties')
  const invalidDeclaration = declarations.find(match => hasInvalidTokenValue(match[1]))
  if (invalidDeclaration) problems.push(`invalid token value: ${invalidDeclaration[0].trim()}`)

  return qualityCheck(
    'css-export-validity',
    'CSS export validity',
    problems,
    20
  )
}

function validateTailwindExport(tailwind: string): AnalysisQualityCheck {
  const problems: string[] = []
  if (!tailwind.includes('module.exports')) problems.push('missing module.exports')
  if (!hasBalancedBraces(tailwind)) problems.push('unbalanced braces')
  if (/['"][^'"]*\|[^'"]*['"]/.test(tailwind)) problems.push('pipe-joined token value')

  try {
    const moduleLike = { exports: undefined as unknown }
    Function('module', 'exports', tailwind)(moduleLike, {})
    if (!moduleLike.exports || typeof moduleLike.exports !== 'object') problems.push('config does not export an object')
  } catch (error) {
    problems.push(`parse error: ${error instanceof Error ? error.message : 'unknown error'}`)
  }

  return qualityCheck(
    'tailwind-export-validity',
    'Tailwind export validity',
    problems,
    20
  )
}

function validateJsonExport(json: string): AnalysisQualityCheck {
  const problems: string[] = []

  try {
    const parsed = JSON.parse(json) as { stylelens?: unknown }
    if (!parsed || typeof parsed !== 'object') problems.push('JSON root is not an object')
    if (!parsed.stylelens) problems.push('missing stylelens root')
  } catch (error) {
    problems.push(`parse error: ${error instanceof Error ? error.message : 'unknown error'}`)
  }

  return qualityCheck(
    'json-export-validity',
    'JSON export validity',
    problems,
    20
  )
}

function validatePromptExport(prompt: string): AnalysisQualityCheck {
  const problems: string[] = []
  if (!/Evidence Basis|证据依据/.test(prompt)) problems.push('missing evidence basis')
  if (!/dom-computed|measured|测量|证据/.test(prompt)) problems.push('missing measured evidence language')
  if (hasRadiusContradiction(prompt)) problems.push('radius contradiction')
  if (hasInvalidPromptTokenLine(prompt)) problems.push('invalid prompt token value')

  return qualityCheck(
    'prompt-export-consistency',
    'Prompt export consistency',
    problems,
    20
  )
}

function validateMarkdownExport(markdown: string): AnalysisQualityCheck {
  const problems: string[] = []
  if (!/质量门禁|Quality gate/.test(markdown)) problems.push('missing quality gate')
  if (!/可信度|Confidence|证据数量|Evidence count/.test(markdown)) problems.push('missing evidence trust summary')
  if (!/组件证据|Component evidence/.test(markdown)) problems.push('missing component evidence summary')

  return qualityCheck(
    'markdown-export-evidence',
    'Markdown export evidence',
    problems,
    20
  )
}

function qualityCheck(
  id: string,
  label: string,
  problems: string[],
  passScore: number
): AnalysisQualityCheck {
  return {
    id,
    label,
    status: problems.length ? 'fail' : 'pass',
    score: problems.length ? 0 : passScore,
    details: problems.length ? problems.join('; ') : 'valid',
    blocking: problems.length > 0,
  }
}

function hasBalancedBraces(value: string): boolean {
  let depth = 0
  for (const char of value) {
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}

function hasInvalidTokenValue(value: string): boolean {
  const normalized = value.trim()
  return normalized.includes('|')
    || normalized.includes('\n')
    || /[{};]/.test(normalized)
}

function hasRadiusContradiction(prompt: string): boolean {
  const radiusLine = prompt.match(/(?:Border Radius|圆角):\s*([^\n]+)/i)?.[1] || ''
  const hasRoundedValue = /(?:[1-9]\d*(?:\.\d+)?px|rem|em|9999|100%)/.test(radiusLine)
  const forbidsRadius = /DO NOT add rounded corners|禁止圆角/.test(prompt)
  return hasRoundedValue && forbidsRadius
}

function hasInvalidPromptTokenLine(prompt: string): boolean {
  return prompt
    .split('\n')
    .some(line => /(?:--[a-z0-9-_]+|brand:|base:)/i.test(line) && hasInvalidTokenValue(line))
}
