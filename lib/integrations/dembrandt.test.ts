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
  gradients: [
    { gradient: 'linear-gradient(90deg, #111111, #ffffff)', type: 'linear', stopColors: ['#111111', '#ffffff'], count: 1 },
  ],
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
    buttons: [
      {
        states: {
          default: {
            backgroundColor: '#111111',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '10px 20px',
            border: '1px solid #111111',
          },
          hover: {
            backgroundColor: '#222222',
            color: '#ffffff',
          },
        },
        text: 'Start',
        fontWeight: '700',
        fontSize: '15px',
        classes: '.cta',
      },
    ],
    inputs: [
      {
        states: {
          default: {
            backgroundColor: '#ffffff',
            color: '#111111',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid #dddddd',
          },
          focus: {
            border: '1px solid #111111',
          },
        },
        type: 'text',
      },
    ],
    links: [
      {
        states: {
          default: { color: '#111111' },
          hover: { color: '#222222', textDecoration: 'underline' },
        },
        fontWeight: '500',
      },
    ],
    badges: {
      all: [
        {
          backgroundColor: '#f5f5f5',
          color: '#111111',
          borderRadius: '999px',
          padding: '4px 10px',
          fontSize: '12px',
        },
      ],
    },
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
      expect.objectContaining({
        reveal: true,
        wcag: true,
        mobile: true,
        slow: true,
        keepAnimations: true,
        includeRawColors: true,
      })
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
    expect(report.gradients[0].css).toBe('linear-gradient(90deg, #111111, #ffffff)')
    expect(report.typography.fontFamily).toBe('Inter')
    expect(report.designDetails.cssRadius).toBe('12px')
    expect(report.designDetails.iconEn).toBe('lucide')
    expect(report.designDetails.signatureEn).toBe('Next.js')
    expect(report.pageAnalysis?.typographyTokens[0].fontFamily).toBe('Inter')
    expect(report.pageAnalysis?.spacingTokens[0].value).toBe('8px')
    expect(report.pageAnalysis?.radiusTokens[0].value).toBe('12px')
    expect(report.pageAnalysis?.shadowTokens[0].value).toBe('0 4px 12px rgba(0,0,0,0.1)')
    expect(report.pageAnalysis?.borderTokens?.[0].width).toBe('1px')
    expect(report.pageAnalysis?.transitionTokens?.[0].duration).toBe('150ms')
    expect(report.pageAnalysis?.buttonSnapshots?.[0].text).toBe('Start')
    expect(report.pageAnalysis?.inputSnapshots?.[0].borderRadius).toBe('8px')
    expect(report.pageAnalysis?.tagSnapshots?.[0].borderRadius).toBe('999px')
    expect(report.pageAnalysis?.stateTokens?.button?.[0].state).toBe('hover')
    expect(report.pageAnalysis?.stateTokens?.link?.[0].state).toBe('hover')
    expect(report.pageAnalysis?.pageMaxWidth).toBe('1024px')
    expect(report.pageAnalysis?.evidenceSummary?.notes).toContain('Dembrandt native extraction')
    expect(report.pageAnalysis?.auditSummary?.designSystem?.summary).toContain('Dembrandt findings')
    expect(report.pageAnalysis?.auditSummary?.accessibility?.summary).toContain('Dembrandt WCAG pairs')
  })
})
