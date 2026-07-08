/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import type { PageStyleAnalysis, StyleReport } from '@/lib/types'
import {
  applyMeasuredUrlSignals,
  buildAiExtractionPrompt,
  deriveAiShellFallback,
  recoverShellSemanticSlots
} from '@/lib/api/aiExtract'

function emptyAnalysis(overrides: Partial<PageStyleAnalysis> = {}): PageStyleAnalysis {
  return {
    colorCandidates: [],
    semanticColorSystem: undefined,
    typographyCandidates: [],
    typographyTokens: [],
    radiusCandidates: [],
    radiusTokens: [],
    shadowCandidates: [],
    shadowTokens: [],
    spacingCandidates: [],
    spacingTokens: [],
    layoutHints: [],
    layoutEvidence: [],
    stateTokens: {},
    cssTextExcerpt: '',
    sourceCount: { inlineStyleBlocks: 0, linkedStylesheets: 0 },
    ...overrides,
  }
}

function baseParsed(colors: StyleReport['colors']) {
  return {
    summary: 'test',
    summaryEn: 'test',
    summaryZh: 'test',
    tags: [],
    tagsEn: [],
    tagsZh: [],
    colors,
    colorSystem: undefined,
    gradients: [],
    typography: {
      fontFamily: 'Inter',
      confidence: 'identified' as const,
      headingWeight: 700,
      bodyWeight: 400,
      fontSizeScale: '16px',
      lineHeight: '1.5',
      letterSpacing: 'normal',
      alignment: 'left' as const,
      textTreatment: 'solid' as const,
      googleFontsAlt: 'Inter',
    },
    designDetails: {
      overallStyle: 'Minimal',
      colorMode: 'light' as const,
      borderRadius: '8px',
      shadowStyle: 'subtle',
      spacingSystem: '8px base',
      borderStyle: 'soft',
      animationTendency: 'subtle',
      imageHandling: 'contained',
      layoutStructure: 'grid',
    },
  }
}

describe('aiExtract shell recovery', () => {
  it('builds prompt with measured pageAnalysis signals and prioritization rules', () => {
    const prompt = buildAiExtractionPrompt({
      sourceType: 'url',
      pageAnalysis: emptyAnalysis({
        stateTokens: {
          button: [{
            value: '#111111',
            property: 'background-color',
            state: 'hover',
            componentKinds: ['button'],
            evidenceScore: 1,
            measured: true,
          }],
        },
        layoutEvidence: [
          {
            label: 'Hero split layout',
            kind: 'hero',
            sampleCount: 1,
            componentKinds: ['section'],
            evidenceScore: 1,
          },
        ],
      }),
    } as any)

    expect(prompt).toContain('stateTokens')
    expect(prompt).toContain('pageSections')
    expect(prompt).toContain('viewportSlices')
    expect(prompt).toContain('Prefer measured pageAnalysis signals first')
    expect(prompt).toContain('Use screenshot evidence only as supporting context')
  })

  it('derives page shell from AI colors when only hero semantic slots exist', () => {
    const fallback = deriveAiShellFallback([
      {
        role: 'background',
        hex: '#001040',
        rgb: 'rgb(0, 16, 64)',
        hsl: 'hsl(225,100%,13%)',
        name: 'Hero',
        description: 'hero',
      },
      {
        role: 'surface',
        hex: '#F0F0F0',
        rgb: 'rgb(240, 240, 240)',
        hsl: 'hsl(0,0%,94%)',
        name: 'Shell',
        description: 'shell',
      },
      {
        role: 'surface',
        hex: '#FFFFFF',
        rgb: 'rgb(255, 255, 255)',
        hsl: 'hsl(0,0%,100%)',
        name: 'Surface',
        description: 'surface',
      },
      {
        role: 'text',
        hex: '#2C2C2B',
        rgb: 'rgb(44, 44, 43)',
        hsl: 'hsl(60,1%,17%)',
        name: 'Text',
        description: 'text',
      },
    ])

    expect(fallback.pageBackground?.hex).toBe('#F0F0F0')
    expect(fallback.surface?.hex).toBe('#FFFFFF')
    expect(fallback.textPrimary?.hex).toBe('#2C2C2B')
  })

  it('recovers screenshot shell semantic slots into pageAnalysis', () => {
    const analysis = recoverShellSemanticSlots(emptyAnalysis({
      colorCandidates: [
        {
          hex: '#FFFFFF',
          property: 'screenshot-content',
          count: 12,
          roleHints: ['background'],
          layerHints: ['content'],
          evidenceScore: 12,
        },
        {
          hex: '#F0F0F0',
          property: 'screenshot-content',
          count: 10,
          roleHints: ['background'],
          layerHints: ['content'],
          evidenceScore: 10,
        },
        {
          hex: '#E0E0E0',
          property: 'screenshot-content',
          count: 8,
          roleHints: ['surface'],
          layerHints: ['content'],
          evidenceScore: 8,
        },
      ],
      semanticColorSystem: {
        heroBackground: {
          role: 'background',
          hex: '#001040',
          rgb: 'rgb(0, 16, 64)',
          hsl: '',
          name: 'Hero Background',
          description: 'hero',
        },
      },
    }))

    expect(analysis.semanticColorSystem?.heroBackground?.hex).toBe('#001040')
    expect(analysis.semanticColorSystem?.pageBackground?.hex).toBe('#F0F0F0')
    expect(analysis.semanticColorSystem?.surface?.hex).toBe('#FFFFFF')
  })

  it('applies shell fallback to final colorSystem even when pageAnalysis has hero-only semantic slots', () => {
    const parsed = applyMeasuredUrlSignals(
      baseParsed([
        {
          role: 'background',
          hex: '#001040',
          rgb: 'rgb(0, 16, 64)',
          hsl: 'hsl(225,100%,13%)',
          name: 'Hero',
          description: 'hero',
        },
        {
          role: 'surface',
          hex: '#F0F0F0',
          rgb: 'rgb(240, 240, 240)',
          hsl: 'hsl(0,0%,94%)',
          name: 'Shell',
          description: 'shell',
        },
        {
          role: 'surface',
          hex: '#FFFFFF',
          rgb: 'rgb(255, 255, 255)',
          hsl: 'hsl(0,0%,100%)',
          name: 'Surface',
          description: 'surface',
        },
        {
          role: 'text',
          hex: '#2C2C2B',
          rgb: 'rgb(44, 44, 43)',
          hsl: 'hsl(60,1%,17%)',
          name: 'Text',
          description: 'text',
        },
      ]),
      emptyAnalysis({
        semanticColorSystem: {
          heroBackground: {
            role: 'background',
            hex: '#001040',
            rgb: 'rgb(0, 16, 64)',
            hsl: '',
            name: 'Hero Background',
            description: 'hero',
          },
          heroPrimaryAction: {
            role: 'primary',
            hex: '#4060E0',
            rgb: 'rgb(64, 96, 224)',
            hsl: '',
            name: 'Action',
            description: 'action',
          },
        },
      })
    )

    expect(parsed.colorSystem?.heroBackground?.hex).toBe('#001040')
    expect(parsed.colorSystem?.pageBackground?.hex).toBe('#F0F0F0')
    expect(parsed.colorSystem?.surface?.hex).toBe('#FFFFFF')
    expect(parsed.colorSystem?.textPrimary?.hex).toBe('#2C2C2B')
  })

  it('derives measured typography from typographyCandidates when typographyTokens are missing reliable sizes', () => {
    const parsed = applyMeasuredUrlSignals(
      baseParsed([]),
      emptyAnalysis({
        typographyCandidates: [
          {
            fontFamily: 'Inter',
            fontSize: '48px',
            fontWeight: '700',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            count: 4,
            evidenceScore: 9,
          },
          {
            fontFamily: 'Inter',
            fontSize: '32px',
            fontWeight: '600',
            lineHeight: '1.2',
            letterSpacing: '-0.01em',
            count: 6,
            evidenceScore: 8,
          },
          {
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: 'normal',
            count: 12,
            evidenceScore: 7,
          },
        ],
        typographyTokens: [
          {
            id: 'typo-1',
            label: 'Display',
            fontFamily: 'Inter',
            fontSize: 'NaNpx',
            fontWeight: '700',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            usage: 'display',
            sampleCount: 2,
            componentKinds: [],
            evidenceScore: 5,
          },
        ],
      })
    )

    expect(parsed.typography.fontFamily).toBe('Inter')
    expect(parsed.typography.fontSizeScale).toBe('48px / 32px / 16px')
    expect(parsed.typography.headingWeight).toBe(700)
    expect(parsed.typography.bodyWeight).toBe(400)
    expect(parsed.typography.lineHeight).toBe('1.1')
    expect(parsed.typography.letterSpacing).toBe('-0.02em')
  })
})
