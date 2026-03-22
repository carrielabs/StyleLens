import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ExtractRequest, StyleReport } from '@/lib/types'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetchNode from 'node-fetch'

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

Be highly specific with color values (exact HEX codes). For colors you cannot determine exactly, make an educated approximation. Always extract at least 6-8 colors. Classify each color by its role in the design.`

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
- Extract at minimum 6 colors, maximum 12
- Provide accurate dual-language translations
- layoutEn, layoutZh, spacingEn, spacingZh, motionEn, motionZh: If multiple patterns are detected (e.g. Bento + Flex), return them separated by '|'. (e.g. 'Bento Grid | Sidebar Layout'). KEEP THEM ULTRA-SHORT BADGES.
- cssRadius and cssShadow MUST be exact valid CSS values only. extracted all unique variations found on the page, separated by '|'.
- If no gradients detected, return empty array []`

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

  let promptText = USER_PROMPT_TEMPLATE
  if (req.extractedCss) {
    console.log(`[aiExtract] Adding CSS context (${req.extractedCss.length} bytes)`)
    promptText += `\n\nAdditional context — extracted CSS from the page:\n\`\`\`css\n${req.extractedCss.slice(0, 3000)}\n\`\`\``
  }

  let lastError = null
  
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
      
      return parseAndFormatResponse(rawText, req, mimeType, base64Data)
    } catch (err: any) {
      lastError = err
      const isQuotaError = err.message?.includes('429') || err.message?.toLowerCase().includes('quota')
      console.warn(`Gemini Key ${i + 1} failed:`, err.message)
      
      if (i < geminiKeys.length - 1) {
        console.log('Switching to backup Gemini key...')
        continue // Try next key
      }
    }
  }

  // If we reach here, all Gemini keys failed
  throw new Error(`[All Gemini Keys Failed] Last error: ${lastError?.message || 'Unknown error'}`)
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

  return {
    sourceType: req.sourceType,
    sourceLabel: req.sourceLabel,
    thumbnailUrl: req.screenshotUrl || (base64Data ? `data:${mimeType};base64,${base64Data}` : undefined),
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
