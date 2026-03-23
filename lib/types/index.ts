// ─── Style Extract Result ────────────────────────────────────────────────────

export interface ColorToken {
  role: 'background' | 'surface' | 'primary' | 'secondary' | 'accent' | 'text' | 'border' | 'other'
  hex: string
  rgb: string
  hsl: string
  name: string
  description: string
}

export interface SemanticColorSystem {
  heroBackground?: ColorToken
  pageBackground?: ColorToken
  surface?: ColorToken
  textPrimary?: ColorToken
  textSecondary?: ColorToken
  border?: ColorToken
  primaryAction?: ColorToken
  secondaryAction?: ColorToken
  contentColors?: ColorToken[]
}

export type LayeredColorSystem = SemanticColorSystem

export type ComponentKind =
  | 'hero'
  | 'nav'
  | 'button'
  | 'card'
  | 'section'
  | 'input'
  | 'link'
  | 'text'
  | 'surface'

export interface TypographyToken {
  id: string
  label: string
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  usage: 'display' | 'heading' | 'title' | 'body' | 'label' | 'caption'
  sampleText?: string
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
}

export interface RadiusToken {
  value: string
  label: string
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
}

export interface ShadowToken {
  value: string
  label: string
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
}

export interface SpacingToken {
  value: string
  label: string
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
}

export interface LayoutEvidence {
  label: string
  kind: 'hero' | 'grid' | 'flex' | 'navigation' | 'form' | 'section' | 'multi-column' | 'sticky' | 'stack'
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
}

export type InteractionState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'selected'

export interface StateTokenValue {
  value: string
  property: 'color' | 'background-color' | 'border-color' | 'box-shadow' | 'opacity' | 'transform'
  state: InteractionState
  componentKinds: ComponentKind[]
  evidenceScore: number
  measured: boolean
}

export interface ComponentStateTokens {
  button?: StateTokenValue[]
  link?: StateTokenValue[]
  input?: StateTokenValue[]
  card?: StateTokenValue[]
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

export interface PageColorCandidate {
  hex: string
  property: string
  selectorHint?: string
  count: number
  roleHints: string[]
  layerHints: Array<'global' | 'hero' | 'content'>
  componentKinds?: ComponentKind[]
  areaWeight?: number
  viewportWeight?: number
  repetitionWeight?: number
  evidenceScore?: number
}

export interface PageTypographyCandidate {
  fontFamily: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  letterSpacing?: string
  count: number
  componentKinds?: ComponentKind[]
  sampleText?: string
  evidenceScore?: number
}

export interface PageStyleAnalysis {
  colorCandidates: PageColorCandidate[]
  semanticColorSystem?: SemanticColorSystem
  typographyCandidates: PageTypographyCandidate[]
  typographyTokens: TypographyToken[]
  radiusCandidates: string[]
  radiusTokens: RadiusToken[]
  shadowCandidates: string[]
  shadowTokens: ShadowToken[]
  spacingCandidates: string[]
  spacingTokens: SpacingToken[]
  layoutHints: string[]
  layoutEvidence: LayoutEvidence[]
  stateTokens?: ComponentStateTokens
  cssTextExcerpt?: string
  sourceCount: {
    inlineStyleBlocks: number
    linkedStylesheets: number
  }
}

export interface StyleReport {
  id?: string
  sourceType: 'image' | 'url'
  sourceLabel: string
  thumbnailUrl?: string
  pageAnalysis?: PageStyleAnalysis
  colorSystem?: LayeredColorSystem
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
  pageAnalysis?: PageStyleAnalysis
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
  pageAnalysis?: PageStyleAnalysis
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
