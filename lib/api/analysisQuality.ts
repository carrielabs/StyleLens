import type {
  AnalysisQualityCheck,
  AnalysisQualityGate,
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
  const checks: AnalysisQualityCheck[] = [
    scoreSemanticColorEvidence(attribution),
    scoreThirdPartyNoise(analysis),
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
    score: (hasBackground ? 10 : 0) + (hasText ? 10 : 0) + (hasAction ? 5 : 0),
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

function scoreMeasuredCoverage(analysis: PageStyleAnalysis | undefined): AnalysisQualityCheck {
  const coverage = analysis?.coverageSummary?.overallCoverage || 0

  return {
    id: 'measured-coverage',
    label: 'Measured coverage',
    status: coverage >= 0.8 ? 'pass' : coverage >= 0.65 ? 'warn' : 'fail',
    score: coverage >= 0.8 ? 20 : coverage >= 0.65 ? 12 : 0,
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
    score: highEvidence ? 20 : mediumEvidence ? 12 : 0,
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
