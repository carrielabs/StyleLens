import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ColorToken, ExtractRequest, PageColorCandidate, PageStyleAnalysis, StyleReport, Typography, DesignDetails } from '@/lib/types'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetchNode from 'node-fetch'
import sharp from 'sharp'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

function isUnsupportedLocationError(message: string): boolean {
  const normalized = message.toLowerCase()
  return normalized.includes('user location is not supported')
    || normalized.includes('location is not supported for the api use')
}

// We patch globalThis.fetch specifically for Gemini, as the SDK removed clean proxy overrides.
const setupProxy = () => {
  const proxyUrl = process.env.STYLELENS_HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY
  if (!proxyUrl) return

  if (!(globalThis as any).__gemini_fetch_patched__) {
    console.log('[aiExtract] Patching global fetch to use proxy:', proxyUrl)
    const agent = new HttpsProxyAgent(proxyUrl)
    const originalFetch = globalThis.fetch
    
    globalThis.fetch = async (url, init) => {
      // Intercept Google Generative AI & ScreenshotOne requests if needed
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('generativelanguage.googleapis.com') || urlStr.includes('screenshotone.com')) {
        console.log(`[aiExtract] Proxying request to: ${urlStr.slice(0, 60)}...`)
        return fetchNode(url as any, { ...init, agent } as any) as any
      }
      return originalFetch(url, init)
    }
    
    ;(globalThis as any).__gemini_fetch_patched__ = true
  }
}

// Ensure proxy is rigged before any models are called
setupProxy()

/**
 * Fetches an image from a URL and converts it to a base64 string.
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mediaType: string }> {
  // 1. If it's already a Data URL, parse it directly
  if (url.startsWith('data:')) {
    console.log('[aiExtract] Detected Data URL, parsing directly...')
    const [header, base64] = url.split(',')
    const mimeMatch = header.match(/data:([^;]+)/)
    return {
      data: base64,
      mediaType: (mimeMatch ? mimeMatch[1] : 'image/jpeg') as any
    }
  }

  // 2. Otherwise, fetch normally (Proxy applied via global patch)
  console.log(`[aiExtract] Fetching image from URL: ${url.slice(0, 50)}...`)
  const response = await fetch(url)
  if (!response.ok) {
    console.error(`[aiExtract] Image fetch failed with status: ${response.status}`)
    throw new Error(`Failed to fetch screenshot from URL (Status: ${response.status})`)
  }
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  console.log(`[aiExtract] Successfully fetched image. Type: ${contentType}, Size: ${buffer.byteLength}`)
  
  return {
    data: base64,
    mediaType: contentType as 'image/jpeg' | 'image/png' | 'image/webp'
  }
}

const SYSTEM_PROMPT = `You are an expert visual design analyst. Your job is to analyze images and extract comprehensive, precise visual style information. Always respond with valid JSON only — no markdown, no extra text.

For URL / website analysis, prioritize measured page signals over decorative imagery. Ignore colors that appear only inside illustrations, product screenshots, avatars, logos, or embedded media unless those colors also appear in the measured page style signals. Use measured typography, radius, shadow, spacing, and layout evidence whenever it is provided.

Be highly specific with color values (exact HEX codes). For colors you cannot determine exactly, make an educated approximation only when no measured evidence is available.`

const USER_PROMPT_TEMPLATE = `Analyze this design and return a complete style report as JSON with this exact structure:

{
  "summary": "Deprecated field, but provide a tiny string to be safe.",
  "summaryEn": "A comprehensive 2-3 sentence paragraph detailing the overall visual aesthetic, structural layout theme, color theory impression, and target audience emotion.",
  "summaryZh": "A highly professional 2-3 sentence paragraph in Chinese detailing the overall visual aesthetic, layout theme, and brand impression. (e.g. 采用了极简主义与大面积留白，结合高对比度无衬线字体，传递出极具未来感的技术品牌调性...)",
  "tags": ["tag1", "tag2"],
  "tagsEn": ["Minimalist", "Dark Mode", "Editorial", "High Contrast", "Glassmorphism", "Geometric", "(Provide EXACTLY 6 to 10 highly specific tags)"],
  "tagsZh": ["极简主义", "深色模式", "杂志排版", "高对比度", "毛玻璃", "几何感", "(Provide EXACTLY 6 to 10 highly specific tags)"],
  "colors": [
    {
      "role": "background|surface|primary|secondary|accent|text|border|other",
      "hex": "#RRGGBB",
      "rgb": "rgb(R, G, B)",
      "hsl": "hsl(H, S%, L%)",
      "name": "Color name in English",
      "description": "Brief description of how this color is used"
    }
  ],
  "gradients": [
    {
      "css": "linear-gradient(...) or radial-gradient(...)",
      "description": "Where this gradient is used"
    }
  ],
  "typography": {
    "fontFamily": "Font name or font stack",
    "confidence": "identified|inferred",
    "headingWeight": 700,
    "bodyWeight": 400,
    "fontSizeScale": "Description of the type scale",
    "lineHeight": "Exact number or CSS (e.g. '1.5', '24px'). NO descriptive text.",
    "letterSpacing": "Exact CSS value (e.g. '-0.02em', 'normal'). NO descriptive text.",
    "alignment": "left|center|justify",
    "textTreatment": "solid|gradient|translucent",
    "googleFontsAlt": "Closest Google Fonts alternative"
  },
  "designDetails": {
    "overallStyle": "Primary design style",
    "colorMode": "dark|light|system",
    "borderRadius": "Description of border radius usage",
    "shadowStyle": "Description of shadows",
    "spacingSystem": "Description of spacing",
    "borderStyle": "Description of border style",
    "animationTendency": "Description of animation approach",
    "imageHandling": "How images are treated",
    "layoutStructure": "Layout description",
    // ONLY output EXACT, pure short strings. NO paragraphs!
    "layoutEn": "Ultra-short 2-5 words describing layout (e.g., 'Bento Grid', 'Asymmetric Layout')",
    "layoutZh": "Ultra-short Chinese translation (e.g., '便当盒网格', '不对称布局')",
    "spacingEn": "Ultra-short spacing rule (e.g., 'Spacious', 'Dense 4px grid')",
    "spacingZh": "Ultra-short Chinese (e.g., '极其宽敞', '紧凑 4px 网格')",
    "motionEn": "Ultra-short motion type (e.g., 'Spring physics', 'Subtle fade')",
    "motionZh": "Ultra-short Chinese (e.g., '弹性物理过渡', '微弱淡入')",
    
    // NEW: We need strict exact CSS for actual visual rendering in the UI. 
    // If the site uses multiple sizes/variants, separate them by "|"
    "cssRadius": "Exact CSS value like '8px' or multiple '4px | 12px | 50%'. STRICTLY ONLY THE VALUES.",
    "cssShadow": "Exact CSS box-shadow like '0 4px 12px rgba(0,0,0,0.1)' or multiple separated by '|'. STRICTLY ONLY THE VALUES."
  }
}

Rules:
- For URL / website analysis, prefer 4 to 8 UI system colors. Do NOT include colors that only come from content screenshots or illustrations unless they are repeated in measured page signals.
- For image-only analysis, extract at minimum 6 colors, maximum 12
- Provide accurate dual-language translations
- layoutEn, layoutZh, spacingEn, spacingZh, motionEn, motionZh: If multiple patterns are detected (e.g. Bento + Flex), return them separated by '|'. (e.g. 'Bento Grid | Sidebar Layout'). KEEP THEM ULTRA-SHORT BADGES.
- If measured radius/shadow candidates are provided, cssRadius and cssShadow MUST come from those candidates only.
- If measured typography candidates are provided, typography should be derived from those measured families/sizes/weights instead of visual guessing.
- cssRadius and cssShadow MUST be exact valid CSS values only. If multiple unique variations are found, separate them by '|'.
- If no gradients detected, return empty array []`

function formatPageAnalysis(pageAnalysis?: PageStyleAnalysis): string {
  if (!pageAnalysis) return ''

  const colors = pageAnalysis.colorCandidates
    .map(candidate => `${candidate.hex} | ${candidate.property} | layer=${candidate.layerHints.join('/') || 'none'} | hints=${candidate.roleHints.join('/') || 'none'} | count=${candidate.count}`)
    .join('\n')

  const typography = pageAnalysis.typographyCandidates
    .map(candidate => `${candidate.fontFamily} | size=${candidate.fontSize || 'unknown'} | weight=${candidate.fontWeight || 'unknown'} | lineHeight=${candidate.lineHeight || 'unknown'} | count=${candidate.count}`)
    .join('\n')

  return `

Measured page style signals (prefer these over screenshot-only guesses):
- Color candidates:
${colors || 'none'}
- Typography candidates:
${typography || 'none'}
- Radius candidates: ${pageAnalysis.radiusCandidates.join(' | ') || 'none'}
- Shadow candidates: ${pageAnalysis.shadowCandidates.join(' | ') || 'none'}
- Spacing candidates: ${pageAnalysis.spacingCandidates.join(' | ') || 'none'}
- Layout hints: ${pageAnalysis.layoutHints.join(' | ') || 'none'}
`
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const parts = [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)].map(part => Number.parseInt(part, 16))
  return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`
}

function hexToHsl(hex: string): string {
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

function inferRoleFromHints(hints: string[]): ColorToken['role'] {
  if (hints.includes('hero')) return 'background'
  if (hints.includes('background')) return 'background'
  if (hints.includes('surface')) return 'surface'
  if (hints.includes('text')) return 'text'
  if (hints.includes('primary')) return 'primary'
  if (hints.includes('accent')) return 'accent'
  if (hints.includes('border')) return 'border'
  return 'other'
}

function fallbackColorName(role: ColorToken['role']): string {
  const map: Record<ColorToken['role'], string> = {
    background: 'Background',
    surface: 'Surface',
    primary: 'Primary',
    secondary: 'Secondary',
    accent: 'Accent',
    text: 'Text',
    border: 'Border',
    other: 'Other',
  }
  return map[role]
}

function debugColorCandidates(label: string, candidates: PageColorCandidate[]) {
  console.log(`[color-debug] ${label}`)
  candidates.slice(0, 12).forEach((candidate, index) => {
    console.log(
      `[color-debug] ${index + 1}. ${candidate.hex} property=${candidate.property} count=${candidate.count} layers=${candidate.layerHints.join('/') || 'none'} hints=${candidate.roleHints.join('/') || 'none'} selector=${candidate.selectorHint || 'n/a'}`
    )
  })
}

function debugSelectedPalette(colors: ColorToken[]) {
  console.log('[color-debug] selected palette')
  colors.forEach((color, index) => {
    console.log(
      `[color-debug] ${index + 1}. ${color.hex} role=${color.role} name=${color.name}`
    )
  })
}

function quantizeChannel(channel: number): number {
  return Math.max(0, Math.min(255, Math.round(channel / 16) * 16))
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function isNearNeutral(r: number, g: number, b: number): boolean {
  return Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) < 18
}

function isExtremeMonochrome(r: number, g: number, b: number): boolean {
  const avg = (r + g + b) / 3
  return avg < 18 || avg > 246
}

async function extractDominantRegionColors(
  imageBuffer: Buffer,
  region: { left: number; top: number; width: number; height: number }
): Promise<string[]> {
  if (region.width <= 4 || region.height <= 4) return []

  const { data, info } = await sharp(imageBuffer)
    .extract(region)
    .resize(96, 96, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const buckets = new Map<string, number>()
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = rgbToHex(quantizeChannel(r), quantizeChannel(g), quantizeChannel(b))
    buckets.set(key, (buckets.get(key) || 0) + 1)
  }

  const ranked = [...buckets.entries()]
    .map(([hex, count]) => {
      const r = Number.parseInt(hex.slice(1, 3), 16)
      const g = Number.parseInt(hex.slice(3, 5), 16)
      const b = Number.parseInt(hex.slice(5, 7), 16)
      let priority = count
      if (!isNearNeutral(r, g, b)) priority += 60
      if (!isExtremeMonochrome(r, g, b)) priority += 30
      return { hex, priority, count }
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)

  return ranked.map(item => item.hex)
}

async function extractHeroEdgeColors(
  imageBuffer: Buffer,
  width: number,
  height: number
): Promise<string[]> {
  const heroHeight = Math.max(60, Math.floor(height * 0.38))
  const sideWidth = Math.max(36, Math.floor(width * 0.16))
  const topBandHeight = Math.max(28, Math.floor(heroHeight * 0.22))
  const lowerBandTop = Math.max(0, Math.floor(heroHeight * 0.58))
  const lowerBandHeight = Math.max(28, Math.floor(heroHeight * 0.18))

  const regions = [
    { left: 0, top: 0, width: sideWidth, height: heroHeight },
    { left: width - sideWidth, top: 0, width: sideWidth, height: heroHeight },
    { left: 0, top: 0, width, height: topBandHeight },
    { left: 0, top: lowerBandTop, width: Math.max(36, Math.floor(width * 0.18)), height: lowerBandHeight },
    { left: width - Math.max(36, Math.floor(width * 0.18)), top: lowerBandTop, width: Math.max(36, Math.floor(width * 0.18)), height: lowerBandHeight },
  ]

  const colors = new Map<string, number>()
  for (const region of regions) {
    const sampled = await extractDominantRegionColors(imageBuffer, region)
    sampled.forEach((hex, index) => {
      const weight = Math.max(1, 5 - index)
      colors.set(hex, (colors.get(hex) || 0) + weight)
    })
  }

  return [...colors.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex)
    .slice(0, 5)
}

async function mergeScreenshotColorSignals(
  pageAnalysis: PageStyleAnalysis | undefined,
  base64Data: string
): Promise<PageStyleAnalysis | undefined> {
  if (!pageAnalysis) return pageAnalysis

  try {
    const imageBuffer = Buffer.from(base64Data, 'base64')
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0
    if (width < 40 || height < 40) return pageAnalysis

    const heroColors = await extractHeroEdgeColors(imageBuffer, width, height)

    const contentColors = await extractDominantRegionColors(imageBuffer, {
      left: 0,
      top: Math.floor(height * 0.42),
      width,
      height: Math.max(40, Math.floor(height * 0.42)),
    })

    const augmentedCandidates = [...pageAnalysis.colorCandidates]
    const existing = new Map(augmentedCandidates.map(candidate => [candidate.hex.toUpperCase(), candidate]))

    for (const hex of heroColors) {
      const current = existing.get(hex)
    if (current) {
      current.count += 18
      current.roleHints = [...new Set([...current.roleHints, 'background', 'hero'])]
      current.layerHints = [...new Set([...(current.layerHints || []), 'hero'])] as Array<'global' | 'hero' | 'content'>
      if (current.property === 'color' || current.property === 'border-color') {
        current.property = 'background-image'
      }
    } else {
      const candidate: PageColorCandidate = {
        hex,
        property: 'screenshot-hero',
        selectorHint: 'hero-region',
          count: 18,
          roleHints: ['background', 'hero'],
          layerHints: ['hero'],
        }
        augmentedCandidates.push(candidate)
        existing.set(hex, candidate)
      }
    }

    for (const hex of contentColors) {
      const current = existing.get(hex)
      if (current) {
        current.count += 8
        current.roleHints = [...new Set([...current.roleHints, 'surface'])]
        current.layerHints = [...new Set([...(current.layerHints || []), 'global'])] as Array<'global' | 'hero' | 'content'>
      } else {
        const candidate: PageColorCandidate = {
          hex,
          property: 'screenshot-content',
          selectorHint: 'content-region',
          count: 8,
          roleHints: ['surface'],
          layerHints: ['global'],
        }
        augmentedCandidates.push(candidate)
        existing.set(hex, candidate)
      }
    }

    const mergedAnalysis = {
      ...pageAnalysis,
      colorCandidates: augmentedCandidates,
    }
    debugColorCandidates('merged screenshot/page candidates', mergedAnalysis.colorCandidates)
    return mergedAnalysis
  } catch (error) {
    console.warn('[aiExtract] Screenshot color analysis failed:', error)
    return pageAnalysis
  }
}

function pickMeasuredColors(pageAnalysis: PageStyleAnalysis, aiColors: ColorToken[]): ColorToken[] {
  debugColorCandidates('incoming measured candidates', pageAnalysis.colorCandidates)
  const aiByHex = new Map(aiColors.map(color => [color.hex.toUpperCase(), color]))
  const measured = pageAnalysis.colorCandidates
    .filter(candidate => candidate.count >= 1)

  const scored = measured.map(candidate => {
    const hints = new Set(candidate.roleHints)
    const layers = new Set(candidate.layerHints)
    let priority = candidate.count

    if (candidate.property === 'screenshot-hero') priority += 26
    if (candidate.property === 'screenshot-content') priority -= 6
    if (candidate.property === 'background-image') priority += 14
    if (candidate.property === 'background-color') priority += 10
    if (candidate.property === 'color') priority += 5
    if (candidate.property === 'border-color') priority += 3

    if (hints.has('background')) priority += 10
    if (hints.has('surface')) priority += 8
    if (hints.has('text')) priority += 7
    if (hints.has('border')) priority += 5
    if (hints.has('primary')) priority += 5
    if (hints.has('accent')) priority += 3
    if (hints.has('hero')) priority += 16
    if (layers.has('global')) priority += 10
    if (layers.has('hero')) priority += 18
    if (layers.has('content')) priority -= 10

    return { candidate, priority }
  }).sort((a, b) => b.priority - a.priority)

  const selected: typeof measured = []
  const seenHex = new Set<string>()
  const seenRoles = new Set<ColorToken['role']>()
  const requiredRoles: Array<ColorToken['role']> = ['background', 'surface', 'text', 'border', 'primary', 'accent']

  for (const role of requiredRoles) {
    const hit = scored.find(({ candidate }) => {
      const inferredRole = inferRoleFromHints(candidate.roleHints)
      if (candidate.layerHints.includes('content') && !candidate.layerHints.includes('hero')) return false
      if (role === 'background') {
        return inferredRole === role && !seenHex.has(candidate.hex.toUpperCase())
      }
      return inferredRole === role && !seenHex.has(candidate.hex.toUpperCase())
    })
    if (hit) {
      selected.push(hit.candidate)
      seenHex.add(hit.candidate.hex.toUpperCase())
      seenRoles.add(role)
    }
  }

  const heroBackground = scored.find(({ candidate }) =>
    candidate.roleHints.includes('hero') &&
    !candidate.layerHints.includes('content') &&
    !seenHex.has(candidate.hex.toUpperCase())
  )
  if (heroBackground) {
    selected.unshift(heroBackground.candidate)
    seenHex.add(heroBackground.candidate.hex.toUpperCase())
  }

  for (const { candidate } of scored) {
    if (selected.length >= 8) break
    const hex = candidate.hex.toUpperCase()
    if (seenHex.has(hex)) continue
    if (candidate.layerHints.includes('content') && !candidate.layerHints.includes('hero')) continue
    selected.push(candidate)
    seenHex.add(hex)
  }

  const colors = selected.map(candidate => {
    const hex = candidate.hex.toUpperCase()
    const matched = aiByHex.get(hex)
    let role = matched?.role || inferRoleFromHints(candidate.roleHints)
    if (candidate.roleHints.includes('hero')) role = 'background'

    return {
      role,
      hex,
      rgb: matched?.rgb || hexToRgb(hex),
      hsl: matched?.hsl || hexToHsl(hex),
      name: matched?.name || fallbackColorName(role),
      description: matched?.description || `Measured from ${candidate.property}${candidate.selectorHint ? ` on ${candidate.selectorHint}` : ''}`,
    } satisfies ColorToken
  })

  const unique = new Map<string, ColorToken>()
  for (const color of colors) {
    if (!unique.has(color.hex)) unique.set(color.hex, color)
  }

  const finalPalette = [...unique.values()]
    .filter(color => {
      if ((color.role === 'accent' || color.role === 'other') && (color.hex === '#FFFF00' || color.hex === '#FFFB30')) {
        return false
      }
      return true
    })
    .slice(0, 8)
  debugSelectedPalette(finalPalette)
  return finalPalette
}

function summarizeSpacing(pageAnalysis: PageStyleAnalysis, fallback?: string) {
  if (!pageAnalysis.spacingCandidates.length) return fallback || 'Measured spacing not available'
  const top = pageAnalysis.spacingCandidates.slice(0, 4).join(' | ')
  return `Measured spacing scale: ${top}`
}

function summarizeLayout(pageAnalysis: PageStyleAnalysis, fallback?: string) {
  if (!pageAnalysis.layoutHints.length) return fallback || 'Measured layout not available'
  return pageAnalysis.layoutHints.slice(0, 3).join(' | ')
}

function pickMeasuredTypography(pageAnalysis: PageStyleAnalysis, aiTypography: Typography): Typography {
  if (!pageAnalysis.typographyCandidates.length) return aiTypography

  const candidates = pageAnalysis.typographyCandidates
  const distinctFamilies = [...new Set(candidates.map(candidate => candidate.fontFamily).filter(Boolean))]
  const primaryFamily = distinctFamilies.slice(0, 3).join(', ') || aiTypography.fontFamily

  const numericWeights = candidates
    .map(candidate => Number(candidate.fontWeight))
    .filter(weight => Number.isFinite(weight))

  const numericSizes = candidates
    .map(candidate => Number.parseFloat(candidate.fontSize || ''))
    .filter(size => Number.isFinite(size))
    .sort((a, b) => b - a)

  const lineHeight = candidates.find(candidate => candidate.lineHeight)?.lineHeight || aiTypography.lineHeight
  const letterSpacing = candidates.find(candidate => candidate.letterSpacing)?.letterSpacing || aiTypography.letterSpacing

  return {
    ...aiTypography,
    fontFamily: primaryFamily,
    confidence: 'identified',
    headingWeight: numericWeights.length ? Math.max(...numericWeights, aiTypography.headingWeight || 700) : aiTypography.headingWeight,
    bodyWeight: numericWeights.length ? Math.min(...numericWeights, aiTypography.bodyWeight || 400) : aiTypography.bodyWeight,
    fontSizeScale: numericSizes.length >= 3
      ? `${numericSizes.slice(0, 4).map(size => `${Math.round(size)}px`).join(' / ')}`
      : aiTypography.fontSizeScale,
    lineHeight,
    letterSpacing,
  }
}

function pickMeasuredDesignDetails(pageAnalysis: PageStyleAnalysis, aiDetails: DesignDetails): DesignDetails {
  return {
    ...aiDetails,
    borderRadius: pageAnalysis.radiusCandidates.length
      ? `Measured radius variants: ${pageAnalysis.radiusCandidates.slice(0, 4).join(' | ')}`
      : aiDetails.borderRadius,
    shadowStyle: pageAnalysis.shadowCandidates.length
      ? `Measured shadow variants: ${pageAnalysis.shadowCandidates.slice(0, 3).join(' | ')}`
      : aiDetails.shadowStyle,
    spacingSystem: summarizeSpacing(pageAnalysis, aiDetails.spacingSystem),
    layoutStructure: summarizeLayout(pageAnalysis, aiDetails.layoutStructure),
    cssRadius: pageAnalysis.radiusCandidates.length
      ? pageAnalysis.radiusCandidates.slice(0, 5).join(' | ')
      : aiDetails.cssRadius,
    cssShadow: pageAnalysis.shadowCandidates.length
      ? pageAnalysis.shadowCandidates.slice(0, 4).join(' | ')
      : aiDetails.cssShadow,
    layoutEn: pageAnalysis.layoutHints.length ? pageAnalysis.layoutHints.slice(0, 3).join(' | ') : aiDetails.layoutEn,
    spacingEn: pageAnalysis.spacingCandidates.length ? pageAnalysis.spacingCandidates.slice(0, 4).join(' | ') : aiDetails.spacingEn,
  }
}

function applyMeasuredUrlSignals(
  parsed: Omit<StyleReport, 'id' | 'sourceType' | 'sourceLabel' | 'thumbnailUrl' | 'createdAt'>,
  pageAnalysis?: PageStyleAnalysis
) {
  if (!pageAnalysis) return parsed

  return {
    ...parsed,
    colors: pageAnalysis.colorCandidates.length ? pickMeasuredColors(pageAnalysis, parsed.colors || []) : parsed.colors,
    typography: pageAnalysis.typographyCandidates.length ? pickMeasuredTypography(pageAnalysis, parsed.typography) : parsed.typography,
    designDetails: pickMeasuredDesignDetails(pageAnalysis, parsed.designDetails),
  }
}

export async function extractStyleWithAI(req: ExtractRequest): Promise<StyleReport> {
  const geminiKeys = [
    process.env.STYLELENS_GEMINI_API_KEY,
    process.env.STYLELENS_GEMINI_API_KEY_2,
    process.env.STYLELENS_GEMINI_API_KEY_3,
    process.env.STYLELENS_GEMINI_API_KEY_4
  ].filter(Boolean) as string[]

  if (geminiKeys.length === 0) {
    throw new Error('No Gemini API keys configured in environment variables.')
  }

  let base64Data = ''
  let mimeType = ''

  if (req.imageBase64) {
    console.log('[aiExtract] Using provided imageBase64')
    if (req.imageBase64.startsWith('data:')) {
      // Strip data URL prefix: "data:image/jpeg;base64,/9j/..." → pure base64
      const [header, b64] = req.imageBase64.split(',')
      const mimeMatch = header.match(/data:([^;]+)/)
      mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      base64Data = b64
    } else {
      base64Data = req.imageBase64
      mimeType = req.imageBase64.startsWith('/9j/') || req.imageBase64.includes('jpeg')
        ? 'image/jpeg'
        : req.imageBase64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg'
    }
  } else if (req.screenshotUrl) {
    console.log(`[aiExtract] Handling screenshotUrl: ${req.screenshotUrl.slice(0, 50)}`)
    const { data, mediaType } = await fetchImageAsBase64(req.screenshotUrl)
    base64Data = data
    mimeType = mediaType
  }

  console.log(`[aiExtract] Image prepared. Mime: ${mimeType}, B64 Length: ${base64Data.length}`)

  let requestWithAnalysis = req
  if (req.sourceType === 'url' && req.pageAnalysis && base64Data) {
    const mergedAnalysis = await mergeScreenshotColorSignals(req.pageAnalysis, base64Data)
    if (mergedAnalysis) {
      requestWithAnalysis = {
        ...req,
        pageAnalysis: mergedAnalysis,
      }
    }
  }

  let promptText = USER_PROMPT_TEMPLATE
  if (requestWithAnalysis.extractedCss) {
    console.log(`[aiExtract] Adding CSS context (${requestWithAnalysis.extractedCss.length} bytes)`)
    promptText += `\n\nAdditional context — extracted CSS from the page:\n\`\`\`css\n${requestWithAnalysis.extractedCss.slice(0, 3000)}\n\`\`\``
  }
  if (requestWithAnalysis.pageAnalysis) {
    console.log('[aiExtract] Adding measured page analysis context')
    promptText += formatPageAnalysis(requestWithAnalysis.pageAnalysis)
  }

  let lastError: unknown = null
  
  // ── Multi-Key Rotation Strategy ────────────────────────────────────
  for (let i = 0; i < geminiKeys.length; i++) {
    const apiKey = geminiKeys[i]
    try {
      console.log(`[Attempt ${i + 1}/${geminiKeys.length}] Style extraction with Gemini 2.5 Flash...`)
      
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      })

      const imagePart = {
        inlineData: { data: base64Data, mimeType }
      }
      const parts = [promptText, imagePart]

      const result = await model.generateContent(parts)
      const response = await result.response
      const rawText = response.text().trim()
      
      return parseAndFormatResponse(rawText, requestWithAnalysis, mimeType, base64Data)
    } catch (err: unknown) {
      lastError = err
      const message = getErrorMessage(err)
      console.warn(`Gemini Key ${i + 1} failed:`, message)

      if (isUnsupportedLocationError(message)) {
        throw new Error('当前 AI 解析服务在此网络环境下暂不可用，请切换网络环境后重试。')
      }
      
      if (i < geminiKeys.length - 1) {
        console.log('Switching to backup Gemini key...')
        continue // Try next key
      }
    }
  }

  // If we reach here, all Gemini keys failed
  throw new Error(`[All Gemini Keys Failed] Last error: ${getErrorMessage(lastError)}`)
}

/**
 * Shared parser for AI response
 */
function parseAndFormatResponse(
  rawText: string, 
  req: ExtractRequest, 
  mimeType: string, 
  base64Data: string
): StyleReport {
  let parsed: Omit<StyleReport, 'id' | 'sourceType' | 'sourceLabel' | 'thumbnailUrl' | 'createdAt'>
  try {
    const clean = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    parsed = JSON.parse(clean)
  } catch {
    throw new Error(`AI returned invalid JSON: ${rawText.slice(0, 200)}`)
  }

  if (req.sourceType === 'url') {
    parsed = applyMeasuredUrlSignals(parsed, req.pageAnalysis)
  }

  return {
    sourceType: req.sourceType,
    sourceLabel: req.sourceLabel,
    thumbnailUrl: req.screenshotUrl || (base64Data ? `data:${mimeType};base64,${base64Data}` : undefined),
    pageAnalysis: req.pageAnalysis,
    summary: parsed.summary,
    summaryEn: parsed.summaryEn || parsed.summary,
    summaryZh: parsed.summaryZh || parsed.summary,
    tags: parsed.tags,
    tagsEn: parsed.tagsEn || parsed.tags,
    tagsZh: parsed.tagsZh || parsed.tags,
    colors: parsed.colors,
    gradients: parsed.gradients || [],
    typography: parsed.typography,
    designDetails: parsed.designDetails,
    createdAt: new Date().toISOString(),
  }
}
