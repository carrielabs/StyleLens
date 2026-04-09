/**
 * @vitest-environment node
 */

import type { PageStyleAnalysis } from '@/lib/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { analyzePageStyles } from '@/lib/api/pageAnalyzer'

const TARGETS = [
  'https://linear.app',
  'https://stripe.com',
  'https://www.apple.com',
  'https://www.notion.com/',
]

function createPageAnalysis(overrides: Partial<PageStyleAnalysis> = {}): PageStyleAnalysis {
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
    borderTokens: [],
    transitionTokens: [],
    buttonSnapshots: [],
    inputSnapshots: [],
    cardSnapshots: [],
    tagSnapshots: [],
    pageSections: [],
    viewportSlices: [],
    cssTextExcerpt: '',
    evidenceSummary: {
      overallConfidence: 'medium',
      totalEvidenceCount: 1,
      sourceBreakdown: {},
      confidenceBreakdown: {},
    },
    coverageSummary: {
      overallCoverage: 1,
      coveredAreas: [],
      missingAreas: [],
    },
    interactionSummary: {
      hasInteractiveSignals: false,
      measuredStates: [],
      componentKinds: [],
      transitionCount: 0,
    },
    auditSummary: {
      cssAnalyzer: {
        status: 'not-run',
      },
    },
    sourceCount: {
      inlineStyleBlocks: 0,
      linkedStylesheets: 0,
    },
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('screenshotter viewport aggregation', () => {
  it('aggregates pageAnalysis across desktop and mobile while keeping one primary screenshot', async () => {
    const desktopAnalysis = createPageAnalysis({
      typographyTokens: [
        {
          id: 'desktop-heading',
          label: 'Desktop Heading',
          fontFamily: 'Inter',
          fontSize: '48px',
          fontWeight: '700',
          lineHeight: '56px',
          letterSpacing: '-0.02em',
          usage: 'heading',
          sampleCount: 4,
          componentKinds: ['text'],
          evidenceScore: 80,
        },
      ],
      radiusTokens: [
        {
          value: '12px',
          label: 'Large Radius',
          sampleCount: 3,
          componentKinds: ['button'],
          evidenceScore: 60,
        },
      ],
      layoutEvidence: [
        {
          label: 'Desktop hero split layout',
          kind: 'hero',
          sampleCount: 2,
          componentKinds: ['section'],
          evidenceScore: 40,
        },
      ],
      cssTextExcerpt: '.hero { display:grid; }',
    })

    const mobileAnalysis = createPageAnalysis({
      shadowTokens: [
        {
          value: '0 12px 24px rgba(0,0,0,0.12)',
          label: 'Card Shadow',
          sampleCount: 2,
          componentKinds: ['card'],
          evidenceScore: 50,
        },
      ],
      spacingTokens: [
        {
          value: '16px',
          label: 'Base Spacing',
          sampleCount: 5,
          componentKinds: ['section'],
          evidenceScore: 55,
        },
      ],
      stateTokens: {
        button: [
          {
            value: '#111111',
            property: 'background-color',
            state: 'hover',
            componentKinds: ['button'],
            evidenceScore: 42,
            measured: true,
          },
        ],
      },
      pageSections: [
        {
          index: 0,
          purpose: 'hero',
          layout: 'full-width',
          columns: 1,
          hasCTA: true,
          hasImage: false,
          measured: true,
        },
      ],
      viewportSlices: [
        {
          index: 0,
          yStartPct: 0,
          yEndPct: 50,
          dominantSectionId: 'hero-0',
        },
      ],
      cssTextExcerpt: '.cta { padding:16px; }',
    })

    const analyzePageStylesFromPage = vi.fn()
      .mockResolvedValueOnce(desktopAnalysis)
      .mockResolvedValueOnce(mobileAnalysis)

    const page = {
      addInitScript: vi.fn().mockResolvedValue(undefined),
      addStyleTag: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(true),
      route: vi.fn().mockResolvedValue(undefined),
      goto: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('desktop-primary')),
      setViewportSize: vi.fn().mockResolvedValue(undefined),
      content: vi.fn().mockResolvedValue('<html></html>'),
    }

    const context = {
      newPage: vi.fn().mockResolvedValue(page),
    }

    const browser = {
      version: () => '136.0.0.0',
      newContext: vi.fn().mockResolvedValue(context),
      close: vi.fn().mockResolvedValue(undefined),
    }

    vi.doMock('playwright', () => ({
      chromium: {
        launch: vi.fn().mockResolvedValue(browser),
      },
    }))

    vi.doMock('@/lib/api/pageAnalyzer', () => ({
      analyzePageStyles: vi.fn(),
      analyzePageStylesFromPage,
      sanitizePageAnalysis: vi.fn(value => value),
    }))

    const { captureScreenshot } = await import('@/lib/api/screenshotter')
    const result = await captureScreenshot('https://www.notion.com/viewport-aggregation-test')

    expect(result.success).toBe(true)
    expect(result.screenshotUrl).toMatch(/^data:image\/jpeg;base64,/)
    expect(page.screenshot).toHaveBeenCalledTimes(1)
    expect(page.setViewportSize).toHaveBeenCalledTimes(1)
    expect(page.setViewportSize).toHaveBeenCalledWith({ width: 390, height: 844 })
    expect(analyzePageStylesFromPage).toHaveBeenCalledTimes(2)
    expect(result.pageAnalysis?.typographyTokens.map(token => token.id)).toContain('desktop-heading')
    expect(result.pageAnalysis?.radiusTokens.map(token => token.value)).toContain('12px')
    expect(result.pageAnalysis?.shadowTokens.map(token => token.value)).toContain('0 12px 24px rgba(0,0,0,0.12)')
    expect(result.pageAnalysis?.spacingTokens.map(token => token.value)).toContain('16px')
    expect(result.pageAnalysis?.layoutEvidence.map(item => item.label)).toContain('Desktop hero split layout')
    expect(result.pageAnalysis?.stateTokens?.button).toHaveLength(1)
    expect(result.pageAnalysis?.pageSections).toHaveLength(1)
    expect(result.pageAnalysis?.viewportSlices).toHaveLength(1)
    expect(result.extractedCss).toContain('.hero')
  })
})

describe('pageAnalyzer real-world verification', () => {
  for (const url of TARGETS) {
    it(
      `extracts semantic color slots for ${url}`,
      async () => {
        const analysis = await analyzePageStyles(url)

        const summary = {
          url,
          heroBackground: analysis.semanticColorSystem?.heroBackground?.hex,
          pageBackground: analysis.semanticColorSystem?.pageBackground?.hex,
          surface: analysis.semanticColorSystem?.surface?.hex,
          textPrimary: analysis.semanticColorSystem?.textPrimary?.hex,
          primaryAction: analysis.semanticColorSystem?.primaryAction?.hex,
          contentColors: analysis.semanticColorSystem?.contentColors?.map(color => color.hex) || [],
          topCandidates: analysis.colorCandidates.slice(0, 8).map(candidate => ({
            hex: candidate.hex,
            property: candidate.property,
            hints: candidate.roleHints,
            layers: candidate.layerHints,
            score: candidate.evidenceScore,
          })),
        }

        console.log(JSON.stringify(summary, null, 2))

        expect(analysis.colorCandidates.length).toBeGreaterThan(0)
        expect(analysis.semanticColorSystem).toBeDefined()
        expect(
          analysis.semanticColorSystem?.heroBackground
          || analysis.semanticColorSystem?.pageBackground
        ).toBeDefined()
        expect(analysis.semanticColorSystem?.textPrimary).toBeDefined()
      },
      60_000
    )
  }
})
