import { describe, expect, it } from 'vitest'
import { createFixtureReport } from '@/test/fixtures/dembrandt-report-fixture'
import {
  applyDembrandtExtraction,
  buildDembrandtDesignMd,
  buildDembrandtDtcg,
  buildDembrandtDrift,
  buildDembrandtFindings,
  buildDembrandtTailwindTheme,
} from '@/lib/integrations/dembrandt'

describe('dembrandt bridge smoke', () => {
  it('runs the real Dembrandt formatters on the fixture report', () => {
    const report = applyDembrandtExtraction(createFixtureReport(), {
      url: 'https://example.com',
      extractedAt: '2026-08-25T00:00:00.000Z',
      siteName: 'Example',
      colors: {
        palette: [
          { color: '#111111', normalized: '#111111', count: 3, confidence: 'high', role: 'primary' },
          { color: '#FFFFFF', normalized: '#FFFFFF', count: 2, confidence: 'high', role: 'surface' },
        ],
        semantic: {
          primary: '#111111',
          surface: '#FFFFFF',
          background: '#FFFFFF',
          'on-surface': '#111111',
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
          {
            context: 'body',
            family: 'Inter',
            size: '16px',
            weight: '400',
            lineHeight: '24px',
            letterSpacing: '0',
          },
        ],
        sources: {},
      },
      spacing: {
        scaleType: 'base-8',
        commonValues: [{ px: 8, display: '8px' }],
      },
      borderRadius: {
        values: [{ value: '12px', count: 2, confidence: 'high' }],
      },
      borders: {
        widths: [{ value: '1px', count: 1, confidence: 'high' }],
        styles: [{ value: 'solid', count: 1, confidence: 'high' }],
        colors: [{ value: '#111111', count: 1, confidence: 'high' }],
      },
      shadows: [{ shadow: '0 4px 12px rgba(0,0,0,0.1)', count: 1, confidence: 'high' }],
      gradients: [],
      motion: {
        durations: [{ value: '150ms', ms: 150, count: 1 }],
        easings: [{ value: 'ease', count: 1 }],
        animations: [],
        interactiveDeltas: [],
      },
      components: { buttons: [], inputs: [], links: [], badges: [] },
      breakpoints: [{ px: 1024 }],
      iconSystem: [{ name: 'lucide', type: 'library', sizes: ['16', '20'] }],
      frameworks: [{ name: 'Next.js', confidence: 'high' }],
      wcag: [{ fg: '#111111', bg: '#FFFFFF', ratio: 21, aa: true, aaLarge: true, aaa: true }],
      note: '',
      isCanvasOnly: false,
    } as never)

    const designMd = buildDembrandtDesignMd(report)
    const dtcg = buildDembrandtDtcg(report)
    const tailwind = buildDembrandtTailwindTheme(report)
    const findings = buildDembrandtFindings(report)
    const drift = buildDembrandtDrift(report, report)

    expect(designMd).toContain('# Design System')
    expect(designMd).toContain('## Overview')
    expect(tailwind).toContain('@theme')
    expect(Object.keys(dtcg)).not.toHaveLength(0)
    expect(findings.coverage.total).toBe(6)
    expect(findings.findings.length).toBeGreaterThanOrEqual(0)
    expect(drift.status).toBe('stable')
    expect(drift.score).toBe(0)
  })
})
