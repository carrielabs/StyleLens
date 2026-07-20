import type {
  AnalysisQualityCheck,
  AnalysisQualityGate,
  ComponentEvidenceBucket,
  ComponentEvidenceExample,
  ComponentEvidenceSummary,
  ColorToken,
  ColorEvidenceAttribution,
  PageColorCandidate,
  PageStyleAnalysis,
  SemanticColorSystem,
} from '@/lib/types'

const SEMANTIC_SLOT_LABELS: Partial<Record<keyof SemanticColorSystem, string>> = {
  heroBackground: 'Hero background',
  pageBackground: 'Page background',
  surface: 'Surface',
  textPrimary: 'Primary text',
  textSecondary: 'Secondary text',
  border: 'Border',
  primaryAction: 'Primary action',
  secondaryAction: 'Secondary action',
}

export function isThirdPartyStyleArtifactHint(value: string): boolean {
  const normalized = value.toLowerCase()
  return /(?:^|[\s.#:_\-[(/])(?:cc-main|cc--|cm__|pm__|cookie|cookies|cookiebot|consent|onetrust|ot-sdk|didomi|iubenda|gdpr|privacy-preferences|intercom|crisp|drift|zendesk|hubspot|chat-widget|recaptcha|grecaptcha|captcha)(?:$|[\s.#:_\-\])>/])/.test(normalized)
    || /(?:^|[\s.(])--cc-[a-z0-9-]+/.test(normalized)
}

export function buildColorEvidenceAttribution(analysis: PageStyleAnalysis | undefined): ColorEvidenceAttribution {
  if (!analysis?.semanticColorSystem) {
    return {
      slots: {},
      rejectedThirdPartyHexes: analysis?.colorEvidenceAttribution?.rejectedThirdPartyHexes || [],
    }
  }

  const slots: ColorEvidenceAttribution['slots'] = {}
  const semanticEntries = Object.entries(analysis.semanticColorSystem)
    .filter(([, value]) => value && !Array.isArray(value)) as Array<[keyof SemanticColorSystem, ColorToken]>

  for (const [slot, color] of semanticEntries) {
    const candidate = findBestCandidateForColor(analysis.colorCandidates, color.hex, slot)
    slots[slot] = {
      hex: color.hex.toUpperCase(),
      source: candidate?.meta?.source || color.meta?.source || 'inferred',
      confidence: candidate?.meta?.confidence || color.meta?.confidence || 'low',
      evidenceCount: candidate?.meta?.evidenceCount || color.meta?.evidenceCount || candidate?.count || 0,
      property: candidate?.property,
      selectorHint: candidate?.selectorHint,
      context: candidate?.meta?.context || color.meta?.context || SEMANTIC_SLOT_LABELS[slot],
      layerHints: candidate?.layerHints || [],
      componentKinds: candidate?.componentKinds || [],
    }
  }

  return {
    slots,
    rejectedThirdPartyHexes: analysis.colorEvidenceAttribution?.rejectedThirdPartyHexes || [],
  }
}

export function buildAnalysisQualityGate(analysis: PageStyleAnalysis | undefined): AnalysisQualityGate {
  const attribution = buildColorEvidenceAttribution(analysis)
  const componentEvidence = analysis?.componentEvidence || buildComponentEvidenceSummary(analysis)
  const checks: AnalysisQualityCheck[] = [
    scoreSemanticColorEvidence(attribution),
    scoreThirdPartyNoise(analysis),
    scoreComponentEvidence(componentEvidence),
    scoreMeasuredCoverage(analysis),
    scoreEvidenceConfidence(analysis),
    scoreExportReadiness(analysis),
  ]
  const score = Math.round(checks.reduce((sum, check) => sum + check.score, 0))
  const status: AnalysisQualityGate['status'] =
    checks.some(check => check.blocking) || score < 65
      ? 'fail'
      : score >= 80
        ? 'pass'
        : 'warn'

  return {
    score,
    status,
    checks,
  }
}

export function buildComponentEvidenceSummary(analysis: PageStyleAnalysis | undefined): ComponentEvidenceSummary {
  const empty = (): ComponentEvidenceBucket => ({ count: 0, confidence: 'low', examples: [] })
  const summary: ComponentEvidenceSummary = {
    button: empty(),
    navigation: empty(),
    card: empty(),
    cta: empty(),
  }
  if (!analysis) return summary

  const primaryActionCandidate = findPrimaryActionCandidate(analysis.colorCandidates)
  const navCandidate = analysis.colorCandidates.find(candidate =>
    candidate.componentKinds?.includes('nav') || (candidate.selectorHint || '').toLowerCase().includes('nav')
  )
  const cardLikeCandidates = analysis.colorCandidates
    .filter(isCardLikeCandidate)
    .sort((a, b) => (b.evidenceScore || b.count) - (a.evidenceScore || a.count))

  summary.button = buildBucket(
    Math.max(analysis.buttonSnapshots?.length || 0, primaryActionCandidate ? 1 : 0),
    (analysis.buttonSnapshots?.length || 0) > 0
      ? snapshotExamples(
          analysis.buttonSnapshots || [],
          primaryActionCandidate?.selectorHint || '[component:button]',
          'button'
        )
      : primaryActionCandidate
        ? [candidateExample(primaryActionCandidate, 'button-like CTA evidence')]
        : []
  )
  summary.cta = buildBucket(
    primaryActionCandidate || analysis.semanticColorSystem?.primaryAction
      ? Math.max(1, primaryActionCandidate?.count || analysis.semanticColorSystem?.primaryAction?.meta?.evidenceCount || 1)
      : 0,
    primaryActionCandidate
      ? [candidateExample(primaryActionCandidate, 'CTA background')]
      : analysis.semanticColorSystem?.primaryAction
        ? [{
            selectorHint: '[semantic:primaryAction]',
            styleSummary: `CTA color ${analysis.semanticColorSystem.primaryAction.hex.toUpperCase()}`,
            source: analysis.semanticColorSystem.primaryAction.meta?.source || 'dom-computed',
            confidence: analysis.semanticColorSystem.primaryAction.meta?.confidence || 'medium',
            evidenceCount: analysis.semanticColorSystem.primaryAction.meta?.evidenceCount || 1,
          }]
      : []
  )
  summary.navigation = buildBucket(
    Math.max(
      analysis.layoutEvidence.filter(item => item.kind === 'navigation' || item.componentKinds.includes('nav')).length,
      navCandidate ? 1 : 0
    ),
    [
      {
        selectorHint: navCandidate?.selectorHint || '[anchor:nav]',
        styleSummary: 'navigation layout evidence',
        source: navCandidate?.meta?.source || 'dom-computed',
        confidence: navCandidate?.meta?.confidence || 'medium',
        evidenceCount: navCandidate?.meta?.evidenceCount || 1,
      },
    ]
  )
  summary.card = buildBucket(
    Math.max(analysis.cardSnapshots?.length || 0, cardLikeCandidates.length),
    (analysis.cardSnapshots?.length || 0) > 0
      ? snapshotExamples(analysis.cardSnapshots || [], cardLikeCandidates[0]?.selectorHint || '[component:card]', 'card')
      : cardLikeCandidates.slice(0, 3).map(candidate => candidateExample(candidate, 'card-like surface evidence'))
  )

  return summary
}

function isCardLikeCandidate(candidate: PageColorCandidate): boolean {
  const hint = `${candidate.selectorHint || ''} ${candidate.property} ${(candidate.componentKinds || []).join(' ')}`.toLowerCase()
  return Boolean(candidate.componentKinds?.includes('card'))
    || /\b(card|cards|panel|tile|feature|testimonial|case-study|case|work|project|block|item)\b/.test(hint)
    || (candidate.roleHints.includes('surface') && candidate.layerHints.includes('content'))
}

function findBestCandidateForColor(
  candidates: PageColorCandidate[],
  hex: string,
  slot: keyof SemanticColorSystem
): PageColorCandidate | undefined {
  const normalized = hex.toUpperCase()
  const slotHint = semanticSlotHint(slot)
  return candidates
    .filter(candidate => candidate.hex.toUpperCase() === normalized)
    .sort((a, b) => {
      const slotDiff = Number(hasSlotHint(b, slotHint)) - Number(hasSlotHint(a, slotHint))
      if (slotDiff !== 0) return slotDiff
      return (b.evidenceScore || b.count) - (a.evidenceScore || a.count)
    })[0]
}

function semanticSlotHint(slot: keyof SemanticColorSystem): string {
  if (slot.includes('Background')) return 'background'
  if (slot.includes('Text')) return 'text'
  if (slot.includes('Action')) return 'cta'
  if (slot === 'surface') return 'surface'
  if (slot === 'border') return 'border'
  return 'accent'
}

function hasSlotHint(candidate: PageColorCandidate, hint: string): boolean {
  return candidate.roleHints.includes(hint)
    || candidate.property.includes(hint)
    || Boolean(candidate.componentKinds?.includes(hint as never))
}

function scoreSemanticColorEvidence(attribution: ColorEvidenceAttribution): AnalysisQualityCheck {
  const slots = attribution.slots
  const hasBackground = Boolean(slots.heroBackground || slots.pageBackground)
  const hasText = Boolean(slots.textPrimary)
  const hasAction = Boolean(slots.primaryAction || slots.secondaryAction)
  const measuredCount = [slots.heroBackground, slots.pageBackground, slots.textPrimary, slots.primaryAction, slots.secondaryAction]
    .filter(slot => slot && slot.source !== 'inferred' && slot.evidenceCount > 0)
    .length
  const status = hasBackground && hasText && measuredCount >= 2 ? 'pass' : 'fail'

  return {
    id: 'semantic-color-evidence',
    label: 'Semantic color evidence',
    status,
    score: (hasBackground ? 8 : 0) + (hasText ? 8 : 0) + (hasAction ? 4 : 0),
    details: `${measuredCount} measured semantic color slots`,
    blocking: status === 'fail',
  }
}

function scoreThirdPartyNoise(analysis: PageStyleAnalysis | undefined): AnalysisQualityCheck {
  const leaked = (analysis?.colorCandidates || [])
    .filter(candidate => isThirdPartyStyleArtifactHint(`${candidate.selectorHint || ''} ${candidate.property} ${candidate.meta?.context || ''}`))
    .map(candidate => candidate.hex.toUpperCase())

  return {
    id: 'third-party-noise',
    label: 'Third-party noise',
    status: leaked.length ? 'fail' : 'pass',
    score: leaked.length ? 0 : 20,
    details: leaked.length ? `Leaked colors: ${[...new Set(leaked)].join(', ')}` : 'No third-party color leak',
    blocking: leaked.length > 0,
  }
}

function scoreComponentEvidence(componentEvidence: ComponentEvidenceSummary): AnalysisQualityCheck {
  const missing = (['button', 'navigation', 'card', 'cta'] as const)
    .filter(kind => componentEvidence[kind].count <= 0)

  return {
    id: 'component-evidence',
    label: 'Component evidence',
    status: missing.length ? 'fail' : 'pass',
    score: missing.length ? 0 : 15,
    details: missing.length ? `Missing: ${missing.join(', ')}` : 'Button, navigation, card, and CTA evidence present',
    blocking: missing.length > 0,
  }
}

function scoreMeasuredCoverage(analysis: PageStyleAnalysis | undefined): AnalysisQualityCheck {
  const coverage = analysis?.coverageSummary?.overallCoverage || 0

  return {
    id: 'measured-coverage',
    label: 'Measured coverage',
    status: coverage >= 0.8 ? 'pass' : coverage >= 0.65 ? 'warn' : 'fail',
    score: coverage >= 0.8 ? 15 : coverage >= 0.65 ? 9 : 0,
    details: `${Math.round(coverage * 100)}% coverage`,
    blocking: coverage < 0.65,
  }
}

function scoreEvidenceConfidence(analysis: PageStyleAnalysis | undefined): AnalysisQualityCheck {
  const summary = analysis?.evidenceSummary
  const highEvidence = summary?.overallConfidence === 'high' && (summary.totalEvidenceCount || 0) >= 20
  const mediumEvidence = summary?.overallConfidence === 'medium' && (summary.totalEvidenceCount || 0) >= 10

  return {
    id: 'evidence-confidence',
    label: 'Evidence confidence',
    status: highEvidence ? 'pass' : mediumEvidence ? 'warn' : 'fail',
    score: highEvidence ? 15 : mediumEvidence ? 9 : 0,
    details: `${summary?.overallConfidence || 'low'} confidence, ${summary?.totalEvidenceCount || 0} evidence`,
    blocking: !highEvidence && !mediumEvidence,
  }
}

function scoreExportReadiness(analysis: PageStyleAnalysis | undefined): AnalysisQualityCheck {
  const readySignals = [
    (analysis?.typographyTokens.length || 0) > 0,
    (analysis?.radiusTokens.length || 0) > 0,
    (analysis?.spacingTokens.length || 0) > 0,
    (analysis?.buttonSnapshots?.length || 0) > 0,
    (analysis?.layoutEvidence.length || 0) > 0,
  ]
  const readyCount = readySignals.filter(Boolean).length

  return {
    id: 'export-readiness',
    label: 'Export readiness',
    status: readyCount >= 4 ? 'pass' : readyCount >= 3 ? 'warn' : 'fail',
    score: readyCount >= 4 ? 15 : readyCount >= 3 ? 9 : 0,
    details: `${readyCount}/5 export signals ready`,
    blocking: readyCount < 3,
  }
}

function findPrimaryActionCandidate(candidates: PageColorCandidate[]): PageColorCandidate | undefined {
  return candidates
    .filter(candidate =>
      candidate.property === 'cta-background'
      || candidate.roleHints.includes('cta')
      || candidate.roleHints.includes('primary')
      || candidate.componentKinds?.includes('button')
    )
    .sort((a, b) => (b.evidenceScore || b.count) - (a.evidenceScore || a.count))[0]
}

function candidateExample(candidate: PageColorCandidate, styleSummary: string): ComponentEvidenceExample {
  return {
    selectorHint: candidate.selectorHint || '[component:cta]',
    styleSummary,
    source: candidate.meta?.source || 'dom-computed',
    confidence: candidate.meta?.confidence || 'medium',
    evidenceCount: candidate.meta?.evidenceCount || candidate.count || 1,
  }
}

function snapshotExamples(
  snapshots: Array<{
    backgroundColor?: string
    color?: string
    borderRadius?: string
    paddingH?: string
    paddingV?: string
    padding?: string
    text?: string
    headingText?: string
  }>,
  selectorHint: string,
  kind: 'button' | 'card'
): ComponentEvidenceExample[] {
  return snapshots.slice(0, 3).map(snapshot => ({
    selectorHint,
    text: snapshot.text || snapshot.headingText,
    styleSummary: summarizeSnapshotStyle(snapshot, kind),
    source: 'dom-computed',
    confidence: 'high',
    evidenceCount: 1,
  }))
}

function summarizeSnapshotStyle(
  snapshot: {
    backgroundColor?: string
    color?: string
    borderRadius?: string
    paddingH?: string
    paddingV?: string
    padding?: string
  },
  kind: 'button' | 'card'
): string {
  const parts = [
    snapshot.backgroundColor ? `background ${snapshot.backgroundColor}` : undefined,
    snapshot.color ? `color ${snapshot.color}` : undefined,
    snapshot.borderRadius ? `radius ${snapshot.borderRadius}` : undefined,
    snapshot.padding ? `padding ${snapshot.padding}` : undefined,
    snapshot.paddingH || snapshot.paddingV ? `padding ${snapshot.paddingV || '?'} ${snapshot.paddingH || '?'}` : undefined,
  ].filter(Boolean)
  return parts.join(' · ') || `${kind} style evidence`
}

function buildBucket(count: number, examples: ComponentEvidenceExample[]): ComponentEvidenceBucket {
  const normalizedCount = Math.ceil(count)
  return {
    count: normalizedCount,
    confidence: normalizedCount >= 2 ? 'high' : normalizedCount === 1 ? 'medium' : 'low',
    examples: normalizedCount > 0 ? examples : [],
  }
}
