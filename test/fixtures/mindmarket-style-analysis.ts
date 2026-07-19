import { buildSemanticColorSystem, createEmptyPageAnalysis } from '@/lib/api/pageAnalyzer'
import type { PageStyleAnalysis } from '@/lib/types'

export function createMindMarketStyleAnalysisFixture(): PageStyleAnalysis {
  const analysis = createEmptyPageAnalysis({ inlineStyleBlocks: 2, linkedStylesheets: 3 })

  analysis.colorCandidates = [
    {
      hex: '#C2D0E0',
      property: 'css-variable',
      selectorHint: ':root(--cc-btn-primary-bg)',
      count: 20,
      roleHints: ['primary'],
      layerHints: ['global'],
      componentKinds: ['button'],
      evidenceScore: 260,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 20,
        context: 'cookie consent primary action',
      },
    },
    {
      hex: '#98A7B6',
      property: 'css-variable',
      selectorHint: '.cc--darkmode',
      count: 18,
      roleHints: ['secondary'],
      layerHints: ['global'],
      componentKinds: ['button'],
      evidenceScore: 230,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 18,
        context: 'cookie consent secondary action',
      },
    },
    {
      hex: '#8ED462',
      property: 'cta-background',
      selectorHint: 'a.c-button.button-green',
      count: 8,
      roleHints: ['primary', 'cta', 'background'],
      layerHints: ['hero'],
      componentKinds: ['button', 'hero'],
      evidenceScore: 150,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 8,
        context: 'primary action',
      },
    },
    {
      hex: '#F5F1E4',
      property: 'background-color',
      selectorHint: '[anchor:body]',
      count: 12,
      roleHints: ['background'],
      layerHints: ['global'],
      componentKinds: ['surface'],
      evidenceScore: 180,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 12,
      },
    },
    {
      hex: '#2C2E2A',
      property: 'color',
      selectorHint: '[anchor:body-text]',
      count: 24,
      roleHints: ['text'],
      layerHints: ['global'],
      componentKinds: ['text'],
      evidenceScore: 190,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 24,
      },
    },
  ]
  analysis.semanticColorSystem = buildSemanticColorSystem(analysis.colorCandidates)
  analysis.typographyTokens = [
    {
      id: 'heading',
      label: 'Heading',
      fontFamily: 'Inter, sans-serif',
      fontSize: '56px',
      fontWeight: '700',
      lineHeight: '1.05',
      letterSpacing: '0',
      usage: 'heading',
      sampleCount: 6,
      componentKinds: ['hero', 'text'],
      evidenceScore: 80,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 6,
      },
    },
  ]
  analysis.radiusTokens = [
    {
      value: '50px',
      label: 'Pill controls',
      sampleCount: 6,
      componentKinds: ['button'],
      evidenceScore: 70,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 6,
      },
    },
  ]
  analysis.spacingTokens = [
    {
      value: '24px',
      label: 'Section spacing',
      sampleCount: 10,
      componentKinds: ['section'],
      evidenceScore: 72,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 10,
      },
    },
  ]
  analysis.layoutEvidence = [
    {
      label: 'Hero section',
      kind: 'hero',
      sampleCount: 1,
      componentKinds: ['hero'],
      evidenceScore: 40,
      meta: {
        source: 'dom-computed',
        confidence: 'high',
        evidenceCount: 1,
      },
    },
  ]
  analysis.buttonSnapshots = [
    {
      backgroundColor: '#8ED462',
      color: '#2C2E2A',
      borderRadius: '50px',
      paddingH: '24px',
      paddingV: '14px',
      fontSize: '16px',
      fontWeight: '700',
      text: 'Start investing',
    },
  ]
  analysis.evidenceSummary = {
    overallConfidence: 'high',
    totalEvidenceCount: 59,
    sourceBreakdown: {
      'dom-computed': 59,
    },
    confidenceBreakdown: {
      high: 59,
    },
  }
  analysis.coverageSummary = {
    overallCoverage: 0.86,
    coveredAreas: ['color', 'typography', 'radius', 'spacing', 'layout', 'components'],
    missingAreas: ['interaction'],
  }

  return analysis
}
