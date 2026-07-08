import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ColorToken, ExtractRequest, LayeredColorSystem, PageColorCandidate, PageStyleAnalysis, SemanticColorSystem, StyleReport, Typography, DesignDetails } from '@/lib/types'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetchNode from 'node-fetch'
import sharp from 'sharp'
import fs from 'fs'
import { mergeScreenshotColorSignals } from '@/lib/api/heroVisualAnalyzer'
import { sanitizePageAnalysis } from '@/lib/api/pageAnalyzer'

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
    "cssShadow": "Exact CSS box-shadow like '0 4px 12px rgba(0,0,0,0.1)' or multiple separated by '|'. STRICTLY ONLY THE VALUES.",

    // Page sections — structural breakdown of major page sections top to bottom
    "pageSections": [
      {
        "index": 0,
        "purpose": "hero|features|pricing|testimonials|cta|footer|section",
        "layout": "full-width|2-column|3-column-grid|4-column-grid|asymmetric|grid",
        "columns": 1,
        "hasCTA": true,
        "hasImage": false,
        "heading": "Section heading text if visible (omit if not visible)",
        "measured": false
      }
    ],

    // Visual style DNA — icon family, personality, density
    "visualStyle": {
      "iconStyle": "solid|outline|rounded-outline|duotone|mixed|minimal|none",
      "personality": ["minimal", "professional", "bold"],
      "density": "sparse|comfortable|dense",
      "imageStyle": "photography|illustration|product-screenshots|abstract|mixed|none",
      "colorTemperature": "warm|cool|neutral",
      "iconLibrary": "heroicons|lucide|feather|fontawesome|custom|unknown"
    },

    // Interaction style — how the UI feels in motion
    "interactionStyle": {
      "hoverEffect": "Brief description: 'subtle color shift', 'scale up 1.02', 'underline appears', etc.",
      "transitionFeel": "snappy|smooth|bouncy",
      "animationCharacter": "restrained|expressive|none"
    }
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

  const typography = pageAnalysis.typographyTokens
    .map(token => `${token.label} | family=${token.fontFamily} | size=${token.fontSize} | weight=${token.fontWeight} | lineHeight=${token.lineHeight} | letterSpacing=${token.letterSpacing} | score=${token.evidenceScore}`)
    .join('\n')

  const semanticSlots = pageAnalysis.semanticColorSystem
    ? Object.entries(pageAnalysis.semanticColorSystem)
        .filter(([, value]) => value && !Array.isArray(value))
        .map(([slot, value]) => `${slot}=${(value as ColorToken).hex}`)
        .join(' | ')
    : 'none'
  const stateTokens = Object.entries(pageAnalysis.stateTokens || {})
    .map(([kind, values]) => `${kind}=${(values || []).length}`)
    .join(' | ')
  const pageSections = (pageAnalysis.pageSections || [])
    .map(section => `${section.index}:${section.purpose}:${section.layout}:${section.columns}`)
    .join(' | ')
  const viewportSlices = (pageAnalysis.viewportSlices || [])
    .map(slice => `${slice.index}:${slice.yStartPct}-${slice.yEndPct}:${slice.dominantSectionId || 'none'}`)
    .join(' | ')

  return `

Measured page style signals (prefer these over screenshot-only guesses):
- Prefer measured pageAnalysis signals first.
- Use screenshot evidence only as supporting context.
- Semantic color slots: ${semanticSlots}
- Color candidates:
${colors || 'none'}
- Typography tokens:
${typography || 'none'}
- Radius tokens: ${pageAnalysis.radiusTokens.map(token => token.value).join(' | ') || 'none'}
- Shadow tokens: ${pageAnalysis.shadowTokens.map(token => token.value).join(' | ') || 'none'}
- Spacing tokens: ${pageAnalysis.spacingTokens.map(token => token.value).join(' | ') || 'none'}
- Layout evidence: ${pageAnalysis.layoutEvidence.map(item => item.label).join(' | ') || 'none'}
- stateTokens: ${stateTokens || 'none'}
- pageSections: ${pageSections || 'none'}
- viewportSlices: ${viewportSlices || 'none'}
`
}

export function buildAiExtractionPrompt(req: Pick<ExtractRequest, 'sourceType' | 'extractedCss' | 'pageAnalysis'>): string {
  let promptText = USER_PROMPT_TEMPLATE

  if (req.extractedCss) {
    promptText += `\n\nAdditional context — extracted CSS from the page:\n\`\`\`css\n${req.extractedCss.slice(0, 3000)}\n\`\`\``
  }

  if (req.pageAnalysis) {
    promptText += formatPageAnalysis(req.pageAnalysis)
  }

  return promptText
}

async function enhancePageAnalysisWithScreenshotSignals(
  req: ExtractRequest,
  base64Data: string
): Promise<ExtractRequest> {
  let requestWithAnalysis = {
    ...req,
    pageAnalysis: sanitizePageAnalysis(req.pageAnalysis),
  }

  if (requestWithAnalysis.sourceType === 'url') {
    writeUrlDebugSnapshot('url-before-merge', {
      sourceLabel: requestWithAnalysis.sourceLabel,
      pageAnalysis: requestWithAnalysis.pageAnalysis,
    })
  }

  if (!(requestWithAnalysis.sourceType === 'url' && requestWithAnalysis.pageAnalysis && base64Data)) {
    return requestWithAnalysis
  }

  const mergedAnalysis = await mergeScreenshotColorSignals(requestWithAnalysis.pageAnalysis, base64Data)
  if (mergedAnalysis) {
    const originalAnalysis = requestWithAnalysis.pageAnalysis
    const recoveredAnalysis = recoverShellSemanticSlots(mergedAnalysis)
    requestWithAnalysis = {
      ...requestWithAnalysis,
      pageAnalysis: {
        ...recoveredAnalysis,
        typographyCandidates:
          recoveredAnalysis.typographyCandidates?.length
            ? recoveredAnalysis.typographyCandidates
            : originalAnalysis?.typographyCandidates ?? [],
        typographyTokens:
          recoveredAnalysis.typographyTokens?.length
            ? recoveredAnalysis.typographyTokens
            : originalAnalysis?.typographyTokens ?? [],
        radiusTokens:
          recoveredAnalysis.radiusTokens?.length
            ? recoveredAnalysis.radiusTokens
            : originalAnalysis?.radiusTokens ?? [],
        shadowTokens:
          recoveredAnalysis.shadowTokens?.length
            ? recoveredAnalysis.shadowTokens
            : originalAnalysis?.shadowTokens ?? [],
        spacingTokens:
          recoveredAnalysis.spacingTokens?.length
            ? recoveredAnalysis.spacingTokens
            : originalAnalysis?.spacingTokens ?? [],
        layoutEvidence:
          recoveredAnalysis.layoutEvidence?.length
            ? recoveredAnalysis.layoutEvidence
            : originalAnalysis?.layoutEvidence ?? [],
        stateTokens:
          Object.keys(recoveredAnalysis.stateTokens ?? {}).length
            ? recoveredAnalysis.stateTokens
            : originalAnalysis?.stateTokens ?? {},
      },
    }
  }

  writeUrlDebugSnapshot('url-after-merge', {
    sourceLabel: requestWithAnalysis.sourceLabel,
    pageAnalysis: requestWithAnalysis.pageAnalysis,
  })

  return requestWithAnalysis
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
      + ` source=${color.meta?.source || 'n/a'}`
      + ` confidence=${color.meta?.confidence || 'n/a'}`
      + ` evidence=${color.meta?.evidenceCount ?? 'n/a'}`
      + ` context=${color.meta?.context || 'n/a'}`
    )
  })
}

function writeUrlDebugSnapshot(label: string, payload: unknown) {
  try {
    fs.writeFileSync(`/tmp/stylelens-${label}.json`, JSON.stringify(payload, null, 2), 'utf8')
  } catch (error) {
    console.warn('[aiExtract] Failed to write debug snapshot:', error)
  }
}

function inferRoleFromSemanticSlot(slot: keyof SemanticColorSystem): ColorToken['role'] {
  switch (slot) {
    case 'heroBackground':
    case 'pageBackground':
      return 'background'
    case 'surface':
      return 'surface'
    case 'textPrimary':
    case 'textSecondary':
      return 'text'
    case 'border':
      return 'border'
    case 'primaryAction':
      return 'primary'
    case 'secondaryAction':
      return 'secondary'
    case 'contentColors':
      return 'accent'
    default:
      return 'other'
  }
}

function hexDistance(hexA?: string, hexB?: string): number {
  if (!hexA || !hexB) return Number.POSITIVE_INFINITY

  const parse = (hex: string) => {
    const clean = hex.replace('#', '')
    return [
      Number.parseInt(clean.slice(0, 2), 16),
      Number.parseInt(clean.slice(2, 4), 16),
      Number.parseInt(clean.slice(4, 6), 16),
    ]
  }

  const [r1, g1, b1] = parse(hexA)
  const [r2, g2, b2] = parse(hexB)
  return Math.sqrt(((r1 - r2) ** 2) + ((g1 - g2) ** 2) + ((b1 - b2) ** 2))
}

function isExtremeNoiseColor(hex?: string): boolean {
  if (!hex) return false
  const clean = hex.replace('#', '').toUpperCase()
  return clean === '00FF00' || clean === 'FFFF00'
}

function dedupeColorTokens(tokens: Array<ColorToken | undefined>, minDistance = 14): ColorToken[] {
  const result: ColorToken[] = []
  for (const token of tokens) {
    if (!token) continue
    if (isExtremeNoiseColor(token.hex)) continue
    const isDuplicate = result.some(existing => hexDistance(existing.hex, token.hex) < minDistance)
    if (isDuplicate) continue
    result.push(token)
  }
  return result
}

function normalizeSemanticColorSystem(colorSystem?: SemanticColorSystem): SemanticColorSystem | undefined {
  if (!colorSystem) return undefined

  const normalized: SemanticColorSystem = { ...colorSystem }

  const brightness = (hex?: string) => {
    if (!hex) return Number.NaN
    const clean = hex.replace('#', '')
    return Number.parseInt(clean.slice(0, 2), 16)
      + Number.parseInt(clean.slice(2, 4), 16)
      + Number.parseInt(clean.slice(4, 6), 16)
  }

  if (normalized.heroTextPrimary && normalized.textPrimary && hexDistance(normalized.heroTextPrimary.hex, normalized.textPrimary.hex) < 18) {
    normalized.heroTextPrimary = undefined
  }

  if (
    normalized.heroTextPrimary &&
    normalized.heroBackground &&
    (
      Math.abs(brightness(normalized.heroTextPrimary.hex) - brightness(normalized.heroBackground.hex)) < 160
      || hexDistance(normalized.heroTextPrimary.hex, normalized.heroBackground.hex) < 52
    )
  ) {
    normalized.heroTextPrimary = undefined
  }

  if (normalized.textSecondary && normalized.textPrimary && hexDistance(normalized.textSecondary.hex, normalized.textPrimary.hex) < 20) {
    normalized.textSecondary = undefined
  }

  if (normalized.textPrimary && normalized.border && hexDistance(normalized.border.hex, normalized.textPrimary.hex) < 18) {
    normalized.border = undefined
  }

  if (
    normalized.pageBackground &&
    normalized.border &&
    brightness(normalized.pageBackground.hex) >= 620 &&
    brightness(normalized.border.hex) <= 120
  ) {
    normalized.border = undefined
  }

  if (
    normalized.pageBackground &&
    normalized.surface &&
    brightness(normalized.pageBackground.hex) >= 620 &&
    brightness(normalized.surface.hex) <= 180
  ) {
    normalized.surface = undefined
  }

  if (normalized.heroSecondaryAction && normalized.heroPrimaryAction && hexDistance(normalized.heroSecondaryAction.hex, normalized.heroPrimaryAction.hex) < 22) {
    normalized.heroSecondaryAction = undefined
  }

  if (normalized.secondaryAction && normalized.primaryAction && hexDistance(normalized.secondaryAction.hex, normalized.primaryAction.hex) < 22) {
    normalized.secondaryAction = undefined
  }

  normalized.heroAccentColors = dedupeColorTokens(
    (normalized.heroAccentColors || []).filter(token =>
      hexDistance(token.hex, normalized.heroBackground?.hex) >= 20 &&
      hexDistance(token.hex, normalized.heroPrimaryAction?.hex) >= 20
    ),
    20
  ).slice(0, 2)

  normalized.contentColors = dedupeColorTokens(normalized.contentColors || [], 20).slice(0, 3)

  if (normalized.contentColors?.length) {
    normalized.contentColors = normalized.contentColors.filter(token =>
      !isExtremeNoiseColor(token.hex) &&
      hexDistance(token.hex, normalized.primaryAction?.hex) >= 16 &&
      hexDistance(token.hex, normalized.textPrimary?.hex) >= 16
    )
  }

  return normalized
}

function hydrateSemanticColorSystem(
  semanticColorSystem: SemanticColorSystem | undefined,
  aiColors: ColorToken[]
): SemanticColorSystem | undefined {
  if (!semanticColorSystem) return undefined

  const aiByHex = new Map(aiColors.map(color => [color.hex.toUpperCase(), color]))
  const hydrate = (color: ColorToken | undefined, role: ColorToken['role']): ColorToken | undefined => {
    if (!color) return undefined
    const hex = color.hex.toUpperCase()
    const matched = aiByHex.get(hex)
    return {
      role,
      hex,
      rgb: matched?.rgb || color.rgb || hexToRgb(hex),
      hsl: matched?.hsl || color.hsl || hexToHsl(hex),
      name: matched?.name || color.name || fallbackColorName(role),
      description: matched?.description || color.description || fallbackColorName(role),
      meta: matched?.meta || color.meta,
    }
  }

  return {
    heroBackground: hydrate(semanticColorSystem.heroBackground, inferRoleFromSemanticSlot('heroBackground')),
    heroTextPrimary: hydrate(semanticColorSystem.heroTextPrimary, inferRoleFromSemanticSlot('textPrimary')),
    heroPrimaryAction: hydrate(semanticColorSystem.heroPrimaryAction, inferRoleFromSemanticSlot('primaryAction')),
    heroSecondaryAction: hydrate(semanticColorSystem.heroSecondaryAction, inferRoleFromSemanticSlot('secondaryAction')),
    heroAccentColors: (semanticColorSystem.heroAccentColors || [])
      .map(color => hydrate(color, 'accent'))
      .filter((value): value is ColorToken => Boolean(value)),
    pageBackground: hydrate(semanticColorSystem.pageBackground, inferRoleFromSemanticSlot('pageBackground')),
    surface: hydrate(semanticColorSystem.surface, inferRoleFromSemanticSlot('surface')),
    textPrimary: hydrate(semanticColorSystem.textPrimary, inferRoleFromSemanticSlot('textPrimary')),
    textSecondary: hydrate(semanticColorSystem.textSecondary, inferRoleFromSemanticSlot('textSecondary')),
    border: hydrate(semanticColorSystem.border, inferRoleFromSemanticSlot('border')),
    primaryAction: hydrate(semanticColorSystem.primaryAction, inferRoleFromSemanticSlot('primaryAction')),
    secondaryAction: hydrate(semanticColorSystem.secondaryAction, inferRoleFromSemanticSlot('secondaryAction')),
    contentColors: (semanticColorSystem.contentColors || [])
      .map(color => hydrate(color, 'accent'))
      .filter((value): value is ColorToken => Boolean(value)),
  }
}

function selectAiFallbackColor(
  colors: ColorToken[],
  predicate: (color: ColorToken) => boolean,
  sort?: (a: ColorToken, b: ColorToken) => number
) {
  const filtered = colors.filter(predicate)
  if (!filtered.length) return undefined
  if (sort) filtered.sort(sort)
  return filtered[0]
}

export function deriveScreenshotShellFallback(
  pageAnalysis: PageStyleAnalysis,
  aiColors: ColorToken[]
): Partial<LayeredColorSystem> {
  const screenshotShell = (pageAnalysis.colorCandidates || [])
    .filter(candidate => candidate.property === 'screenshot-content')
    .map(candidate => ({
      ...candidate,
      brightness: parseInt(candidate.hex.slice(1, 3), 16) + parseInt(candidate.hex.slice(3, 5), 16) + parseInt(candidate.hex.slice(5, 7), 16),
      chroma: Math.max(
        parseInt(candidate.hex.slice(1, 3), 16),
        parseInt(candidate.hex.slice(3, 5), 16),
        parseInt(candidate.hex.slice(5, 7), 16)
      ) - Math.min(
        parseInt(candidate.hex.slice(1, 3), 16),
        parseInt(candidate.hex.slice(3, 5), 16),
        parseInt(candidate.hex.slice(5, 7), 16)
      )
    }))

  const lightNeutrals = screenshotShell
    .filter(candidate => candidate.brightness >= 600 && candidate.chroma <= 48)
    .sort((a, b) => b.brightness - a.brightness)

  const pureWhiteThreshold = 750
  const slightlyDarkerNeutral = lightNeutrals.find(candidate =>
    candidate.brightness < pureWhiteThreshold &&
    candidate.chroma <= 24
  )

  const pageBackgroundCandidate = slightlyDarkerNeutral || lightNeutrals[0]
  const surfaceCandidate = lightNeutrals.find(candidate => candidate.hex !== pageBackgroundCandidate?.hex)
    || (slightlyDarkerNeutral ? lightNeutrals[0] : undefined)

  const pageBackground = pageBackgroundCandidate
    ? {
        role: 'background' as const,
        hex: pageBackgroundCandidate.hex,
        rgb: hexToRgb(pageBackgroundCandidate.hex),
        hsl: hexToHsl(pageBackgroundCandidate.hex),
        name: 'Page Background',
        description: 'Recovered from screenshot shell region',
        meta: {
          source: pageBackgroundCandidate.meta?.source || 'screenshot-sampled',
          confidence: pageBackgroundCandidate.meta?.confidence || 'medium',
          evidenceCount: pageBackgroundCandidate.meta?.evidenceCount || pageBackgroundCandidate.count || 1,
          context: pageBackgroundCandidate.meta?.context || 'page shell background',
          viewport: pageBackgroundCandidate.meta?.viewport,
        },
      }
    : undefined

  const surface = surfaceCandidate
    ? {
        role: 'surface' as const,
        hex: surfaceCandidate.hex,
        rgb: hexToRgb(surfaceCandidate.hex),
        hsl: hexToHsl(surfaceCandidate.hex),
        name: 'Surface',
        description: 'Recovered from screenshot shell region',
        meta: {
          source: surfaceCandidate.meta?.source || 'screenshot-sampled',
          confidence: surfaceCandidate.meta?.confidence || 'medium',
          evidenceCount: surfaceCandidate.meta?.evidenceCount || surfaceCandidate.count || 1,
          context: surfaceCandidate.meta?.context || 'page shell surface',
          viewport: surfaceCandidate.meta?.viewport,
        },
      }
    : undefined

  const textPrimaryFallback = selectAiFallbackColor(
    aiColors,
    color => color.role === 'text',
    (a, b) => hexDistance(a.hex, '#000000') - hexDistance(b.hex, '#000000')
  )

  const textSecondaryFallback = selectAiFallbackColor(
    aiColors,
    color => color.role === 'text' && color.hex.toUpperCase() !== textPrimaryFallback?.hex.toUpperCase(),
    (a, b) => hexDistance(a.hex, '#666666') - hexDistance(b.hex, '#666666')
  )

  return {
    pageBackground,
    surface,
    textPrimary: textPrimaryFallback,
    textSecondary: textSecondaryFallback,
  }
}

export function deriveDomShellFallback(
  pageAnalysis: PageStyleAnalysis
): Partial<LayeredColorSystem> {
  const anchorBoost = (candidate: PageColorCandidate) => {
    const hint = (candidate.selectorHint || '').toLowerCase()
    if (hint.includes('[anchor:body]')) return 4
    if (hint.includes('[anchor:main]')) return 3
    if (hint.includes('[anchor:nav]')) return 2
    return 0
  }

  const domShell = (pageAnalysis.colorCandidates || [])
    .filter(candidate =>
      candidate.meta?.source === 'dom-computed' &&
      !candidate.layerHints?.includes('hero')
    )
    .map(candidate => {
      const clean = candidate.hex.replace('#', '')
      const r = Number.parseInt(clean.slice(0, 2), 16)
      const g = Number.parseInt(clean.slice(2, 4), 16)
      const b = Number.parseInt(clean.slice(4, 6), 16)
      const brightness = r + g + b
      const chroma = Math.max(r, g, b) - Math.min(r, g, b)
      return { candidate, brightness, chroma }
    })

  const shellBackgrounds = domShell
    .filter(item =>
      item.candidate.roleHints?.includes('background') &&
      !item.candidate.roleHints?.includes('text') &&
      !item.candidate.roleHints?.includes('border') &&
      !item.candidate.roleHints?.includes('accent') &&
      item.brightness >= 600 &&
      item.chroma <= 40
    )
    .sort((a, b) => {
      const anchorDiff = anchorBoost(b.candidate) - anchorBoost(a.candidate)
      if (anchorDiff !== 0) return anchorDiff

      const aScore = (b.candidate.evidenceScore || b.candidate.count) - (a.candidate.evidenceScore || a.candidate.count)
      if (aScore !== 0) return aScore
      return a.brightness - b.brightness
    })

  const shellSurfaces = domShell
    .filter(item =>
      (item.candidate.roleHints?.includes('surface') || item.candidate.roleHints?.includes('background')) &&
      !item.candidate.roleHints?.includes('text') &&
      !item.candidate.roleHints?.includes('border') &&
      item.brightness >= 560 &&
      item.chroma <= 56
    )
    .sort((a, b) => {
      const anchorDiff = anchorBoost(b.candidate) - anchorBoost(a.candidate)
      if (anchorDiff !== 0) return anchorDiff

      const scoreDiff = (b.candidate.evidenceScore || b.candidate.count) - (a.candidate.evidenceScore || a.candidate.count)
      if (scoreDiff !== 0) return scoreDiff
      return b.brightness - a.brightness
    })

  const shellText = domShell
    .filter(item =>
      item.candidate.roleHints?.includes('text') &&
      !item.candidate.roleHints?.includes('background') &&
      item.brightness <= 260 &&
      item.chroma <= 56
    )
    .sort((a, b) => {
      const anchorDiff = anchorBoost(b.candidate) - anchorBoost(a.candidate)
      if (anchorDiff !== 0) return anchorDiff

      const scoreDiff = (b.candidate.evidenceScore || b.candidate.count) - (a.candidate.evidenceScore || a.candidate.count)
      if (scoreDiff !== 0) return scoreDiff
      return a.brightness - b.brightness
    })

  const shellBorders = domShell
    .filter(item =>
      (item.candidate.property === 'border-color' || item.candidate.roleHints?.includes('border')) &&
      item.brightness > 40
    )
    .sort((a, b) => {
      const anchorDiff = anchorBoost(b.candidate) - anchorBoost(a.candidate)
      if (anchorDiff !== 0) return anchorDiff
      const scoreDiff = (b.candidate.evidenceScore || b.candidate.count) - (a.candidate.evidenceScore || a.candidate.count)
      if (scoreDiff !== 0) return scoreDiff
      return a.brightness - b.brightness
    })

  const pageBackgroundItem = shellBackgrounds[0]
  const surfaceItem = shellSurfaces.find(item => item.candidate.hex !== pageBackgroundItem?.candidate.hex)
  const textPrimaryItem = shellText[0]
  const textSecondaryItem = shellText.find(item => item.candidate.hex !== textPrimaryItem?.candidate.hex)
  const borderItem = shellBorders.find(item => {
    if (!pageBackgroundItem) return true
    if (pageBackgroundItem.brightness >= 600 && item.brightness <= 32) return false
    const delta = Math.abs(item.brightness - pageBackgroundItem.brightness)
    return delta >= 8 && delta <= 90
  })

  return {
    pageBackground: pageBackgroundItem
      ? {
          role: 'background',
          hex: pageBackgroundItem.candidate.hex,
          rgb: hexToRgb(pageBackgroundItem.candidate.hex),
          hsl: hexToHsl(pageBackgroundItem.candidate.hex),
          name: 'Page Background',
          description: 'Recovered from DOM shell candidates',
          meta: {
            source: pageBackgroundItem.candidate.meta?.source || 'dom-computed',
            confidence: pageBackgroundItem.candidate.meta?.confidence || 'medium',
            evidenceCount: pageBackgroundItem.candidate.meta?.evidenceCount || pageBackgroundItem.candidate.count || 1,
            context: 'page shell background',
            viewport: pageBackgroundItem.candidate.meta?.viewport,
          },
        }
      : undefined,
    surface: surfaceItem
      ? {
          role: 'surface',
          hex: surfaceItem.candidate.hex,
          rgb: hexToRgb(surfaceItem.candidate.hex),
          hsl: hexToHsl(surfaceItem.candidate.hex),
          name: 'Surface',
          description: 'Recovered from DOM shell candidates',
          meta: {
            source: surfaceItem.candidate.meta?.source || 'dom-computed',
            confidence: surfaceItem.candidate.meta?.confidence || 'medium',
            evidenceCount: surfaceItem.candidate.meta?.evidenceCount || surfaceItem.candidate.count || 1,
            context: 'page shell surface',
            viewport: surfaceItem.candidate.meta?.viewport,
          },
        }
      : undefined,
    textPrimary: textPrimaryItem
      ? {
          role: 'text',
          hex: textPrimaryItem.candidate.hex,
          rgb: hexToRgb(textPrimaryItem.candidate.hex),
          hsl: hexToHsl(textPrimaryItem.candidate.hex),
          name: 'Text Primary',
          description: 'Recovered from DOM shell candidates',
          meta: {
            source: textPrimaryItem.candidate.meta?.source || 'dom-computed',
            confidence: textPrimaryItem.candidate.meta?.confidence || 'medium',
            evidenceCount: textPrimaryItem.candidate.meta?.evidenceCount || textPrimaryItem.candidate.count || 1,
            context: 'primary text',
            viewport: textPrimaryItem.candidate.meta?.viewport,
          },
        }
      : undefined,
    textSecondary: textSecondaryItem
      ? {
          role: 'text',
          hex: textSecondaryItem.candidate.hex,
          rgb: hexToRgb(textSecondaryItem.candidate.hex),
          hsl: hexToHsl(textSecondaryItem.candidate.hex),
          name: 'Text Secondary',
          description: 'Recovered from DOM shell candidates',
          meta: {
            source: textSecondaryItem.candidate.meta?.source || 'dom-computed',
            confidence: textSecondaryItem.candidate.meta?.confidence || 'low',
            evidenceCount: textSecondaryItem.candidate.meta?.evidenceCount || textSecondaryItem.candidate.count || 1,
            context: 'secondary text',
            viewport: textSecondaryItem.candidate.meta?.viewport,
          },
        }
      : undefined,
    border: borderItem
      ? {
          role: 'border',
          hex: borderItem.candidate.hex,
          rgb: hexToRgb(borderItem.candidate.hex),
          hsl: hexToHsl(borderItem.candidate.hex),
          name: 'Border',
          description: 'Recovered from DOM shell candidates',
          meta: {
            source: borderItem.candidate.meta?.source || 'dom-computed',
            confidence: borderItem.candidate.meta?.confidence || 'medium',
            evidenceCount: borderItem.candidate.meta?.evidenceCount || borderItem.candidate.count || 1,
            context: 'border color',
            viewport: borderItem.candidate.meta?.viewport,
          },
        }
      : undefined,
  }
}

export function deriveAiShellFallback(colors: ColorToken[]): Partial<LayeredColorSystem> {
  const withMetrics = colors
    .filter(color => !isExtremeNoiseColor(color.hex))
    .map(color => {
      const clean = color.hex.replace('#', '')
      const r = Number.parseInt(clean.slice(0, 2), 16)
      const g = Number.parseInt(clean.slice(2, 4), 16)
      const b = Number.parseInt(clean.slice(4, 6), 16)
      const brightness = r + g + b
      const chroma = Math.max(r, g, b) - Math.min(r, g, b)
      return { color, brightness, chroma }
    })

  const lightNeutrals = withMetrics
    .filter(item => item.brightness >= 600 && item.chroma <= 48)
    .sort((a, b) => a.brightness - b.brightness)

  const pageBackgroundItem = lightNeutrals.find(item => item.brightness < 750) || lightNeutrals[0]
  const surfaceItem = lightNeutrals.find(item => item.color.hex !== pageBackgroundItem?.color.hex) || lightNeutrals.at(-1)

  const darkNeutrals = withMetrics
    .filter(item => item.brightness <= 220 && item.chroma <= 40)
    .sort((a, b) => a.brightness - b.brightness)

  const textPrimaryItem = darkNeutrals[0]
  const textSecondaryItem = darkNeutrals.find(item =>
    item.color.hex !== textPrimaryItem?.color.hex &&
    item.brightness >= (textPrimaryItem?.brightness || 0) + 18
  )

  return {
    pageBackground: pageBackgroundItem?.color
      ? {
          ...pageBackgroundItem.color,
          role: 'background',
          name: 'Page Background',
          meta: {
            source: pageBackgroundItem.color.meta?.source || 'inferred',
            confidence: pageBackgroundItem.color.meta?.confidence || 'medium',
            evidenceCount: pageBackgroundItem.color.meta?.evidenceCount || 1,
            context: pageBackgroundItem.color.meta?.context || 'page shell background',
            viewport: pageBackgroundItem.color.meta?.viewport,
          },
        }
      : undefined,
    surface: surfaceItem?.color
      ? {
          ...surfaceItem.color,
          role: 'surface',
          name: 'Surface',
          meta: {
            source: surfaceItem.color.meta?.source || 'inferred',
            confidence: surfaceItem.color.meta?.confidence || 'medium',
            evidenceCount: surfaceItem.color.meta?.evidenceCount || 1,
            context: surfaceItem.color.meta?.context || 'page shell surface',
            viewport: surfaceItem.color.meta?.viewport,
          },
        }
      : undefined,
    textPrimary: textPrimaryItem?.color
      ? {
          ...textPrimaryItem.color,
          role: 'text',
          name: 'Text Primary',
          meta: {
            source: textPrimaryItem.color.meta?.source || 'inferred',
            confidence: textPrimaryItem.color.meta?.confidence || 'medium',
            evidenceCount: textPrimaryItem.color.meta?.evidenceCount || 1,
            context: textPrimaryItem.color.meta?.context || 'text color',
            viewport: textPrimaryItem.color.meta?.viewport,
          },
        }
      : undefined,
    textSecondary: textSecondaryItem?.color
      ? {
          ...textSecondaryItem.color,
          role: 'text',
          name: 'Text Secondary',
          meta: {
            source: textSecondaryItem.color.meta?.source || 'inferred',
            confidence: textSecondaryItem.color.meta?.confidence || 'low',
            evidenceCount: textSecondaryItem.color.meta?.evidenceCount || 1,
            context: textSecondaryItem.color.meta?.context || 'secondary text color',
            viewport: textSecondaryItem.color.meta?.viewport,
          },
        }
      : undefined,
  }
}

export function recoverShellSemanticSlots(pageAnalysis: PageStyleAnalysis): PageStyleAnalysis {
  const fallback = deriveScreenshotShellFallback(pageAnalysis, [])
  if (!fallback.pageBackground && !fallback.surface) return pageAnalysis

  return {
    ...pageAnalysis,
    semanticColorSystem: {
      ...(pageAnalysis.semanticColorSystem || {}),
      pageBackground: pageAnalysis.semanticColorSystem?.pageBackground || fallback.pageBackground,
      surface: pageAnalysis.semanticColorSystem?.surface || fallback.surface,
    }
  }
}

function summarizeSpacing(pageAnalysis: PageStyleAnalysis, fallback?: string) {
  if (!pageAnalysis.spacingTokens.length) return fallback || 'Measured spacing not available'
  const top = pageAnalysis.spacingTokens.slice(0, 4).map(token => token.value).join(' | ')
  return `Measured spacing scale: ${top}`
}

function summarizeLayout(pageAnalysis: PageStyleAnalysis, fallback?: string) {
  if (!pageAnalysis.layoutEvidence.length) return fallback || 'Measured layout not available'
  return pageAnalysis.layoutEvidence.slice(0, 3).map(item => item.label).join(' | ')
}

function hasNumericTypographyValue(value?: string) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized.includes('nan') || normalized === 'unknown') return false
  return /\d/.test(normalized)
}

function pickMeasuredTypography(pageAnalysis: PageStyleAnalysis, aiTypography: Typography): Typography {
  const tokens = pageAnalysis.typographyTokens.filter(token => hasNumericTypographyValue(token.fontSize))
  const candidates = pageAnalysis.typographyCandidates.filter(candidate => hasNumericTypographyValue(candidate.fontSize))
  const sourceTypography = tokens.length
    ? tokens.map(token => ({
        fontFamily: token.fontFamily,
        fontSize: token.fontSize,
        fontWeight: token.fontWeight,
        lineHeight: token.lineHeight,
        letterSpacing: token.letterSpacing,
      }))
    : candidates

  if (!sourceTypography.length) return aiTypography

  const distinctFamilies = [...new Set(sourceTypography.map(token => token.fontFamily).filter(Boolean))]
  const primaryFamily = distinctFamilies.slice(0, 3).join(', ') || aiTypography.fontFamily

  const numericWeights = sourceTypography
    .map(token => Number(token.fontWeight))
    .filter(weight => Number.isFinite(weight))

  const numericSizes = sourceTypography
    .map(token => Number.parseFloat(token.fontSize || ''))
    .filter(size => Number.isFinite(size))
    .sort((a, b) => b - a)

  const lineHeight =
    sourceTypography.find(token => hasNumericTypographyValue(token.lineHeight))?.lineHeight ||
    aiTypography.lineHeight
  const letterSpacing =
    sourceTypography.find(token => token.letterSpacing && token.letterSpacing !== 'normal')?.letterSpacing ||
    sourceTypography.find(token => token.letterSpacing)?.letterSpacing ||
    aiTypography.letterSpacing

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
  // For URL reports: DOM-measured page sections override AI-inferred ones
  const pageSections = (pageAnalysis.pageSections && pageAnalysis.pageSections.length > 0)
    ? pageAnalysis.pageSections
    : aiDetails.pageSections

  return {
    ...aiDetails,
    borderRadius: pageAnalysis.radiusTokens.length
      ? `Measured radius variants: ${pageAnalysis.radiusTokens.slice(0, 4).map(token => token.value).join(' | ')}`
      : aiDetails.borderRadius,
    shadowStyle: pageAnalysis.shadowTokens.length
      ? `Measured shadow variants: ${pageAnalysis.shadowTokens.slice(0, 3).map(token => token.value).join(' | ')}`
      : aiDetails.shadowStyle,
    spacingSystem: summarizeSpacing(pageAnalysis, aiDetails.spacingSystem),
    layoutStructure: summarizeLayout(pageAnalysis, aiDetails.layoutStructure),
    cssRadius: pageAnalysis.radiusTokens.length
      ? pageAnalysis.radiusTokens.slice(0, 5).map(token => token.value).join(' | ')
      : aiDetails.cssRadius,
    cssShadow: pageAnalysis.shadowTokens.length
      ? pageAnalysis.shadowTokens.slice(0, 4).map(token => token.value).join(' | ')
      : aiDetails.cssShadow,
    layoutEn: pageAnalysis.layoutEvidence.length ? pageAnalysis.layoutEvidence.slice(0, 3).map(item => item.label).join(' | ') : aiDetails.layoutEn,
    spacingEn: pageAnalysis.spacingTokens.length ? pageAnalysis.spacingTokens.slice(0, 4).map(token => token.value).join(' | ') : aiDetails.spacingEn,
    pageSections,
    // Always preserve AI-generated visual/interaction style (no DOM equivalent)
    visualStyle: aiDetails.visualStyle,
    interactionStyle: aiDetails.interactionStyle,
  }
}

export function applyMeasuredUrlSignals(
  parsed: Omit<StyleReport, 'id' | 'sourceType' | 'sourceLabel' | 'thumbnailUrl' | 'createdAt'>,
  pageAnalysis?: PageStyleAnalysis
) {
  if (!pageAnalysis) return parsed

  const hydratedColorSystem = normalizeSemanticColorSystem(
    hydrateSemanticColorSystem(pageAnalysis.semanticColorSystem, parsed.colors || [])
  )
  const domShellFallback = deriveDomShellFallback(pageAnalysis)
  const screenshotShellFallback = deriveScreenshotShellFallback(pageAnalysis, parsed.colors || [])
  const aiShellFallback = deriveAiShellFallback(parsed.colors || [])
  const colorSystem = normalizeSemanticColorSystem({
    ...hydratedColorSystem,
    pageBackground: hydratedColorSystem?.pageBackground || domShellFallback.pageBackground || screenshotShellFallback.pageBackground || aiShellFallback.pageBackground,
    surface: hydratedColorSystem?.surface || domShellFallback.surface || screenshotShellFallback.surface || aiShellFallback.surface,
    textPrimary: hydratedColorSystem?.textPrimary || domShellFallback.textPrimary || screenshotShellFallback.textPrimary || aiShellFallback.textPrimary,
    textSecondary: hydratedColorSystem?.textSecondary || domShellFallback.textSecondary || screenshotShellFallback.textSecondary || aiShellFallback.textSecondary,
    border: hydratedColorSystem?.border || domShellFallback.border,
  })
  const compatibilityColors = colorSystem
    ? dedupeColorTokens([
        colorSystem.heroBackground,
        colorSystem.heroTextPrimary,
        colorSystem.heroPrimaryAction,
        colorSystem.heroSecondaryAction,
        colorSystem.pageBackground,
        colorSystem.surface,
        colorSystem.textPrimary,
        colorSystem.textSecondary,
        colorSystem.border,
        colorSystem.primaryAction,
        colorSystem.secondaryAction,
      ], 18)
    : parsed.colors

  debugSelectedPalette(compatibilityColors)

  const hasMeasuredTypography =
    pageAnalysis.typographyTokens.some(token => hasNumericTypographyValue(token.fontSize)) ||
    pageAnalysis.typographyCandidates.some(candidate => hasNumericTypographyValue(candidate.fontSize))

  return {
    ...parsed,
    colors: colorSystem ? compatibilityColors : parsed.colors,
    colorSystem,
    typography: hasMeasuredTypography ? pickMeasuredTypography(pageAnalysis, parsed.typography) : parsed.typography,
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

  const requestWithAnalysis = await enhancePageAnalysisWithScreenshotSignals(req, base64Data)

  if (requestWithAnalysis.extractedCss) {
    console.log(`[aiExtract] Adding CSS context (${requestWithAnalysis.extractedCss.length} bytes)`)
  }
  if (requestWithAnalysis.pageAnalysis) {
    console.log('[aiExtract] Adding measured page analysis context')
  }
  const promptText = buildAiExtractionPrompt(requestWithAnalysis)

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
    writeUrlDebugSnapshot('url-final-report', {
      sourceLabel: req.sourceLabel,
      inputPageAnalysis: req.pageAnalysis,
      finalColorSystem: parsed.colorSystem,
      finalColors: parsed.colors,
    })
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
    colorSystem: parsed.colorSystem,
    gradients: parsed.gradients || [],
    typography: parsed.typography,
    designDetails: parsed.designDetails,
    createdAt: new Date().toISOString(),
  }
}
