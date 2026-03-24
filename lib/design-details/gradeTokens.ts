/**
 * gradeTokens.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure function layer: raw PageStyleAnalysis tokens → graded display/export data.
 *
 * Grading uses sampleCount + evidenceScore as confidence proxy until Codex
 * delivers the unified TokenMeta schema (source / confidence / evidenceCount).
 * The API is forward-compatible: when TokenMeta arrives, we swap the grading
 * function without touching the UI or exporter.
 *
 * Grade semantics
 * ───────────────
 * A  dom-measured, strong evidence (sampleCount ≥ 3)  → show directly, green dot
 * B  dom-measured, moderate evidence (sampleCount ≥ 1) → show as "high-freq measurement"
 * C  low/inferred evidence                             → layout structural params only
 * D  no evidence                                       → omit entirely
 *
 * Responsibilities
 * ────────────────
 * ✅ Grading and filtering
 * ✅ Sorting (by sampleCount desc)
 * ✅ Spacing: cap at top-6, compute freqRatio for frequency bars
 * ✅ Export helpers: filter to A+B only
 * ✅ Aggregate confidence per dimension
 *
 * NOT responsible for
 * ────────────────────
 * ❌ CSS token naming (that's the exporter's job)
 * ❌ UI rendering (that's DesignInspector's job)
 * ❌ AI-inferred fields (those stay in DesignDetails / interactionStyle)
 */

import type {
  RadiusToken,
  ShadowToken,
  SpacingToken,
  LayoutEvidence,
  BorderToken,
  TransitionToken,
  TokenMeta,
} from '@/lib/types'

// ── Grade type ────────────────────────────────────────────────────────────────

export type TokenGrade = 'A' | 'B' | 'C' | 'D'

export type DimensionConfidence = 'high' | 'medium' | 'low' | 'none'

// ── Graded token variants ─────────────────────────────────────────────────────

export interface GradedRadiusToken extends RadiusToken {
  grade: TokenGrade
}

export interface GradedShadowToken extends ShadowToken {
  grade: TokenGrade
}

export interface GradedSpacingToken extends SpacingToken {
  grade: TokenGrade
  /** 0–1, relative to the highest-sampleCount spacing token — used for frequency bars */
  freqRatio: number
  /** true if value is an exact multiple of 4 (e.g. 4px, 8px, 12px, 16px…) */
  isStandard4n: boolean
  /** true if value is an exact multiple of 8 (e.g. 8px, 16px, 24px, 32px…) */
  isStandard8n: boolean
}

export interface GradedLayoutEvidence extends LayoutEvidence {
  grade: TokenGrade
}

export interface GradedBorderToken extends BorderToken {
  grade: TokenGrade
}

// ── Output shape ─────────────────────────────────────────────────────────────

export interface GradedTokenSet {
  /** A+B radius tokens, sorted by sampleCount desc */
  radius: GradedRadiusToken[]
  /** A+B shadow tokens, sorted by sampleCount desc */
  shadow: GradedShadowToken[]
  /** Top-6 spacing tokens by frequency, B-grade presentation */
  spacing: GradedSpacingToken[]
  /** C-grade layout evidence, sorted by sampleCount desc */
  layout: GradedLayoutEvidence[]
  /** A+B border tokens */
  border: GradedBorderToken[]

  // Per-dimension confidence rollup
  radiusConfidence: DimensionConfidence
  shadowConfidence: DimensionConfidence
  spacingConfidence: DimensionConfidence

  /** % of spacing tokens (weighted by sampleCount) that align to the 8pt grid.
   *  Pure math — no AI involved. e.g. 0.81 means "81% aligns to 8pt grid" */
  gridAlignmentPct: number
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Grade a single token.
 *  Prefers TokenMeta (source/confidence/evidenceCount) from Codex when available.
 *  Falls back to sampleCount+evidenceScore heuristics for legacy/partial data. */
function gradeByEvidence(evidenceScore: number, sampleCount: number, meta?: TokenMeta): TokenGrade {
  // ── Primary path: use Codex-provided TokenMeta ────────────────────────────
  if (meta) {
    if (meta.source === 'dom-computed') {
      if (meta.evidenceCount >= 3 || meta.confidence === 'high') return 'A'
      if (meta.evidenceCount >= 1 || meta.confidence === 'medium') return 'B'
      return 'C'
    }
    if (meta.source === 'screenshot-sampled') {
      return meta.confidence === 'high' ? 'B' : 'C'
    }
    if (meta.source === 'inferred') return 'C'
  }
  // ── Fallback: heuristics until TokenMeta is fully populated ───────────────
  if (sampleCount >= 3) return 'A'
  if (sampleCount >= 1) return 'B'
  if (evidenceScore >= 2) return 'B'
  if (evidenceScore >= 1) return 'C'
  return 'D'
}

function rollupConfidence(items: { grade: TokenGrade }[]): DimensionConfidence {
  if (!items.length) return 'none'
  if (items.some(t => t.grade === 'A')) return 'high'
  if (items.some(t => t.grade === 'B')) return 'medium'
  return 'low'
}

// ── Main export ───────────────────────────────────────────────────────────────

export function gradeTokens(
  radiusTokens: RadiusToken[],
  shadowTokens: ShadowToken[],
  spacingTokens: SpacingToken[],
  layoutEvidence: LayoutEvidence[],
  borderTokens: BorderToken[] = [],
): GradedTokenSet {

  // ── Radius (A + B) ─────────────────────────────────────────────────────────
  const radius: GradedRadiusToken[] = radiusTokens
    .map(t => ({ ...t, grade: gradeByEvidence(t.evidenceScore, t.sampleCount, t.meta) }))
    .filter((t): t is GradedRadiusToken => t.grade !== 'D')
    .sort((a, b) => b.sampleCount - a.sampleCount)

  // ── Shadow (A + B) ─────────────────────────────────────────────────────────
  const shadow: GradedShadowToken[] = shadowTokens
    .map(t => ({ ...t, grade: gradeByEvidence(t.evidenceScore, t.sampleCount, t.meta) }))
    .filter((t): t is GradedShadowToken => t.grade !== 'D')
    .sort((a, b) => b.sampleCount - a.sampleCount)

  // ── Spacing (top-6 only, B-grade presentation) ─────────────────────────────
  // Cluster ±1px duplicates first, then grade and cap at 6
  // We never claim this is a design-system "scale" — it's raw measurement frequency.
  const clusteredSpacing = clusterSpacingTokens(spacingTokens)
  const spacingSorted = clusteredSpacing
    .map(t => ({ ...t, grade: gradeByEvidence(t.evidenceScore, t.sampleCount, t.meta) }))
    .filter((t): t is GradedSpacingToken & { freqRatio: number } => t.grade !== 'D')
    .sort((a, b) => b.sampleCount - a.sampleCount)
    .slice(0, 6)

  const maxSpacingCount = spacingSorted[0]?.sampleCount || 1

  function isMultipleOf(value: string, n: number): boolean {
    const px = parseFloat(value)
    if (!isFinite(px) || px <= 0) return false
    return Math.abs(Math.round(px / n) * n - px) < 0.5  // ±0.5px tolerance
  }

  const spacing: GradedSpacingToken[] = spacingSorted.map(t => ({
    ...t,
    freqRatio: t.sampleCount / maxSpacingCount,
    isStandard4n: isMultipleOf(t.value, 4),
    isStandard8n: isMultipleOf(t.value, 8),
  }))

  // 8pt grid alignment: weighted by sampleCount across ALL spacing tokens (not just top-6)
  const allSpacingGraded = spacingTokens.filter(t => t.sampleCount > 0)
  const totalSamples = allSpacingGraded.reduce((s, t) => s + t.sampleCount, 0)
  const alignedSamples = allSpacingGraded
    .filter(t => isMultipleOf(t.value, 8))
    .reduce((s, t) => s + t.sampleCount, 0)
  const gridAlignmentPct = totalSamples > 0 ? alignedSamples / totalSamples : 0

  // ── Layout (C-grade: structural evidence only) ─────────────────────────────
  const layout: GradedLayoutEvidence[] = layoutEvidence
    .map(t => ({ ...t, grade: gradeByEvidence(t.evidenceScore, t.sampleCount, t.meta) }))
    .filter((t): t is GradedLayoutEvidence => t.grade !== 'D')
    .sort((a, b) => b.sampleCount - a.sampleCount)

  // ── Border (A + B) ─────────────────────────────────────────────────────────
  const border: GradedBorderToken[] = borderTokens
    .map(t => ({ ...t, grade: gradeByEvidence(0, t.sampleCount) }))  // BorderToken has no meta yet
    .filter((t): t is GradedBorderToken => t.grade !== 'D')
    .sort((a, b) => b.sampleCount - a.sampleCount)

  return {
    radius,
    shadow,
    spacing,
    layout,
    border,
    radiusConfidence: rollupConfidence(radius),
    shadowConfidence: rollupConfidence(shadow),
    spacingConfidence: rollupConfidence(spacing),
    gridAlignmentPct,
  }
}

// ── Spacing clustering: merge tokens within ±1px of each other ───────────────
/** Merge spacing tokens that are within ±1px of each other (e.g. 15.9px + 16px → 16px).
 *  Preserves all original values as aliases, takes the most frequent as canonical. */
export function clusterSpacingTokens(tokens: SpacingToken[]): SpacingToken[] {
  if (!tokens.length) return []

  // Sort by numeric value
  const sorted = [...tokens].sort((a, b) => parseFloat(a.value) - parseFloat(b.value))
  const clusters: SpacingToken[][] = []

  for (const token of sorted) {
    const px = parseFloat(token.value)
    if (!isFinite(px)) { clusters.push([token]); continue }
    // Try to merge into the last cluster
    const last = clusters[clusters.length - 1]
    if (last) {
      const lastPx = parseFloat(last[0].value)
      if (Math.abs(px - lastPx) <= 1.0) {
        last.push(token)
        continue
      }
    }
    clusters.push([token])
  }

  // For each cluster, take the canonical token (highest sampleCount)
  return clusters.map(cluster => {
    const canonical = cluster.reduce((best, t) => t.sampleCount > best.sampleCount ? t : best, cluster[0])
    const totalCount = cluster.reduce((s, t) => s + t.sampleCount, 0)
    return {
      ...canonical,
      sampleCount: totalCount,  // sum up evidence across all near-duplicates
      evidenceScore: Math.max(...cluster.map(t => t.evidenceScore)),
    }
  })
}

// ── Export helpers: A+B only ──────────────────────────────────────────────────

/** Radius tokens safe to include in code exports */
export function exportableRadius(graded: GradedTokenSet): GradedRadiusToken[] {
  return graded.radius.filter(t => t.grade === 'A' || t.grade === 'B')
}

/** Shadow tokens safe to include in code exports */
export function exportableShadow(graded: GradedTokenSet): GradedShadowToken[] {
  return graded.shadow.filter(t => t.grade === 'A' || t.grade === 'B')
}

/** Spacing tokens safe to include in code exports.
 *  Description: always include raw sampleCount as a comment, never claim
 *  these are a designed spacing scale. */
export function exportableSpacing(graded: GradedTokenSet): GradedSpacingToken[] {
  return graded.spacing.filter(t => t.grade === 'A' || t.grade === 'B')
}

/** Human-readable confidence label for UI display */
export function confidenceLabel(c: DimensionConfidence, lang: 'zh' | 'en'): string {
  if (lang === 'zh') {
    return c === 'high' ? '测量值' : c === 'medium' ? '高频测量' : c === 'low' ? '推断' : ''
  }
  return c === 'high' ? 'Measured' : c === 'medium' ? 'High-freq' : c === 'low' ? 'Inferred' : ''
}
