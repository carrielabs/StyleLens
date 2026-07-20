import type {
  ButtonSnapshot,
  CardSnapshot,
  ComponentEvidenceBucket,
  ComponentEvidenceExample,
  ComponentEvidenceSummary,
  EvidenceConfidence,
  PageColorCandidate,
  PageStyleAnalysis,
} from '@/lib/types'

type ScoredExample = ComponentEvidenceExample & {
  score: number
}

const CTA_TEXT_PATTERN = /\b(get|start|try|book|request|demo|quote|contact|sign\s*up|join|download|free|talk|sales|subscribe|buy|upgrade)\b/i
const CTA_SELECTOR_PATTERN = /\b(cta|primary|button|btn|get-started|signup|sign-up|demo|contact|quote|download)\b/i
const SPECIFIC_CTA_SELECTOR_PATTERN = /\b(cta|get-started|signup|sign-up|demo|contact|quote|download|sales|subscribe|buy|upgrade)\b|primary/i
const BUTTON_SELECTOR_PATTERN = /\b(button|btn|cta|primary|submit)\b/i
const LOGO_SELECTOR_PATTERN = /(logo|brand|wordmark|site-logo)/i
const BODY_ANCHOR_PATTERN = /^\[anchor:(body|body-text|main)\]$/i
const NAV_SELECTOR_PATTERN = /\b(nav|navbar|navigation|menu|header)\b/i
const NAV_CONTROL_SELECTOR_PATTERN = /(nav|navigation|navbar|menu|dropdown|trigger)/i
const CARD_SELECTOR_PATTERN = /\b(card|panel|tile|feature|testimonial|case-study|pricing|plan|article|project)\b/i

export function buildReliableComponentEvidence(analysis: PageStyleAnalysis | undefined): ComponentEvidenceSummary {
  return {
    button: buildBucket(detectButtonExamples(analysis), 80),
    navigation: buildBucket(detectNavigationExamples(analysis), 70),
    card: buildBucket(detectCardExamples(analysis), 75),
    cta: buildBucket(detectCtaExamples(analysis), 80),
  }
}

function detectButtonExamples(analysis: PageStyleAnalysis | undefined): ScoredExample[] {
  if (!analysis) return []

  const snapshotExamples = (analysis.buttonSnapshots || [])
    .map(snapshot => scoreButtonSnapshot(snapshot))
    .filter(example => isScoredAtLeast(example, 70))

  const candidateExamples = (analysis.colorCandidates || [])
    .map(candidate => scoreButtonCandidate(candidate))
    .filter(example => isScoredAtLeast(example, 60))

  return [...snapshotExamples, ...candidateExamples]
    .sort((a, b) => b.score - a.score)
}

function detectCtaExamples(analysis: PageStyleAnalysis | undefined): ScoredExample[] {
  if (!analysis) return []

  const snapshotExamples = (analysis.buttonSnapshots || [])
    .map(snapshot => scoreButtonSnapshot(snapshot, true))
    .filter(example => isScoredAtLeast(example, 78))

  const candidateExamples = (analysis.colorCandidates || [])
    .map(candidate => scoreCtaCandidate(candidate))
    .filter(example => isScoredAtLeast(example, 60))

  return [...snapshotExamples, ...candidateExamples]
    .sort((a, b) => b.score - a.score)
}

function detectNavigationExamples(analysis: PageStyleAnalysis | undefined): ScoredExample[] {
  if (!analysis) return []

  const layoutExamples = analysis.layoutEvidence
    .filter(item => item.kind === 'navigation' || item.componentKinds.includes('nav'))
    .map(item => ({
      selectorHint: '[anchor:nav]',
      styleSummary: item.label || 'navigation layout evidence',
      source: item.meta?.source || 'dom-computed',
      confidence: item.meta?.confidence || 'medium',
      evidenceCount: item.meta?.evidenceCount || item.sampleCount || 1,
      reason: 'navigation layout semantics',
      score: item.meta?.confidence === 'high' ? 88 : 76,
    } satisfies ScoredExample))

  const candidateExamples = analysis.colorCandidates
    .filter(candidate => candidate.componentKinds?.includes('nav') || NAV_SELECTOR_PATTERN.test(candidate.selectorHint || ''))
    .map(candidate => candidateExample(candidate, 'navigation color/layout evidence', 'navigation selector evidence', 76))

  return [...layoutExamples, ...candidateExamples].sort((a, b) => b.score - a.score)
}

function detectCardExamples(analysis: PageStyleAnalysis | undefined): ScoredExample[] {
  if (!analysis) return []

  const snapshotExamples = (analysis.cardSnapshots || [])
    .map(snapshot => scoreCardSnapshot(snapshot))
    .filter(example => isScoredAtLeast(example, 60))

  const candidateExamples = (analysis.colorCandidates || [])
    .map(candidate => scoreCardCandidate(candidate))
    .filter(example => isScoredAtLeast(example, 60))

  return [...snapshotExamples, ...candidateExamples]
    .sort((a, b) => b.score - a.score)
}

function scoreButtonCandidate(candidate: PageColorCandidate): ScoredExample | undefined {
  const selectorHint = candidate.selectorHint || ''
  if (!selectorHint || BODY_ANCHOR_PATTERN.test(selectorHint) || isLogoLike(selectorHint)) return undefined

  const selector = selectorHint.toLowerCase()
  const reasons: string[] = []
  let score = 0

  if (candidate.componentKinds?.includes('button')) {
    score += 28
    reasons.push('button component kind')
  }
  if (BUTTON_SELECTOR_PATTERN.test(selector)) {
    score += 26
    reasons.push('button semantics')
  }
  if (candidate.property.includes('cta') || candidate.roleHints.includes('cta')) {
    score += 18
    reasons.push('CTA intent')
  }
  if (candidate.property.includes('background') || candidate.property.includes('border') || candidate.property.includes('foreground')) {
    score += 12
    reasons.push('visual chrome')
  }
  if (candidate.meta?.confidence === 'high') score += 8

  if (!reasons.includes('button component kind') && !reasons.includes('button semantics')) return undefined

  return candidateExample(candidate, 'button-like component evidence', reasons.join(', '), score)
}

function scoreButtonSnapshot(snapshot: ButtonSnapshot, requireCtaIntent = false): ScoredExample | undefined {
  const selectorHint = snapshot.selectorHint || '[component:button]'
  const text = cleanText(snapshot.text)
  const selector = selectorHint.toLowerCase()
  const reasons: string[] = []
  let score = 0

  if (isLogoLike(selectorHint, text)) return undefined
  if (!text || text.length > 44) return undefined

  if (BUTTON_SELECTOR_PATTERN.test(selector)) {
    score += 30
    reasons.push('button semantics')
  }
  if (CTA_TEXT_PATTERN.test(text) || CTA_SELECTOR_PATTERN.test(selector)) {
    score += 24
    reasons.push('CTA intent')
  }
  if (snapshot.backgroundColor) {
    score += 18
    reasons.push('visual fill')
  }
  if (snapshot.border && snapshot.border !== 'none') {
    score += 10
    reasons.push('border chrome')
  }
  if (snapshot.borderRadius) {
    score += 8
    reasons.push('rounded control shape')
  }
  if (snapshot.paddingH && snapshot.paddingV) {
    score += 12
    reasons.push('button padding')
  }
  if (snapshot.width && snapshot.height) {
    score += 6
    reasons.push('measured size')
  }

  if (requireCtaIntent && !reasons.includes('CTA intent')) return undefined
  if (!reasons.includes('button semantics') && !reasons.includes('visual fill') && !reasons.includes('border chrome')) return undefined

  return {
    selectorHint,
    text,
    styleSummary: summarizeButton(snapshot),
    source: 'dom-computed',
    confidence: confidenceFromScore(score),
    evidenceCount: 1,
    reason: reasons.join(', '),
    score,
  }
}

function scoreCtaCandidate(candidate: PageColorCandidate): ScoredExample | undefined {
  const selectorHint = candidate.selectorHint || '[component:cta]'
  if (BODY_ANCHOR_PATTERN.test(selectorHint) || isLogoLike(selectorHint)) return undefined

  const selector = selectorHint.toLowerCase()
  if (NAV_CONTROL_SELECTOR_PATTERN.test(selector) && !SPECIFIC_CTA_SELECTOR_PATTERN.test(selector)) return undefined

  const reasons: string[] = []
  let score = 0

  if (candidate.property.includes('cta')) {
    score += 32
    reasons.push('CTA color property')
  }
  if (candidate.roleHints.includes('cta') || candidate.roleHints.includes('primary')) {
    score += 24
    reasons.push('CTA intent')
  }
  if (candidate.componentKinds?.includes('button')) {
    score += 20
    reasons.push('button component kind')
  }
  if (CTA_SELECTOR_PATTERN.test(selector)) {
    score += 14
    reasons.push('CTA selector')
  }
  if (candidate.meta?.confidence === 'high') score += 8

  if (!reasons.some(reason => reason.includes('CTA'))) return undefined

  return candidateExample(candidate, 'CTA background', reasons.join(', '), score)
}

function scoreCardSnapshot(snapshot: CardSnapshot): ScoredExample | undefined {
  const selectorHint = snapshot.selectorHint || '[component:card]'
  const selector = selectorHint.toLowerCase()
  const heading = cleanText(snapshot.headingText)
  const reasons: string[] = []
  let score = 0

  if (BODY_ANCHOR_PATTERN.test(selectorHint) || LOGO_SELECTOR_PATTERN.test(selector)) return undefined

  if (CARD_SELECTOR_PATTERN.test(selector)) {
    score += 28
    reasons.push('card selector')
  }
  if (heading) {
    score += 24
    reasons.push('card structure')
  }
  if (snapshot.backgroundColor) {
    score += 14
    reasons.push('surface fill')
  }
  if (snapshot.border && snapshot.border !== 'none') {
    score += 12
    reasons.push('border chrome')
  }
  if (snapshot.boxShadow) {
    score += 10
    reasons.push('shadow depth')
  }
  if (snapshot.borderRadius) {
    score += 8
    reasons.push('rounded surface')
  }
  if (snapshot.padding) {
    score += 8
    reasons.push('content padding')
  }

  if (!heading) return undefined
  if (!reasons.some(reason => ['card selector', 'surface fill', 'border chrome', 'shadow depth', 'rounded surface'].includes(reason))) return undefined

  return {
    selectorHint,
    text: heading,
    styleSummary: summarizeCard(snapshot),
    source: 'dom-computed',
    confidence: confidenceFromScore(score),
    evidenceCount: 1,
    reason: reasons.join(', '),
    score,
  }
}

function scoreCardCandidate(candidate: PageColorCandidate): ScoredExample | undefined {
  const selectorHint = candidate.selectorHint || ''
  if (!selectorHint || BODY_ANCHOR_PATTERN.test(selectorHint) || isLogoLike(selectorHint)) return undefined

  const selector = selectorHint.toLowerCase()
  const reasons: string[] = []
  let score = 0

  if (candidate.componentKinds?.includes('card')) {
    score += 28
    reasons.push('card component kind')
  }
  if (CARD_SELECTOR_PATTERN.test(selector)) {
    score += 26
    reasons.push('card selector')
  }
  if (candidate.roleHints.includes('surface') && candidate.layerHints.includes('content')) {
    score += 18
    reasons.push('content surface')
  }
  if (candidate.property.includes('background') || candidate.property.includes('border')) {
    score += 12
    reasons.push('surface chrome')
  }
  if (candidate.meta?.confidence === 'high') score += 8

  if (!reasons.includes('card component kind') && !reasons.includes('card selector')) return undefined

  return candidateExample(candidate, 'card-like surface evidence', reasons.join(', '), score)
}

function candidateExample(
  candidate: PageColorCandidate,
  styleSummary: string,
  reason: string,
  score: number
): ScoredExample {
  return {
    selectorHint: candidate.selectorHint || '[component]',
    styleSummary,
    source: candidate.meta?.source || 'dom-computed',
    confidence: confidenceFromScore(score),
    evidenceCount: candidate.meta?.evidenceCount || candidate.count || 1,
    reason,
    score,
  }
}

function buildBucket(examples: ScoredExample[], highThreshold: number): ComponentEvidenceBucket {
  const deduped = dedupeExamples(examples).slice(0, 3)
  const bestScore = deduped[0]?.score || 0

  return {
    count: deduped.length,
    confidence: bestScore >= highThreshold ? 'high' : bestScore >= 60 ? 'medium' : 'low',
    examples: deduped.map(({ score, ...example }) => example),
  }
}

function isScoredAtLeast(example: ScoredExample | undefined, minScore: number): example is ScoredExample {
  return Boolean(example && example.score >= minScore)
}

function dedupeExamples(examples: ScoredExample[]): ScoredExample[] {
  const seen = new Set<string>()
  const deduped: ScoredExample[] = []
  for (const example of examples) {
    const key = example.selectorHint || `${example.text || ''}|${example.styleSummary || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(example)
  }
  return deduped
}

function confidenceFromScore(score: number): EvidenceConfidence {
  return score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
}

function isLogoLike(selectorHint = '', text = ''): boolean {
  if (CTA_TEXT_PATTERN.test(text)) return false
  return LOGO_SELECTOR_PATTERN.test(selectorHint)
    || /^logo$/i.test(text)
    || (/^[a-z0-9 .-]{1,18}$/i.test(text) && LOGO_SELECTOR_PATTERN.test(selectorHint))
}

function cleanText(value: string | undefined): string {
  return (value || '').trim().replace(/\s+/g, ' ')
}

function summarizeButton(snapshot: ButtonSnapshot): string {
  return [
    snapshot.backgroundColor ? `background ${snapshot.backgroundColor}` : undefined,
    snapshot.color ? `color ${snapshot.color}` : undefined,
    snapshot.borderRadius ? `radius ${snapshot.borderRadius}` : undefined,
    snapshot.paddingH || snapshot.paddingV ? `padding ${snapshot.paddingV || '?'} ${snapshot.paddingH || '?'}` : undefined,
  ].filter(Boolean).join(' · ') || 'button style evidence'
}

function summarizeCard(snapshot: CardSnapshot): string {
  return [
    snapshot.backgroundColor ? `background ${snapshot.backgroundColor}` : undefined,
    snapshot.borderRadius ? `radius ${snapshot.borderRadius}` : undefined,
    snapshot.border ? `border ${snapshot.border}` : undefined,
    snapshot.boxShadow ? 'shadow' : undefined,
    snapshot.padding ? `padding ${snapshot.padding}` : undefined,
  ].filter(Boolean).join(' · ') || 'card style evidence'
}
