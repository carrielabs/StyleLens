import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ExtractRequest, StyleReport } from '@/lib/types'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetchNode from 'node-fetch'

// We patch globalThis.fetch specifically for Gemini, as the SDK removed clean proxy overrides.
const setupProxy = () => {
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY
  if (!proxyUrl) return

  if (!(globalThis as any).__gemini_fetch_patched__) {
    console.log('Patching global fetch for Gemini API to use proxy:', proxyUrl)
    const agent = new HttpsProxyAgent(proxyUrl)
    const originalFetch = globalThis.fetch
    
    globalThis.fetch = async (url, init) => {
      // Intercept only Google Generative AI requests
      if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com')) {
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
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch screenshot from URL (Status: ${response.status})`)
  }
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  
  return {
    data: base64,
    mediaType: contentType as 'image/jpeg' | 'image/png' | 'image/webp'
  }
}

const SYSTEM_PROMPT = `You are an expert visual design analyst. Your job is to analyze images and extract comprehensive, precise visual style information. Always respond with valid JSON only — no markdown, no extra text.

Be highly specific with color values (exact HEX codes). For colors you cannot determine exactly, make an educated approximation. Always extract at least 6-8 colors. Classify each color by its role in the design.`

const USER_PROMPT_TEMPLATE = `Analyze this design and return a complete style report as JSON with this exact structure:

{
  "summary": "One sentence describing the overall visual style in Chinese",
  "summaryEn": "Same summary translated perfectly to English",
  "summaryZh": "Same summary in Chinese",
  "tags": ["tag1", "tag2", "tag3"],
  "tagsEn": ["Minimalist", "Dark Mode", "Editorial"],
  "tagsZh": ["极简主义", "深色模式", "杂志排版"],
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
    "lineHeight": "Estimated line-height value",
    "letterSpacing": "Estimated letter-spacing",
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
- layoutEn, layoutZh, spacingEn, spacingZh, motionEn, motionZh MUST be extremely short UI badges (2-4 words max). Do NOT write paragraphs for these.
- cssRadius and cssShadow MUST be exact valid CSS values only (e.g. '0px', '12px', '0 2px 4px rgba(...)'). Do not output text descriptions in these exact CSS fields.
- If no gradients detected, return empty array []`

export async function extractStyleWithAI(req: ExtractRequest): Promise<StyleReport> {
  const apiKey = process.env.STYLELENS_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured in environment variables.')
  }

  let base64Data = ''
  let mimeType = ''

  if (req.imageBase64) {
    base64Data = req.imageBase64
    mimeType = req.imageBase64.startsWith('/9j/') || req.imageBase64.includes('jpeg')
      ? 'image/jpeg'
      : req.imageBase64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg'
  } else if (req.screenshotUrl) {
    const { data, mediaType } = await fetchImageAsBase64(req.screenshotUrl)
    base64Data = data
    mimeType = mediaType
  }

  let promptText = USER_PROMPT_TEMPLATE
  if (req.extractedCss) {
    promptText += `\n\nAdditional context — extracted CSS from the page:\n\`\`\`css\n${req.extractedCss.slice(0, 3000)}\n\`\`\``
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  
  // Use gemini-2.5-flash as it is highly capable and heavily supported on the free tier
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

  // Format array payload for Gemini multimodal model
  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  }

  const parts = [promptText, imagePart]

  try {
    const result = await model.generateContent(parts)
    const response = await result.response
    const rawText = response.text().trim()

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
      thumbnailUrl: req.screenshotUrl || (req.imageBase64 ? `data:${mimeType};base64,${req.imageBase64}` : undefined),
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
  } catch (error: any) {
    console.error('Gemini extraction failed:', error)
    throw new Error(`Extraction failed: ${error.message || 'Unknown error'}`)
  }
}
