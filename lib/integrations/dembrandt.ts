import { chromium } from 'playwright'
import { extractBranding } from 'dembrandt/extractors'
import { computeDrift } from 'dembrandt/drift'
import { computeFindings } from 'dembrandt/findings'
import { generateDesignMd } from 'dembrandt/markdown'
import { toDtcgTokens } from 'dembrandt/dtcg-export'
import type {
  BrandingResult as DembrandtBrandingResult,
  ExtractOptions as DembrandtExtractOptions,
  Spinner as DembrandtSpinner,
} from 'dembrandt/types'
import type { StyleReport } from '../types/index.ts'
import { generateTailwindTheme } from './dembrandt-tailwind'

type BrandingResult = DembrandtBrandingResult
type CssState = {
  backgroundColor?: string
  color?: string
  borderRadius?: string
  padding?: string
  border?: string
  boxShadow?: string
  textDecoration?: string
}
type ColorToken = any

function createSilentSpinner(): DembrandtSpinner {
  const spinner: DembrandtSpinner = {
    start: () => spinner,
    stop: () => spinner,
    succeed: () => spinner,
    fail: () => spinner,
    warn: () => spinner,
    info: () => spinner,
  }

  return spinner
}

export async function extractDembrandtBranding(url: string, options: Partial<DembrandtExtractOptions> = {}) {
  const browser = await chromium.launch({ headless: true })
  try {
    return await extractBranding(url, createSilentSpinner(), browser, {
      reveal: true,
      wcag: true,
      ...options,
    })
  } finally {
    await browser.close()
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'stylelens'
}

function normalizeHex(value?: string | null): string | undefined {
  if (!value) return undefined
  const text = String(value).trim()
  if (/^#[0-9a-f]{6}$/i.test(text)) return text.toUpperCase()
  if (/^#[0-9a-f]{3}$/i.test(text)) {
    const hex = text.slice(1).split('').map(ch => ch + ch).join('')
    return `#${hex}`.toUpperCase()
  }
  return undefined
}

function splitValues(value?: string | null): string[] {
  return String(value || '')
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
}

function buildColorToken(color: ColorToken): any {
  return {
    color: color.hex,
    normalized: color.hex.toUpperCase(),
    count: color.meta?.evidenceCount || 1,
    confidence: color.meta?.confidence || 'medium',
    role: color.role || 'other',
    sources: color.meta?.source ? [color.meta.source] : undefined,
    isToken: true,
  }
}

function buildSemanticColors(report: StyleReport): Record<string, string> {
  const system = report.colorSystem
  if (!system) return {}

  const semantic: Record<string, string> = {}
  const add = (key: string, color?: ColorToken | null) => {
    const hex = color?.hex ? normalizeHex(color.hex) : undefined
    if (hex) semantic[key] = hex
  }

  add('heroBackground', system.heroBackground)
  add('pageBackground', system.pageBackground)
  add('surface', system.surface)
  add('textPrimary', system.textPrimary)
  add('textSecondary', system.textSecondary)
  add('border', system.border)
  add('primaryAction', system.primaryAction)
  add('secondaryAction', system.secondaryAction)

  return semantic
}

function buildCssVariables(report: StyleReport): Record<string, string> {
  const semantic = buildSemanticColors(report)
  return Object.fromEntries(
    Object.entries(semantic).map(([key, value]) => [`--color-${slugify(key)}`, value])
  )
}

function buildTypography(report: StyleReport): BrandingResult['typography'] {
  const tokens = report.pageAnalysis?.typographyTokens || []
  const fallback = report.typography

  const styles = tokens.length > 0
    ? tokens.map(token => ({
        context: token.usage,
        family: token.fontFamily,
        size: token.fontSize,
        weight: token.fontWeight,
        lineHeight: token.lineHeight,
        letterSpacing: token.letterSpacing,
        count: token.sampleCount,
      }))
    : [{
        context: 'body',
        family: fallback.fontFamily,
        size: '16px',
        weight: String(fallback.bodyWeight),
        lineHeight: fallback.lineHeight,
        letterSpacing: fallback.letterSpacing,
        count: 1,
      }]

  return {
    styles,
    sources: {},
  }
}

function buildSpacing(report: StyleReport): BrandingResult['spacing'] {
  const values = report.pageAnalysis?.spacingTokens || []
  const fallbackSpacing = report.pageAnalysis?.spacingCandidates?.length
    ? report.pageAnalysis.spacingCandidates
    : splitValues(report.designDetails.spacingSystem).flatMap(part => part.match(/\d+(?:\.\d+)?px/g) || [])
  const commonValues = values.length > 0
    ? values.map(token => ({
        px: token.value,
        display: token.value,
        count: token.sampleCount,
      }))
    : fallbackSpacing.map(value => ({
        px: value,
        display: value,
        count: 1,
      }))

  return {
    scaleType: report.designDetails.spacingSystem || 'custom',
    commonValues,
  }
}

function buildBorderRadius(report: StyleReport): BrandingResult['borderRadius'] {
  const tokens = report.pageAnalysis?.radiusTokens || []
  const values = (tokens.length > 0 ? tokens.map(token => token.value) : splitValues(report.designDetails.cssRadius))
    .filter(Boolean)

  return {
    values: values.map(value => ({
      value,
      count: 1,
      confidence: 'medium',
    })),
  }
}

function buildShadows(report: StyleReport): BrandingResult['shadows'] {
  const tokens = report.pageAnalysis?.shadowTokens || []
  const values = tokens.length > 0 ? tokens.map(token => token.value) : splitValues(report.designDetails.cssShadow)
  return values
    .filter(Boolean)
    .map(value => ({
      shadow: value,
      count: 1,
      confidence: 'medium',
    }))
}

function buildBorders(report: StyleReport): BrandingResult['borders'] {
  const tokens = report.pageAnalysis?.borderTokens || []
  if (tokens.length === 0) {
    return { widths: [], styles: [], colors: [] }
  }

  return {
    widths: tokens.map(token => ({
      value: token.width,
      count: token.sampleCount,
      confidence: 'medium',
    })),
    styles: tokens.map(token => ({
      value: token.style,
      count: token.sampleCount,
      confidence: 'medium',
    })),
    colors: tokens
      .filter(token => token.color)
      .map(token => ({
        value: token.color as string,
        count: token.sampleCount,
        confidence: 'medium',
      })),
  }
}

function buildStateState(style?: CssState): CssState {
  return {
    backgroundColor: style?.backgroundColor,
    color: style?.color,
    borderRadius: style?.borderRadius,
    padding: style?.padding,
    border: style?.border,
    boxShadow: style?.boxShadow,
    textDecoration: style?.textDecoration,
  }
}

function buildButtons(report: StyleReport): BrandingResult['components']['buttons'] {
  const snapshot = report.pageAnalysis?.buttonSnapshot || report.pageAnalysis?.buttonSnapshots?.[0]
  const fallbackBg = report.colorSystem?.primaryAction?.hex || report.colors.find(color => color.role === 'primary')?.hex || '#1D1D1F'
  const fallbackFg = report.colorSystem?.textPrimary?.hex || report.colors.find(color => color.role === 'text')?.hex || '#FFFFFF'
  const defaultState = buildStateState({
    backgroundColor: snapshot?.backgroundColor || fallbackBg,
    color: snapshot?.color || fallbackFg,
    borderRadius: snapshot?.borderRadius || report.designDetails.cssRadius || report.designDetails.borderRadius,
    padding: snapshot?.paddingH && snapshot?.paddingV ? `${snapshot.paddingV} ${snapshot.paddingH}` : undefined,
    border: snapshot?.border || 'none',
    boxShadow: snapshot?.boxShadow,
  })

  return [{
    states: { default: defaultState },
    text: snapshot?.text,
    fontWeight: snapshot?.fontWeight,
    fontSize: snapshot?.fontSize,
    classes: snapshot?.selectorHint,
  }]
}

function buildInputs(report: StyleReport): BrandingResult['components']['inputs'] {
  const snapshot = report.pageAnalysis?.inputSnapshots?.[0]
  const defaultState = {
    backgroundColor: snapshot?.backgroundColor || report.colorSystem?.surface?.hex,
    color: snapshot?.color || report.colorSystem?.textPrimary?.hex,
    borderRadius: snapshot?.borderRadius || report.designDetails.cssRadius || report.designDetails.borderRadius,
    padding: snapshot?.paddingH && snapshot?.paddingV ? `${snapshot.paddingV} ${snapshot.paddingH}` : undefined,
    border: snapshot?.border,
  }

  return [{
    states: { default: defaultState },
    type: 'text',
    border: snapshot?.border,
    borderRadius: snapshot?.borderRadius,
    padding: defaultState.padding,
  }]
}

function buildLinks(report: StyleReport): BrandingResult['components']['links'] {
  const primary = report.colorSystem?.primaryAction?.hex || report.colors.find(color => color.role === 'primary')?.hex || '#1D1D1F'
  return [{
    states: { default: { color: primary } },
    fontWeight: String(report.typography.bodyWeight),
  }]
}

function buildBadges(report: StyleReport): BrandingResult['components']['badges'] {
  return {
    all: [{
      backgroundColor: report.colorSystem?.surface?.hex || '#F5F5F7',
      color: report.colorSystem?.textPrimary?.hex || '#1D1D1F',
      borderRadius: report.designDetails.cssRadius || report.designDetails.borderRadius,
      padding: '4px 10px',
      fontSize: '12px',
      isRounded: true,
      styleType: 'solid',
    }],
  }
}

function buildComponents(report: StyleReport): BrandingResult['components'] {
  return {
    buttons: buildButtons(report),
    inputs: buildInputs(report),
    links: buildLinks(report),
    badges: buildBadges(report),
  }
}

function buildBreakpoints(report: StyleReport): BrandingResult['breakpoints'] {
  const width = report.pageAnalysis?.pageMaxWidth
  const numeric = Number.parseInt(width || '', 10)
  return Number.isFinite(numeric) ? [{ px: numeric }] : []
}

function buildIconSystem(): BrandingResult['iconSystem'] {
  return []
}

function buildFrameworks(): BrandingResult['frameworks'] {
  return []
}

function buildLogo(): BrandingResult['logo'] {
  return null
}

function buildFavicons(): BrandingResult['favicons'] {
  return []
}

function buildUrl(report: StyleReport): string {
  if (report.sourceType === 'url' && /^https?:\/\//i.test(report.sourceLabel)) {
    return report.sourceLabel
  }
  return `https://stylelens.local/${slugify(report.sourceLabel)}`
}

function getNativeDembrandtResult(report: StyleReport): BrandingResult | undefined {
  return report.dembrandtResult
}

function dembrandtHexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const parts = [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)].map(part => Number.parseInt(part, 16))
  return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`
}

function dembrandtHexToHsl(hex: string): string {
  const clean = hex.replace('#', '')
  const [r, g, b] = [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)].map(part => Number.parseInt(part, 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = 60 * (((g - b) / delta) % 6)
        break
      case g:
        h = 60 * ((b - r) / delta + 2)
        break
      case b:
        h = 60 * ((r - g) / delta + 4)
        break
    }
  }

  if (h < 0) h += 360
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

function buildColorTokenFromDembrandt(color: BrandingResult['colors']['palette'][number]): ColorToken {
  const hex = (color.normalized || color.color || '#000000').toUpperCase()
  return {
    role: color.role || 'other',
    hex,
    rgb: dembrandtHexToRgb(hex),
    hsl: dembrandtHexToHsl(hex),
    name: color.role || hex,
    description: `Dembrandt ${color.role || 'palette'} token`,
    meta: {
      source: 'dom-computed',
      confidence: color.confidence,
      evidenceCount: color.count || 1,
    },
  }
}

function pickDembrandtTypographyStyles(result: BrandingResult) {
  const styles = result.typography?.styles || []
  const heading = styles.find(style => /display|heading|title|h[1-6]/i.test(String(style.context || ''))) || styles[0]
  const body = styles.find(style => /body|text|label|caption|link|button/i.test(String(style.context || ''))) || styles[0]
  return { heading, body, styles }
}

function buildTypographyFromDembrandt(result: BrandingResult): StyleReport['typography'] {
  const { heading, body, styles } = pickDembrandtTypographyStyles(result)
  const families = Array.from(new Set(styles.map(style => style.family).filter(Boolean)))
  const sizes = Array.from(new Set(styles.map(style => style.size).filter(Boolean)))
  const lineHeights = Array.from(new Set(styles.map(style => style.lineHeight).filter(Boolean)))
  const letterSpacings = Array.from(new Set(styles.map(style => style.letterSpacing).filter(Boolean)))

  return {
    fontFamily: body?.family || heading?.family || families[0] || 'System',
    confidence: styles.length > 0 ? 'identified' : 'inferred',
    headingWeight: Number.parseInt(String(heading?.weight || 700), 10) || 700,
    bodyWeight: Number.parseInt(String(body?.weight || 400), 10) || 400,
    fontSizeScale: sizes.join(' | ') || 'Measured typography',
    lineHeight: lineHeights.join(' | ') || '1.5',
    letterSpacing: letterSpacings.join(' | ') || '0',
    alignment: 'left',
    textTreatment: 'solid',
    googleFontsAlt: result.typography?.sources?.googleFonts?.[0],
  }
}

function buildSemanticColorSystemFromDembrandt(result: BrandingResult) {
  const semantic = result.colors?.semantic || {}
  const palette = result.colors?.palette || []
  const paletteTokens = palette.map(buildColorTokenFromDembrandt)
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = semantic[key]
      if (value) return value
    }
    return undefined
  }

  const primary = pick('primary')
  const secondary = pick('secondary')
  const background = pick('background', 'surface')
  const surface = pick('surface', 'background')
  const onSurface = pick('on-surface', 'text')
  const border = pick('border')

  const findPalette = (hex?: string) => paletteTokens.find(token => token.hex.toUpperCase() === hex?.toUpperCase())

  return {
    heroBackground: background ? findPalette(background) ?? buildColorTokenFromDembrandt({ color: background, normalized: background, count: 1, confidence: 'medium', role: 'background' }) : undefined,
    heroTextPrimary: onSurface ? findPalette(onSurface) ?? buildColorTokenFromDembrandt({ color: onSurface, normalized: onSurface, count: 1, confidence: 'medium', role: 'text' }) : undefined,
    heroPrimaryAction: primary ? findPalette(primary) ?? buildColorTokenFromDembrandt({ color: primary, normalized: primary, count: 1, confidence: 'medium', role: 'primary' }) : undefined,
    heroSecondaryAction: secondary ? findPalette(secondary) ?? buildColorTokenFromDembrandt({ color: secondary, normalized: secondary, count: 1, confidence: 'medium', role: 'secondary' }) : undefined,
    pageBackground: background ? findPalette(background) ?? buildColorTokenFromDembrandt({ color: background, normalized: background, count: 1, confidence: 'medium', role: 'background' }) : undefined,
    surface: surface ? findPalette(surface) ?? buildColorTokenFromDembrandt({ color: surface, normalized: surface, count: 1, confidence: 'medium', role: 'surface' }) : undefined,
    textPrimary: onSurface ? findPalette(onSurface) ?? buildColorTokenFromDembrandt({ color: onSurface, normalized: onSurface, count: 1, confidence: 'medium', role: 'text' }) : undefined,
    textSecondary: secondary ? findPalette(secondary) ?? buildColorTokenFromDembrandt({ color: secondary, normalized: secondary, count: 1, confidence: 'medium', role: 'text' }) : undefined,
    border: border ? findPalette(border) ?? buildColorTokenFromDembrandt({ color: border, normalized: border, count: 1, confidence: 'medium', role: 'border' }) : undefined,
    primaryAction: primary ? findPalette(primary) ?? buildColorTokenFromDembrandt({ color: primary, normalized: primary, count: 1, confidence: 'medium', role: 'primary' }) : undefined,
    secondaryAction: secondary ? findPalette(secondary) ?? buildColorTokenFromDembrandt({ color: secondary, normalized: secondary, count: 1, confidence: 'medium', role: 'secondary' }) : undefined,
    contentColors: paletteTokens.slice(0, 6),
  }
}

function buildDesignDetailsFromDembrandt(result: BrandingResult): StyleReport['designDetails'] {
  const radii = (result.borderRadius?.values || []).map(item => item.value).filter(Boolean)
  const shadows = (result.shadows || []).map(item => item.shadow).filter(Boolean)
  const widths = result.borders?.widths?.map(item => item.value).filter(Boolean) || []
  const styles = result.borders?.styles?.map(item => item.value).filter(Boolean) || []
  const colors = result.borders?.colors?.map(item => item.value).filter(Boolean) || []
  const motionDurations = result.motion?.durations?.map(item => item.value).filter(Boolean) || []
  const iconNames = result.iconSystem?.map(item => item.name).filter(Boolean) || []
  const frameworkNames = result.frameworks?.map(item => item.name).filter(Boolean) || []
  const background = result.colors?.semantic?.background || result.colors?.semantic?.surface
  const pageBackground = typeof background === 'string' ? background : undefined
  const colorMode = pageBackground && /^#[0-9a-f]{6}$/i.test(pageBackground)
    ? (Number.parseInt(pageBackground.slice(1, 3), 16) + Number.parseInt(pageBackground.slice(3, 5), 16) + Number.parseInt(pageBackground.slice(5, 7), 16)) < 384
      ? 'dark'
      : 'light'
    : 'system'

  return {
    overallStyle: result.siteName || 'Dembrandt extracted system',
    colorMode,
    borderRadius: radii.join(' | ') || 'none',
    shadowStyle: shadows.join(' | ') || 'none',
    spacingSystem: result.spacing?.scaleType || 'custom',
    borderStyle: [widths[0], styles[0], colors[0]].filter(Boolean).join(' ') || 'none',
    animationTendency: motionDurations.length ? 'measured motion' : 'none',
    imageHandling: 'observed',
    layoutStructure: result.breakpoints?.length ? `${result.breakpoints.length} breakpoint(s)` : 'single layout',
    cssRadius: radii.join(' | ') || undefined,
    cssShadow: shadows.join(' | ') || undefined,
    layoutEn: result.breakpoints?.length > 1 ? 'Responsive Layout' : 'Single Layout',
    layoutZh: result.breakpoints?.length > 1 ? '响应式布局' : '单列布局',
    spacingEn: result.spacing?.scaleType || 'Measured spacing',
    spacingZh: result.spacing?.scaleType || '测量间距',
    motionEn: motionDurations.length ? 'Measured motion' : 'No motion',
    motionZh: motionDurations.length ? '测量动效' : '无动效',
    iconEn: iconNames.join(' | ') || 'No icons',
    iconZh: iconNames.join(' | ') || '无图标',
    signatureEn: frameworkNames.join(' | ') || 'Native extraction',
    signatureZh: frameworkNames.join(' | ') || '原生抽取',
  }
}

export function applyDembrandtExtraction(report: StyleReport, result: BrandingResult): StyleReport {
  const findings = computeFindings(result)
  const wcag = result.wcag || []

  return {
    ...report,
    dembrandtResult: result,
    colors: result.colors?.palette?.map(buildColorTokenFromDembrandt) || report.colors,
    colorSystem: buildSemanticColorSystemFromDembrandt(result),
    typography: buildTypographyFromDembrandt(result),
    designDetails: buildDesignDetailsFromDembrandt(result),
    pageAnalysis: report.pageAnalysis
      ? {
          ...report.pageAnalysis,
          auditSummary: {
            ...report.pageAnalysis.auditSummary,
            designSystem: {
              status: findings.findings.length > 0 && findings.findings.some(item => item.severity === 'error') ? 'failed' : 'completed',
              summary: findings.findings.length > 0
                ? `Dembrandt findings: ${findings.findings.length}`
                : 'Dembrandt findings: 0',
              findingsCount: findings.findings.length,
              updatedAt: report.createdAt,
            },
            ...(wcag.length
              ? {
                  accessibility: {
                    status: wcag.some(item => !item.aa && !item.aaLarge && !item.aaa) ? 'failed' : 'completed',
                    summary: `Dembrandt WCAG pairs: ${wcag.length}`,
                    findingsCount: wcag.length,
                    updatedAt: report.createdAt,
                  },
                }
              : {}),
          },
        }
      : report.pageAnalysis,
  }
}

export function buildDembrandtBrandingResult(report: StyleReport): BrandingResult {
  const nativeResult = getNativeDembrandtResult(report)
  if (nativeResult) return nativeResult

  const palette = report.colors.map(buildColorToken)

  return {
    url: buildUrl(report),
    extractedAt: report.createdAt,
    siteName: report.sourceType === 'url' ? (() => {
      try {
        return new URL(report.sourceLabel).hostname.replace(/^www\./, '')
      } catch {
        return report.sourceLabel
      }
    })() : report.sourceLabel,
    logo: buildLogo(),
    logoInstances: [],
    favicons: buildFavicons(),
    manifest: undefined,
    colors: {
      palette,
      semantic: buildSemanticColors(report),
      cssVariables: buildCssVariables(report),
      rawColors: palette,
    },
    typography: buildTypography(report),
    spacing: buildSpacing(report),
    borderRadius: buildBorderRadius(report),
    borders: buildBorders(report),
    shadows: buildShadows(report),
    gradients: [],
    motion: undefined,
    components: buildComponents(report),
    breakpoints: buildBreakpoints(report),
    iconSystem: buildIconSystem(),
    frameworks: buildFrameworks(),
    wcag: undefined,
    note: report.summary,
    isCanvasOnly: false,
  }
}

export function buildDembrandtFindings(report: StyleReport) {
  return computeFindings(buildDembrandtBrandingResult(report))
}

export function buildDembrandtDesignMd(report: StyleReport) {
  return generateDesignMd(buildDembrandtBrandingResult(report))
}

export function buildDembrandtDtcg(report: StyleReport) {
  return toDtcgTokens(buildDembrandtBrandingResult(report))
}

export function buildDembrandtTailwindTheme(report: StyleReport) {
  return generateTailwindTheme(buildDembrandtBrandingResult(report))
}

export function buildDembrandtDrift(baseline: StyleReport, candidate: StyleReport) {
  return computeDrift(buildDembrandtBrandingResult(baseline), buildDembrandtBrandingResult(candidate))
}
