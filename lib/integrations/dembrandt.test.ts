import { describe, expect, it, vi } from 'vitest'
import { createFixtureReport } from '@/test/fixtures/dembrandt-report-fixture'
import {
  applyDembrandtExtraction,
  buildDembrandtDesignMd,
  buildDembrandtDtcg,
  buildDembrandtDrift,
  buildDembrandtFindings,
  buildDembrandtTailwindTheme,
  extractDembrandtBranding,
} from '@/lib/integrations/dembrandt'
import { extractBranding } from 'dembrandt/extractors'
import { chromium } from 'playwright'

const nativeDembrandtResult = vi.hoisted(() => ({
  url: 'https://example.com',
  extractedAt: '2026-08-25T00:00:00.000Z',
  siteName: 'Example',
  colors: {
    palette: [
      {
        color: '#111111',
        normalized: '#111111',
        count: 3,
        confidence: 'high',
        role: 'primary',
      },
    ],
    semantic: {
      primary: '#111111',
      background: '#ffffff',
      surface: '#ffffff',
      'on-surface': '#000000',
    },
    cssVariables: {},
    rawColors: [],
  },
  typography: {
    styles: [
      {
        context: 'heading',
        family: 'Inter',
        size: '48px',
        weight: '700',
        lineHeight: '56px',
        letterSpacing: '0',
      },
    ],
    sources: {},
  },
  spacing: {
    scaleType: 'base-8',
    commonValues: [
      { px: 8, display: '8px' },
    ],
  },
  borderRadius: {
    values: [
      { value: '12px', count: 2, confidence: 'high' },
    ],
  },
  borders: {
    widths: [
      { value: '1px', count: 1, confidence: 'high' },
    ],
    styles: [
      { value: 'solid', count: 1, confidence: 'high' },
    ],
    colors: [
      { value: '#111111', count: 1, confidence: 'high' },
    ],
  },
  shadows: [
    { shadow: '0 4px 12px rgba(0,0,0,0.1)', count: 1, confidence: 'high' },
  ],
  gradients: [],
  motion: {
    durations: [
      { value: '150ms', ms: 150, count: 1 },
    ],
    easings: [
      { value: 'ease', count: 1 },
    ],
    animations: [],
    interactiveDeltas: [],
  },
  components: {
    buttons: [],
    inputs: [],
    links: [],
    badges: [],
  },
  breakpoints: [
    { px: 1024 },
  ],
  iconSystem: [
    { name: 'lucide', type: 'library', sizes: ['16', '20'] },
  ],
  frameworks: [
    { name: 'Next.js', confidence: 'high' },
  ],
  wcag: [
    { fg: '#000000', bg: '#ffffff', ratio: 21, aa: true, aaLarge: true, aaa: true },
  ],
  note: '',
  isCanvasOnly: false,
}))

vi.mock('dembrandt/markdown', () => ({ generateDesignMd: vi.fn(() => 'mock-design-md') }))
vi.mock('dembrandt/dtcg-export', () => ({ toDtcgTokens: vi.fn(() => ({ mocked: true })) }))
vi.mock('dembrandt/findings', () => ({ computeFindings: vi.fn(() => ({
  findings: [{ category: 'contrast', severity: 'warn' }],
  consistency: 99,
  contrast: 100,
  coverage: { present: 6, total: 6 },
})) }))
vi.mock('dembrandt/drift', () => ({ computeDrift: vi.fn(() => ({ score: 0, status: 'stable' })) }))
vi.mock('@/lib/integrations/dembrandt-tailwind', () => ({ generateTailwindTheme: vi.fn(() => 'mock-tailwind') }))
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(async () => ({ close: vi.fn() })),
  },
}))
vi.mock('dembrandt/extractors', () => ({
  extractBranding: vi.fn(async () => nativeDembrandtResult),
}))

describe('dembrandt bridge', () => {
  it('calls the official Dembrandt extractor for URL input', async () => {
    const result = await extractDembrandtBranding('https://example.com')

    expect(result).toBe(nativeDembrandtResult)
    expect(vi.mocked(chromium.launch)).toHaveBeenCalledWith({ headless: true })
    expect(vi.mocked(extractBranding)).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        start: expect.any(Function),
        stop: expect.any(Function),
        succeed: expect.any(Function),
        fail: expect.any(Function),
        warn: expect.any(Function),
        info: expect.any(Function),
      }),
      expect.any(Object),
      expect.objectContaining({ reveal: true, wcag: true })
    )
  })

  it('delegates DESIGN.md generation to Dembrandt', () => {
    expect(buildDembrandtDesignMd(createFixtureReport())).toBe('mock-design-md')
  })

  it('delegates DTCG generation to Dembrandt', () => {
    expect(buildDembrandtDtcg(createFixtureReport())).toEqual({ mocked: true })
  })

  it('delegates Tailwind theme generation to Dembrandt', () => {
    expect(buildDembrandtTailwindTheme(createFixtureReport())).toBe('mock-tailwind')
  })

  it('delegates findings generation to Dembrandt', () => {
    expect(buildDembrandtFindings(createFixtureReport()).findings[0].category).toBe('contrast')
  })

  it('delegates drift computation to Dembrandt', () => {
    expect(buildDembrandtDrift(createFixtureReport(), createFixtureReport()).status).toBe('stable')
  })

  it('uses the attached native result instead of rebuilding a bridge report', () => {
    const report = applyDembrandtExtraction(createFixtureReport(), nativeDembrandtResult as never)

    expect(report.dembrandtResult).toBe(nativeDembrandtResult)
    expect(report.colors[0].hex).toBe('#111111')
    expect(report.colorSystem?.primaryAction?.hex).toBe('#111111')
    expect(report.typography.fontFamily).toBe('Inter')
    expect(report.designDetails.cssRadius).toBe('12px')
    expect(report.pageAnalysis?.auditSummary?.designSystem?.summary).toContain('Dembrandt findings')
    expect(report.pageAnalysis?.auditSummary?.accessibility?.summary).toContain('Dembrandt WCAG pairs')
  })
})
