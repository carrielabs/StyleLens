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
}

type ValueAccumulator = {
  value: string
  count: number
  componentKinds: Set<ComponentKind>
  evidenceScore: number
}

type LayoutAccumulator = {
  label: string
  kind: LayoutEvidence['kind']
  count: number
  componentKinds: Set<ComponentKind>
  evidenceScore: number
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
}

type RawLayoutAccumulator = {
  label: string
  kind: LayoutEvidence['kind']
  count: number
  componentKinds: ComponentKind[]
  evidenceScore: number
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
  stateTokens?: ComponentStateTokens
}

type StateAccumulator = {
  value: string
  property: 'color' | 'background-color' | 'border-color' | 'box-shadow' | 'opacity' | 'transform'
  state: InteractionState
  componentKinds: Set<ComponentKind>
  evidenceScore: number
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

function mergeColorCandidates(domGroup: PageColorCandidate[], cssGroup: PageColorCandidate[]): PageColorCandidate[] {
  const merged = new Map<string, ColorAccumulator>()

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
    }))
}

function mergeTypographyCandidates(...groups: PageTypographyCandidate[][]): PageTypographyCandidate[] {
  const merged = new Map<string, TypographyAccumulator>()

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
      }
      existing.count += candidate.count
      candidate.componentKinds?.forEach(kind => existing.componentKinds.add(kind))
      existing.sampleText = existing.sampleText || candidate.sampleText
      existing.evidenceScore += candidate.evidenceScore || candidate.count
      merged.set(key, existing)
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.evidenceScore - a.evidenceScore)
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

function mergeValueAccumulators(...groups: Array<Array<ValueAccumulator | RawValueAccumulator>>): ValueAccumulator[] {
  const merged = new Map<string, ValueAccumulator>()
  for (const group of groups) {
    for (const entry of group) {
      const existing = merged.get(entry.value) || {
        value: entry.value,
        count: 0,
        componentKinds: new Set<ComponentKind>(),
        evidenceScore: 0,
      }
      existing.count += entry.count
      entry.componentKinds.forEach(kind => existing.componentKinds.add(kind))
      existing.evidenceScore += entry.evidenceScore
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
      }
      existing.count += entry.count
      entry.componentKinds.forEach(kind => existing.componentKinds.add(kind))
      existing.evidenceScore += entry.evidenceScore
      merged.set(key, existing)
    }
  }
  return [...merged.values()].sort((a, b) => b.evidenceScore - a.evidenceScore)
}

function toTypographyTokens(candidates: PageTypographyCandidate[]): TypographyToken[] {
  return candidates.slice(0, 8).map((candidate, index) => {
    const size = Number.parseFloat(candidate.fontSize || '')
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
    }
  })
}

function toRadiusTokens(values: ValueAccumulator[]): RadiusToken[] {
  return values.slice(0, 6).map((entry, index) => ({
    value: entry.value,
    label: index === 0 ? 'Primary radius' : `Radius ${index + 1}`,
    sampleCount: entry.count,
    componentKinds: [...entry.componentKinds],
    evidenceScore: Math.round(entry.evidenceScore),
  }))
}

function toShadowTokens(values: ValueAccumulator[]): ShadowToken[] {
  return values.slice(0, 5).map((entry, index) => ({
    value: entry.value,
    label: index === 0 ? 'Primary shadow' : `Shadow ${index + 1}`,
    sampleCount: entry.count,
    componentKinds: [...entry.componentKinds],
    evidenceScore: Math.round(entry.evidenceScore),
  }))
}

function toSpacingTokens(values: ValueAccumulator[]): SpacingToken[] {
  return values.slice(0, 8).map((entry, index) => ({
    value: entry.value,
    label: index === 0 ? 'Base spacing' : `Spacing ${index + 1}`,
    sampleCount: entry.count,
    componentKinds: [...entry.componentKinds],
    evidenceScore: Math.round(entry.evidenceScore),
  }))
}

function toLayoutEvidence(values: LayoutAccumulator[]): LayoutEvidence[] {
  return values.slice(0, 8).map(entry => ({
    label: entry.label,
    kind: entry.kind,
    sampleCount: entry.count,
    componentKinds: [...entry.componentKinds],
    evidenceScore: Math.round(entry.evidenceScore),
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

function buildSemanticColorSystem(candidates: PageColorCandidate[]): SemanticColorSystem | undefined {
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
    }
  }

  const ranked = [...candidates].sort((a, b) => (b.evidenceScore || b.count) - (a.evidenceScore || a.count))
  const used = new Set<string>()

  const heroBackground = pickSlot(ranked, candidate =>
    candidate.layerHints.includes('hero') &&
    candidate.roleHints.includes('background')
  )
  if (heroBackground) used.add(heroBackground.hex.toUpperCase())

  const pageBackground = pickSlot(ranked, candidate =>
    candidate.layerHints.includes('global') &&
    candidate.roleHints.includes('background')
  , used)
  if (pageBackground) used.add(pageBackground.hex.toUpperCase())

  const surface = pickSlot(ranked, candidate =>
    candidate.roleHints.includes('surface') || !!candidate.componentKinds?.includes('card') || !!candidate.componentKinds?.includes('surface')
  , used)
  if (surface) used.add(surface.hex.toUpperCase())

  const textPrimary = pickSlot(ranked, candidate =>
    candidate.roleHints.includes('text')
  , used)
  if (textPrimary) used.add(textPrimary.hex.toUpperCase())

  const textSecondary = pickSlot(ranked, candidate =>
    candidate.roleHints.includes('text-secondary') || (candidate.roleHints.includes('text') && candidate.hex.toUpperCase() !== textPrimary?.hex.toUpperCase())
  , used)
  if (textSecondary) used.add(textSecondary.hex.toUpperCase())

  const border = pickSlot(ranked, candidate =>
    candidate.roleHints.includes('border') || candidate.property === 'border-color'
  , used)
  if (border) used.add(border.hex.toUpperCase())

  const primaryAction = pickSlot(ranked, candidate =>
    candidate.roleHints.includes('primary') || !!candidate.componentKinds?.includes('button')
  , used)
  if (primaryAction) used.add(primaryAction.hex.toUpperCase())

  const secondaryAction = pickSlot(ranked, candidate =>
    candidate.roleHints.includes('secondary') || candidate.roleHints.includes('accent')
  , used)
  if (secondaryAction) used.add(secondaryAction.hex.toUpperCase())

  const contentColors = ranked
    .filter(candidate => candidate.layerHints.includes('content') && !used.has(candidate.hex.toUpperCase()))
    .slice(0, 6)
    .map(candidate => toToken(candidate, 'accent'))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))

  return {
    heroBackground: toToken(heroBackground, 'background'),
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
        }
        existing.count += 1
        roleHintsFromProperty(property, selectorHint).forEach(hint => existing.roleHints.add(hint))
        layerHints.forEach(hint => existing.layerHints.add(hint))
        componentKinds.forEach(kind => existing.componentKinds.add(kind))
        existing.repetitionWeight += 1
        existing.evidenceScore += 2
        colors.set(key, existing)
      }

      if (property === 'font-family') fontFamily = value.replace(/\s*!important$/, '')
      if (property === 'font-size') fontSize = value
      if (property === 'font-weight') fontWeight = value
      if (property === 'line-height') lineHeight = value
      if (property === 'letter-spacing') letterSpacing = value

      if (property === 'border-radius' && value !== '0' && value !== '0px') {
        const existing = radiusValues.get(value) || { value, count: 0, componentKinds: new Set<ComponentKind>(), evidenceScore: 0 }
        existing.count += 1
        componentKinds.forEach(kind => existing.componentKinds.add(kind))
        existing.evidenceScore += 1
        radiusValues.set(value, existing)
      }

      if (property === 'box-shadow' && value !== 'none') {
        const existing = shadowValues.get(value) || { value, count: 0, componentKinds: new Set<ComponentKind>(), evidenceScore: 0 }
        existing.count += 1
        componentKinds.forEach(kind => existing.componentKinds.add(kind))
        existing.evidenceScore += 1
        shadowValues.set(value, existing)
      }

      if (property === 'gap' || property.startsWith('padding') || property.startsWith('margin')) {
        for (const item of value.match(/\d+(\.\d+)?px/g) || []) {
          const existing = spacingValues.get(item) || { value: item, count: 0, componentKinds: new Set<ComponentKind>(), evidenceScore: 0 }
          existing.count += 1
          componentKinds.forEach(kind => existing.componentKinds.add(kind))
          existing.evidenceScore += 1
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
        })
      }
      if (property === 'display' && value.includes('flex')) {
        layoutValues.set('Flex', {
          label: 'Flex',
          kind: 'flex',
          count: (layoutValues.get('Flex')?.count || 0) + 1,
          componentKinds: new Set(componentKinds),
          evidenceScore: (layoutValues.get('Flex')?.evidenceScore || 0) + 2,
        })
      }
      if (property.startsWith('grid-template-columns')) {
        layoutValues.set('Multi-column grid', {
          label: 'Multi-column grid',
          kind: 'multi-column',
          count: (layoutValues.get('Multi-column grid')?.count || 0) + 1,
          componentKinds: new Set(componentKinds),
          evidenceScore: (layoutValues.get('Multi-column grid')?.evidenceScore || 0) + 3,
        })
      }
      if (property === 'position' && value === 'sticky') {
        layoutValues.set('Sticky navigation', {
          label: 'Sticky navigation',
          kind: 'sticky',
          count: (layoutValues.get('Sticky navigation')?.count || 0) + 1,
          componentKinds: new Set(componentKinds),
          evidenceScore: (layoutValues.get('Sticky navigation')?.evidenceScore || 0) + 3,
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
      }
      existing.count += 1
      componentKinds.forEach(kind => existing.componentKinds.add(kind))
      existing.evidenceScore += 2
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

async function extractDomSignals(targetUrl: string): Promise<RawDomSignals> {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1200 },
      deviceScaleFactor: 1,
    })

    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_ANALYSIS_TIMEOUT,
    })

    await page.waitForTimeout(1200)
    const interactiveStateTokens = await collectInteractiveStateSignals(page)

    const domSignals = await page.evaluate(({ maxVisibleElements }) => {
      type ComponentKind = 'hero' | 'nav' | 'button' | 'card' | 'section' | 'input' | 'link' | 'text' | 'surface'
      type ValueAccumulator = { value: string; count: number; componentKinds: ComponentKind[]; evidenceScore: number }
      type LayoutAccumulator = { label: string; kind: 'hero' | 'grid' | 'flex' | 'navigation' | 'form' | 'section' | 'multi-column' | 'sticky' | 'stack'; count: number; componentKinds: ComponentKind[]; evidenceScore: number }

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

      const addValueToken = (map: Map<string, ValueAccumulator>, value: string, componentKinds: ComponentKind[], evidence: number) => {
        if (!value || value === '0px' || value === 'none') return
        const existing = map.get(value) || { value, count: 0, componentKinds: [], evidenceScore: 0 }
        existing.count += 1
        existing.componentKinds = [...new Set([...existing.componentKinds, ...componentKinds])]
        existing.evidenceScore += evidence
        map.set(value, existing)
      }

      const addLayout = (label: string, kind: LayoutAccumulator['kind'], componentKinds: ComponentKind[], evidence: number) => {
        const key = `${kind}:${label}`
        const existing = layoutValues.get(key) || { label, kind, count: 0, componentKinds: [], evidenceScore: 0 }
        existing.count += 1
        existing.componentKinds = [...new Set([...existing.componentKinds, ...componentKinds])]
        existing.evidenceScore += evidence
        layoutValues.set(key, existing)
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

      const body = document.body
      if (body) {
        const bodyStyle = window.getComputedStyle(body)
        if (bodyStyle.display === 'grid') addLayout('Grid', 'grid', ['section'], 2)
        if (bodyStyle.display === 'flex') addLayout('Flex', 'flex', ['section'], 2)
      }

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
        const looksLikeHero = isTopRegion && widthRatio > 0.72 && heightRatio > 0.18
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

        if (style.borderRadius && style.borderRadius !== '0px') addValueToken(radiusValues, style.borderRadius, componentKinds, evidence)
        if (style.boxShadow && style.boxShadow !== 'none') addValueToken(shadowValues, style.boxShadow, componentKinds, evidence)

        ;[style.gap, style.rowGap, style.columnGap, style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft, style.marginTop, style.marginBottom].forEach(value => {
          const match = value?.match(/\d+(\.\d+)?px/)
          if (match) addValueToken(spacingValues, match[0], componentKinds, Math.max(1, Math.round(evidence * 0.5)))
        })

        if (text.length >= 2 && text.length <= 160) {
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
          }
          existing.count += 1
          existing.componentKinds = [...new Set([...(existing.componentKinds || []), ...componentKinds])]
          existing.sampleText = existing.sampleText || text
          existing.evidenceScore += evidence
          typoMap.set(key, existing)
        }
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
        stateTokens: {},
      }
    }, { maxVisibleElements: MAX_VISIBLE_ELEMENTS })

    return {
      ...domSignals,
      stateTokens: interactiveStateTokens,
    }
  } finally {
    await browser.close()
  }
}

export async function analyzePageStyles(targetUrl: string): Promise<PageStyleAnalysis> {
  const html = await fetchText(targetUrl)
  const inlineBlocks = extractStyleBlocks(html)
  const stylesheetUrls = extractStylesheetHrefs(html, targetUrl)

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
  let domSignals: RawDomSignals | null = null

  try {
    domSignals = await extractDomSignals(targetUrl)
  } catch (error) {
    console.warn('[pageAnalyzer] DOM analysis failed, using CSS-only signals:', error)
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

  return {
    colorCandidates,
    semanticColorSystem: buildSemanticColorSystem(colorCandidates),
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
    cssTextExcerpt: cssText.slice(0, MAX_CSS_EXCERPT),
    sourceCount: {
      inlineStyleBlocks: inlineBlocks.length,
      linkedStylesheets: stylesheetTexts.filter(Boolean).length,
    },
  }
}
