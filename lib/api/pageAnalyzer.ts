import type {
  StateTokenValue,
  ComponentStateTokens,
  ComponentKind,
  InteractionState,
  LayoutEvidence,
  PageColorCandidate,
  PageStyleAnalysis,
  PageTypographyCandidate,
  RadiusToken,
  SemanticColorSystem,
  ShadowToken,
  SpacingToken,
  TypographyToken,
  BorderToken,
  TransitionToken,
  ButtonSnapshot,
  PageSection,
  TokenMeta,
} from '@/lib/types'
import { chromium, type ElementHandle, type Page } from 'playwright'

const MAX_STYLESHEETS = 6
const MAX_STYLESHEET_BYTES = 180_000
const MAX_CSS_EXCERPT = 3_500
const MAX_VISIBLE_ELEMENTS = 180
const MAX_INTERACTIVE_STATE_ELEMENTS = 12
const PAGE_ANALYSIS_TIMEOUT = 20_000

type ColorAccumulator = {
  hex: string
  property: string
  selectorHint?: string
  count: number
  roleHints: Set<string>
  layerHints: Set<'global' | 'hero' | 'content'>
  componentKinds: Set<ComponentKind>
  areaWeight: number
  viewportWeight: number
  repetitionWeight: number
  evidenceScore: number
  sources: Set<TokenMeta['source']>
  viewport?: string
}

type TypographyAccumulator = {
  key: string
  fontFamily: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  letterSpacing?: string
  count: number
  componentKinds: Set<ComponentKind>
  sampleText?: string
  evidenceScore: number
  sources: Set<TokenMeta['source']>
  viewport?: string
}

type ValueAccumulator = {
  value: string
  count: number
  componentKinds: Set<ComponentKind>
  evidenceScore: number
  sources: Set<TokenMeta['source']>
  viewport?: string
}

type LayoutAccumulator = {
  label: string
  kind: LayoutEvidence['kind']
  count: number
  componentKinds: Set<ComponentKind>
  evidenceScore: number
  sources: Set<TokenMeta['source']>
  viewport?: string
}

type RawDomColorCandidate = Omit<PageColorCandidate, 'layerHints' | 'roleHints'> & {
  roleHints: string[]
  layerHints: Array<'global' | 'hero' | 'content'>
}

type RawDomTypographyCandidate = PageTypographyCandidate

type RawValueAccumulator = {
  value: string
  count: number
  componentKinds: ComponentKind[]
  evidenceScore: number
  meta?: TokenMeta
}

type RawLayoutAccumulator = {
  label: string
  kind: LayoutEvidence['kind']
  count: number
  componentKinds: ComponentKind[]
  evidenceScore: number
  meta?: TokenMeta
}

type RawBorderAccumulator = {
  width: string
  style: string
  color?: string
  count: number
  componentKinds: ComponentKind[]
  meta?: TokenMeta
}

type RawTransitionAccumulator = {
  property: string
  duration: string
  easing: string
  count: number
  componentKinds: ComponentKind[]
  meta?: TokenMeta
}

type RawDomSignals = {
  colorCandidates: RawDomColorCandidate[]
  typographyCandidates: RawDomTypographyCandidate[]
  radiusCandidates: string[]
  shadowCandidates: string[]
  spacingCandidates: string[]
  layoutHints: string[]
  rawRadiusTokens: RawValueAccumulator[]
  rawShadowTokens: RawValueAccumulator[]
  rawSpacingTokens: RawValueAccumulator[]
  rawLayoutEvidence: RawLayoutAccumulator[]
  rawBorderTokens: RawBorderAccumulator[]
  rawTransitionTokens: RawTransitionAccumulator[]
  pageMaxWidth?: string
  gridColumns?: string
  stateTokens?: ComponentStateTokens
  buttonSnapshot?: ButtonSnapshot
  pageSections?: PageSection[]
}

type StateAccumulator = {
  value: string
  property: 'color' | 'background-color' | 'border-color' | 'box-shadow' | 'opacity' | 'transform'
  state: InteractionState
  componentKinds: Set<ComponentKind>
  evidenceScore: number
  meta?: TokenMeta
}

export function createEmptyPageAnalysis(sourceCount?: { inlineStyleBlocks: number; linkedStylesheets: number }): PageStyleAnalysis {
  return {
    colorCandidates: [],
    semanticColorSystem: undefined,
    typographyCandidates: [],
    typographyTokens: [],
    radiusCandidates: [],
    radiusTokens: [],
    shadowCandidates: [],
    shadowTokens: [],
    spacingCandidates: [],
    spacingTokens: [],
    layoutHints: [],
    layoutEvidence: [],
    stateTokens: {},
    borderTokens: [],
    transitionTokens: [],
    pageMaxWidth: undefined,
    gridColumns: undefined,
    cssTextExcerpt: '',
    sourceCount: sourceCount || {
      inlineStyleBlocks: 0,
      linkedStylesheets: 0,
    },
  }
}

function isLikelyAuthGate(targetUrl: string, content: string, finalUrl?: string): boolean {
  const lower = content.toLowerCase()
  const urlToCheck = (finalUrl || targetUrl).toLowerCase()

  if (/\b(login|signin|sign-in|auth|account|password-reset|reset-password|session)\b/.test(new URL(urlToCheck).pathname.toLowerCase())) {
    return true
  }

  let score = 0
  if (/\blog in with\b|\bsign in with\b|\bcontinue with\b/.test(lower)) score += 3
  if (/\bpasskey\b|\bsso\b|\boauth\b/.test(lower)) score += 2
  if (/\bforgot password\b|\buse an organization email\b/.test(lower)) score += 2
  if (/\bcreate account\b|\blog in to your\b|\bmagic link\b|\bverification code\b/.test(lower)) score += 2

  const targetPath = new URL(targetUrl).pathname.toLowerCase()
  const targetLooksAuth = /\b(login|signin|sign-in|auth|account|session)\b/.test(targetPath)
  return !targetLooksAuth && score >= 4
}

export function isLikelyAuthAnalysis(analysis: Pick<PageStyleAnalysis, 'typographyCandidates' | 'layoutHints' | 'colorCandidates'>): boolean {
  const textBlob = [
    ...analysis.typographyCandidates.map(candidate => candidate.sampleText || ''),
    ...analysis.layoutHints,
    ...analysis.colorCandidates.map(candidate => `${candidate.selectorHint || ''} ${candidate.property}`),
  ]
    .join(' ')
    .toLowerCase()

  let score = 0
  if (/\blog in with\b|\bsign in with\b|\bcontinue with\b/.test(textBlob)) score += 3
  if (/\blog in to your\b|\buse an organization email\b|\bmagic link\b|\bverification code\b/.test(textBlob)) score += 3
  if (/\bpasskey\b|\bsso\b|\boauth\b/.test(textBlob)) score += 2
  if (/\bforgot password\b|\breset password\b/.test(textBlob)) score += 1

  return score >= 4
}

function isAuthArtifactText(value: string): boolean {
  const normalized = value.toLowerCase()
  return /\blog in with\b|\bsign in with\b|\bcontinue with\b|\blog in to your\b|\buse an organization email\b|\bforgot password\b|\bpasskey\b|\bsso\b|\boauth\b|\bpassword-reset\b|\breset password\b|\bcreate account\b|\bmagic link\b|\bverification code\b/.test(normalized)
}

function stripAuthArtifacts(analysis: PageStyleAnalysis): PageStyleAnalysis {
  const typographyCandidates = analysis.typographyCandidates.filter(candidate =>
    !isAuthArtifactText(`${candidate.sampleText || ''} ${candidate.fontFamily || ''}`)
  )

  const colorCandidates = analysis.colorCandidates.filter(candidate =>
    !isAuthArtifactText(`${candidate.selectorHint || ''} ${candidate.property}`)
  )

  const layoutEvidence = analysis.layoutEvidence.filter(item =>
    !isAuthArtifactText(`${item.label} ${item.kind} ${(item.componentKinds || []).join(' ')}`)
  )

  const layoutHints = analysis.layoutHints.filter(hint => !isAuthArtifactText(hint))

  return {
    ...analysis,
    colorCandidates,
    typographyCandidates,
    typographyTokens: toTypographyTokens(typographyCandidates),
    layoutHints,
    layoutEvidence,
  }
}

function hasRetainedMeasuredSignals(analysis: PageStyleAnalysis): boolean {
  return Boolean(
    analysis.colorCandidates.length ||
    analysis.typographyCandidates.length ||
    analysis.radiusTokens.length ||
    analysis.shadowTokens.length ||
    analysis.spacingTokens.length ||
    analysis.layoutEvidence.length ||
    Object.values(analysis.stateTokens || {}).some(values => (values || []).length > 0)
  )
}

export function sanitizePageAnalysis(
  analysis: PageStyleAnalysis | undefined
): PageStyleAnalysis | undefined {
  if (!analysis) return analysis
  if (!isLikelyAuthAnalysis(analysis)) return analysis

  const stripped = stripAuthArtifacts(analysis)
  const retainedSignals = hasRetainedMeasuredSignals(stripped)

  if (!retainedSignals) {
    return createEmptyPageAnalysis(analysis.sourceCount)
  }

  return stripped
}

function normalizeHex(value: string): string | null {
  const match = value.match(/#([0-9a-f]{3,8})/i)
  if (!match) return null
  let hex = match[0].toUpperCase()
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }
  return hex.length >= 7 ? hex.slice(0, 7) : null
}

function rgbStringToHex(value: string): string | null {
  const match = value.match(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i)
  if (!match) return null
  const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if ([r, g, b].some(channel => Number.isNaN(channel) || channel < 0 || channel > 255)) return null
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function extractHexesFromValue(value: string): string[] {
  const matches = new Set<string>()

  for (const match of value.matchAll(/#([0-9a-f]{3,8})/gi)) {
    const normalized = normalizeHex(match[0])
    if (normalized) matches.add(normalized)
  }

  for (const match of value.matchAll(/rgba?\(\s*\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3}(?:[\s,\/]+[\d.]+)?\s*\)/gi)) {
    const normalized = rgbStringToHex(match[0])
    if (normalized) matches.add(normalized)
  }

  return [...matches]
}

function addUniqueValue(target: Set<string>, value?: string, max = 12) {
  if (!value || target.size >= max) return
  const normalized = value.trim()
  if (!normalized) return
  target.add(normalized)
}

function extractStyleBlocks(html: string): string[] {
  const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
  return blocks.map(match => match[1]).filter(Boolean)
}

function extractStylesheetHrefs(html: string, baseUrl: string): string[] {
  const hrefs = [...html.matchAll(/<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1])
    .filter(Boolean)

  const unique = new Set<string>()
  for (const href of hrefs) {
    try {
      unique.add(new URL(href, baseUrl).toString())
    } catch {
      continue
    }
    if (unique.size >= MAX_STYLESHEETS) break
  }

  return [...unique]
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; StyleLensBot/1.0; +https://stylelens.local)',
      accept: 'text/html,text/css,*/*;q=0.1',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  const text = await response.text()
  return text.slice(0, MAX_STYLESHEET_BYTES)
}

function classifyComponent(selectorHint = '', property = ''): ComponentKind[] {
  const joined = `${selectorHint} ${property}`.toLowerCase()
  const kinds = new Set<ComponentKind>()

  if (/\b(hero|banner|masthead|jumbotron)\b/.test(joined)) kinds.add('hero')
  if (/\b(nav|navbar|menu|header)\b/.test(joined)) kinds.add('nav')
  if (/\b(button|btn|cta)\b/.test(joined)) kinds.add('button')
  if (/\b(card|panel|tile|surface|modal)\b/.test(joined)) kinds.add('card')
  if (/\b(section|container|wrapper|content)\b/.test(joined)) kinds.add('section')
  if (/\b(input|field|textarea|select|form)\b/.test(joined)) kinds.add('input')
  if (/\b(link|anchor)\b/.test(joined)) kinds.add('link')
  if (/\b(text|title|heading|copy|body|paragraph)\b/.test(joined) || property === 'color') kinds.add('text')
  if (/\b(surface|panel|background)\b/.test(joined) || property.startsWith('background')) kinds.add('surface')

  if (!kinds.size) kinds.add(property === 'color' ? 'text' : 'section')
  return [...kinds]
}

function roleHintsFromProperty(property: string, selectorHint = '') {
  const joined = `${property} ${selectorHint}`.toLowerCase()
  const hints = new Set<string>()

  if (joined.includes('background') || joined.includes('bg')) hints.add('background')
  if (joined.includes('surface') || joined.includes('card') || joined.includes('panel')) hints.add('surface')
  if (joined.includes('primary') || joined.includes('brand') || joined.includes('button') || joined.includes('cta')) hints.add('primary')
  if (joined.includes('secondary')) hints.add('secondary')
  if (joined.includes('accent') || joined.includes('highlight')) hints.add('accent')
  if (joined.includes('text') || joined.includes('foreground') || joined.includes('font')) hints.add('text')
  if (joined.includes('border') || joined.includes('stroke') || joined.includes('outline') || joined.includes('divider')) hints.add('border')
  if (joined.includes('hero') || joined.includes('banner') || joined.includes('masthead')) hints.add('hero')
  if (joined.includes('muted') || joined.includes('secondary-text') || joined.includes('subtle')) hints.add('text-secondary')

  return [...hints]
}

function layerHintsFromSelector(selectorHint = ''): Array<'global' | 'hero' | 'content'> {
  const joined = selectorHint.toLowerCase()
  const hints = new Set<'global' | 'hero' | 'content'>()

  if (joined.includes('hero') || joined.includes('banner') || joined.includes('masthead')) hints.add('hero')
  if (joined.includes('card') || joined.includes('tile') || joined.includes('feature') || joined.includes('testimonial')) hints.add('content')
  if (!hints.size) hints.add('global')

  return [...hints]
}

function scoreColor(candidate: ColorAccumulator) {
  let score = candidate.count + candidate.areaWeight + candidate.viewportWeight + candidate.repetitionWeight + candidate.evidenceScore
  if (candidate.property === 'visual-hero') score += 28
  if (candidate.property === 'visual-page') score += 18
  if (candidate.property === 'visual-content') score += 8
  if (candidate.property === 'background-image') score += 10
  if (candidate.property === 'background-color') score += 8
  if (candidate.property === 'color') score += 5
  if (candidate.property === 'border-color') score += 3
  if (candidate.roleHints.has('background')) score += 8
  if (candidate.roleHints.has('surface')) score += 6
  if (candidate.roleHints.has('text')) score += 5
  if (candidate.roleHints.has('primary')) score += 6
  if (candidate.roleHints.has('secondary')) score += 4
  if (candidate.roleHints.has('border')) score += 3
  if (candidate.roleHints.has('hero')) score += 14
  if (candidate.hex === '#FFFFFF' || candidate.hex === '#000000') score += 2
  return score
}

function hexToRgbParts(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ]
}

function getColorBrightness(hex: string): number {
  const [r, g, b] = hexToRgbParts(hex)
  return (r + g + b) / 3
}

function getColorChroma(hex: string): number {
  const [r, g, b] = hexToRgbParts(hex)
  return Math.max(r, g, b) - Math.min(r, g, b)
}

function getColorDistance(hexA: string, hexB: string): number {
  const [r1, g1, b1] = hexToRgbParts(hexA)
  const [r2, g2, b2] = hexToRgbParts(hexB)
  return Math.sqrt(((r1 - r2) ** 2) + ((g1 - g2) ** 2) + ((b1 - b2) ** 2))
}

function isLikelyTextCandidate(candidate: PageColorCandidate) {
  return candidate.property === 'color'
}

function isLikelyBackgroundCandidate(candidate: PageColorCandidate) {
  return candidate.property === 'background-color'
    || candidate.property === 'background-image'
    || candidate.property === 'screenshot-hero'
    || candidate.property === 'screenshot-content'
    || candidate.property === 'visual-hero'
    || candidate.property === 'visual-page'
    || candidate.property === 'cta-background'
    || (candidate.property === 'css-variable' && candidate.roleHints.includes('background'))
}

function isLikelySurfaceCandidate(candidate: PageColorCandidate) {
  const usesBackgroundPaint =
    candidate.property === 'background-color'
    || candidate.property === 'background-image'
    || candidate.property === 'visual-page'
    || candidate.property === 'visual-content'
    || candidate.property === 'cta-background'
    || (candidate.property === 'css-variable' && (candidate.roleHints.includes('surface') || candidate.roleHints.includes('background')))
  if (!usesBackgroundPaint) return false
  return candidate.roleHints.includes('surface')
    || !!candidate.componentKinds?.includes('card')
    || !!candidate.componentKinds?.includes('surface')
    || candidate.layerHints.includes('content')
}

function isLikelyActionCandidate(candidate: PageColorCandidate) {
  return candidate.roleHints.includes('primary')
    || candidate.roleHints.includes('secondary')
    || candidate.roleHints.includes('accent')
    || !!candidate.componentKinds?.includes('button')
    || !!candidate.componentKinds?.includes('link')
}

function scoreActionCandidate(candidate: PageColorCandidate) {
  let score = candidate.evidenceScore || candidate.count || 0
  const kinds = candidate.componentKinds || []
  const selector = (candidate.selectorHint || '').toLowerCase()

  if (candidate.property === 'cta-background') score += 36
  if (candidate.property === 'cta-foreground') score += 10
  if (candidate.property === 'cta-border') score += 16
  if (candidate.property === 'css-variable') score += 18
  if (candidate.property === 'background-color') score += 22
  if (candidate.property === 'background-image') score += 18
  if (candidate.property === 'border-color') score += 6
  if (candidate.property === 'color') score += 2

  if (kinds.includes('button')) score += 30
  if (selector.includes('cta') || selector.includes('button') || selector.includes('btn')) score += 18
  if (kinds.includes('link')) score -= 10

  if (candidate.roleHints.includes('primary')) score += 12
  if (candidate.roleHints.includes('secondary')) score += 6
  if (candidate.roleHints.includes('accent')) score += 4
  if (candidate.roleHints.includes('cta')) score += 24

  if (candidate.hex.toUpperCase() === '#0000EE') score -= 18

  score += Math.min(20, getColorChroma(candidate.hex))
  return score
}

function quantizeChannel(channel: number): number {
  return Math.max(0, Math.min(255, Math.round(channel / 16) * 16))
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function isContainerBackgroundCandidate(candidate: PageColorCandidate) {
  const kinds = candidate.componentKinds || []
  if (kinds.includes('button') || kinds.includes('link') || kinds.includes('input')) return false
  return kinds.includes('hero')
    || kinds.includes('nav')
    || kinds.includes('section')
    || kinds.includes('surface')
    || kinds.includes('card')
    || kinds.length === 0
}

function isLikelyEmbeddedHeroMedia(candidate: PageColorCandidate) {
  const selector = (candidate.selectorHint || '').toLowerCase()
  return /heromedia|productimage|gradient|playpause|controller|video|media|image|app-inner|appinner|notion-app-inner|product|screenshot|workspace|editor|board/.test(selector)
}

function isLikelyUtilityNavBackground(candidate: PageColorCandidate) {
  const selector = (candidate.selectorHint || '').toLowerCase()
  return /downloadbox|download-box|nav|navbar|header|menu|button|btn|cta/.test(selector)
}

function mergeColorCandidates(domGroup: PageColorCandidate[], cssGroup: PageColorCandidate[]): PageColorCandidate[] {
  const merged = new Map<string, ColorAccumulator>()

  const deriveColorContext = (candidate: Pick<PageColorCandidate, 'roleHints' | 'layerHints' | 'componentKinds'>): string | undefined => {
    if (candidate.layerHints.includes('hero')) return 'hero color'
    if (candidate.componentKinds?.includes('nav')) return 'navigation color'
    if (candidate.roleHints.includes('text')) return 'text color'
    if (candidate.roleHints.includes('border')) return 'border color'
    if (candidate.roleHints.includes('surface')) return 'surface color'
    if (candidate.roleHints.includes('primary')) return 'primary action color'
    if (candidate.roleHints.includes('secondary')) return 'secondary action color'
    return 'page shell color'
  }

  const weightedGroups = [
    { group: domGroup, weight: 1 },
    { group: cssGroup, weight: 0.35 },
  ]

  for (const { group, weight } of weightedGroups) {
    for (const candidate of group) {
      const key = `${candidate.hex}:${candidate.property}`
      const existing = merged.get(key) || {
        hex: candidate.hex,
        property: candidate.property,
        selectorHint: candidate.selectorHint,
        count: 0,
        roleHints: new Set<string>(),
        layerHints: new Set<'global' | 'hero' | 'content'>(),
        componentKinds: new Set<ComponentKind>(),
        areaWeight: 0,
        viewportWeight: 0,
        repetitionWeight: 0,
        evidenceScore: 0,
        sources: new Set<TokenMeta['source']>(),
        viewport: candidate.meta?.viewport,
      }
      existing.count += candidate.count * weight
      existing.selectorHint = existing.selectorHint || candidate.selectorHint
      candidate.roleHints.forEach(hint => existing.roleHints.add(hint))
      candidate.layerHints.forEach(hint => existing.layerHints.add(hint))
      candidate.componentKinds?.forEach(kind => existing.componentKinds.add(kind))
      existing.areaWeight += (candidate.areaWeight || 0) * weight
      existing.viewportWeight += (candidate.viewportWeight || 0) * weight
      existing.repetitionWeight += (candidate.repetitionWeight || 0) * weight
      existing.evidenceScore += (candidate.evidenceScore || 0) * weight
      existing.viewport = existing.viewport || candidate.meta?.viewport
      existing.sources.add(candidate.meta?.source || (weight >= 1 ? 'dom-computed' : 'inferred'))
      merged.set(key, existing)
    }
  }

  return [...merged.values()]
    .sort((a, b) => scoreColor(b) - scoreColor(a))
    .slice(0, 20)
    .map(item => ({
      hex: item.hex,
      property: item.property,
      selectorHint: item.selectorHint,
      count: item.count,
      roleHints: [...item.roleHints],
      layerHints: [...item.layerHints],
      componentKinds: [...item.componentKinds],
      areaWeight: Math.round(item.areaWeight),
      viewportWeight: Math.round(item.viewportWeight),
      repetitionWeight: Math.round(item.repetitionWeight),
      evidenceScore: Math.round(scoreColor(item)),
      meta: {
        source: item.sources.has('dom-computed') ? 'dom-computed' : item.sources.has('screenshot-sampled') ? 'screenshot-sampled' : 'inferred',
        confidence:
          scoreColor(item) >= 120 || item.count >= 6 ? 'high'
            : scoreColor(item) >= 60 || item.count >= 3 ? 'medium'
              : 'low',
        evidenceCount: Math.max(1, Math.round(item.count)),
        context: deriveColorContext({
          roleHints: [...item.roleHints],
          layerHints: [...item.layerHints],
          componentKinds: [...item.componentKinds],
        }),
        viewport: item.viewport,
      },
    }))
}

function mergeTypographyCandidates(...groups: PageTypographyCandidate[][]): PageTypographyCandidate[] {
  const merged = new Map<string, TypographyAccumulator>()

  const deriveTypographyContext = (candidate: { componentKinds?: ComponentKind[] | Set<ComponentKind>; fontSize?: string }): string | undefined => {
    const rawKinds = candidate.componentKinds
    const kinds = rawKinds instanceof Set ? [...rawKinds] : (rawKinds || [])
    if (kinds.includes('hero')) return 'hero heading'
    if (kinds.includes('nav')) return 'navigation text'

    const size = parseTypographySize(candidate.fontSize)
    if (Number.isFinite(size) && size >= 36) return 'display text'
    if (Number.isFinite(size) && size >= 24) return 'section heading'
    if (Number.isFinite(size) && size >= 14) return 'body text'
    if (Number.isFinite(size)) return 'supporting text'
    return undefined
  }

  const hasNumericSize = (value?: string) => {
    if (!value) return false
    const normalized = value.trim().toLowerCase()
    if (!normalized || normalized === 'unknown' || normalized === 'inherit' || normalized.includes('nan')) return false
    return /\d/.test(normalized)
  }

  const parseTypographySize = (value?: string) => {
    if (!value) return Number.NaN
    const normalized = value.trim().toLowerCase()
    if (!normalized || normalized === 'unknown' || normalized === 'inherit' || normalized.includes('nan')) return Number.NaN
    const numeric = Number.parseFloat(normalized)
    if (!Number.isFinite(numeric)) return Number.NaN
    if (normalized.endsWith('px')) return numeric
    if (normalized.endsWith('rem') || normalized.endsWith('em')) return numeric * 16
    return numeric
  }

  const typographyRank = (candidate: TypographyAccumulator) => {
    let score = candidate.evidenceScore
    const size = parseTypographySize(candidate.fontSize)
    if (hasNumericSize(candidate.fontSize)) score += 100
    if (Number.isFinite(size)) {
      score += Math.min(size * 3, 240)
      if (size >= 48) score += 160
      else if (size >= 36) score += 120
      else if (size >= 28) score += 90
      else if (size >= 20) score += 50
      else if (size <= 13) score -= 80
      else if (size <= 15) score -= 30
    }
    if (candidate.sampleText && candidate.sampleText.trim().length >= 2) score += 30
    if (candidate.fontFamily && candidate.fontFamily !== 'inherit') score += 10
    if (candidate.lineHeight && candidate.lineHeight !== 'normal' && candidate.lineHeight !== 'inherit') score += 6
    if (candidate.letterSpacing && candidate.letterSpacing !== 'normal' && candidate.letterSpacing !== 'inherit') score += 6
    if (candidate.componentKinds?.has('hero')) score += 60
    if (candidate.componentKinds?.has('nav')) score -= 25
    return score
  }

  for (const group of groups) {
    for (const candidate of group) {
      const key = [candidate.fontFamily, candidate.fontSize || '', candidate.fontWeight || '', candidate.lineHeight || '', candidate.letterSpacing || ''].join('|')
      const existing = merged.get(key) || {
        key,
        fontFamily: candidate.fontFamily,
        fontSize: candidate.fontSize,
        fontWeight: candidate.fontWeight,
        lineHeight: candidate.lineHeight,
        letterSpacing: candidate.letterSpacing,
        count: 0,
        componentKinds: new Set<ComponentKind>(),
        sampleText: candidate.sampleText,
        evidenceScore: 0,
        sources: new Set<TokenMeta['source']>(),
        viewport: candidate.meta?.viewport,
      }
      existing.count += candidate.count
      candidate.componentKinds?.forEach(kind => existing.componentKinds.add(kind))
      existing.sampleText = existing.sampleText || candidate.sampleText
      existing.evidenceScore += candidate.evidenceScore || candidate.count
      existing.viewport = existing.viewport || candidate.meta?.viewport
      existing.sources.add(candidate.meta?.source || (candidate.sampleText ? 'dom-computed' : 'inferred'))
      merged.set(key, existing)
    }
  }

  return [...merged.values()]
    .filter(candidate => candidate.fontFamily && candidate.fontFamily !== 'inherit')
    .sort((a, b) => typographyRank(b) - typographyRank(a))
    .slice(0, 12)
    .map(item => ({
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      lineHeight: item.lineHeight,
      letterSpacing: item.letterSpacing,
      count: item.count,
      componentKinds: [...item.componentKinds],
      sampleText: item.sampleText,
      evidenceScore: Math.round(item.evidenceScore),
      meta: {
        source: item.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
        confidence:
          item.evidenceScore >= 220 || item.count >= 6 ? 'high'
            : item.evidenceScore >= 100 || item.count >= 3 ? 'medium'
              : 'low',
        evidenceCount: item.count,
        context: deriveTypographyContext(item),
        viewport: item.viewport,
      },
    }))
}

function mergeUniqueValues(limit: number, ...groups: string[][]): string[] {
  const merged = new Set<string>()
  for (const group of groups) {
    for (const item of group) {
      if (!item) continue
      merged.add(item)
      if (merged.size >= limit) return [...merged]
    }
  }
  return [...merged]
}

function sortValueAccumulators(values: ValueAccumulator[]): ValueAccumulator[] {
  return [...values].sort((a, b) => b.evidenceScore - a.evidenceScore)
}

function getAccumulatorViewport(entry: ValueAccumulator | RawValueAccumulator | LayoutAccumulator | RawLayoutAccumulator) {
  return (entry as { viewport?: string; meta?: TokenMeta }).viewport || (entry as { meta?: TokenMeta }).meta?.viewport
}

function getAccumulatorSource(entry: ValueAccumulator | RawValueAccumulator | LayoutAccumulator | RawLayoutAccumulator): TokenMeta['source'] {
  return 'sources' in entry ? [...entry.sources][0] || 'inferred' : (entry.meta?.source || 'inferred')
}

function mergeValueAccumulators(...groups: Array<Array<ValueAccumulator | RawValueAccumulator>>): ValueAccumulator[] {
  const merged = new Map<string, ValueAccumulator>()
  for (const group of groups) {
    for (const entry of group) {
      const existing = merged.get(entry.value) || {
        value: entry.value,
        count: 0,
        componentKinds: new Set<ComponentKind>(),
        evidenceScore: 0,
        sources: new Set<TokenMeta['source']>(),
        viewport: getAccumulatorViewport(entry),
      }
      existing.count += entry.count
      entry.componentKinds.forEach(kind => existing.componentKinds.add(kind))
      existing.evidenceScore += entry.evidenceScore
      existing.viewport = existing.viewport || getAccumulatorViewport(entry)
      existing.sources.add(getAccumulatorSource(entry))
      merged.set(entry.value, existing)
    }
  }
  return sortValueAccumulators([...merged.values()])
}

function mergeLayoutAccumulators(...groups: Array<Array<LayoutAccumulator | RawLayoutAccumulator>>): LayoutAccumulator[] {
  const merged = new Map<string, LayoutAccumulator>()
  for (const group of groups) {
    for (const entry of group) {
      const key = `${entry.kind}:${entry.label}`
      const existing = merged.get(key) || {
        label: entry.label,
        kind: entry.kind,
        count: 0,
        componentKinds: new Set<ComponentKind>(),
        evidenceScore: 0,
        sources: new Set<TokenMeta['source']>(),
        viewport: getAccumulatorViewport(entry),
      }
      existing.count += entry.count
      entry.componentKinds.forEach(kind => existing.componentKinds.add(kind))
      existing.evidenceScore += entry.evidenceScore
      existing.viewport = existing.viewport || getAccumulatorViewport(entry)
      existing.sources.add(getAccumulatorSource(entry))
      merged.set(key, existing)
    }
  }
  return [...merged.values()].sort((a, b) => b.evidenceScore - a.evidenceScore)
}

function toTypographyTokens(candidates: PageTypographyCandidate[]): TypographyToken[] {
  return candidates.slice(0, 8).map((candidate, index) => {
    const size = Number.parseFloat(candidate.fontSize || '')
    const candidateViewport = candidate.meta?.viewport
    const usage: TypographyToken['usage'] =
      Number.isFinite(size) && size >= 40 ? 'display'
        : Number.isFinite(size) && size >= 28 ? 'heading'
          : Number.isFinite(size) && size >= 20 ? 'title'
            : Number.isFinite(size) && size >= 14 ? 'body'
              : 'caption'

    return {
      id: `typo-${index + 1}`,
      label: usage === 'display' ? 'Display' : usage === 'heading' ? 'Heading' : usage === 'title' ? 'Title' : usage === 'body' ? 'Body' : 'Caption',
      fontFamily: candidate.fontFamily,
      fontSize: candidate.fontSize || 'unknown',
      fontWeight: candidate.fontWeight || '400',
      lineHeight: candidate.lineHeight || 'normal',
      letterSpacing: candidate.letterSpacing || 'normal',
      usage,
      sampleText: candidate.sampleText,
      sampleCount: candidate.count,
      componentKinds: candidate.componentKinds || [],
      evidenceScore: candidate.evidenceScore || candidate.count,
      meta: candidate.meta || {
        source: candidate.sampleText ? 'dom-computed' : 'inferred',
        confidence:
          (candidate.evidenceScore || candidate.count) >= 220 || candidate.count >= 6 ? 'high'
            : (candidate.evidenceScore || candidate.count) >= 100 || candidate.count >= 3 ? 'medium'
              : 'low',
        evidenceCount: candidate.count,
        context: usage === 'display'
          ? 'hero heading'
          : usage === 'heading'
            ? 'section heading'
            : usage === 'title'
              ? 'title text'
              : usage === 'body'
                ? 'body text'
                : 'supporting text',
        viewport: candidateViewport,
      },
    }
  })
}

function normalizeRadiusShorthand(value: string): string {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 4 && parts[0] === parts[1] && parts[1] === parts[2] && parts[2] === parts[3]) return parts[0]
  if (parts.length === 4 && parts[0] === parts[2] && parts[1] === parts[3]) return `${parts[0]} ${parts[1]}`
  if (parts.length === 3 && parts[0] === parts[2]) return `${parts[0]} ${parts[1]}`
  return value
}

function toRadiusTokens(values: ValueAccumulator[]): RadiusToken[] {
  return values.slice(0, 6).map((entry, index) => ({
    value: entry.value,
    label: index === 0 ? 'Primary radius' : `Radius ${index + 1}`,
    sampleCount: entry.count,
    componentKinds: [...entry.componentKinds],
    evidenceScore: Math.round(entry.evidenceScore),
    meta: {
      source: entry.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
      confidence:
        entry.evidenceScore >= 40 || entry.count >= 6 ? 'high'
          : entry.evidenceScore >= 18 || entry.count >= 3 ? 'medium'
            : 'low',
      evidenceCount: entry.count,
      context: 'border radius',
      viewport: entry.viewport,
    },
  }))
}

function toShadowTokens(values: ValueAccumulator[]): ShadowToken[] {
  return values.slice(0, 5).map((entry, index) => ({
    value: entry.value,
    label: index === 0 ? 'Primary shadow' : `Shadow ${index + 1}`,
    sampleCount: entry.count,
    componentKinds: [...entry.componentKinds],
    evidenceScore: Math.round(entry.evidenceScore),
    meta: {
      source: entry.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
      confidence:
        entry.evidenceScore >= 40 || entry.count >= 5 ? 'high'
          : entry.evidenceScore >= 18 || entry.count >= 3 ? 'medium'
            : 'low',
      evidenceCount: entry.count,
      context: 'box shadow',
      viewport: entry.viewport,
    },
  }))
}

function toSpacingTokens(values: ValueAccumulator[]): SpacingToken[] {
  return values.slice(0, 8).map((entry, index) => ({
    value: entry.value,
    label: index === 0 ? 'Base spacing' : `Spacing ${index + 1}`,
    sampleCount: entry.count,
    componentKinds: [...entry.componentKinds],
    evidenceScore: Math.round(entry.evidenceScore),
    meta: {
      source: entry.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
      confidence:
        entry.evidenceScore >= 30 || entry.count >= 8 ? 'high'
          : entry.evidenceScore >= 14 || entry.count >= 4 ? 'medium'
            : 'low',
      evidenceCount: entry.count,
      context: 'common spacing measurement',
      viewport: entry.viewport,
    },
  }))
}

function toLayoutEvidence(values: LayoutAccumulator[]): LayoutEvidence[] {
  return values.slice(0, 8).map(entry => ({
    label: entry.label,
    kind: entry.kind,
    sampleCount: entry.count,
    componentKinds: [...entry.componentKinds],
    evidenceScore: Math.round(entry.evidenceScore),
    meta: {
      source: entry.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
      confidence:
        entry.evidenceScore >= 20 || entry.count >= 4 ? 'high'
          : entry.evidenceScore >= 8 || entry.count >= 2 ? 'medium'
            : 'low',
      evidenceCount: entry.count,
      context: `${entry.kind} layout evidence`,
      viewport: entry.viewport,
    },
  }))
}

function toBorderTokens(values: RawBorderAccumulator[]): BorderToken[] {
  // Merge by width+style key, pick highest count
  const merged = new Map<string, RawBorderAccumulator>()
  for (const v of values) {
    const key = `${v.width}:${v.style}`
    const existing = merged.get(key)
    if (!existing || v.count > existing.count) merged.set(key, v)
  }
  return [...merged.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(v => ({
      width: v.width,
      style: v.style,
      color: v.color,
      sampleCount: v.count,
      componentKinds: v.componentKinds,
      meta: v.meta || {
        source: 'dom-computed',
        confidence: v.count >= 4 ? 'high' : v.count >= 2 ? 'medium' : 'low',
        evidenceCount: v.count,
        context: 'border style',
      },
    }))
}

function toTransitionTokens(values: RawTransitionAccumulator[]): TransitionToken[] {
  const merged = new Map<string, RawTransitionAccumulator>()
  for (const v of values) {
    const key = `${v.duration}:${v.easing}`
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, { ...v })
    } else {
      existing.count += v.count
      existing.componentKinds = [...new Set([...existing.componentKinds, ...v.componentKinds])]
    }
  }
  return [...merged.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(v => ({
      property: v.property,
      duration: v.duration,
      easing: v.easing,
      sampleCount: v.count,
      componentKinds: v.componentKinds,
      meta: v.meta || {
        source: 'dom-computed',
        confidence: v.count >= 4 ? 'high' : v.count >= 2 ? 'medium' : 'low',
        evidenceCount: v.count,
        context: 'transition token',
      },
    }))
}

function parseInteractionState(selectorHint: string): InteractionState | null {
  const lower = selectorHint.toLowerCase()
  if (lower.includes(':hover')) return 'hover'
  if (lower.includes(':focus') || lower.includes(':focus-visible') || lower.includes(':focus-within')) return 'focus'
  if (lower.includes(':active')) return 'active'
  if (lower.includes(':disabled') || lower.includes('[disabled]') || lower.includes('[aria-disabled')) return 'disabled'
  if (lower.includes(':selected') || lower.includes('[aria-selected') || lower.includes('[data-state="active"]')) return 'selected'
  return null
}

function buildStateTokens(
  cssStateTokens: StateAccumulator[],
  domStateTokens?: ComponentStateTokens
): ComponentStateTokens {
  const result: ComponentStateTokens = {
    button: [...(domStateTokens?.button || [])],
    link: [...(domStateTokens?.link || [])],
    input: [...(domStateTokens?.input || [])],
    card: [...(domStateTokens?.card || [])],
  }

  for (const token of cssStateTokens) {
    const payload: StateTokenValue = {
      value: token.value,
      property: token.property,
      state: token.state,
      componentKinds: [...token.componentKinds],
      evidenceScore: Math.round(token.evidenceScore),
      measured: true,
      meta: token.meta || {
        source: 'inferred',
        confidence: token.evidenceScore >= 18 ? 'high' : token.evidenceScore >= 8 ? 'medium' : 'low',
        evidenceCount: 1,
        context: `${token.state} state`,
      },
    }

    if (token.componentKinds.has('button')) result.button?.push(payload)
    if (token.componentKinds.has('link')) result.link?.push(payload)
    if (token.componentKinds.has('input')) result.input?.push(payload)
    if (token.componentKinds.has('card')) result.card?.push(payload)
  }

  return Object.fromEntries(
    Object.entries(result).map(([key, value]) => {
      const deduped = new Map<string, (typeof value extends Array<infer T> ? T : never)>()
      ;(value || []).forEach((item: StateTokenValue) => {
        deduped.set(`${item.state}:${item.property}:${item.value}`, item as never)
      })
      return [key, [...deduped.values()]]
    })
  ) as ComponentStateTokens
}

function emptyComponentStateTokens(): ComponentStateTokens {
  return {
    button: [],
    link: [],
    input: [],
    card: [],
  }
}

function mergeComponentStateTokens(...sources: Array<ComponentStateTokens | undefined>): ComponentStateTokens {
  const merged = emptyComponentStateTokens()

  for (const source of sources) {
    if (!source) continue
    for (const key of Object.keys(merged) as Array<keyof ComponentStateTokens>) {
      merged[key] = [...(merged[key] || []), ...(source[key] || [])]
    }
  }

  for (const key of Object.keys(merged) as Array<keyof ComponentStateTokens>) {
    const deduped = new Map<string, StateTokenValue>()
    ;(merged[key] || []).forEach(item => {
      deduped.set(`${item.state}:${item.property}:${item.value}`, item)
    })
    merged[key] = [...deduped.values()]
  }

  return merged
}

function mergeRawDomSignals(...sources: RawDomSignals[]): RawDomSignals {
  const available = sources.filter(Boolean)
  if (!available.length) {
    return {
      colorCandidates: [],
      typographyCandidates: [],
      radiusCandidates: [],
      shadowCandidates: [],
      spacingCandidates: [],
      layoutHints: [],
      rawRadiusTokens: [],
      rawShadowTokens: [],
      rawSpacingTokens: [],
      rawLayoutEvidence: [],
      rawBorderTokens: [],
      rawTransitionTokens: [],
      stateTokens: emptyComponentStateTokens(),
      buttonSnapshot: undefined,
      pageSections: [],
    }
  }

  return {
    colorCandidates: mergeColorCandidates(available.flatMap(source => source.colorCandidates), []),
    typographyCandidates: mergeTypographyCandidates(...available.map(source => source.typographyCandidates)),
    radiusCandidates: mergeUniqueValues(10, ...available.map(source => source.radiusCandidates)),
    shadowCandidates: mergeUniqueValues(8, ...available.map(source => source.shadowCandidates)),
    spacingCandidates: mergeUniqueValues(12, ...available.map(source => source.spacingCandidates)),
    layoutHints: mergeUniqueValues(8, ...available.map(source => source.layoutHints)),
    rawRadiusTokens: mergeValueAccumulators(...available.map(source => source.rawRadiusTokens)).map(entry => ({
      value: entry.value,
      count: entry.count,
      componentKinds: [...entry.componentKinds],
      evidenceScore: entry.evidenceScore,
      meta: {
        source: entry.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
        confidence:
          entry.evidenceScore >= 40 || entry.count >= 6 ? 'high'
            : entry.evidenceScore >= 18 || entry.count >= 3 ? 'medium'
              : 'low',
        evidenceCount: entry.count,
        context: 'border radius',
        viewport: entry.viewport,
      },
    })),
    rawShadowTokens: mergeValueAccumulators(...available.map(source => source.rawShadowTokens)).map(entry => ({
      value: entry.value,
      count: entry.count,
      componentKinds: [...entry.componentKinds],
      evidenceScore: entry.evidenceScore,
      meta: {
        source: entry.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
        confidence:
          entry.evidenceScore >= 40 || entry.count >= 5 ? 'high'
            : entry.evidenceScore >= 18 || entry.count >= 3 ? 'medium'
              : 'low',
        evidenceCount: entry.count,
        context: 'box shadow',
        viewport: entry.viewport,
      },
    })),
    rawSpacingTokens: mergeValueAccumulators(...available.map(source => source.rawSpacingTokens)).map(entry => ({
      value: entry.value,
      count: entry.count,
      componentKinds: [...entry.componentKinds],
      evidenceScore: entry.evidenceScore,
      meta: {
        source: entry.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
        confidence:
          entry.evidenceScore >= 30 || entry.count >= 8 ? 'high'
            : entry.evidenceScore >= 14 || entry.count >= 4 ? 'medium'
              : 'low',
        evidenceCount: entry.count,
        context: 'common spacing measurement',
        viewport: entry.viewport,
      },
    })),
    rawLayoutEvidence: mergeLayoutAccumulators(...available.map(source => source.rawLayoutEvidence)).map(entry => ({
      label: entry.label,
      kind: entry.kind,
      count: entry.count,
      componentKinds: [...entry.componentKinds],
      evidenceScore: entry.evidenceScore,
      meta: {
        source: entry.sources.has('dom-computed') ? 'dom-computed' : 'inferred',
        confidence:
          entry.evidenceScore >= 20 || entry.count >= 4 ? 'high'
            : entry.evidenceScore >= 8 || entry.count >= 2 ? 'medium'
              : 'low',
        evidenceCount: entry.count,
        context: `${entry.kind} layout evidence`,
        viewport: entry.viewport,
      },
    })),
    rawBorderTokens: available.flatMap(s => s.rawBorderTokens || []),
    rawTransitionTokens: available.flatMap(s => s.rawTransitionTokens || []),
    pageMaxWidth: available.map(s => s.pageMaxWidth).find(v => v),
    gridColumns: available.map(s => s.gridColumns).find(v => v),
    stateTokens: mergeComponentStateTokens(...available.map(source => source.stateTokens)),
    buttonSnapshot: available.map(s => s.buttonSnapshot).find(v => v),
    pageSections: (() => {
      // Use sections from the snapshot with the most sections found
      const allSections = available.map(s => s.pageSections || [])
      return allSections.reduce((best, cur) => cur.length > best.length ? cur : best, [])
    })(),
  }
}

type InteractiveSnapshot = {
  property: StateTokenValue['property']
  value: string
}

function normalizeStateValue(property: StateTokenValue['property'], value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (property === 'box-shadow' && trimmed === 'none') return null
  if (property === 'opacity' && trimmed === '1') return null
  if (property === 'transform' && trimmed === 'none') return null
  if (
    (property === 'color' || property === 'background-color' || property === 'border-color')
    && (trimmed === 'transparent' || trimmed === 'rgba(0, 0, 0, 0)' || trimmed === 'rgba(255, 255, 255, 0)')
  ) {
    return null
  }
  return trimmed
}

async function captureInteractiveSnapshot(handle: ElementHandle): Promise<InteractiveSnapshot[]> {
  return handle.evaluate((node) => {
    const element = node as HTMLElement
    const style = window.getComputedStyle(element)
    return [
      { property: 'color', value: style.color },
      { property: 'background-color', value: style.backgroundColor },
      { property: 'border-color', value: style.borderColor },
      { property: 'box-shadow', value: style.boxShadow },
      { property: 'opacity', value: style.opacity },
      { property: 'transform', value: style.transform },
    ]
  })
}

async function collectInteractiveStateSignals(page: Page): Promise<ComponentStateTokens> {
  const result = emptyComponentStateTokens()
  const targets = [
    { selector: 'button, [role="button"], .btn, .button', component: 'button' as const },
    { selector: 'a[href]', component: 'link' as const },
    { selector: 'input, textarea, select, [role="textbox"], [role="combobox"]', component: 'input' as const },
    { selector: '[class*="card"], [class*="panel"], article, [data-card]', component: 'card' as const },
  ]

  for (const { selector, component } of targets) {
    const handles = await page.locator(selector).elementHandles()
    let sampled = 0

    for (const handle of handles) {
      if (sampled >= MAX_INTERACTIVE_STATE_ELEMENTS) break

      const isVisible = await handle.evaluate((node) => {
        const element = node as HTMLElement
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return !(
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          Number(style.opacity) === 0 ||
          rect.width < 8 ||
          rect.height < 8 ||
          rect.bottom < 0 ||
          rect.top > window.innerHeight * 1.25
        )
      }).catch(() => false)

      if (!isVisible) continue

      const baseline = await captureInteractiveSnapshot(handle).catch(() => [])
      const baselineMap = new Map(baseline.map(item => [item.property, item.value.trim()]))

      const collectDiff = async (
        state: StateTokenValue['state'],
        action: () => Promise<void>,
        bonus = 0
      ) => {
        try {
          await action()
          await page.waitForTimeout(60)
          const snapshot = await captureInteractiveSnapshot(handle)
          snapshot.forEach(item => {
            const normalized = normalizeStateValue(item.property, item.value)
            if (!normalized) return
            if ((baselineMap.get(item.property) || '') === normalized) return
            result[component]?.push({
              value: normalized,
              property: item.property,
              state,
              componentKinds: [component],
              evidenceScore: 6 + bonus,
              measured: true,
            })
          })
        } catch {
          return
        }
      }

      await collectDiff('hover', async () => {
        await handle.hover({ force: true })
      }, 1)

      await collectDiff('focus', async () => {
        await handle.focus()
      }, 1)

      await collectDiff('active', async () => {
        await handle.hover({ force: true })
        await page.mouse.down()
      }, 2)

      await page.mouse.up().catch(() => {})
      await page.locator('body').hover({ force: true }).catch(() => {})
      sampled += 1
    }
  }

  return mergeComponentStateTokens(result)
}

function pickSlot(candidates: PageColorCandidate[], predicate: (candidate: PageColorCandidate) => boolean, exclude = new Set<string>()) {
  return candidates.find(candidate => !exclude.has(candidate.hex.toUpperCase()) && predicate(candidate))
}

export function buildSemanticColorSystem(candidates: PageColorCandidate[]): SemanticColorSystem | undefined {
  if (!candidates.length) return undefined

  const toToken = (candidate?: PageColorCandidate, forcedRole?: SemanticColorSystem[keyof SemanticColorSystem] extends infer T ? T extends { role: infer R } ? R : never : never) => {
    if (!candidate) return undefined
    const hex = candidate.hex.toUpperCase()
    const role = forcedRole || (candidate.roleHints.includes('text') ? 'text'
      : candidate.roleHints.includes('border') ? 'border'
        : candidate.roleHints.includes('surface') ? 'surface'
          : candidate.roleHints.includes('secondary') ? 'secondary'
            : candidate.roleHints.includes('primary') ? 'primary'
              : candidate.roleHints.includes('accent') ? 'accent'
                : 'background')
    const rgb = `rgb(${Number.parseInt(hex.slice(1, 3), 16)}, ${Number.parseInt(hex.slice(3, 5), 16)}, ${Number.parseInt(hex.slice(5, 7), 16)})`
    return {
      role,
      hex,
      rgb,
      hsl: '',
      name: candidate.roleHints.includes('hero') ? 'Hero Background' : 'Measured Color',
      description: `Measured from ${candidate.property}${candidate.selectorHint ? ` on ${candidate.selectorHint}` : ''}`,
      meta: candidate.meta,
    }
  }

  const ranked = [...candidates].sort((a, b) => (b.evidenceScore || b.count) - (a.evidenceScore || a.count))
  const used = new Set<string>()
  const inferLayerMode = (layerCandidates: PageColorCandidate[], fallback: 'light' | 'dark' = 'light') => {
    const preferred = [...layerCandidates].sort((a, b) => {
      const weight = (candidate: PageColorCandidate) => {
        if (candidate.property === 'css-variable') return 4
        if (candidate.property === 'visual-hero' || candidate.property === 'visual-page') return 3
        if (candidate.property === 'background-image') return 2
        if (candidate.property === 'background-color') return 1
        return 0
      }
      const weightDiff = weight(b) - weight(a)
      if (weightDiff !== 0) return weightDiff
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]

    if (!preferred) return fallback
    return getColorBrightness(preferred.hex) < 145 ? 'dark' : 'light'
  }

  const globalBackgroundCandidates = ranked.filter(candidate =>
    candidate.layerHints.includes('global') &&
    !candidate.layerHints.includes('content') &&
    isLikelyBackgroundCandidate(candidate) &&
    isContainerBackgroundCandidate(candidate) &&
    !isLikelyUtilityNavBackground(candidate) &&
    !isLikelyTextCandidate(candidate) &&
    candidate.property !== 'screenshot-content' &&
    candidate.property !== 'visual-content' &&
    candidate.property !== 'cta-background' &&
    !candidate.roleHints.includes('accent')
  )
  const heroBackgroundCandidates = ranked.filter(candidate =>
    candidate.layerHints.includes('hero') &&
    isLikelyBackgroundCandidate(candidate) &&
    isContainerBackgroundCandidate(candidate) &&
    !isLikelyEmbeddedHeroMedia(candidate)
  )
  const backgroundMode = (() => {
    const textCandidate = ranked.find(candidate =>
      isLikelyTextCandidate(candidate) &&
      !candidate.layerHints.includes('content')
    )
    if (textCandidate) {
      return getColorBrightness(textCandidate.hex) > 170 ? 'dark' : 'light'
    }

    const backgroundCandidate = ranked.find(candidate =>
      isLikelyBackgroundCandidate(candidate) &&
      isContainerBackgroundCandidate(candidate) &&
      !candidate.layerHints.includes('content')
    )
    if (!backgroundCandidate) return 'light'
    return getColorBrightness(backgroundCandidate.hex) < 145 ? 'dark' : 'light'
  })()
  const heroBackgroundMode = inferLayerMode(heroBackgroundCandidates, backgroundMode)
  const pageBackgroundMode = inferLayerMode(globalBackgroundCandidates, 'light')
  const prefersDarkText = backgroundMode === 'light'
  const preferredTextCandidates = ranked.filter(candidate =>
    isLikelyTextCandidate(candidate) &&
    !candidate.layerHints.includes('content')
  )
  const fallbackTextCandidates = ranked.filter(candidate =>
    (candidate.property === 'css-variable' && candidate.roleHints.includes('text'))
      || candidate.property === 'cta-foreground'
  )
  const heroTextCandidates = ranked.filter(candidate =>
    isLikelyTextCandidate(candidate) &&
    candidate.layerHints.includes('hero')
  )
  const heroActionCandidates = ranked.filter(candidate =>
    isLikelyActionCandidate(candidate) &&
    candidate.layerHints.includes('hero') &&
    getColorChroma(candidate.hex) >= 18
  )

  const heroBackground = [...heroBackgroundCandidates]
    .filter(candidate => heroBackgroundMode === 'dark'
      ? getColorBrightness(candidate.hex) <= 205
      : getColorBrightness(candidate.hex) >= 60
    )
    .sort((a, b) => {
      const aVisualBoost = a.property === 'visual-hero' || a.property === 'screenshot-hero' ? 3 : a.property === 'background-image' ? 2 : a.property === 'background-color' ? 1 : 0
      const bVisualBoost = b.property === 'visual-hero' || b.property === 'screenshot-hero' ? 3 : b.property === 'background-image' ? 2 : b.property === 'background-color' ? 1 : 0
      if (aVisualBoost !== bVisualBoost) return bVisualBoost - aVisualBoost

      const aModeMismatch = heroBackgroundMode === 'dark'
        ? Number(getColorBrightness(a.hex) > 170)
        : Number(getColorBrightness(a.hex) < 85)
      const bModeMismatch = heroBackgroundMode === 'dark'
        ? Number(getColorBrightness(b.hex) > 170)
        : Number(getColorBrightness(b.hex) < 85)
      if (aModeMismatch !== bModeMismatch) return aModeMismatch - bModeMismatch

      const aHeroBoost = a.property === 'background-image' ? 2 : a.property === 'background-color' ? 1 : 0
      const bHeroBoost = b.property === 'background-image' ? 2 : b.property === 'background-color' ? 1 : 0
      if (aHeroBoost !== bHeroBoost) return bHeroBoost - aHeroBoost

      const aBrightness = getColorBrightness(a.hex)
      const bBrightness = getColorBrightness(b.hex)
      if (heroBackgroundMode === 'dark' && aBrightness !== bBrightness) return aBrightness - bBrightness
      if (heroBackgroundMode === 'light' && aBrightness !== bBrightness) return bBrightness - aBrightness

      const aChroma = getColorChroma(a.hex)
      const bChroma = getColorChroma(b.hex)
      if (aChroma !== bChroma) return bChroma - aChroma

      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]
  if (heroBackground) used.add(heroBackground.hex.toUpperCase())

  const pageBackground = [...globalBackgroundCandidates]
    .filter(candidate =>
      !used.has(candidate.hex.toUpperCase()) &&
      (!heroBackground || getColorDistance(candidate.hex, heroBackground.hex) >= 28)
    )
    .filter(candidate => pageBackgroundMode === 'light'
      ? getColorBrightness(candidate.hex) >= 170
      : getColorBrightness(candidate.hex) <= 120
    )
    .sort((a, b) => {
      const pageWeight = (candidate: PageColorCandidate) => {
        if (candidate.property === 'css-variable') return 4
        if (candidate.property === 'background-color') return 3
        if (candidate.property === 'background-image') return 2
        if (candidate.property === 'visual-page') return 1
        return 0
      }
      const aVisualBoost = pageWeight(a)
      const bVisualBoost = pageWeight(b)
      if (aVisualBoost !== bVisualBoost) return bVisualBoost - aVisualBoost

      const aModeMismatch = pageBackgroundMode === 'light'
        ? Number(getColorBrightness(a.hex) < 150)
        : Number(getColorBrightness(a.hex) > 170)
      const bModeMismatch = pageBackgroundMode === 'light'
        ? Number(getColorBrightness(b.hex) < 150)
        : Number(getColorBrightness(b.hex) > 170)
      if (aModeMismatch !== bModeMismatch) return aModeMismatch - bModeMismatch

      const aChroma = getColorChroma(a.hex)
      const bChroma = getColorChroma(b.hex)
      if (pageBackgroundMode === 'light' && aChroma !== bChroma) return aChroma - bChroma
      if (pageBackgroundMode === 'dark' && aChroma !== bChroma) return aChroma - bChroma

      const aBrightness = getColorBrightness(a.hex)
      const bBrightness = getColorBrightness(b.hex)
      if (pageBackgroundMode === 'light' && aBrightness !== bBrightness) return bBrightness - aBrightness
      if (pageBackgroundMode === 'dark' && aBrightness !== bBrightness) return aBrightness - bBrightness
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]
    || [...globalBackgroundCandidates]
      .filter(candidate =>
        !used.has(candidate.hex.toUpperCase()) &&
        (!heroBackground || getColorDistance(candidate.hex, heroBackground.hex) >= 28)
      )
      .sort((a, b) => {
        const aBrightness = getColorBrightness(a.hex)
        const bBrightness = getColorBrightness(b.hex)
        return bBrightness - aBrightness
      })[0]
  if (pageBackground) used.add(pageBackground.hex.toUpperCase())

  const surface = [...ranked]
    .filter(candidate =>
      isLikelySurfaceCandidate(candidate) &&
      candidate.property !== 'cta-background' &&
      candidate.hex.toUpperCase() !== pageBackground?.hex.toUpperCase() &&
      !used.has(candidate.hex.toUpperCase())
    )
    .sort((a, b) => {
      const aLayerBoost = (a.layerHints.includes('content') ? 2 : 0) + (a.property === 'screenshot-content' || a.property === 'visual-content' ? 2 : 0)
      const bLayerBoost = (b.layerHints.includes('content') ? 2 : 0) + (b.property === 'screenshot-content' || b.property === 'visual-content' ? 2 : 0)
      if (aLayerBoost !== bLayerBoost) return bLayerBoost - aLayerBoost

      if (pageBackground) {
        const pageBrightness = getColorBrightness(pageBackground.hex)
        const aDistance = Math.abs(getColorBrightness(a.hex) - pageBrightness)
        const bDistance = Math.abs(getColorBrightness(b.hex) - pageBrightness)
        if (aDistance !== bDistance) return aDistance - bDistance
      }

      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]
  if (surface) used.add(surface.hex.toUpperCase())

  const textPrimary = preferredTextCandidates
    .filter(candidate => !used.has(candidate.hex.toUpperCase()))
    .sort((a, b) => {
      const aBrightness = getColorBrightness(a.hex)
      const bBrightness = getColorBrightness(b.hex)
      if (prefersDarkText && aBrightness !== bBrightness) return aBrightness - bBrightness
      if (!prefersDarkText && aBrightness !== bBrightness) return bBrightness - aBrightness
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0] || fallbackTextCandidates
      .filter(candidate => !used.has(candidate.hex.toUpperCase()))
      .sort((a, b) => (b.evidenceScore || b.count) - (a.evidenceScore || a.count))[0]
  if (textPrimary) used.add(textPrimary.hex.toUpperCase())

  const heroTextPrimary = heroTextCandidates
    .filter(candidate => candidate.hex.toUpperCase() !== textPrimary?.hex.toUpperCase())
    .sort((a, b) => {
      const aBrightness = getColorBrightness(a.hex)
      const bBrightness = getColorBrightness(b.hex)
      if (backgroundMode === 'dark' && aBrightness !== bBrightness) return bBrightness - aBrightness
      if (backgroundMode === 'light' && aBrightness !== bBrightness) return aBrightness - bBrightness
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]

  const textSecondary = preferredTextCandidates
    .filter(candidate => !used.has(candidate.hex.toUpperCase()))
    .sort((a, b) => {
      const aSecondaryHint = a.roleHints.includes('text-secondary') ? 1 : 0
      const bSecondaryHint = b.roleHints.includes('text-secondary') ? 1 : 0
      if (aSecondaryHint !== bSecondaryHint) return bSecondaryHint - aSecondaryHint

      const primaryBrightness = textPrimary ? getColorBrightness(textPrimary.hex) : prefersDarkText ? 20 : 235
      const aDistance = Math.abs(getColorBrightness(a.hex) - primaryBrightness)
      const bDistance = Math.abs(getColorBrightness(b.hex) - primaryBrightness)
      if (aDistance !== bDistance) return bDistance - aDistance

      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]
  if (textSecondary) used.add(textSecondary.hex.toUpperCase())

  const border = pickSlot(ranked, candidate =>
    candidate.roleHints.includes('border') || candidate.property === 'border-color'
  , used)
  if (border) used.add(border.hex.toUpperCase())

  const actionCandidates = ranked.filter(candidate =>
    isLikelyActionCandidate(candidate) &&
    !used.has(candidate.hex.toUpperCase()) &&
    getColorChroma(candidate.hex) >= 18
  )

  const primaryAction = [...actionCandidates]
    .sort((a, b) => {
      const aCtaBoost = a.property === 'cta-background' ? 3 : a.property === 'cta-border' ? 2 : a.property === 'cta-foreground' ? 1 : 0
      const bCtaBoost = b.property === 'cta-background' ? 3 : b.property === 'cta-border' ? 2 : b.property === 'cta-foreground' ? 1 : 0
      if (aCtaBoost !== bCtaBoost) return bCtaBoost - aCtaBoost

      const scoreDiff = scoreActionCandidate(b) - scoreActionCandidate(a)
      if (scoreDiff !== 0) return scoreDiff
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]
  if (primaryAction) used.add(primaryAction.hex.toUpperCase())

  const heroPrimaryAction = [...heroActionCandidates]
    .filter(candidate => {
      if (!heroBackground) return true
      const brightnessGap = Math.abs(getColorBrightness(candidate.hex) - getColorBrightness(heroBackground.hex))
      const chromaGap = Math.abs(getColorChroma(candidate.hex) - getColorChroma(heroBackground.hex))
      const distance = getColorDistance(candidate.hex, heroBackground.hex)
      return brightnessGap >= 18 || chromaGap >= 12 || distance >= 42
    })
    .sort((a, b) => {
      const aCtaBoost = a.property === 'cta-background' ? 3 : a.property === 'cta-border' ? 2 : a.property === 'cta-foreground' ? 1 : 0
      const bCtaBoost = b.property === 'cta-background' ? 3 : b.property === 'cta-border' ? 2 : b.property === 'cta-foreground' ? 1 : 0
      if (aCtaBoost !== bCtaBoost) return bCtaBoost - aCtaBoost

      if (heroBackground) {
        const heroBrightness = getColorBrightness(heroBackground.hex)
        const aBrightness = getColorBrightness(a.hex)
        const bBrightness = getColorBrightness(b.hex)
        const aContrast = Math.abs(aBrightness - heroBrightness)
        const bContrast = Math.abs(bBrightness - heroBrightness)
        if (aContrast !== bContrast) return bContrast - aContrast

        const aDistance = getColorDistance(a.hex, heroBackground.hex)
        const bDistance = getColorDistance(b.hex, heroBackground.hex)
        if (aDistance !== bDistance) return bDistance - aDistance
      }

      const scoreDiff = scoreActionCandidate(b) - scoreActionCandidate(a)
      if (scoreDiff !== 0) return scoreDiff
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]

  const secondaryAction = [...actionCandidates]
    .filter(candidate => candidate.hex.toUpperCase() !== primaryAction?.hex.toUpperCase())
    .sort((a, b) => {
      const aSecondaryHint = a.roleHints.includes('secondary') ? 1 : 0
      const bSecondaryHint = b.roleHints.includes('secondary') ? 1 : 0
      if (aSecondaryHint !== bSecondaryHint) return bSecondaryHint - aSecondaryHint

      const scoreDiff = scoreActionCandidate(b) - scoreActionCandidate(a)
      if (scoreDiff !== 0) return scoreDiff
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]
  if (secondaryAction) used.add(secondaryAction.hex.toUpperCase())

  const heroSecondaryAction = [...heroActionCandidates]
    .filter(candidate => candidate.hex.toUpperCase() !== heroPrimaryAction?.hex.toUpperCase())
    .filter(candidate => {
      if (!heroBackground) return true
      const brightnessGap = Math.abs(getColorBrightness(candidate.hex) - getColorBrightness(heroBackground.hex))
      const distance = getColorDistance(candidate.hex, heroBackground.hex)
      return brightnessGap >= 14 || distance >= 36
    })
    .sort((a, b) => {
      if (heroBackground) {
        const heroBrightness = getColorBrightness(heroBackground.hex)
        const aContrast = Math.abs(getColorBrightness(a.hex) - heroBrightness)
        const bContrast = Math.abs(getColorBrightness(b.hex) - heroBrightness)
        if (aContrast !== bContrast) return bContrast - aContrast
      }

      const scoreDiff = scoreActionCandidate(b) - scoreActionCandidate(a)
      if (scoreDiff !== 0) return scoreDiff
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]

  const heroAccentColors = ranked
    .filter(candidate =>
      candidate.layerHints.includes('hero') &&
      getColorChroma(candidate.hex) >= 24 &&
      candidate.hex.toUpperCase() !== heroBackground?.hex.toUpperCase() &&
      candidate.hex.toUpperCase() !== heroPrimaryAction?.hex.toUpperCase() &&
      candidate.hex.toUpperCase() !== heroSecondaryAction?.hex.toUpperCase()
    )
    .slice(0, 4)
    .map(candidate => toToken(candidate, 'accent'))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))

  const contentColors = ranked
    .filter(candidate =>
      candidate.layerHints.includes('content') &&
      !used.has(candidate.hex.toUpperCase()) &&
      getColorChroma(candidate.hex) >= 12
    )
    .slice(0, 6)
    .map(candidate => toToken(candidate, 'accent'))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))

  return {
    heroBackground: toToken(heroBackground, 'background'),
    heroTextPrimary: toToken(heroTextPrimary, 'text'),
    heroPrimaryAction: toToken(heroPrimaryAction, 'primary'),
    heroSecondaryAction: toToken(heroSecondaryAction, 'secondary'),
    heroAccentColors: heroAccentColors.length ? heroAccentColors : undefined,
    pageBackground: toToken(pageBackground, 'background'),
    surface: toToken(surface, 'surface'),
    textPrimary: toToken(textPrimary, 'text'),
    textSecondary: toToken(textSecondary, 'text'),
    border: toToken(border, 'border'),
    primaryAction: toToken(primaryAction, 'primary'),
    secondaryAction: toToken(secondaryAction, 'secondary'),
    contentColors: contentColors.length ? contentColors : undefined,
  }
}

function extractCssSignals(cssText: string): {
  colorCandidates: PageColorCandidate[]
  typographyCandidates: PageTypographyCandidate[]
  radiusCandidates: string[]
  shadowCandidates: string[]
  spacingCandidates: string[]
  layoutHints: string[]
  rawRadiusTokens: ValueAccumulator[]
  rawShadowTokens: ValueAccumulator[]
  rawSpacingTokens: ValueAccumulator[]
  rawLayoutEvidence: LayoutAccumulator[]
  rawStateTokens: StateAccumulator[]
} {
  const colors = new Map<string, ColorAccumulator>()
  const typography = new Map<string, TypographyAccumulator>()
  const radiusValues = new Map<string, ValueAccumulator>()
  const shadowValues = new Map<string, ValueAccumulator>()
  const spacingValues = new Map<string, ValueAccumulator>()
  const layoutValues = new Map<string, LayoutAccumulator>()
  const stateTokens = new Map<string, StateAccumulator>()

  const declarationRegex = /([.#]?[a-z0-9:_\-[\]\s>+~(),"'*=]+)?\{([^{}]+)\}/gi
  let match: RegExpExecArray | null

  while ((match = declarationRegex.exec(cssText)) !== null) {
    const selectorHint = match[1]?.trim() || ''
    const block = match[2]
    const componentKinds = classifyComponent(selectorHint)
    const layerHints = layerHintsFromSelector(selectorHint)
    const interactionState = parseInteractionState(selectorHint)

    const propertyRegex = /([a-z-]+)\s*:\s*([^;]+);?/gi
    let propMatch: RegExpExecArray | null

    let fontFamily = ''
    let fontSize: string | undefined
    let fontWeight: string | undefined
    let lineHeight: string | undefined
    let letterSpacing: string | undefined

    while ((propMatch = propertyRegex.exec(block)) !== null) {
      const property = propMatch[1].trim()
      const value = propMatch[2].trim()

      for (const hex of extractHexesFromValue(value)) {
        const key = `${hex}:${property}:${selectorHint}`
      const existing = colors.get(key) || {
        hex,
        property,
          selectorHint,
          count: 0,
          roleHints: new Set<string>(),
          layerHints: new Set<'global' | 'hero' | 'content'>(),
          componentKinds: new Set<ComponentKind>(),
        areaWeight: 0,
        viewportWeight: 0,
        repetitionWeight: 0,
        evidenceScore: 0,
        sources: new Set<TokenMeta['source']>(),
        viewport: undefined,
      }
        existing.count += 1
        roleHintsFromProperty(property, selectorHint).forEach(hint => existing.roleHints.add(hint))
        layerHints.forEach(hint => existing.layerHints.add(hint))
        componentKinds.forEach(kind => existing.componentKinds.add(kind))
      existing.repetitionWeight += 1
      existing.evidenceScore += 2
      existing.sources.add('inferred')
      colors.set(key, existing)
    }

      if (property === 'font-family') fontFamily = value.replace(/\s*!important$/, '')
      if (property === 'font-size') fontSize = value
      if (property === 'font-weight') fontWeight = value
      if (property === 'line-height') lineHeight = value
      if (property === 'letter-spacing') letterSpacing = value

      if (property === 'border-radius' && value !== '0' && value !== '0px' && !value.includes('var(') && !value.includes('calc(')) {
        const normalized = normalizeRadiusShorthand(value)
        const existing = radiusValues.get(normalized) || { value: normalized, count: 0, componentKinds: new Set<ComponentKind>(), evidenceScore: 0, sources: new Set<TokenMeta['source']>(), viewport: undefined }
        existing.count += 1
        componentKinds.forEach(kind => existing.componentKinds.add(kind))
        existing.evidenceScore += 1
        existing.sources.add('inferred')
        radiusValues.set(normalized, existing)
      }

      if (property === 'box-shadow' && value !== 'none' && !value.includes('var(')) {
        const existing = shadowValues.get(value) || { value, count: 0, componentKinds: new Set<ComponentKind>(), evidenceScore: 0, sources: new Set<TokenMeta['source']>(), viewport: undefined }
        existing.count += 1
        componentKinds.forEach(kind => existing.componentKinds.add(kind))
        existing.evidenceScore += 1
        existing.sources.add('inferred')
        shadowValues.set(value, existing)
      }

      if (property === 'gap' || property.startsWith('padding') || property.startsWith('margin')) {
        for (const item of value.match(/\d+(\.\d+)?px/g) || []) {
          if (Number.parseFloat(item) < 4) continue
          const existing = spacingValues.get(item) || { value: item, count: 0, componentKinds: new Set<ComponentKind>(), evidenceScore: 0, sources: new Set<TokenMeta['source']>(), viewport: undefined }
          existing.count += 1
          componentKinds.forEach(kind => existing.componentKinds.add(kind))
          existing.evidenceScore += 1
          existing.sources.add('inferred')
          spacingValues.set(item, existing)
        }
      }

      if (property === 'display' && value.includes('grid')) {
        layoutValues.set('Grid', {
          label: 'Grid',
          kind: 'grid',
          count: (layoutValues.get('Grid')?.count || 0) + 1,
          componentKinds: new Set(componentKinds),
          evidenceScore: (layoutValues.get('Grid')?.evidenceScore || 0) + 2,
          sources: new Set<TokenMeta['source']>(['inferred']),
          viewport: undefined,
        })
      }
      if (property === 'display' && value.includes('flex')) {
        layoutValues.set('Flex', {
          label: 'Flex',
          kind: 'flex',
          count: (layoutValues.get('Flex')?.count || 0) + 1,
          componentKinds: new Set(componentKinds),
          evidenceScore: (layoutValues.get('Flex')?.evidenceScore || 0) + 2,
          sources: new Set<TokenMeta['source']>(['inferred']),
          viewport: undefined,
        })
      }
      if (property.startsWith('grid-template-columns')) {
        layoutValues.set('Multi-column grid', {
          label: 'Multi-column grid',
          kind: 'multi-column',
          count: (layoutValues.get('Multi-column grid')?.count || 0) + 1,
          componentKinds: new Set(componentKinds),
          evidenceScore: (layoutValues.get('Multi-column grid')?.evidenceScore || 0) + 3,
          sources: new Set<TokenMeta['source']>(['inferred']),
          viewport: undefined,
        })
      }
      if (property === 'position' && value === 'sticky') {
        layoutValues.set('Sticky navigation', {
          label: 'Sticky navigation',
          kind: 'sticky',
          count: (layoutValues.get('Sticky navigation')?.count || 0) + 1,
          componentKinds: new Set(componentKinds),
          evidenceScore: (layoutValues.get('Sticky navigation')?.evidenceScore || 0) + 3,
          sources: new Set<TokenMeta['source']>(['inferred']),
          viewport: undefined,
        })
      }

      if (interactionState && ['color', 'background-color', 'border-color', 'box-shadow', 'opacity', 'transform'].includes(property)) {
        const key = `${selectorHint}:${interactionState}:${property}:${value}`
        const existing = stateTokens.get(key) || {
          value,
          property: property as StateAccumulator['property'],
          state: interactionState,
          componentKinds: new Set<ComponentKind>(),
          evidenceScore: 0,
          meta: {
            source: 'inferred',
            confidence: 'medium',
            evidenceCount: 1,
            context: `${interactionState} state`,
          },
        }
        componentKinds.forEach(kind => existing.componentKinds.add(kind))
        existing.evidenceScore += 3
        stateTokens.set(key, existing)
      }
    }

    if (fontFamily) {
      const key = [fontFamily, fontSize || '', fontWeight || '', lineHeight || '', letterSpacing || ''].join('|')
      const existing = typography.get(key) || {
        key,
        fontFamily,
        fontSize,
        fontWeight,
        lineHeight,
        letterSpacing,
        count: 0,
        componentKinds: new Set<ComponentKind>(),
        sampleText: undefined,
        evidenceScore: 0,
        sources: new Set<TokenMeta['source']>(),
        viewport: undefined,
      }
      existing.count += 1
      componentKinds.forEach(kind => existing.componentKinds.add(kind))
      existing.evidenceScore += 2
      existing.sources.add('inferred')
      typography.set(key, existing)
    }
  }

  return {
    colorCandidates: [...colors.values()].sort((a, b) => scoreColor(b) - scoreColor(a)).slice(0, 18).map(item => ({
      hex: item.hex,
      property: item.property,
      selectorHint: item.selectorHint,
      count: item.count,
      roleHints: [...item.roleHints],
      layerHints: [...item.layerHints],
      componentKinds: [...item.componentKinds],
      areaWeight: item.areaWeight,
      viewportWeight: item.viewportWeight,
      repetitionWeight: item.repetitionWeight,
      evidenceScore: Math.round(scoreColor(item)),
      meta: {
        source: 'inferred',
        confidence: scoreColor(item) >= 60 || item.count >= 3 ? 'medium' : 'low',
        evidenceCount: Math.max(1, Math.round(item.count)),
        context: roleHintsFromProperty(item.property, item.selectorHint).includes('hero') ? 'hero color' : roleHintsFromProperty(item.property, item.selectorHint).includes('text') ? 'text color' : 'css color rule',
      },
    })),
    typographyCandidates: [...typography.values()].sort((a, b) => b.evidenceScore - a.evidenceScore).slice(0, 10).map(item => ({
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      lineHeight: item.lineHeight,
      letterSpacing: item.letterSpacing,
      count: item.count,
      componentKinds: [...item.componentKinds],
      sampleText: item.sampleText,
      evidenceScore: Math.round(item.evidenceScore),
      meta: {
        source: 'inferred',
        confidence: item.evidenceScore >= 6 || item.count >= 3 ? 'medium' : 'low',
        evidenceCount: item.count,
        context: item.componentKinds.has('hero') ? 'hero text' : item.componentKinds.has('nav') ? 'navigation text' : 'css typography rule',
      },
    })),
    radiusCandidates: [...radiusValues.keys()].slice(0, 10),
    shadowCandidates: [...shadowValues.keys()].slice(0, 8),
    spacingCandidates: [...spacingValues.keys()].slice(0, 12),
    layoutHints: [...layoutValues.keys()].slice(0, 8),
    rawRadiusTokens: [...radiusValues.values()],
    rawShadowTokens: [...shadowValues.values()],
    rawSpacingTokens: [...spacingValues.values()],
    rawLayoutEvidence: [...layoutValues.values()],
    rawStateTokens: [...stateTokens.values()],
  }
}

type DomExtractionOptions = {
  pageAlreadySettled?: boolean
  snapshotCount?: number
}

async function extractDomSignalsFromPage(
  page: Page,
  targetUrl: string,
  options?: DomExtractionOptions
): Promise<RawDomSignals> {
  const pageAlreadySettled = options?.pageAlreadySettled ?? false
  const snapshotCount = Math.max(1, Math.min(options?.snapshotCount ?? 3, 3))

  if (!pageAlreadySettled) {
    await page.waitForTimeout(1200)
  }
  const finalUrl = page.url()
  const authProbeText = `${await page.title().catch(() => '')} ${(await page.textContent('body').catch(() => '') || '').slice(0, 1200)}`
  if (isLikelyAuthGate(targetUrl, authProbeText, finalUrl)) {
    console.warn(
      '[pageAnalyzer] Auth-like DOM probe detected, continuing with measured DOM signals and relying on later sanitization:',
      finalUrl
    )
  }

  const interactiveStateTokens = await collectInteractiveStateSignals(page)

  const collectSnapshot = () => page.evaluate(({ maxVisibleElements }) => {
      type ComponentKind = 'hero' | 'nav' | 'button' | 'card' | 'section' | 'input' | 'link' | 'text' | 'surface'
      type ValueAccumulator = {
        value: string
        count: number
        componentKinds: ComponentKind[]
        evidenceScore: number
        meta?: {
          source: 'dom-computed'
          confidence: 'high' | 'medium' | 'low'
          evidenceCount: number
          context?: string
          viewport?: string
        }
      }
      type LayoutAccumulator = {
        label: string
        kind: 'hero' | 'grid' | 'flex' | 'navigation' | 'form' | 'section' | 'multi-column' | 'sticky' | 'stack'
        count: number
        componentKinds: ComponentKind[]
        evidenceScore: number
        meta?: {
          source: 'dom-computed'
          confidence: 'high' | 'medium' | 'low'
          evidenceCount: number
          context?: string
          viewport?: string
        }
      }

      const colorMap = new Map<string, any>()
      const typoMap = new Map<string, any>()
      const radiusValues = new Map<string, ValueAccumulator>()
      const shadowValues = new Map<string, ValueAccumulator>()
      const spacingValues = new Map<string, ValueAccumulator>()
      const layoutValues = new Map<string, LayoutAccumulator>()

      const rgbToHex = (value: string) => {
        const match = value.match(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i)
        if (!match) return null
        const parts = [Number(match[1]), Number(match[2]), Number(match[3])]
        if (parts.some(part => Number.isNaN(part) || part < 0 || part > 255)) return null
        return `#${parts.map(part => part.toString(16).padStart(2, '0')).join('').toUpperCase()}`
      }

      const isTransparent = (value: string) =>
        !value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || value === 'rgba(255, 255, 255, 0)'

      const selectorHintFor = (el: Element) => {
        const tag = el.tagName.toLowerCase()
        const className = typeof (el as HTMLElement).className === 'string'
          ? (el as HTMLElement).className.split(/\s+/).slice(0, 2).join('.')
          : ''
        return className ? `${tag}.${className}` : tag
      }

      const classifyComponent = (el: HTMLElement, selectorHint: string): ComponentKind[] => {
        const joined = `${el.tagName.toLowerCase()} ${selectorHint} ${el.getAttribute('role') || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase()
        const kinds = new Set<ComponentKind>()
        if (/\b(hero|banner|masthead)\b/.test(joined)) kinds.add('hero')
        if (el.tagName.toLowerCase() === 'nav' || /\b(nav|navbar|menu)\b/.test(joined)) kinds.add('nav')
        if (el.tagName.toLowerCase() === 'button' || /\b(btn|button|cta)\b/.test(joined)) kinds.add('button')
        if (/\b(card|panel|tile|surface|modal)\b/.test(joined)) kinds.add('card')
        if (el.tagName.toLowerCase() === 'section' || /\b(section|container|wrapper)\b/.test(joined)) kinds.add('section')
        if (['input', 'textarea', 'select', 'form'].includes(el.tagName.toLowerCase()) || /\b(form|field)\b/.test(joined)) kinds.add('input')
        if (el.tagName.toLowerCase() === 'a') kinds.add('link')
        if (['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'li'].includes(el.tagName.toLowerCase())) kinds.add('text')
        if (['main', 'section', 'article', 'aside'].includes(el.tagName.toLowerCase())) kinds.add('surface')
        if (!kinds.size) kinds.add((el.textContent || '').trim() ? 'text' : 'section')
        return [...kinds]
      }

      const viewport = `${window.innerWidth}x${window.innerHeight}`

      const addValueToken = (
        map: Map<string, ValueAccumulator>,
        value: string,
        componentKinds: ComponentKind[],
        evidence: number,
        context: string
      ) => {
        if (!value || value === '0px' || value === 'none') return
        const existing = map.get(value) || { value, count: 0, componentKinds: [], evidenceScore: 0, meta: undefined }
        existing.count += 1
        existing.componentKinds = [...new Set([...existing.componentKinds, ...componentKinds])]
        existing.evidenceScore += evidence
        existing.meta = {
          source: 'dom-computed',
          confidence: existing.evidenceScore >= 30 || existing.count >= 5 ? 'high' : existing.evidenceScore >= 12 || existing.count >= 3 ? 'medium' : 'low',
          evidenceCount: existing.count,
          context,
          viewport,
        }
        map.set(value, existing)
      }

      const addLayout = (label: string, kind: LayoutAccumulator['kind'], componentKinds: ComponentKind[], evidence: number) => {
        const key = `${kind}:${label}`
        const existing = layoutValues.get(key) || { label, kind, count: 0, componentKinds: [], evidenceScore: 0, meta: undefined }
        existing.count += 1
        existing.componentKinds = [...new Set([...existing.componentKinds, ...componentKinds])]
        existing.evidenceScore += evidence
        existing.meta = {
          source: 'dom-computed',
          confidence: existing.evidenceScore >= 16 || existing.count >= 4 ? 'high' : existing.evidenceScore >= 8 || existing.count >= 2 ? 'medium' : 'low',
          evidenceCount: existing.count,
          context: `${kind} layout evidence`,
          viewport,
        }
        layoutValues.set(key, existing)
      }

      const addExplicitColor = (
        rawColor: string,
        property: string,
        selectorHint: string,
        componentKinds: ComponentKind[],
        roleHints: string[],
        layerHints: Array<'global' | 'hero' | 'content'>,
        evidence: number
      ) => {
        if (!rawColor || isTransparent(rawColor)) return
        const hex = rgbToHex(rawColor) || (rawColor.startsWith('#') ? rawColor.toUpperCase().slice(0, 7) : null)
        if (!hex) return

        const key = `${hex}:${property}`
        const existing = colorMap.get(key) || {
          hex,
          property,
          selectorHint,
          count: 0,
          roleHints: [],
          layerHints: [],
          componentKinds: [],
          areaWeight: 0,
          viewportWeight: 0,
          repetitionWeight: 0,
          evidenceScore: 0,
        }
        existing.count += 1
        existing.roleHints = [...new Set([...(existing.roleHints || []), ...roleHints])]
        existing.layerHints = [...new Set([...(existing.layerHints || []), ...layerHints])]
        existing.componentKinds = [...new Set([...(existing.componentKinds || []), ...componentKinds])]
        existing.repetitionWeight += 1
        existing.evidenceScore += evidence
        colorMap.set(key, existing)
      }

      const addColor = (value: string, property: string, el: HTMLElement, evidence: number, layerHints: Array<'global' | 'hero' | 'content'>) => {
        if (!value || isTransparent(value)) return
        const hexes = value.includes('gradient')
          ? Array.from(value.matchAll(/rgba?\(\s*\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3}(?:[\s,\/]+[\d.]+)?\s*\)|#[0-9a-fA-F]{3,8}/g)).map(match => match[0])
          : [value]

        const selectorHint = selectorHintFor(el)
        const componentKinds = classifyComponent(el, selectorHint)
        const roleHints = new Set<string>()
        const classText = `${selectorHint} ${el.getAttribute('role') || ''}`.toLowerCase()

        if (property === 'background-color' || property === 'background-image') roleHints.add('background')
        if (property === 'color') roleHints.add('text')
        if (property === 'border-color') roleHints.add('border')
        if (componentKinds.includes('button')) roleHints.add('primary')
        if (componentKinds.includes('card') || componentKinds.includes('surface')) roleHints.add('surface')
        if (classText.includes('secondary')) roleHints.add('secondary')
        if (classText.includes('muted') || classText.includes('subtle')) roleHints.add('text-secondary')
        if (componentKinds.includes('hero')) roleHints.add('hero')

        for (const rawColor of hexes) {
          const hex = rgbToHex(rawColor) || (rawColor.startsWith('#') ? rawColor.toUpperCase().slice(0, 7) : null)
          if (!hex) continue
          const key = `${hex}:${property}`
          const existing = colorMap.get(key) || {
            hex,
            property,
            selectorHint,
            count: 0,
            roleHints: [],
            layerHints: [],
            componentKinds: [],
            areaWeight: 0,
            viewportWeight: 0,
            repetitionWeight: 0,
            evidenceScore: 0,
          }
          existing.count += 1
          existing.roleHints = [...new Set([...existing.roleHints, ...roleHints])]
          existing.layerHints = [...new Set([...(existing.layerHints || []), ...layerHints])]
          existing.componentKinds = [...new Set([...(existing.componentKinds || []), ...componentKinds])]
          existing.repetitionWeight += 1
          existing.evidenceScore += evidence
          colorMap.set(key, existing)
        }
      }

      const extractRootVariableEvidence = () => {
        const semanticPattern = /(?:^|[-_])(background|surface|foreground|text|border|primary|secondary|accent|brand|page)(?:[-_]|$)/
        const targets = [document.documentElement, document.body].filter(Boolean) as HTMLElement[]
        for (const target of targets) {
          const style = window.getComputedStyle(target)
          for (let i = 0; i < style.length; i++) {
            const prop = style[i]
            if (!prop || !prop.startsWith('--')) continue
            const lower = prop.toLowerCase()
            if (!semanticPattern.test(lower)) continue

            const value = style.getPropertyValue(prop).trim()
            if (!value) continue

            const roleHints: string[] = []
            if (/(?:^|[-_])(background|page)(?:[-_]|$)/.test(lower)) roleHints.push('background')
            if (/surface/.test(lower)) roleHints.push('surface')
            if (/(?:^|[-_])(text|foreground)(?:[-_]|$)/.test(lower)) roleHints.push('text')
            if (/border|stroke|divider|outline/.test(lower)) roleHints.push('border')
            if (/primary|brand/.test(lower)) roleHints.push('primary')
            if (/secondary/.test(lower)) roleHints.push('secondary')
            if (/accent|highlight/.test(lower)) roleHints.push('accent')
            if (!roleHints.length) continue

            const evidence = 18
              + (roleHints.includes('primary') ? 12 : 0)
              + (roleHints.includes('background') ? 8 : 0)
              + (roleHints.includes('text') ? 6 : 0)

            addExplicitColor(
              value,
              'css-variable',
              `:root(${prop})`,
              ['section', 'surface'],
              roleHints,
              ['global'],
              evidence
            )
          }
        }
      }

      const extractCtaEvidence = () => {
        const targets = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a[href], input[type="submit"], input[type="button"]'))
        for (const el of targets) {
          const style = window.getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            Number(style.opacity) === 0 ||
            rect.width < 24 ||
            rect.height < 20 ||
            rect.bottom < 0 ||
            rect.top > window.innerHeight * 1.2
          ) {
            continue
          }

          const text = `${el.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`.toLowerCase()
          const selectorHint = selectorHintFor(el)
          const isTopRegion = rect.top >= -8 && rect.top < window.innerHeight * 0.55
          const hasPaintedBg = !isTransparent(style.backgroundColor)
          const likelyCta = /\b(get|start|try|free|demo|request|sign|book|contact|download)\b/.test(text)
            || /\b(cta|button|btn|primary)\b/.test(selectorHint.toLowerCase())

          const roleHints = [
            likelyCta ? 'primary' : 'accent',
            'cta',
          ]
          const layerHints: Array<'global' | 'hero' | 'content'> = isTopRegion ? ['hero'] : ['global']
          const baseEvidence = 22
            + (likelyCta ? 18 : 0)
            + (isTopRegion ? 10 : 0)
            + (hasPaintedBg ? 14 : 0)

          if (hasPaintedBg) {
            addExplicitColor(
              style.backgroundColor,
              'cta-background',
              selectorHint,
              ['button'],
              [...roleHints, 'background'],
              layerHints,
              baseEvidence
            )
          }

          addExplicitColor(
            style.color,
            'cta-foreground',
            selectorHint,
            ['button'],
            roleHints,
            layerHints,
            Math.max(10, baseEvidence - 8)
          )

          if (!isTransparent(style.borderColor)) {
            addExplicitColor(
              style.borderColor,
              'cta-border',
              selectorHint,
              ['button'],
              [...roleHints, 'border'],
              layerHints,
              Math.max(8, baseEvidence - 10)
            )
          }
        }
      }

      const body = document.body
      if (body) {
        const bodyStyle = window.getComputedStyle(body)
        if (bodyStyle.display === 'grid') addLayout('Grid', 'grid', ['section'], 2)
        if (bodyStyle.display === 'flex') addLayout('Flex', 'flex', ['section'], 2)
      }

      extractRootVariableEvidence()
      extractCtaEvidence()

      const hasDirectText = (el: HTMLElement) =>
        Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim().length >= 2)

      const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .filter(el => {
          const style = window.getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
          if (rect.width < 8 || rect.height < 8) return false
          if (rect.bottom < 0 || rect.top > window.innerHeight * 1.6) return false
          const tag = el.tagName.toLowerCase()
          if (['img', 'svg', 'video', 'canvas', 'picture'].includes(tag)) return false
          return true
        })
        .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))
        .slice(0, maxVisibleElements)

      const textNodes: Array<{ el: HTMLElement; text: string }> = []
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: node => {
            const text = (node.textContent || '').trim().replace(/\s+/g, ' ')
            if (text.length < 2 || text.length > 180) return NodeFilter.FILTER_REJECT

            const parent = node.parentElement as HTMLElement | null
            if (!parent) return NodeFilter.FILTER_REJECT

            const tag = parent.tagName.toLowerCase()
            if (['script', 'style', 'noscript', 'img', 'svg', 'video', 'canvas', 'picture'].includes(tag)) {
              return NodeFilter.FILTER_REJECT
            }

            const style = window.getComputedStyle(parent)
            const rect = parent.getBoundingClientRect()
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
              return NodeFilter.FILTER_REJECT
            }
            if (rect.width < 2 || rect.height < 2) return NodeFilter.FILTER_REJECT
            if (rect.bottom < 0 || rect.top > window.innerHeight * 1.6) return NodeFilter.FILTER_REJECT

            return NodeFilter.FILTER_ACCEPT
          },
        }
      )

      let currentTextNode: Node | null
      while ((currentTextNode = walker.nextNode())) {
        const parent = currentTextNode.parentElement as HTMLElement | null
        if (!parent) continue
        const text = (currentTextNode.textContent || '').trim().replace(/\s+/g, ' ')
        textNodes.push({ el: parent, text })
        if (textNodes.length >= Math.max(40, Math.floor(maxVisibleElements * 0.8))) break
      }

      for (const el of visibleElements) {
        const style = window.getComputedStyle(el)
        const selectorHint = selectorHintFor(el)
        const componentKinds = classifyComponent(el, selectorHint)
        const text = (el.textContent || '').trim().replace(/\s+/g, ' ')
        const rect = el.getBoundingClientRect()
        const area = rect.width * rect.height
        const viewportArea = Math.max(window.innerWidth * window.innerHeight, 1)
        const areaRatio = area / viewportArea
        const widthRatio = rect.width / Math.max(window.innerWidth, 1)
        const heightRatio = rect.height / Math.max(window.innerHeight, 1)
        const isTopRegion = rect.top >= -8 && rect.top < window.innerHeight * 0.45
        const selectorLower = selectorHint.toLowerCase()
        const looksLikeEmbeddedMedia = /app-inner|appinner|notion-app-inner|product|screenshot|workspace|editor|board|media|video|image|player/.test(selectorLower)
        const looksLikeHero = !looksLikeEmbeddedMedia && isTopRegion && widthRatio > 0.72 && heightRatio > 0.18
        const layerHints: Array<'global' | 'hero' | 'content'> = looksLikeHero ? ['hero'] : (componentKinds.includes('card') ? ['content'] : ['global'])
        const areaWeight = Math.max(1, Math.round(Math.min(areaRatio * 30, 14)))
        const viewportWeight = isTopRegion ? 4 : rect.top < window.innerHeight ? 2 : 0
        const containerBoost = (componentKinds.includes('hero') || componentKinds.includes('nav') || componentKinds.includes('surface')) ? 4 : 0
        const evidence = areaWeight + viewportWeight + containerBoost + (looksLikeHero ? 8 : 0)

        if (looksLikeHero) addLayout('Hero section', 'hero', [...new Set<ComponentKind>([...componentKinds, 'hero'])], evidence)
        if (componentKinds.includes('nav') && rect.top < 120) addLayout('Top navigation', 'navigation', componentKinds, evidence)
        if (style.display === 'grid') addLayout('Grid', 'grid', componentKinds, evidence)
        if (style.display === 'flex') addLayout('Flex', 'flex', componentKinds, evidence)
        if (style.position === 'sticky') addLayout('Sticky navigation', 'sticky', componentKinds, evidence)
        if (style.gridTemplateColumns && style.gridTemplateColumns !== 'none') addLayout('Multi-column grid', 'multi-column', componentKinds, evidence)
        if (componentKinds.includes('input')) addLayout('Form inputs', 'form', componentKinds, evidence)

        addColor(style.backgroundColor, 'background-color', el, evidence + 3, layerHints)
        addColor(style.backgroundImage, 'background-image', el, evidence + 4, layerHints)
        addColor(style.color, 'color', el, Math.max(1, Math.round(evidence * 0.65)), layerHints)
        addColor(style.borderColor, 'border-color', el, Math.max(1, Math.round(evidence * 0.5)), layerHints)

        if (style.borderRadius && style.borderRadius !== '0px' && !style.borderRadius.startsWith('var(')) {
          // Normalize shorthand: "4px 4px 4px 4px" → "4px"
          const rParts = style.borderRadius.split(/\s+/)
          const normalized = (rParts.length === 4 && rParts[0] === rParts[1] && rParts[1] === rParts[2] && rParts[2] === rParts[3])
            ? rParts[0]
            : (rParts.length === 4 && rParts[0] === rParts[2] && rParts[1] === rParts[3])
              ? `${rParts[0]} ${rParts[1]}`
              : style.borderRadius
          addValueToken(radiusValues, normalized, componentKinds, evidence, 'border radius')
        }
        if (style.boxShadow && style.boxShadow !== 'none' && !style.boxShadow.startsWith('var(')) addValueToken(shadowValues, style.boxShadow, componentKinds, evidence, 'box shadow')

        ;[style.gap, style.rowGap, style.columnGap, style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft, style.marginTop, style.marginBottom].forEach(value => {
          const match = value?.match(/\d+(\.\d+)?px/)
          if (match && parseFloat(match[0]) >= 4) addValueToken(spacingValues, match[0], componentKinds, Math.max(1, Math.round(evidence * 0.5)), 'common spacing measurement')
        })

      }

      for (const entry of textNodes) {
        const el = entry.el
        const style = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        const selectorHint = selectorHintFor(el)
        const componentKinds = classifyComponent(el, selectorHint)
        const text = entry.text
        if (text.length < 2 || text.length > 180) continue

        const tag = el.tagName.toLowerCase()
        const isHeading = /^h[1-6]$/.test(tag)
        const isTopRegion = rect.top >= -8 && rect.top < window.innerHeight * 0.45
        const numericFontSize = Number.parseFloat(style.fontSize || '')
        const sizeBonus =
          Number.isFinite(numericFontSize) && numericFontSize >= 48 ? 160
            : Number.isFinite(numericFontSize) && numericFontSize >= 36 ? 120
              : Number.isFinite(numericFontSize) && numericFontSize >= 28 ? 90
                : Number.isFinite(numericFontSize) && numericFontSize >= 20 ? 45
                  : Number.isFinite(numericFontSize) && numericFontSize <= 13 ? -50
                    : 0

        const textEvidence =
          (isHeading ? 20 : 0)
          + (isTopRegion ? 10 : 0)
          + Math.max(1, Math.round(Math.min((rect.width * rect.height) / Math.max(window.innerWidth * window.innerHeight, 1) * 20, 10)))
          + sizeBonus

        const key = [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing].join('|')
        const existing = typoMap.get(key) || {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          count: 0,
          componentKinds: [],
          sampleText: text,
          evidenceScore: 0,
          meta: {
            source: 'dom-computed' as const,
            confidence: 'medium' as const,
            evidenceCount: 0,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
          },
        }
        existing.count += 1
        existing.componentKinds = [...new Set([...(existing.componentKinds || []), ...componentKinds])]
        existing.sampleText = existing.sampleText || text
        existing.evidenceScore += textEvidence
        existing.meta = {
          source: 'dom-computed',
          confidence: existing.evidenceScore >= 220 || existing.count >= 6 ? 'high' : existing.evidenceScore >= 100 || existing.count >= 3 ? 'medium' : 'low',
          evidenceCount: existing.count,
          context: componentKinds.includes('hero') ? 'hero text' : componentKinds.includes('nav') ? 'navigation text' : isHeading ? 'heading text' : 'body text',
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        }
        typoMap.set(key, existing)
      }

      // ── Border tokens (from elements with visible borders) ────────────────
      const borderMap = new Map<string, {
        width: string
        style: string
        color?: string
        count: number
        componentKinds: ComponentKind[]
        meta?: {
          source: 'dom-computed'
          confidence: 'high' | 'medium' | 'low'
          evidenceCount: number
          context?: string
          viewport?: string
        }
      }>()
      const borderTargets = Array.from(document.querySelectorAll<HTMLElement>('button, input, textarea, [class*="card"], [class*="panel"], article, section, aside'))
      for (const el of borderTargets.slice(0, 40)) {
        const style = window.getComputedStyle(el)
        const bw = style.borderTopWidth
        const bs = style.borderTopStyle
        if (!bw || bw === '0px' || bs === 'none' || bs === 'hidden') continue
        const key = `${bw}:${bs}`
        const hex = (() => {
          const m = style.borderTopColor.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/)
          if (!m) return undefined
          return `#${[m[1], m[2], m[3]].map(v => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`
        })()
        const tag = el.tagName.toLowerCase()
        const kinds: ComponentKind[] = tag === 'button' ? ['button'] : (tag === 'input' || tag === 'textarea') ? ['input'] : ['card']
        const existing = borderMap.get(key) || { width: bw, style: bs, color: hex, count: 0, componentKinds: kinds, meta: undefined }
        existing.count += 1
        existing.meta = {
          source: 'dom-computed',
          confidence: existing.count >= 4 ? 'high' : existing.count >= 2 ? 'medium' : 'low',
          evidenceCount: existing.count,
          context: 'border style',
          viewport,
        }
        borderMap.set(key, existing)
      }

      // ── Transition tokens (from interactive elements) ──────────────────────
      const transitionMap = new Map<string, {
        property: string
        duration: string
        easing: string
        count: number
        componentKinds: ComponentKind[]
        meta?: {
          source: 'dom-computed'
          confidence: 'high' | 'medium' | 'low'
          evidenceCount: number
          context?: string
          viewport?: string
        }
      }>()
      const interactiveTargets = Array.from(document.querySelectorAll<HTMLElement>('button, a[href], input, [role="button"]'))
      for (const el of interactiveTargets.slice(0, 30)) {
        const style = window.getComputedStyle(el)
        const t = style.transition
        if (!t || t === 'none' || t === 'all 0s ease 0s' || t.includes('0s')) continue
        // Parse "background-color 0.15s ease-in-out, color 0.15s ease-in-out"
        const parts = t.split(',').map(s => s.trim())
        for (const part of parts) {
          const tokens = part.split(/\s+/)
          if (tokens.length < 2) continue
          const prop = tokens[0]
          const dur = tokens.find(tk => /^\d+(\.\d+)?m?s$/.test(tk)) || ''
          if (!dur || dur === '0s' || dur === '0ms') continue
          const easingParts = tokens.filter(tk => /ease|linear|cubic-bezier|step/.test(tk))
          const easing = easingParts.join(' ') || 'ease'
          const key = `${dur}:${easing}`
          const tag = el.tagName.toLowerCase()
          const kinds: ComponentKind[] = tag === 'button' ? ['button'] : tag === 'a' ? ['link'] : ['input']
          const existing = transitionMap.get(key) || { property: prop, duration: dur, easing, count: 0, componentKinds: kinds, meta: undefined }
          existing.count += 1
          existing.meta = {
            source: 'dom-computed',
            confidence: existing.count >= 4 ? 'high' : existing.count >= 2 ? 'medium' : 'low',
            evidenceCount: existing.count,
            context: 'transition token',
            viewport,
          }
          transitionMap.set(key, existing)
        }
      }

      // ── Page max-width & grid columns ──────────────────────────────────────
      let pageMaxWidth: string | undefined
      let gridColumns: string | undefined
      const containerCandidates = Array.from(document.querySelectorAll<HTMLElement>('main, #main, #content, .container, .wrapper, [class*="container"], [class*="wrapper"], [class*="content"]'))
      for (const el of containerCandidates.slice(0, 12)) {
        const style = window.getComputedStyle(el)
        if (!pageMaxWidth && style.maxWidth && style.maxWidth !== 'none' && style.maxWidth !== '0px') {
          const mw = parseFloat(style.maxWidth)
          if (mw >= 600 && mw <= 2400) pageMaxWidth = style.maxWidth
        }
        if (!gridColumns && style.display === 'grid' && style.gridTemplateColumns && style.gridTemplateColumns !== 'none') {
          gridColumns = style.gridTemplateColumns
        }
      }

      // ── Button snapshot (exact CSS from real primary button) ───────────────
      let buttonSnapshot: Record<string, string | undefined> | undefined
      // Cast wide net: <button>, role=button, CTA-named links, any styled <a> in hero/nav
      const allBtns = Array.from(document.querySelectorAll<HTMLElement>(
        'button, [role="button"], a[class*="btn"], a[class*="button"], a[class*="cta"], ' +
        'a[href*="sign-up"], a[href*="signup"], a[href*="get-started"], a[href*="pricing"], ' +
        'a[href*="free"], a[href*="download"], a[href*="start"], nav a, header a'
      ))
      // Score each candidate: prefer non-transparent bg, proper size, has text, not a nav link
      const scoredBtns = allBtns.map(btn => {
        const rect = btn.getBoundingClientRect()
        const style = window.getComputedStyle(btn)
        const bg = style.backgroundColor
        const text = (btn.textContent || '').trim()
        const isTransparentBg = !bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent'
        let score = 0
        if (rect.width >= 80 && rect.height >= 32) score += 3
        if (!isTransparentBg) score += 4
        if (text.length > 0 && text.length <= 30) score += 2
        if (rect.top < window.innerHeight * 0.5) score += 2  // above fold
        if (rect.width < 60 || rect.height < 24) score -= 10  // too small
        if (text.length > 50) score -= 3  // too long = nav paragraph
        return { btn, score, rect, isTransparentBg }
      }).filter(item => item.score > 0 && item.rect.width > 0)
      scoredBtns.sort((a, b) => b.score - a.score)
      const primaryBtn = scoredBtns[0]?.btn
      if (primaryBtn) {
        const s = window.getComputedStyle(primaryBtn)
        const rect = primaryBtn.getBoundingClientRect()
        const bgHex = rgbToHex(s.backgroundColor) || s.backgroundColor
        const colorHex = rgbToHex(s.color) || s.color
        const borderColorHex = s.borderWidth !== '0px' ? (rgbToHex(s.borderColor) || s.borderColor) : undefined
        buttonSnapshot = {
          backgroundColor: bgHex,
          color: colorHex,
          borderRadius: s.borderRadius !== '0px' ? s.borderRadius : undefined,
          paddingH: s.paddingLeft !== '0px' ? s.paddingLeft : (s.paddingRight !== '0px' ? s.paddingRight : undefined),
          paddingV: s.paddingTop !== '0px' ? s.paddingTop : (s.paddingBottom !== '0px' ? s.paddingBottom : undefined),
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          fontFamily: s.fontFamily,
          border: s.borderWidth !== '0px' ? `${s.borderWidth} ${s.borderStyle} ${borderColorHex}` : 'none',
          boxShadow: s.boxShadow !== 'none' ? s.boxShadow : undefined,
          letterSpacing: s.letterSpacing !== 'normal' && s.letterSpacing !== '0px' ? s.letterSpacing : undefined,
          width: `${Math.round(rect.width)}px`,
          height: `${Math.round(rect.height)}px`,
          text: (primaryBtn.textContent || '').trim().slice(0, 30),
        }
      }

      // ── Page sections (DOM-measured structural layout) ─────────────────────
      const pageSections: Array<{
        index: number; purpose: string; layout: string; columns: number
        hasCTA: boolean; hasImage: boolean; heading?: string; measured: boolean
      }> = []
      const sectionEls = Array.from(document.querySelectorAll<HTMLElement>(
        'section, [class*="section"], [class*="hero"], [class*="feature"], [class*="pricing"], [class*="testimonial"], [class*="cta"], footer'
      ))
      let si = 0
      for (const el of sectionEls.slice(0, 12)) {
        const rect = el.getBoundingClientRect()
        if (rect.height < 80 || rect.width < 200) continue
        const style = window.getComputedStyle(el)
        const headingEl = el.querySelector('h1, h2, h3')
        const headingText = ((headingEl?.textContent) || '').trim().slice(0, 60) || undefined
        const hasCTA = !!el.querySelector('button, [role="button"], a[class*="btn"], a[class*="button"]')
        const hasImage = !!el.querySelector('img, video, picture, [class*="image"], [class*="img"]')
        let columns = 1
        let layout = 'full-width'
        if (style.display === 'grid' && style.gridTemplateColumns && style.gridTemplateColumns !== 'none') {
          const colCount = style.gridTemplateColumns.split(/\s+(?=[^\(]*(?:\(|$))/).filter(Boolean).length
          columns = colCount
          layout = colCount === 2 ? '2-column' : colCount === 3 ? '3-column-grid' : colCount === 4 ? '4-column-grid' : 'grid'
        } else if (style.display === 'flex' && style.flexDirection !== 'column') {
          const visChildren = Array.from(el.children).filter(c => {
            const cr = (c as HTMLElement).getBoundingClientRect()
            return cr.width > 50 && cr.height > 20
          })
          if (visChildren.length >= 2 && visChildren.length <= 4) {
            columns = visChildren.length
            layout = columns === 2 ? '2-column' : `${columns}-column-grid`
          }
        }
        const cls = (el.className || '').toString().toLowerCase()
        const tag = el.tagName.toLowerCase()
        const purpose = cls.includes('hero') ? 'hero'
          : cls.includes('feature') ? 'features'
          : cls.includes('pric') ? 'pricing'
          : cls.includes('testimonial') || cls.includes('review') ? 'testimonials'
          : cls.includes('cta') || cls.includes('call-to-action') ? 'cta'
          : tag === 'footer' ? 'footer'
          : 'section'
        pageSections.push({ index: si++, purpose, layout, columns, hasCTA, hasImage, heading: headingText, measured: true })
        if (si >= 8) break
      }

      return {
        colorCandidates: [...colorMap.values()].sort((a, b) => b.evidenceScore - a.evidenceScore).slice(0, 18),
        typographyCandidates: [...typoMap.values()].sort((a, b) => b.evidenceScore - a.evidenceScore).slice(0, 10),
        radiusCandidates: [...radiusValues.keys()].slice(0, 10),
        shadowCandidates: [...shadowValues.keys()].slice(0, 8),
        spacingCandidates: [...spacingValues.keys()].slice(0, 12),
        layoutHints: [...new Set([...layoutValues.values()].map(item => item.label))].slice(0, 8),
        rawRadiusTokens: [...radiusValues.values()],
        rawShadowTokens: [...shadowValues.values()],
        rawSpacingTokens: [...spacingValues.values()],
        rawLayoutEvidence: [...layoutValues.values()],
        rawBorderTokens: [...borderMap.values()],
        rawTransitionTokens: [...transitionMap.values()],
        pageMaxWidth,
        gridColumns,
        stateTokens: {},
        buttonSnapshot: buttonSnapshot as ButtonSnapshot | undefined,
        pageSections: pageSections as PageSection[],
      }
    }, { maxVisibleElements: MAX_VISIBLE_ELEMENTS })

  const snapshots: RawDomSignals[] = []
  snapshots.push(await collectSnapshot())

  if (snapshotCount >= 2) {
    await page.waitForTimeout(pageAlreadySettled ? 160 : 900)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(pageAlreadySettled ? 80 : 250)
    snapshots.push(await collectSnapshot())
  }

  if (snapshotCount >= 3) {
    await page.waitForTimeout(pageAlreadySettled ? 160 : 900)
    snapshots.push(await collectSnapshot())
  }

  const domSignals = mergeRawDomSignals(...snapshots)

  const viewportSize = page.viewportSize()
  const viewport = viewportSize ? `${viewportSize.width}x${viewportSize.height}` : undefined
  const withColorMeta = (domSignals.colorCandidates || []).map(candidate => {
    const evidenceScore = candidate.evidenceScore || candidate.count || 0
    const context =
      candidate.layerHints.includes('hero') ? 'hero color'
        : candidate.roleHints.includes('text') ? 'text color'
          : candidate.roleHints.includes('border') ? 'border color'
            : candidate.roleHints.includes('surface') ? 'surface color'
              : candidate.roleHints.includes('primary') ? 'primary action color'
                : candidate.roleHints.includes('secondary') ? 'secondary action color'
                  : 'page color'

    return {
      ...candidate,
      meta: candidate.meta || {
        source: 'dom-computed' as const,
        confidence:
          evidenceScore >= 220 || candidate.count >= 6 ? 'high'
            : evidenceScore >= 100 || candidate.count >= 3 ? 'medium'
              : 'low',
        evidenceCount: candidate.count,
        context,
        viewport,
      },
    }
  })

  return {
    ...domSignals,
    colorCandidates: withColorMeta,
    stateTokens: mergeComponentStateTokens(domSignals.stateTokens, interactiveStateTokens),
  }
}

async function extractDomSignals(targetUrl: string): Promise<RawDomSignals> {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1200 },
      deviceScaleFactor: 1,
    })

    await page.addInitScript(() => {
      const block = (kind: string, url?: string | URL | null) => {
        try {
          const nextUrl = String(url || '')
          if (/\/(login|signin|sign-in|auth|session)(?:[/?#]|$)/i.test(nextUrl)) {
            console.warn(`[pageAnalyzer:init] blocked client navigation (${kind}): ${nextUrl}`)
            return true
          }
        } catch {
          return false
        }
        return false
      }

      const locationProto = Object.getPrototypeOf(window.location) as Location & {
        assign?: (url: string | URL) => void
        replace?: (url: string | URL) => void
      }

      const originalAssign = locationProto.assign?.bind(window.location)
      const originalReplace = locationProto.replace?.bind(window.location)
      const originalPushState = history.pushState.bind(history)
      const originalReplaceState = history.replaceState.bind(history)

      if (originalAssign) {
        locationProto.assign = ((url: string | URL) => {
          if (block('location.assign', url)) return
          return originalAssign(url)
        }) as typeof window.location.assign
      }

      if (originalReplace) {
        locationProto.replace = ((url: string | URL) => {
          if (block('location.replace', url)) return
          return originalReplace(url)
        }) as typeof window.location.replace
      }

      history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
        if (block('history.pushState', url)) return
        return originalPushState(data, unused, url)
      }) as typeof history.pushState

      history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
        if (block('history.replaceState', url)) return
        return originalReplaceState(data, unused, url)
      }) as typeof history.replaceState
    })

    await page.route('**/*', route => {
      const request = route.request()
      const lower = request.url().toLowerCase()
      if (
        request.isNavigationRequest()
        && /\/(login|signin|sign-in|auth|session)(?:[/?#]|$)/.test(lower)
      ) {
        console.warn('[pageAnalyzer] Blocking likely auth navigation during direct DOM extraction:', request.url())
        return route.abort('aborted')
      }
      return route.continue()
    })

    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_ANALYSIS_TIMEOUT,
    })

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
          caret-color: transparent !important;
        }
        html {
          scroll-behavior: auto !important;
        }
      `,
    }).catch(() => undefined)

    await page.evaluate(async () => {
      const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts
      if (fonts?.ready) {
        await fonts.ready.catch(() => undefined)
      }
    }).catch(() => undefined)

    await page.waitForSelector('h1, main, [role="main"], [data-hero]', {
      state: 'visible',
      timeout: 5_000,
    }).catch(() => undefined)
    await page.waitForFunction(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let node: Node | null
      let matched = 0
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim()
        if (!text || text.length < 2) continue
        const parent = node.parentElement
        if (!parent) continue
        const rect = parent.getBoundingClientRect()
        if (rect.width < 2 || rect.height < 2) continue
        const style = getComputedStyle(parent)
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
        if (/\d+(\.\d+)?px/.test(style.fontSize)) {
          matched += 1
          if (matched >= 3) return true
        }
      }
      return false
    }, { timeout: 5_000 }).catch(() => undefined)
    await page.waitForTimeout(500)

    return await extractDomSignalsFromPage(page, targetUrl, {
      pageAlreadySettled: true,
      snapshotCount: 1,
    })
  } finally {
    await browser.close()
  }
}

async function analyzePageStylesCore(
  targetUrl: string,
  options?: {
    htmlOverride?: string
    domSignalsOverride?: RawDomSignals | null
    preserveMeasuredPageContext?: boolean
  }
): Promise<PageStyleAnalysis> {
  const html = options?.htmlOverride ?? await fetchText(targetUrl)
  const authLikeFetchedHtml = isLikelyAuthGate(targetUrl, html)
  if (authLikeFetchedHtml) {
    console.warn('[pageAnalyzer] Auth-like fetched HTML detected, ignoring fetched HTML/CSS signals and continuing with DOM analysis:', targetUrl)
  }

  const effectiveHtml = authLikeFetchedHtml ? '' : html
  const inlineBlocks = extractStyleBlocks(effectiveHtml)
  const stylesheetUrls = extractStylesheetHrefs(effectiveHtml, targetUrl)

  const stylesheetTexts = await Promise.all(
    stylesheetUrls.map(async url => {
      try {
        return await fetchText(url)
      } catch (error) {
        console.warn('[pageAnalyzer] Failed to fetch stylesheet:', url, error)
        return ''
      }
    })
  )

  const cssText = [...inlineBlocks, ...stylesheetTexts.filter(Boolean)].join('\n\n')
  const cssSignals = extractCssSignals(cssText)
  let domSignals: RawDomSignals | null = options?.domSignalsOverride ?? null

  if (!domSignals) {
    try {
      domSignals = await extractDomSignals(targetUrl)
    } catch (error) {
      console.warn('[pageAnalyzer] DOM analysis failed, using CSS-only signals:', error)
    }
  }

  const colorCandidates = mergeColorCandidates(domSignals?.colorCandidates || [], cssSignals.colorCandidates)
  const typographyCandidates = mergeTypographyCandidates(domSignals?.typographyCandidates || [], cssSignals.typographyCandidates)
  const radiusValues = mergeValueAccumulators(domSignals?.rawRadiusTokens || [], cssSignals.rawRadiusTokens)
  const shadowValues = mergeValueAccumulators(domSignals?.rawShadowTokens || [], cssSignals.rawShadowTokens)
  const spacingValues = mergeValueAccumulators(domSignals?.rawSpacingTokens || [], cssSignals.rawSpacingTokens)
  const layoutValues = mergeLayoutAccumulators(domSignals?.rawLayoutEvidence || [], cssSignals.rawLayoutEvidence)
  const stateTokens = mergeComponentStateTokens(
    buildStateTokens(cssSignals.rawStateTokens),
    domSignals?.stateTokens
  )

  const analysis: PageStyleAnalysis = {
    colorCandidates,
    semanticColorSystem: undefined,
    typographyCandidates,
    typographyTokens: toTypographyTokens(typographyCandidates),
    radiusCandidates: mergeUniqueValues(10, domSignals?.radiusCandidates || [], cssSignals.radiusCandidates),
    radiusTokens: toRadiusTokens(radiusValues),
    shadowCandidates: mergeUniqueValues(8, domSignals?.shadowCandidates || [], cssSignals.shadowCandidates),
    shadowTokens: toShadowTokens(shadowValues),
    spacingCandidates: mergeUniqueValues(12, domSignals?.spacingCandidates || [], cssSignals.spacingCandidates),
    spacingTokens: toSpacingTokens(spacingValues),
    layoutHints: mergeUniqueValues(8, domSignals?.layoutHints || [], cssSignals.layoutHints),
    layoutEvidence: toLayoutEvidence(layoutValues),
    stateTokens,
    borderTokens: toBorderTokens(domSignals?.rawBorderTokens || []),
    transitionTokens: toTransitionTokens(domSignals?.rawTransitionTokens || []),
    pageMaxWidth: domSignals?.pageMaxWidth,
    gridColumns: domSignals?.gridColumns,
    buttonSnapshot: domSignals?.buttonSnapshot,
    pageSections: domSignals?.pageSections || [],
    cssTextExcerpt: cssText.slice(0, MAX_CSS_EXCERPT),
    sourceCount: {
      inlineStyleBlocks: inlineBlocks.length,
      linkedStylesheets: stylesheetTexts.filter(Boolean).length,
    },
  }

  if (options?.preserveMeasuredPageContext) {
    return analysis
  }

  if (isLikelyAuthAnalysis(analysis)) {
    const stripped = stripAuthArtifacts(analysis)
    if (hasRetainedMeasuredSignals(stripped)) {
      console.warn('[pageAnalyzer] Auth-like measured analysis detected after merge, retaining stripped non-auth signals for:', targetUrl)
      return stripped
    }

    console.warn('[pageAnalyzer] Auth-like measured analysis detected after merge, discarding pageAnalysis for:', targetUrl)
    return createEmptyPageAnalysis({
      inlineStyleBlocks: inlineBlocks.length,
      linkedStylesheets: stylesheetTexts.filter(Boolean).length,
    })
  }

  return analysis
}

export async function analyzePageStylesFromPage(
  page: Page,
  targetUrl: string,
  options?: DomExtractionOptions
): Promise<PageStyleAnalysis> {
  const domSignals = await extractDomSignalsFromPage(page, targetUrl, options)
  const html = (await page.content().catch(() => '')) || ''
  return analyzePageStylesCore(targetUrl, {
    htmlOverride: html,
    domSignalsOverride: domSignals,
    preserveMeasuredPageContext: true,
  })
}

export async function analyzePageStyles(targetUrl: string): Promise<PageStyleAnalysis> {
  return analyzePageStylesCore(targetUrl)
}
