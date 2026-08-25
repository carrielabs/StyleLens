/**
 * @vitest-environment node
 */

import { describe, expect, it, vi } from 'vitest'
import { extractStyleWithAI } from '@/lib/api/aiExtract'
import { buildDembrandtDrift, buildStyleReportFromDembrandt, extractDembrandtBranding } from '@/lib/integrations/dembrandt'

const report = {
  sourceType: 'url',
  sourceLabel: 'https://example.com',
  thumbnailUrl: 'https://example.com/screenshot.png',
  summary: 'Dembrandt extracted design system for example.com.',
  tags: ['Dembrandt'],
  colors: [],
  gradients: [],
  typography: {
    fontFamily: 'Inter',
    confidence: 'identified',
    headingWeight: 700,
    bodyWeight: 400,
    fontSizeScale: '16px',
    lineHeight: '1.5',
    letterSpacing: 'normal',
    alignment: 'left',
    textTreatment: 'solid',
  },
  designDetails: {
    overallStyle: 'example.com',
    colorMode: 'light',
    borderRadius: '8px',
    shadowStyle: 'none',
    spacingSystem: 'base-8',
    borderStyle: 'none',
    animationTendency: 'measured motion',
    imageHandling: 'observed',
    layoutStructure: 'single layout',
  },
  createdAt: '2026-08-25T00:00:00.000Z',
}

vi.mock('@/lib/integrations/dembrandt', () => ({
  extractDembrandtBranding: vi.fn(async () => ({ url: 'https://example.com' })),
  buildStyleReportFromDembrandt: vi.fn(() => report),
  buildDembrandtDrift: vi.fn(() => ({ status: 'stable', score: 0, changes: [] })),
}))

describe('URL extraction with Dembrandt', () => {
  it('returns a Dembrandt-native report without requiring Gemini keys', async () => {
    delete process.env.STYLELENS_GEMINI_API_KEY
    delete process.env.STYLELENS_GEMINI_API_KEY_2
    delete process.env.STYLELENS_GEMINI_API_KEY_3
    delete process.env.STYLELENS_GEMINI_API_KEY_4

    const result = await extractStyleWithAI({
      sourceType: 'url',
      sourceLabel: 'https://example.com',
      screenshotUrl: 'https://example.com/screenshot.png',
      dembrandtOptions: {
        crawl: 3,
        sitemap: true,
        darkMode: true,
        cookie: 'session=redacted',
      },
    })

    expect(result).toBe(report)
    expect(vi.mocked(extractDembrandtBranding)).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        crawl: 3,
        sitemap: true,
        darkMode: true,
        cookie: 'session=redacted',
      })
    )
    expect(vi.mocked(buildStyleReportFromDembrandt)).toHaveBeenCalledWith(
      { url: 'https://example.com' },
      expect.objectContaining({
        sourceType: 'url',
        sourceLabel: 'https://example.com',
        thumbnailUrl: 'https://example.com/screenshot.png',
      })
    )
    expect(vi.mocked(buildDembrandtDrift)).not.toHaveBeenCalled()
  })

  it('adds Dembrandt drift audit when a baseline report is provided', async () => {
    const reportWithAnalysis = {
      ...report,
      pageAnalysis: {
        colorCandidates: [],
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
        sourceCount: { inlineStyleBlocks: 0, linkedStylesheets: 0 },
      },
    }
    vi.mocked(buildStyleReportFromDembrandt).mockReturnValueOnce(reportWithAnalysis as never)
    vi.mocked(buildDembrandtDrift).mockReturnValueOnce({
      status: 'drift',
      score: 42,
      changes: [{ category: 'color', kind: 'changed', label: 'primary' }],
    } as never)

    const result = await extractStyleWithAI({
      sourceType: 'url',
      sourceLabel: 'https://example.com',
      screenshotUrl: 'https://example.com/screenshot.png',
      dembrandtBaseline: report as never,
    })

    expect(vi.mocked(buildDembrandtDrift)).toHaveBeenCalledWith(report, result)
    expect(result.pageAnalysis?.auditSummary?.designDrift?.status).toBe('failed')
    expect(result.pageAnalysis?.auditSummary?.designDrift?.summary).toBe('Dembrandt drift: 42')
    expect(result.pageAnalysis?.auditSummary?.designDrift?.findingsCount).toBe(1)
  })
})
