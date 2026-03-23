import type { PageColorCandidate, PageStyleAnalysis, PageTypographyCandidate } from '@/lib/types'
import { chromium } from 'playwright'

const MAX_STYLESHEETS = 6
const MAX_STYLESHEET_BYTES = 180_000
const MAX_CSS_EXCERPT = 3_500
const MAX_VISIBLE_ELEMENTS = 160
const PAGE_ANALYSIS_TIMEOUT = 20_000

type ColorAccumulator = {
  hex: string
  property: string
  selectorHint?: string
  count: number
  roleHints: Set<string>
  layerHints: Set<'global' | 'hero' | 'content'>
}

type TypographyAccumulator = {
  key: string
  fontFamily: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  letterSpacing?: string
  count: number
}

type RawDomColorCandidate = {
  hex: string
  property: string
  selectorHint?: string
  count: number
  roleHints: string[]
  layerHints: Array<'global' | 'hero' | 'content'>
}

type RawDomTypographyCandidate = {
  fontFamily: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  letterSpacing?: string
  count: number
}

type RawDomSignals = {
  colorCandidates: RawDomColorCandidate[]
  typographyCandidates: RawDomTypographyCandidate[]
  radiusCandidates: string[]
  shadowCandidates: string[]
  spacingCandidates: string[]
  layoutHints: string[]
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

function rgbStringToHex(value: string): string | null {
  const match = value.match(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i)
  if (!match) return null
  const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if ([r, g, b].some(channel => Number.isNaN(channel) || channel < 0 || channel > 255)) return null
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
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

function roleHintsFromProperty(property: string, selectorHint?: string) {
  const joined = `${property} ${selectorHint || ''}`.toLowerCase()
  const hints: string[] = []

  if (joined.includes('background') || joined.includes('bg')) hints.push('background')
  if (joined.includes('surface') || joined.includes('card') || joined.includes('panel')) hints.push('surface')
  if (joined.includes('primary') || joined.includes('brand') || joined.includes('button')) hints.push('primary')
  if (joined.includes('accent') || joined.includes('highlight')) hints.push('accent')
  if (joined.includes('text') || joined.includes('foreground') || joined.includes('font')) hints.push('text')
  if (joined.includes('border') || joined.includes('stroke') || joined.includes('outline') || joined.includes('divider')) hints.push('border')
  if (joined.includes('hero') || joined.includes('banner') || joined.includes('masthead')) hints.push('hero')

  return hints
}

function layerHintsFromSelector(selectorHint?: string): Array<'global' | 'hero' | 'content'> {
  const joined = (selectorHint || '').toLowerCase()
  const hints = new Set<'global' | 'hero' | 'content'>()

  if (joined.includes('hero') || joined.includes('banner') || joined.includes('masthead')) hints.add('hero')
  if (joined.includes('card') || joined.includes('tile') || joined.includes('feature') || joined.includes('testimonial')) hints.add('content')
  if (!hints.size) hints.add('global')

  return [...hints]
}

function scoreColor(candidate: ColorAccumulator) {
  let score = candidate.count
  if (candidate.property === 'background-image') score += 10
  if (candidate.property === 'background-color') score += 8
  if (candidate.property === 'color') score += 5
  if (candidate.property === 'border-color') score += 3
  if (candidate.roleHints.has('background')) score += 8
  if (candidate.roleHints.has('surface')) score += 6
  if (candidate.roleHints.has('text')) score += 5
  if (candidate.roleHints.has('primary')) score += 4
  if (candidate.roleHints.has('border')) score += 3
  if (candidate.roleHints.has('hero')) score += 12
  if (candidate.hex === '#FFFFFF' || candidate.hex === '#000000') score += 2
  return score
}

function mergeColorCandidates(
  domGroup: PageColorCandidate[],
  cssGroup: PageColorCandidate[]
): PageColorCandidate[] {
  const merged = new Map<string, ColorAccumulator>()

  const weightedGroups = [
    { group: domGroup, weight: 1 },
    { group: cssGroup, weight: 0.35 },
  ]

  for (const { group, weight } of weightedGroups) {
    for (const candidate of group) {
      const key = candidate.hex
      const existing = merged.get(key) || {
        hex: candidate.hex,
        property: candidate.property,
        selectorHint: candidate.selectorHint,
        count: 0,
        roleHints: new Set<string>(),
        layerHints: new Set<'global' | 'hero' | 'content'>(),
      }
      existing.count += candidate.count * weight
      existing.property = existing.property || candidate.property
      existing.selectorHint = existing.selectorHint || candidate.selectorHint
      candidate.roleHints.forEach(hint => existing.roleHints.add(hint))
      candidate.layerHints.forEach(hint => existing.layerHints.add(hint))
      merged.set(key, existing)
    }
  }

  return [...merged.values()]
    .sort((a, b) => scoreColor(b) - scoreColor(a))
    .slice(0, 14)
    .map(item => ({
      hex: item.hex,
      property: item.property,
      selectorHint: item.selectorHint,
      count: item.count,
      roleHints: [...item.roleHints],
      layerHints: [...item.layerHints],
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
      }
      existing.count += candidate.count
      merged.set(key, existing)
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      lineHeight: item.lineHeight,
      letterSpacing: item.letterSpacing,
      count: item.count,
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

function extractCssSignals(cssText: string): Pick<PageStyleAnalysis, 'colorCandidates' | 'typographyCandidates' | 'radiusCandidates' | 'shadowCandidates' | 'spacingCandidates' | 'layoutHints'> {
  const colors = new Map<string, ColorAccumulator>()
  const typography = new Map<string, TypographyAccumulator>()
  const radiusValues = new Set<string>()
  const shadowValues = new Set<string>()
  const spacingValues = new Set<string>()
  const layoutHints = new Set<string>()

  const declarationRegex = /([.#]?[a-z0-9:_\-[\]\s>+~(),"'*=]+)?\{([^{}]+)\}/gi
  let match: RegExpExecArray | null

  while ((match = declarationRegex.exec(cssText)) !== null) {
    const selectorHint = match[1]?.trim()
    const block = match[2]

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

      const colorValues = extractHexesFromValue(value)
      for (const hex of colorValues) {
        const key = `${hex}:${property}:${selectorHint || ''}`
        const existing = colors.get(key) || {
          hex,
          property,
          selectorHint,
          count: 0,
          roleHints: new Set<string>(),
          layerHints: new Set<'global' | 'hero' | 'content'>(),
        }
        existing.count += 1
        roleHintsFromProperty(property, selectorHint).forEach(hint => existing.roleHints.add(hint))
        layerHintsFromSelector(selectorHint).forEach(hint => existing.layerHints.add(hint))
        if (property === 'background' || property === 'background-image') {
          existing.roleHints.add('background')
        }
        colors.set(key, existing)
      }

      if (property === 'font-family') fontFamily = value.replace(/\s*!important$/, '')
      if (property === 'font-size') fontSize = value
      if (property === 'font-weight') fontWeight = value
      if (property === 'line-height') lineHeight = value
      if (property === 'letter-spacing') letterSpacing = value

      if (property === 'border-radius') addUniqueValue(radiusValues, value)
      if (property === 'box-shadow') addUniqueValue(shadowValues, value, 10)

      if (property === 'gap' || property.startsWith('padding') || property.startsWith('margin')) {
        const spacingMatch = value.match(/\d+(\.\d+)?px/g)
        spacingMatch?.forEach(item => addUniqueValue(spacingValues, item))
      }

      if (property === 'display' && value.includes('grid')) layoutHints.add('Grid')
      if (property === 'display' && value.includes('flex')) layoutHints.add('Flex')
      if (property.startsWith('grid-template-columns')) layoutHints.add('Multi-column grid')
      if (property === 'position' && value === 'sticky') layoutHints.add('Sticky navigation')
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
      }
      existing.count += 1
      typography.set(key, existing)
    }
  }

  const colorCandidates: PageColorCandidate[] = [...colors.values()]
    .sort((a, b) => scoreColor(b) - scoreColor(a))
    .slice(0, 14)
    .map(item => ({
      hex: item.hex,
      property: item.property,
      selectorHint: item.selectorHint,
      count: item.count,
      roleHints: [...item.roleHints],
      layerHints: [...item.layerHints],
    }))

  const typographyCandidates: PageTypographyCandidate[] = [...typography.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      lineHeight: item.lineHeight,
      letterSpacing: item.letterSpacing,
      count: item.count,
    }))

  return {
    colorCandidates,
    typographyCandidates,
    radiusCandidates: [...radiusValues].slice(0, 10),
    shadowCandidates: [...shadowValues].slice(0, 8),
    spacingCandidates: [...spacingValues].slice(0, 12),
    layoutHints: [...layoutHints].slice(0, 8),
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

    return await page.evaluate(
      ({ maxVisibleElements }) => {
        type Candidate = {
          hex: string
          property: string
          selectorHint?: string
          count: number
          roleHints: string[]
          layerHints: Array<'global' | 'hero' | 'content'>
        }

        type Typo = {
          fontFamily: string
          fontSize?: string
          fontWeight?: string
          lineHeight?: string
          letterSpacing?: string
          count: number
        }

        const colorMap = new Map<string, Candidate>()
        const typoMap = new Map<string, Typo>()
        const radiusValues = new Set<string>()
        const shadowValues = new Set<string>()
        const spacingValues = new Set<string>()
        const layoutHints = new Set<string>()

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

        const addColor = (value: string, property: string, el: Element, weight = 1) => {
          if (!value || isTransparent(value)) return
          const hexes = value.includes('gradient')
            ? Array.from(value.matchAll(/rgba?\(\s*\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3}(?:[\s,\/]+[\d.]+)?\s*\)|#[0-9a-fA-F]{3,8}/g)).map(match => match[0])
            : [value]

          const selectorHint = selectorHintFor(el)
          const roleHints = new Set<string>()
          const layerHints = new Set<'global' | 'hero' | 'content'>()
          const tag = el.tagName.toLowerCase()
          const classText = `${selectorHint} ${(el as HTMLElement).getAttribute('role') || ''}`.toLowerCase()

          if (property === 'background-color' || property === 'background-image') roleHints.add('background')
          if (property === 'color') roleHints.add('text')
          if (property === 'border-color') roleHints.add('border')
          if (tag === 'button' || tag === 'a' || classText.includes('button') || classText.includes('btn')) roleHints.add('primary')
          if (classText.includes('card') || classText.includes('panel') || classText.includes('surface')) roleHints.add('surface')
          if (classText.includes('accent') || classText.includes('highlight')) roleHints.add('accent')
          if (tag === 'body' || tag === 'main' || tag === 'section' || tag === 'header') roleHints.add('surface')
          if (tag === 'header' || classText.includes('hero') || classText.includes('banner') || classText.includes('masthead')) {
            roleHints.add('hero')
            roleHints.add('background')
            layerHints.add('hero')
          }
          if (!layerHints.size) {
            if (classText.includes('card') || classText.includes('tile') || classText.includes('feature') || classText.includes('testimonial')) {
              layerHints.add('content')
            }
          }

          for (const rawColor of hexes) {
            const hex = rgbToHex(rawColor) || (rawColor.startsWith('#') ? rawColor.toUpperCase() : null)
            if (!hex) continue

            const key = `${hex}:${property}`
            const existing = colorMap.get(key) || {
              hex,
              property,
              selectorHint,
              count: 0,
              roleHints: [],
              layerHints: [],
            }
            existing.count += weight
            existing.selectorHint = existing.selectorHint || selectorHint
            existing.roleHints = [...new Set([...existing.roleHints, ...roleHints])]
            const resolvedLayers: Array<'global' | 'hero' | 'content'> = layerHints.size
              ? [...layerHints]
              : [tag === 'body' || tag === 'main' ? 'global' : 'content']
            existing.layerHints = [...new Set([...(existing.layerHints || []), ...resolvedLayers])]
            colorMap.set(key, existing)
          }
        }

        const body = document.body
        if (body) {
          const bodyStyle = window.getComputedStyle(body)
          if (bodyStyle.display === 'grid') layoutHints.add('Grid')
          if (bodyStyle.display === 'flex') layoutHints.add('Flex')
        }

        const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .filter(el => {
            const style = window.getComputedStyle(el)
            const rect = el.getBoundingClientRect()
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
            if (rect.width < 8 || rect.height < 8) return false
            if (rect.bottom < 0 || rect.top > window.innerHeight * 1.5) return false
            const tag = el.tagName.toLowerCase()
            if (['img', 'svg', 'video', 'canvas', 'picture'].includes(tag)) return false
            return true
          })
          .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))
          .slice(0, maxVisibleElements)

        for (const el of visibleElements) {
          const style = window.getComputedStyle(el)
          const tag = el.tagName.toLowerCase()
          const text = (el.textContent || '').trim()
          const rect = el.getBoundingClientRect()
          const area = rect.width * rect.height
          const viewportArea = Math.max(window.innerWidth * window.innerHeight, 1)
          const areaRatio = area / viewportArea
          const widthRatio = rect.width / Math.max(window.innerWidth, 1)
          const heightRatio = rect.height / Math.max(window.innerHeight, 1)
          const isTopRegion = rect.top >= -8 && rect.top < window.innerHeight * 0.45
          const looksLikeHero = isTopRegion && widthRatio > 0.72 && heightRatio > 0.18
          const weight = Math.max(1, Math.round(Math.min(areaRatio * 24, 12)))
          const topBoost = isTopRegion ? 2 : 0
          const heroBoost = looksLikeHero ? 10 : 0

          if (looksLikeHero) {
            layoutHints.add('Hero section')
          }

          addColor(style.backgroundColor, 'background-color', el, weight + topBoost + heroBoost)
          addColor(style.backgroundImage, 'background-image', el, Math.max(1, weight + topBoost + heroBoost + 1))
          addColor(style.color, 'color', el, Math.max(1, Math.round(weight * 0.5)))
          addColor(style.borderColor, 'border-color', el, Math.max(1, Math.round(weight * 0.75)))

          if (style.borderRadius && style.borderRadius !== '0px') radiusValues.add(style.borderRadius)
          if (style.boxShadow && style.boxShadow !== 'none') shadowValues.add(style.boxShadow)

          ;[style.gap, style.rowGap, style.columnGap, style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft, style.marginTop, style.marginBottom].forEach(value => {
            const match = value?.match(/\d+(\.\d+)?px/)
            if (match) spacingValues.add(match[0])
          })

          if (style.display === 'grid') layoutHints.add('Grid')
          if (style.display === 'flex') layoutHints.add('Flex')
          if (style.position === 'sticky') layoutHints.add('Sticky navigation')
          if (style.gridTemplateColumns && style.gridTemplateColumns !== 'none') layoutHints.add('Multi-column grid')

          if (text.length >= 2 && text.length <= 160) {
            const key = [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing].join('|')
            const existing = typoMap.get(key) || {
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
              count: 0,
            }
            existing.count += 1
            typoMap.set(key, existing)
          }

          if ((tag === 'header' || tag === 'nav') && el.getBoundingClientRect().top < 120) {
            layoutHints.add('Top navigation')
          }
        }

        return {
          colorCandidates: [...colorMap.values()].sort((a, b) => b.count - a.count).slice(0, 14),
          typographyCandidates: [...typoMap.values()].sort((a, b) => b.count - a.count).slice(0, 10),
          radiusCandidates: [...radiusValues].slice(0, 10),
          shadowCandidates: [...shadowValues].slice(0, 8),
          spacingCandidates: [...spacingValues].slice(0, 12),
          layoutHints: [...layoutHints].slice(0, 8),
        }
      },
      { maxVisibleElements: MAX_VISIBLE_ELEMENTS }
    )
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

  return {
    colorCandidates: mergeColorCandidates(domSignals?.colorCandidates || [], cssSignals.colorCandidates),
    typographyCandidates: mergeTypographyCandidates(domSignals?.typographyCandidates || [], cssSignals.typographyCandidates),
    radiusCandidates: mergeUniqueValues(10, domSignals?.radiusCandidates || [], cssSignals.radiusCandidates),
    shadowCandidates: mergeUniqueValues(8, domSignals?.shadowCandidates || [], cssSignals.shadowCandidates),
    spacingCandidates: mergeUniqueValues(12, domSignals?.spacingCandidates || [], cssSignals.spacingCandidates),
    layoutHints: mergeUniqueValues(8, domSignals?.layoutHints || [], cssSignals.layoutHints),
    cssTextExcerpt: cssText.slice(0, MAX_CSS_EXCERPT),
    sourceCount: {
      inlineStyleBlocks: inlineBlocks.length,
      linkedStylesheets: stylesheetTexts.filter(Boolean).length,
    },
  }
}
