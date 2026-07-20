/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import { buildAnalysisQualityGate, buildColorEvidenceAttribution } from '@/lib/api/analysisQuality'
import { sanitizePageAnalysis } from '@/lib/api/pageAnalyzer'
import { createMindMarketStyleAnalysisFixture } from '@/test/fixtures/mindmarket-style-analysis'

describe('analysis quality gates', () => {
  it('scores the sanitized MindMarket fixture above 80 while keeping third-party colors out of core slots', () => {
    const sanitized = sanitizePageAnalysis(createMindMarketStyleAnalysisFixture())
    const gate = buildAnalysisQualityGate(sanitized)

    expect(gate.score).toBeGreaterThanOrEqual(80)
    expect(gate.status).toBe('pass')
    expect(gate.checks.find(check => check.id === 'third-party-noise')?.status).toBe('pass')
    expect(sanitized?.semanticColorSystem?.primaryAction?.hex).toBe('#8ED462')
    expect(sanitized?.semanticColorSystem?.textPrimary?.hex).toBe('#2C2E2A')
    expect(sanitized?.colorCandidates.map(candidate => candidate.hex)).not.toContain('#C2D0E0')
  })

  it('attributes semantic colors to measured first-party evidence', () => {
    const sanitized = sanitizePageAnalysis(createMindMarketStyleAnalysisFixture())
    const attribution = buildColorEvidenceAttribution(sanitized)

    expect(attribution.slots.primaryAction).toMatchObject({
      hex: '#8ED462',
      source: 'dom-computed',
      confidence: 'high',
      selectorHint: 'a.c-button.button-green',
      property: 'cta-background',
    })
    expect(attribution.slots.textPrimary).toMatchObject({
      hex: '#2C2E2A',
      source: 'dom-computed',
      confidence: 'high',
      selectorHint: '[anchor:body-text]',
      property: 'color',
    })
    expect(attribution.rejectedThirdPartyHexes).toEqual(['#98A7B6', '#C2D0E0'])
  })

  it('requires MindMarket component evidence for button, navigation, card, and CTA', () => {
    const sanitized = sanitizePageAnalysis(createMindMarketStyleAnalysisFixture())
    const gate = buildAnalysisQualityGate(sanitized)
    const componentCheck = gate.checks.find(check => check.id === 'component-evidence')
    const componentEvidence = sanitized?.componentEvidence

    expect(componentCheck?.status).toBe('pass')
    expect(componentEvidence?.button.count).toBeGreaterThan(0)
    expect(componentEvidence?.navigation.count).toBeGreaterThan(0)
    expect(componentEvidence?.card.count).toBeGreaterThan(0)
    expect(componentEvidence?.cta.count).toBeGreaterThan(0)
    expect(componentEvidence?.button.examples[0].selectorHint).toContain('c-button')
    expect(componentEvidence?.navigation.examples[0].selectorHint).toContain('nav')
    expect(componentEvidence?.card.examples[0].selectorHint).toContain('card')
  })

  it('explains why low-confidence analyses should not be trusted', () => {
    const weakAnalysis = createMindMarketStyleAnalysisFixture()
    weakAnalysis.colorCandidates = []
    weakAnalysis.semanticColorSystem = undefined
    weakAnalysis.typographyTokens = []
    weakAnalysis.radiusTokens = []
    weakAnalysis.spacingTokens = []
    weakAnalysis.layoutEvidence = []
    weakAnalysis.buttonSnapshots = []
    weakAnalysis.cardSnapshots = []
    weakAnalysis.componentEvidence = undefined
    weakAnalysis.evidenceSummary = {
      overallConfidence: 'low',
      totalEvidenceCount: 0,
      sourceBreakdown: {},
      confidenceBreakdown: {},
    }
    weakAnalysis.coverageSummary = {
      overallCoverage: 0.2,
      coveredAreas: ['color'],
      missingAreas: ['typography', 'radius', 'spacing', 'layout', 'components'],
    }

    const gate = buildAnalysisQualityGate(weakAnalysis)

    expect(gate.status).toBe('fail')
    expect(gate.score).toBeLessThan(80)
    expect(gate.failureReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        checkId: 'semantic-color-evidence',
        severity: 'blocking',
      }),
      expect.objectContaining({
        checkId: 'component-evidence',
        severity: 'blocking',
      }),
    ]))
  })

  it('blocks export readiness when measured token values are invalid for generated CSS or Tailwind', () => {
    const analysis = createMindMarketStyleAnalysisFixture()
    analysis.radiusTokens = [{
      value: '100% | 50px | 1rem',
      label: 'Merged radius options',
      sampleCount: 3,
      componentKinds: ['button'],
      evidenceScore: 20,
      meta: {
        source: 'dom-computed',
        confidence: 'medium',
        evidenceCount: 3,
      },
    }]

    const gate = buildAnalysisQualityGate(analysis)
    const exportCheck = gate.checks.find(check => check.id === 'export-readiness')

    expect(exportCheck).toMatchObject({
      status: 'fail',
      blocking: true,
    })
    expect(exportCheck?.details).toContain('Invalid export token values')
    expect(gate.failureReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        checkId: 'export-readiness',
        severity: 'blocking',
      }),
    ]))
  })
})
