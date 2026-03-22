// ─── Style Extract Result ────────────────────────────────────────────────────

export interface ColorToken {
  role: 'background' | 'surface' | 'primary' | 'secondary' | 'accent' | 'text' | 'border' | 'other'
  hex: string
  rgb: string
  hsl: string
  name: string
  description: string
}

export interface Gradient {
  css: string
  description: string
}

export interface Typography {
  fontFamily: string
  confidence: 'identified' | 'inferred'
  headingWeight: number
  bodyWeight: number
  fontSizeScale: string
  lineHeight: string
  letterSpacing: string
  alignment: 'left' | 'center' | 'justify'
  textTreatment: 'solid' | 'gradient' | 'translucent'
  googleFontsAlt?: string
}

export interface DesignDetails {
  overallStyle: string
  colorMode: 'dark' | 'light' | 'system'
  borderRadius: string
  shadowStyle: string
  spacingSystem: string
  borderStyle: string
  animationTendency: string
  imageHandling: string
  layoutStructure: string
  // Exact CSS values
  cssRadius?: string 
  cssShadow?: string 
  // Ultra-short bilingual tags replacing paragraphs
  layoutEn?: string
  layoutZh?: string
  spacingEn?: string
  spacingZh?: string
  motionEn?: string
  motionZh?: string
}

export interface StyleReport {
  id?: string
  sourceType: 'image' | 'url'
  sourceLabel: string
  thumbnailUrl?: string
  summary: string
  summaryEn?: string
  summaryZh?: string
  tags: string[]
  tagsEn?: string[]
  tagsZh?: string[]
  colors: ColorToken[]
  gradients: Gradient[]
  typography: Typography
  designDetails: DesignDetails
  createdAt: string
}

// ─── Home View Models ────────────────────────────────────────────────────────

export type PinnedStyleReport = StyleReport & {
  __pinned?: boolean
}

export type DisplayStyleReport = StyleReport & {
  screenshotUrl?: string
}

export interface HomeHistoryRecord {
  id: string
  user_id: string | null
  source_label: string
  style_data: PinnedStyleReport
  thumbnail_url: string | null
  created_at: string
}

export interface HomeUndoItem {
  id: string
  label: string
  record: HomeHistoryRecord
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface ExtractRequest {
  imageBase64?: string
  imageUrl?: string
  screenshotUrl?: string
  extractedCss?: string
  sourceType: 'image' | 'url'
  sourceLabel: string
}

export interface ExtractResponse {
  success: boolean
  report?: StyleReport
  error?: string
}

export interface ScreenshotRequest {
  url: string
}

export interface ScreenshotResponse {
  success: boolean
  screenshotUrl?: string
  extractedCss?: string
  error?: string
}

// ─── Library ──────────────────────────────────────────────────────────────────

export interface LibraryRecord {
  id: string
  user_id: string
  source_type: 'image' | 'url'
  source_label: string
  thumbnail_url: string | null
  style_data: StyleReport
  tags: string[]
  created_at: string
}

export type SortOrder = 'newest' | 'oldest'
