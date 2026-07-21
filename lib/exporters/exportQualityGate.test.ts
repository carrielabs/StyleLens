import { describe, expect, it } from 'vitest'
import {
  buildExportQualityGate,
  validateGeneratedExports,
} from '@/lib/exporters/exportQualityGate'
import { generateCssVariables } from '@/lib/exporters/cssExporter'
import { generateJsonToken } from '@/lib/exporters/jsonExporter'
import { generateMarkdown } from '@/lib/exporters/markdownExporter'
import { generatePrompt } from '@/lib/exporters/promptExporter'
import { generateTailwindConfig } from '@/lib/exporters/tailwindExporter'
import type { ColorToken, StyleReport } from '@/lib/types'

function color(hex: string, role: ColorToken['role'], name: string): ColorToken {
  return {
    role,
    hex,
    rgb: '',
    hsl: '',
    name,
    description: name,
    meta: {
      source: 'dom-computed',
      confidence: 'high',
      evidenceCount: 8,
    },
  }
}

function createReport(): StyleReport {
  const pageBackground = color('#101114', 'background', 'page background')
  const surface = color('#181B22', 'surface', 'surface')
  const primary = color('#8ED462', 'primary', 'primary action')
  const text = color('#F6F7F2', 'text', 'primary text')
  const border = color('#30343D', 'border', 'border')

  return {
    sourceType: 'url',
    sourceLabel: 'Export fixture',
    summary: 'Measured product interface.',
    summaryEn: 'Measured product interface.',
    summaryZh: '有证据的产品界面。',
    tags: ['product'],
    colors: [pageBackground, surface, primary, text, border],
    colorSystem: {
      pageBackground,
      surface,
      primaryAction: primary,
      textPrimary: text,
      border,
    },
    gradients: [],
    typography: {
      fontFamily: 'Inter, sans-serif',
      confidence: 'identified',
      headingWeight: 700,
      bodyWeight: 500,
      fontSizeScale: '16px to 56px',
      lineHeight: '1.4',
      letterSpacing: '-0.02em',
      alignment: 'left',
      textTreatment: 'solid',
    },
    designDetails: {
      overallStyle: 'measured product UI',
      colorMode: 'dark',
      borderRadius: 'medium',
      shadowStyle: 'minimal',
      spacingSystem: '8px grid',
      borderStyle: '1px solid',
      animationTendency: 'subtle',
      imageHandling: 'product screenshots',
      layoutStructure: 'Hero split layout | Feature card grid',
      cssRadius: '12px',
      cssShadow: 'none',
    },
    pageAnalysis: {
      colorCandidates: [],
      semanticColorSystem: {
        pageBackground,
        surface,
        primaryAction: primary,
        textPrimary: text,
        border,
      },
      typographyCandidates: [],
      typographyTokens: [
        {
          id: 'heading',
          label: 'Heading',
          fontFamily: 'Inter, sans-serif',
          fontSize: '56px',
          fontWeight: '700',
          lineHeight: '1',
          letterSpacing: '-0.04em',
          usage: 'heading',
          sampleCount: 6,
          componentKinds: ['text', 'hero'],
          evidenceScore: 90,
          meta: {
            source: 'dom-computed',
            confidence: 'high',
            evidenceCount: 6,
          },
        },
      ],
      radiusCandidates: ['12px'],
      radiusTokens: [
        {
          value: '12px',
          label: 'Control radius',
          sampleCount: 8,
          componentKinds: ['button', 'card'],
          evidenceScore: 80,
          meta: {
            source: 'dom-computed',
            confidence: 'high',
            evidenceCount: 8,
          },
        },
      ],
      shadowCandidates: ['none'],
      shadowTokens: [],
      spacingCandidates: ['16px', '24px'],
      spacingTokens: [
        {
          value: '24px',
          label: 'Base spacing',
          sampleCount: 12,
          componentKinds: ['section', 'card'],
          evidenceScore: 84,
          meta: {
            source: 'dom-computed',
            confidence: 'high',
            evidenceCount: 12,
          },
        },
      ],
      layoutHints: ['Hero split layout', 'Feature card grid'],
      layoutEvidence: [
        {
          label: 'Hero split layout',
          kind: 'hero',
          sampleCount: 1,
          componentKinds: ['hero', 'section'],
          evidenceScore: 64,
          meta: {
            source: 'dom-computed',
            confidence: 'high',
            evidenceCount: 1,
          },
        },
      ],
      stateTokens: {},
      borderTokens: [],
      transitionTokens: [],
      buttonSnapshots: [
        {
          selectorHint: 'a.button.primary',
          backgroundColor: '#8ED462',
          color: '#101114',
          borderRadius: '12px',
          paddingH: '20px',
          paddingV: '10px',
          fontSize: '15px',
          fontWeight: '700',
          border: 'none',
          text: 'Get started',
        },
      ],
      inputSnapshots: [],
      cardSnapshots: [
        {
          selectorHint: 'article.feature-card',
          backgroundColor: '#181B22',
          borderRadius: '12px',
          border: '1px solid #30343D',
          padding: '24px',
          headingText: 'Feature card',
        },
      ],
      tagSnapshots: [],
      pageSections: [],
      viewportSlices: [],
      cssTextExcerpt: '',
      evidenceSummary: {
        overallConfidence: 'high',
        totalEvidenceCount: 60,
        sourceBreakdown: {
          'dom-computed': 60,
        },
        confidenceBreakdown: {
          high: 60,
        },
      },
      coverageSummary: {
        overallCoverage: 0.9,
        coveredAreas: ['color', 'typography', 'radius', 'spacing', 'layout', 'components'],
        missingAreas: [],
      },
      interactionSummary: {
        hasInteractiveSignals: false,
        measuredStates: [],
        componentKinds: ['button', 'card'],
        transitionCount: 0,
      },
      sourceCount: {
        inlineStyleBlocks: 1,
        linkedStylesheets: 0,
      },
    },
    createdAt: '2026-07-21T00:00:00.000Z',
  }
}

describe('export quality gate', () => {
  it('passes all generated StyleLens export formats when they are parseable and evidence-backed', () => {
    const report = createReport()
    const gate = buildExportQualityGate(report)

    expect(gate.status).toBe('pass')
    expect(gate.score).toBe(100)
    expect(gate.failureReasons).toEqual([])
  })

  it('blocks invalid CSS, Tailwind, JSON, Prompt, and Markdown export output', () => {
    const gate = validateGeneratedExports({
      css: ':root { --radius-base: 100% | 50px; --color-bg: #FFFFFF; }',
      tailwind: 'module.exports = { theme: { extend: { borderRadius: { brand: "100% | 50px" } } }',
      json: '{ "stylelens": ',
      prompt: [
        'Border Radius: 12px',
        'DO NOT add rounded corners',
        'Evidence Basis',
        '- Evidence source: inferred only.',
      ].join('\n'),
      markdown: [
        '# StyleLens Report',
        '- 质量门禁：100/100 · pass',
      ].join('\n'),
    })

    expect(gate.status).toBe('fail')
    expect(gate.score).toBeLessThan(80)
    expect(gate.failureReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ checkId: 'css-export-validity' }),
      expect.objectContaining({ checkId: 'tailwind-export-validity' }),
      expect.objectContaining({ checkId: 'json-export-validity' }),
      expect.objectContaining({ checkId: 'prompt-export-consistency' }),
      expect.objectContaining({ checkId: 'markdown-export-evidence' }),
    ]))
  })

  it('validates the real generated strings instead of trusting report metadata', () => {
    const report = createReport()
    const generated = {
      css: generateCssVariables(report),
      tailwind: generateTailwindConfig(report),
      json: generateJsonToken(report),
      prompt: generatePrompt(report, 'en'),
      markdown: generateMarkdown(report, 'zh'),
    }

    const gate = validateGeneratedExports({
      ...generated,
      css: `${generated.css}\n:root { --broken-token: 1px | 2px; }`,
    })

    expect(gate.status).toBe('fail')
    expect(gate.failureReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        checkId: 'css-export-validity',
        severity: 'blocking',
      }),
    ]))
  })
})
