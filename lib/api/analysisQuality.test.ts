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
})
