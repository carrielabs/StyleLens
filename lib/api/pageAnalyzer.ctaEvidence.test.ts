/**
 * @vitest-environment node
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { analyzePageStylesFromPage } from '@/lib/api/pageAnalyzer'

describe('pageAnalyzer CTA visual evidence', () => {
  let browser: Browser

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true })
  })

  afterAll(async () => {
    await browser?.close()
  })

  it('uses a CTA child paint layer as primary action evidence', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    try {
      await page.setContent(`
        <main>
          <section class="hero">
            <h1>Design systems that ship</h1>
            <a class="hero-cta" href="/start">
              <span class="hero-cta-fill"></span>
              <span class="hero-cta-label">Get started</span>
            </a>
          </section>
        </main>
        <style>
          body { margin: 0; background: #ffffff; color: #171717; font-family: Inter, sans-serif; }
          .hero { min-height: 520px; padding: 96px; background: #f7f7f4; }
          .hero-cta {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 168px;
            height: 48px;
            padding: 0 24px;
            color: #ffffff;
            background: transparent;
            border-radius: 999px;
            overflow: hidden;
            text-decoration: none;
          }
          .hero-cta-fill {
            position: absolute;
            inset: 0;
            background: #14b86a;
            border-radius: inherit;
          }
          .hero-cta-label { position: relative; z-index: 1; font-weight: 700; }
        </style>
      `)

      const analysis = await analyzePageStylesFromPage(page, 'https://fixture.local/child-cta')

      expect(analysis.semanticColorSystem?.primaryAction?.hex).toBe('#14B86A')
      expect(analysis.colorCandidates).toEqual(expect.arrayContaining([
        expect.objectContaining({
          hex: '#14B86A',
          property: 'cta-background',
          roleHints: expect.arrayContaining(['primary', 'cta', 'background']),
          componentKinds: expect.arrayContaining(['button']),
        }),
      ]))
    } finally {
      await page.close()
    }
  })

  it('uses a CTA pseudo-element paint layer as primary action evidence', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    try {
      await page.setContent(`
        <main>
          <section class="hero">
            <h1>Convert faster</h1>
            <a class="demo-cta" href="/demo">Request a demo</a>
          </section>
        </main>
        <style>
          body { margin: 0; background: #ffffff; color: #111111; font-family: Inter, sans-serif; }
          .hero { min-height: 520px; padding: 96px; background: #faf8f2; }
          .demo-cta {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 180px;
            height: 48px;
            padding: 0 24px;
            color: #ffffff;
            background: transparent;
            border-radius: 12px;
            overflow: hidden;
            text-decoration: none;
          }
          .demo-cta::before {
            content: "";
            position: absolute;
            inset: 0;
            background: #6e56cf;
            border-radius: inherit;
          }
        </style>
      `)

      const analysis = await analyzePageStylesFromPage(page, 'https://fixture.local/pseudo-cta')

      expect(analysis.semanticColorSystem?.primaryAction?.hex).toBe('#6E56CF')
      expect(analysis.colorCandidates).toEqual(expect.arrayContaining([
        expect.objectContaining({
          hex: '#6E56CF',
          property: 'cta-background',
          roleHints: expect.arrayContaining(['primary', 'cta', 'background']),
          componentKinds: expect.arrayContaining(['button']),
        }),
      ]))
    } finally {
      await page.close()
    }
  })

  it('keeps top navigation evidence and normalizes duplicated Framer CTA text', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    try {
      await page.setContent(`
        <nav class="framer-nav">
          <a class="brand" href="/">ANESHANESH</a>
          <a class="framer-link" href="/#projects">WORKSWORKS</a>
          <a class="framer-link" href="/#about">ABOUTABOUT</a>
          <a class="framer-link" href="/#footer">CONTACTCONTACT</a>
        </nav>
        <main>
          <section class="hero">
            <h1>Selected design work</h1>
          </section>
        </main>
        <style>
          body { margin: 0; background: #2c2c2c; color: #000000; font-family: Inter, sans-serif; }
          .framer-nav {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            min-height: 96px;
            padding: 32px 56px;
          }
          .framer-link {
            display: flex;
            color: #eb5939;
            font-size: 16px;
            text-decoration: none;
          }
          .hero { min-height: 520px; padding: 96px; background: #0d0d0d; }
        </style>
      `)

      const analysis = await analyzePageStylesFromPage(page, 'https://fixture.local/framer-nav')

      expect(analysis.componentEvidence?.navigation.count).toBeGreaterThan(0)
      expect(analysis.componentEvidence?.button.count).toBeGreaterThan(0)
      expect(analysis.componentEvidence?.cta.count).toBeGreaterThan(0)
      expect(analysis.colorCandidates).toEqual(expect.arrayContaining([
        expect.objectContaining({
          property: 'cta-foreground',
          roleHints: expect.arrayContaining(['primary', 'cta']),
          componentKinds: expect.arrayContaining(['button']),
        }),
      ]))
    } finally {
      await page.close()
    }
  })
})
