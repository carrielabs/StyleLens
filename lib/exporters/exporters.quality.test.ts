import { describe, expect, it } from 'vitest'
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
  const pageBackground = color('#0B0D10', 'background', 'page background')
  const surface = color('#151922', 'surface', 'surface')
  const primary = color('#6EE7B7', 'primary', 'primary action')
  const text = color('#F8FAFC', 'text', 'primary text')
  const border = color('#2A2F3A', 'border', 'border')

  return {
    sourceType: 'url',
    sourceLabel: 'Fixture',
    summary: 'Restrained product UI with high contrast.',
    summaryEn: 'Restrained product UI with high contrast.',
    summaryZh: '克制、高对比的产品界面。',
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
      bodyWeight: 400,
      fontSizeScale: '16px to 48px',
      lineHeight: '1.5',
      letterSpacing: '0',
      alignment: 'left',
      textTreatment: 'solid',
    },
    designDetails: {
      overallStyle: 'minimal product UI',
      colorMode: 'dark',
      borderRadius: 'medium',
      shadowStyle: 'minimal',
      spacingSystem: '8px grid',
      borderStyle: '1px solid',
      animationTendency: 'subtle',
      imageHandling: 'product screenshots',
      layoutStructure: 'section stack',
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
          fontSize: '48px',
          fontWeight: '700',
          lineHeight: '56px',
          letterSpacing: '0',
          usage: 'heading',
          sampleCount: 6,
          componentKinds: ['text'],
          evidenceScore: 80,
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
          sampleCount: 7,
          componentKinds: ['button', 'card', 'input'],
          evidenceScore: 70,
          meta: {
            source: 'dom-computed',
            confidence: 'high',
            evidenceCount: 7,
          },
        },
      ],
      shadowCandidates: ['none'],
      shadowTokens: [],
      spacingCandidates: ['16px', '24px'],
      spacingTokens: [
        {
          value: '16px',
          label: 'Base spacing',
          sampleCount: 12,
          componentKinds: ['section', 'button'],
          evidenceScore: 72,
          meta: {
            source: 'dom-computed',
            confidence: 'high',
            evidenceCount: 12,
          },
        },
      ],
      layoutHints: ['section stack'],
      layoutEvidence: [],
      stateTokens: {},
      borderTokens: [],
      transitionTokens: [],
      buttonSnapshots: [
        {
          backgroundColor: '#6EE7B7',
          color: '#0B0D10',
          borderRadius: '12px',
          paddingH: '20px',
          paddingV: '10px',
          fontSize: '15px',
          fontWeight: '700',
          border: 'none',
          height: '40px',
        },
      ],
      inputSnapshots: [
        {
          borderRadius: '12px',
          border: '1px solid #2A2F3A',
          paddingH: '12px',
          paddingV: '8px',
          fontSize: '15px',
        },
      ],
      cardSnapshots: [
        {
          backgroundColor: '#151922',
          borderRadius: '12px',
          border: '1px solid #2A2F3A',
          boxShadow: 'none',
          padding: '24px',
        },
      ],
      tagSnapshots: [],
      pageSections: [],
      viewportSlices: [],
      cssTextExcerpt: '',
      evidenceSummary: {
        overallConfidence: 'high',
        totalEvidenceCount: 42,
        sourceBreakdown: {
          'dom-computed': 42,
        },
        confidenceBreakdown: {
          high: 42,
        },
      },
      coverageSummary: {
        overallCoverage: 0.83,
        coveredAreas: ['color', 'typography', 'radius', 'spacing', 'components'],
        missingAreas: ['interaction'],
      },
      interactionSummary: {
        hasInteractiveSignals: false,
        measuredStates: [],
        componentKinds: ['button', 'input', 'card'],
        transitionCount: 0,
      },
      sourceCount: {
        inlineStyleBlocks: 1,
        linkedStylesheets: 0,
      },
    },
    createdAt: '2026-07-18T00:00:00.000Z',
  }
}

describe('export quality gates', () => {
  it('generates a prompt with measured component spacing and evidence instead of placeholders', () => {
    const prompt = generatePrompt(createReport(), 'en')

    expect(prompt).not.toContain('match source visually')
    expect(prompt).toContain('padding: 10px 20px')
    expect(prompt).toContain('padding: 24px')
    expect(prompt).toContain('Evidence Basis')
    expect(prompt).toContain('dom-computed')
    expect(prompt).toContain('Taste DNA')
  })

  it('exports CSS variables for measured component and spacing tokens', () => {
    const css = generateCssVariables(createReport())

    expect(css).toContain('--component-button-padding: 10px 20px;')
    expect(css).toContain('--component-card-padding: 24px;')
    expect(css).toContain('--component-input-padding: 8px 12px;')
    expect(css).toContain('--spacing-16: 16px;')
  })

  it('exports DTCG-shaped tokens with StyleLens evidence extensions', () => {
    const tokenDocument = JSON.parse(generateJsonToken(createReport()))

    expect(tokenDocument.$schema).toContain('designtokens')
    expect(tokenDocument.stylelens.color.action.primary.$type).toBe('color')
    expect(tokenDocument.stylelens.radius['control-radius'].$type).toBe('dimension')
    expect(tokenDocument.stylelens.spacing['measured-16px'].$type).toBe('dimension')
    expect(tokenDocument.stylelens.$extensions.stylelens.evidence.overallConfidence).toBe('high')
    expect(tokenDocument.stylelens.$extensions.stylelens.qualityGate.score).toBeGreaterThanOrEqual(80)
    expect(tokenDocument.stylelens.analysis.qualityGate.status).toBe('pass')
    expect(tokenDocument.stylelens.analysis.colorEvidenceAttribution.slots.primaryAction.source).toBe('dom-computed')

    const markdown = generateMarkdown(createReport(), 'zh')
    expect(markdown).toContain('质量门禁：')
    expect(markdown).toContain('/100 · pass')
  })

  it('does not export pipe-joined radius or shadow variants as single CSS/Tailwind values', () => {
    const report = createReport()
    report.pageAnalysis = undefined
    report.designDetails.cssRadius = '100% | 50px | 1rem | 5em | 4px'
    report.designDetails.cssShadow = '0 .625em 1.875em #0000024d | 0 1px 2px #1820035c'

    const css = generateCssVariables(report)
    const tailwind = generateTailwindConfig(report)

    expect(css).not.toContain('--radius-base: 100% | 50px')
    expect(css).not.toContain('--shadow-base: 0 .625em 1.875em #0000024d | 0 1px')
    expect(css).toContain('--radius-base: 100%;')
    expect(css).toContain('--radius-2: 50px;')
    expect(css).toContain('--shadow-base: 0 .625em 1.875em #0000024d;')
    expect(css).toContain('--shadow-2: 0 1px 2px #1820035c;')
    expect(tailwind).not.toContain("brand: '100% | 50px")
    expect(tailwind).toContain("base: '100%',")
    expect(tailwind).toContain("'2': '50px',")
  })

  it('does not add a no-radius prohibition when mixed radius variants include rounded values', () => {
    const report = createReport()
    report.designDetails.borderRadius = '100% | 50px | 1rem | 0px'
    report.designDetails.cssRadius = '100% | 50px | 1rem | 0px'

    const prompt = generatePrompt(report, 'zh')

    expect(prompt).not.toContain('禁止圆角——此设计使用直角')
  })
})
