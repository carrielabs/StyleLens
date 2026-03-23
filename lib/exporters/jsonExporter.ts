import type {
  ColorToken,
  ComponentStateTokens,
  RadiusToken,
  ShadowToken,
  SpacingToken,
  StyleReport,
  TypographyToken,
} from '@/lib/types'

type DtcgToken = {
  $value: unknown
  $type: string
  $description?: string
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'token'
}

function colorToken(color: ColorToken | undefined, fallbackName: string): Record<string, DtcgToken> | undefined {
  if (!color) return undefined
  return {
    [fallbackName]: {
      $value: color.hex.toUpperCase(),
      $type: 'color',
      $description: color.description || color.name,
    },
  }
}

function typographyToken(token: TypographyToken): DtcgToken {
  return {
    $value: {
      fontFamily: token.fontFamily,
      fontSize: token.fontSize,
      fontWeight: token.fontWeight,
      lineHeight: token.lineHeight,
      letterSpacing: token.letterSpacing,
    },
    $type: 'typography',
    $description: `${token.label} token derived from measured page styles`,
  }
}

function dimensionToken(value: string, type: 'borderRadius' | 'boxShadow' | 'spacing', description: string): DtcgToken {
  return {
    $value: value,
    $type: type,
    $description: description,
  }
}

function buildColorSection(report: StyleReport) {
  const system = report.colorSystem
  const palette = report.colors
  const contentColors = system?.contentColors || palette.filter(color => color.role === 'accent' || color.role === 'other').slice(0, 6)

  const color: Record<string, unknown> = {}

  const background = {
    ...colorToken(system?.heroBackground, 'hero'),
    ...colorToken(system?.pageBackground, 'page'),
    ...colorToken(system?.surface, 'surface'),
  }
  if (Object.keys(background).length) color.background = background

  const text = {
    ...colorToken(system?.textPrimary || palette.find(item => item.role === 'text'), 'primary'),
    ...colorToken(system?.textSecondary, 'secondary'),
  }
  if (Object.keys(text).length) color.text = text

  const border = {
    ...colorToken(system?.border || palette.find(item => item.role === 'border'), 'default'),
  }
  if (Object.keys(border).length) color.border = border

  const action = {
    ...colorToken(system?.primaryAction || palette.find(item => item.role === 'primary'), 'primary'),
    ...colorToken(system?.secondaryAction || palette.find(item => item.role === 'secondary' || item.role === 'accent'), 'secondary'),
  }
  if (Object.keys(action).length) color.action = action

  if (contentColors.length) {
    color.content = Object.fromEntries(
      contentColors.map((token, index) => [
        slugify(token.name || `content-${index + 1}`),
        {
          $value: token.hex.toUpperCase(),
          $type: 'color',
          $description: token.description,
        },
      ])
    )
  }

  return color
}

function buildTypographySection(typographyTokens: TypographyToken[], fallback: StyleReport['typography']) {
  if (typographyTokens.length) {
    return Object.fromEntries(
      typographyTokens.map(token => [slugify(token.label), typographyToken(token)])
    )
  }

  return {
    base: {
      $value: {
        fontFamily: fallback.fontFamily,
        fontWeight: fallback.bodyWeight,
        lineHeight: fallback.lineHeight,
        letterSpacing: fallback.letterSpacing,
      },
      $type: 'typography',
      $description: 'Fallback typography token inferred from the report',
    },
  }
}

function buildDimensionSection<T extends RadiusToken | ShadowToken | SpacingToken>(
  tokens: T[],
  fallbackValues: string[],
  type: 'borderRadius' | 'boxShadow' | 'spacing'
) {
  const resolved = tokens.length
    ? tokens.map(token => ({ key: slugify(token.label), value: token.value, description: `Measured from ${token.componentKinds.join(', ') || 'page'} elements` }))
    : fallbackValues.map((value, index) => ({ key: `token-${index + 1}`, value, description: 'Fallback token' }))

  return Object.fromEntries(
    resolved.map(entry => [entry.key, dimensionToken(entry.value, type, entry.description)])
  )
}

function buildStateSection(stateTokens?: ComponentStateTokens) {
  const source = stateTokens || {}
  const tokenTypeForProperty = (property: string) => {
    if (property === 'box-shadow') return 'boxShadow'
    if (property === 'opacity') return 'number'
    if (property === 'transform') return 'string'
    return 'color'
  }
  const components = (Object.entries(source) as Array<[string, NonNullable<ComponentStateTokens[keyof ComponentStateTokens]> | undefined]>)
    .filter(([, tokens]) => (tokens || []).length > 0)
    .map(([component, tokens]) => [
      component,
      Object.fromEntries(
        (tokens || []).map(token => [
          `${token.state}-${slugify(token.property)}`,
          {
            $value: token.value,
            $type: tokenTypeForProperty(token.property),
            $description: `${token.state} state token for ${component}`,
          },
        ])
      ),
    ])

  return Object.fromEntries(components)
}

export function generateJsonToken(report: StyleReport): string {
  const analysis = report.pageAnalysis
  const typographyTokens = analysis?.typographyTokens || []
  const radiusTokens = analysis?.radiusTokens || []
  const shadowTokens = analysis?.shadowTokens || []
  const spacingTokens = analysis?.spacingTokens || []
  const layoutEvidence = analysis?.layoutEvidence || []
  const layoutHints = analysis?.layoutHints || []

  const tokenDocument = {
    $schema: 'https://tr.designtokens.org/format/',
    stylelens: {
      meta: {
        sourceType: report.sourceType,
        sourceLabel: report.sourceLabel,
        generatedAt: report.createdAt,
        overallStyle: report.designDetails.overallStyle,
        colorMode: report.designDetails.colorMode,
      },
      color: buildColorSection(report),
      typography: buildTypographySection(typographyTokens, report.typography),
      radius: buildDimensionSection(radiusTokens, report.designDetails.cssRadius?.split('|').map(item => item.trim()).filter(Boolean) || [], 'borderRadius'),
      shadow: buildDimensionSection(shadowTokens, report.designDetails.cssShadow?.split('|').map(item => item.trim()).filter(Boolean) || [], 'boxShadow'),
      spacing: buildDimensionSection(spacingTokens, report.designDetails.spacingSystem.split('|').map(item => item.trim()).filter(Boolean), 'spacing'),
      layout: {
        structure: {
          $value: layoutEvidence.map(item => item.label).join(' | ') || layoutHints.join(' | ') || report.designDetails.layoutStructure,
          $type: 'string',
          $description: 'Measured layout evidence summarized as a structural token',
        },
      },
      states: buildStateSection(analysis?.stateTokens),
    },
  }

  return JSON.stringify(tokenDocument, null, 2)
}
