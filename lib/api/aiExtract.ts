import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ColorToken, ExtractRequest, PageColorCandidate, PageStyleAnalysis, SemanticColorSystem, StyleReport, Typography, DesignDetails } from '@/lib/types'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetchNode from 'node-fetch'
import sharp from 'sharp'
import { mergeScreenshotColorSignals } from '@/lib/api/heroVisualAnalyzer'

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

  const typography = pageAnalysis.typographyTokens
    .map(token => `${token.label} | family=${token.fontFamily} | size=${token.fontSize} | weight=${token.fontWeight} | lineHeight=${token.lineHeight} | letterSpacing=${token.letterSpacing} | score=${token.evidenceScore}`)
    .join('\n')

  const semanticSlots = pageAnalysis.semanticColorSystem
    ? Object.entries(pageAnalysis.semanticColorSystem)
        .filter(([, value]) => value && !Array.isArray(value))
        .map(([slot, value]) => `${slot}=${(value as ColorToken).hex}`)
        .join(' | ')
    : 'none'

  return `

Measured page style signals (prefer these over screenshot-only guesses):
- Semantic color slots: ${semanticSlots}
- Color candidates:
${colors || 'none'}
- Typography tokens:
${typography || 'none'}
- Radius tokens: ${pageAnalysis.radiusTokens.map(token => token.value).join(' | ') || 'none'}
- Shadow tokens: ${pageAnalysis.shadowTokens.map(token => token.value).join(' | ') || 'none'}
- Spacing tokens: ${pageAnalysis.spacingTokens.map(token => token.value).join(' | ') || 'none'}
- Layout evidence: ${pageAnalysis.layoutEvidence.map(item => item.label).join(' | ') || 'none'}
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

function hydrateSemanticColorSystem(
  semanticColorSystem: SemanticColorSystem | undefined,
  aiColors: ColorToken[]
): SemanticColorSystem | undefined {
  if (!semanticColorSystem) return undefined

  const aiByHex = new Map(aiColors.map(color => [color.hex.toUpperCase(), color]))
  const hydrate = (color: ColorToken | undefined, role: ColorToken['role']) => {
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

function summarizeSpacing(pageAnalysis: PageStyleAnalysis, fallback?: string) {
  if (!pageAnalysis.spacingTokens.length) return fallback || 'Measured spacing not available'
  const top = pageAnalysis.spacingTokens.slice(0, 4).map(token => token.value).join(' | ')
  return `Measured spacing scale: ${top}`
}

function summarizeLayout(pageAnalysis: PageStyleAnalysis, fallback?: string) {
  if (!pageAnalysis.layoutEvidence.length) return fallback || 'Measured layout not available'
  return pageAnalysis.layoutEvidence.slice(0, 3).map(item => item.label).join(' | ')
}

function pickMeasuredTypography(pageAnalysis: PageStyleAnalysis, aiTypography: Typography): Typography {
  if (!pageAnalysis.typographyTokens.length) return aiTypography

  const tokens = pageAnalysis.typographyTokens
  const distinctFamilies = [...new Set(tokens.map(token => token.fontFamily).filter(Boolean))]
  const primaryFamily = distinctFamilies.slice(0, 3).join(', ') || aiTypography.fontFamily

  const numericWeights = tokens
    .map(token => Number(token.fontWeight))
    .filter(weight => Number.isFinite(weight))

  const numericSizes = tokens
    .map(token => Number.parseFloat(token.fontSize || ''))
    .filter(size => Number.isFinite(size))
    .sort((a, b) => b - a)

  const lineHeight = tokens.find(token => token.lineHeight)?.lineHeight || aiTypography.lineHeight
  const letterSpacing = tokens.find(token => token.letterSpacing)?.letterSpacing || aiTypography.letterSpacing

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
  }
}

function applyMeasuredUrlSignals(
  parsed: Omit<StyleReport, 'id' | 'sourceType' | 'sourceLabel' | 'thumbnailUrl' | 'createdAt'>,
  pageAnalysis?: PageStyleAnalysis
) {
  if (!pageAnalysis) return parsed

  const colorSystem = hydrateSemanticColorSystem(pageAnalysis.semanticColorSystem, parsed.colors || [])
  const compatibilityColors = colorSystem
    ? [
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
      ].filter(Boolean) as ColorToken[]
    : parsed.colors

  debugSelectedPalette(compatibilityColors)

  return {
    ...parsed,
    colors: colorSystem ? compatibilityColors : parsed.colors,
    colorSystem,
    typography: pageAnalysis.typographyTokens.length ? pickMeasuredTypography(pageAnalysis, parsed.typography) : parsed.typography,
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
    colorSystem: parsed.colorSystem,
    gradients: parsed.gradients || [],
    typography: parsed.typography,
    designDetails: parsed.designDetails,
    createdAt: new Date().toISOString(),
  }
}
