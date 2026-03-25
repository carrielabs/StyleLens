// ─── Style Extract Result ────────────────────────────────────────────────────

export type EvidenceSource =
  | 'dom-computed'
  | 'screenshot-sampled'
  | 'inferred'

export type EvidenceConfidence =
  | 'high'
  | 'medium'
  | 'low'

export interface TokenMeta {
  source: EvidenceSource
  confidence: EvidenceConfidence
  evidenceCount: number
  context?: string
  viewport?: string
}

export interface ColorToken {
  role: 'background' | 'surface' | 'primary' | 'secondary' | 'accent' | 'text' | 'border' | 'other'
  hex: string
  rgb: string
  hsl: string
  name: string
  description: string
  meta?: TokenMeta
}

export interface SemanticColorSystem {
  heroBackground?: ColorToken
  heroTextPrimary?: ColorToken
  heroPrimaryAction?: ColorToken
  heroSecondaryAction?: ColorToken
  heroAccentColors?: ColorToken[]
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
  meta?: TokenMeta
}

export interface RadiusToken {
  value: string
  label: string
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
  meta?: TokenMeta
}

export interface ShadowToken {
  value: string
  label: string
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
  meta?: TokenMeta
}

export interface SpacingToken {
  value: string
  label: string
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
  meta?: TokenMeta
}

export interface LayoutEvidence {
  label: string
  kind: 'hero' | 'grid' | 'flex' | 'navigation' | 'form' | 'section' | 'multi-column' | 'sticky' | 'stack'
  sampleCount: number
  componentKinds: ComponentKind[]
  evidenceScore: number
  meta?: TokenMeta
}

export interface BorderToken {
  width: string          // '1px', '2px'
  style: string          // 'solid', 'dashed'
  color?: string         // '#E5E5E5'
  sampleCount: number
  componentKinds: ComponentKind[]
  meta?: TokenMeta
}

export interface TransitionToken {
  property: string       // 'all', 'background-color', 'transform'
  duration: string       // '150ms', '250ms'
  easing: string         // 'ease', 'ease-in-out', 'cubic-bezier(...)'
  sampleCount: number
  componentKinds: ComponentKind[]
  meta?: TokenMeta
}

export type InteractionState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'selected'

export interface StateTokenValue {
  value: string
  property: 'color' | 'background-color' | 'border-color' | 'box-shadow' | 'opacity' | 'transform'
  state: InteractionState
  componentKinds: ComponentKind[]
  evidenceScore: number
  measured: boolean
  meta?: TokenMeta
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

// ── Button snapshot (DOM-measured exact CSS from real button element) ──────────
export interface ButtonSnapshot {
  backgroundColor?: string   // '#2383E2'
  color?: string             // '#FFFFFF'
  borderRadius?: string      // '8px'
  paddingH?: string          // '20px'
  paddingV?: string          // '10px'
  fontSize?: string          // '15px'
  fontWeight?: string        // '600'
  fontFamily?: string
  border?: string            // 'none' or '1px solid #xxx'
  boxShadow?: string
  letterSpacing?: string
  width?: string             // actual rendered width e.g. '148px'
  height?: string
  text?: string              // button label text e.g. 'Get Notion free'
}

export interface InputSnapshot {
  backgroundColor?: string
  color?: string
  borderRadius?: string
  border?: string
  paddingH?: string
  paddingV?: string
  fontSize?: string
  fontFamily?: string
  placeholder?: string
  width?: string
}

export interface CardSnapshot {
  backgroundColor?: string
  borderRadius?: string
  border?: string
  boxShadow?: string
  padding?: string
  headingText?: string
  headingFontSize?: string
  headingFontWeight?: string
}

export interface TagSnapshot {
  backgroundColor?: string
  color?: string
  borderRadius?: string
  border?: string
  paddingH?: string
  paddingV?: string
  fontSize?: string
  fontWeight?: string
  text?: string
}

// ── Page section (one visible section of the page) ────────────────────────────
export interface PageSection {
  index: number
  purpose: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'footer' | 'section'
  layout: 'full-width' | '2-column' | '3-column-grid' | '4-column-grid' | 'asymmetric' | 'grid'
  columns: number
  hasCTA: boolean
  hasImage: boolean
  heading?: string
  yStartPct?: number
  yEndPct?: number
  screenStartPct?: number
  screenEndPct?: number
  measured: boolean          // true = DOM-measured, false = AI-inferred
}

export interface ViewportSlice {
  index: number
  yStartPct: number
  yEndPct: number
  dominantSectionId?: string
}

// ── Visual style (AI-inferred from screenshot) ────────────────────────────────
export interface VisualStyleAnalysis {
  iconStyle?: 'solid' | 'outline' | 'rounded-outline' | 'duotone' | 'mixed' | 'minimal' | 'none'
  personality?: string[]     // e.g. ['minimal', 'professional', 'bold']
  density?: 'sparse' | 'comfortable' | 'dense'
  imageStyle?: 'photography' | 'illustration' | 'product-screenshots' | 'abstract' | 'mixed' | 'none'
  colorTemperature?: 'warm' | 'cool' | 'neutral'
  iconLibrary?: string       // 'heroicons', 'lucide', 'custom' etc.
}

// ── Interaction style (AI-inferred for image reports, measured for URL) ───────
export interface InteractionStyleAI {
  hoverEffect?: string       // 'subtle color shift', 'scale up'
  transitionFeel?: string    // 'snappy', 'smooth', 'bouncy'
  animationCharacter?: string // 'restrained', 'expressive'
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
  cssStroke?: string
  // Ultra-short bilingual tags replacing paragraphs
  layoutEn?: string
  layoutZh?: string
  spacingEn?: string
  spacingZh?: string
  motionEn?: string
  motionZh?: string
  iconEn?: string
  iconZh?: string
  signatureEn?: string
  signatureZh?: string
  // Structured AI analysis (for image reports & URL fallback)
  pageSections?: PageSection[]
  visualStyle?: VisualStyleAnalysis
  interactionStyle?: InteractionStyleAI
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
  meta?: TokenMeta
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
  meta?: TokenMeta
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
  borderTokens?: BorderToken[]
  transitionTokens?: TransitionToken[]
  pageMaxWidth?: string
  gridColumns?: string
  buttonSnapshot?: ButtonSnapshot
  buttonSnapshots?: ButtonSnapshot[]
  inputSnapshots?: InputSnapshot[]
  cardSnapshots?: CardSnapshot[]
  tagSnapshots?: TagSnapshot[]
  pageSections?: PageSection[]
  viewportSlices?: ViewportSlice[]
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
