import type {
  AnalysisFailureReason,
  AnalysisQualityCheck,
  AnalysisQualityGate,
  ComponentEvidenceSummary,
  ColorToken,
  ColorEvidenceAttribution,
  PageColorCandidate,
  PageStyleAnalysis,
  SemanticColorSystem,
} from '@/lib/types'
import { buildReliableComponentEvidence } from '@/lib/api/componentDetector'

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
  const failureReasons = buildFailureReasons(checks, score)

  return {
    score,
    status,
    checks,
    failureReasons,
  }
}

export function buildComponentEvidenceSummary(analysis: PageStyleAnalysis | undefined): ComponentEvidenceSummary {
  return buildReliableComponentEvidence(analysis)
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
  const hasBackground = Boolean(slots.heroBackground || slots.pageBackground || slots.surface)
  const hasText = Boolean(slots.textPrimary)
  const hasAction = Boolean(slots.primaryAction || slots.secondaryAction)
  const measuredCount = [slots.heroBackground, slots.pageBackground, slots.surface, slots.textPrimary, slots.primaryAction, slots.secondaryAction]
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
  const missing = (['button', 'navigation', 'cta'] as const)
    .filter(kind => componentEvidence[kind].count <= 0)
  const cardDetail = componentEvidence.card.count > 0 ? ', card evidence present' : ', no reliable card evidence'

  return {
    id: 'component-evidence',
    label: 'Component evidence',
    status: missing.length ? 'fail' : 'pass',
    score: missing.length ? 0 : 15,
    details: missing.length ? `Missing: ${missing.join(', ')}` : `Button, navigation, and CTA evidence present${cardDetail}`,
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
  const invalidValues = collectInvalidExportValues(analysis)
  if (invalidValues.length) {
    return {
      id: 'export-readiness',
      label: 'Export readiness',
      status: 'fail',
      score: 0,
      details: `Invalid export token values: ${invalidValues.slice(0, 4).join(', ')}`,
      blocking: true,
    }
  }

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

function buildFailureReasons(checks: AnalysisQualityCheck[], score: number): AnalysisFailureReason[] {
  const reasons = checks
    .filter(check => check.status !== 'pass')
    .map(check => ({
      checkId: check.id,
      label: check.label,
      severity: check.blocking || check.status === 'fail' ? 'blocking' : 'warning',
      message: check.details,
    } satisfies AnalysisFailureReason))

  if (score < 80 && reasons.length === 0) {
    reasons.push({
      checkId: 'quality-score',
      label: 'Quality score',
      severity: score < 65 ? 'blocking' : 'warning',
      message: `Quality score is ${score}/100`,
    })
  }

  return reasons
}

function collectInvalidExportValues(analysis: PageStyleAnalysis | undefined): string[] {
  if (!analysis) return []

  const invalid: string[] = []
  const addInvalid = (label: string, value: string | undefined) => {
    if (!value) return
    if (isInvalidExportTokenValue(value)) invalid.push(`${label}=${value}`)
  }

  analysis.radiusTokens.forEach(token => addInvalid('radius', token.value))
  analysis.shadowTokens.forEach(token => addInvalid('shadow', token.value))
  analysis.spacingTokens.forEach(token => addInvalid('spacing', token.value))
  analysis.borderTokens?.forEach(token => {
    addInvalid('border-width', token.width)
    addInvalid('border-style', token.style)
    addInvalid('border-color', token.color)
  })
  analysis.transitionTokens?.forEach(token => {
    addInvalid('transition-duration', token.duration)
    addInvalid('transition-easing', token.easing)
  })
  analysis.buttonSnapshots?.forEach(snapshot => {
    addInvalid('button-radius', snapshot.borderRadius)
    addInvalid('button-padding-h', snapshot.paddingH)
    addInvalid('button-padding-v', snapshot.paddingV)
  })
  analysis.cardSnapshots?.forEach(snapshot => {
    addInvalid('card-radius', snapshot.borderRadius)
    addInvalid('card-padding', snapshot.padding)
    addInvalid('card-shadow', snapshot.boxShadow)
  })

  return invalid
}

function isInvalidExportTokenValue(value: string): boolean {
  const normalized = value.trim()
  return normalized.includes('|')
    || normalized.includes('\n')
    || /[{};]/.test(normalized)
}
