/**
 * @vitest-environment node
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { analyzePageStylesFromPage } from '@/lib/api/pageAnalyzer'

describe('pageAnalyzer semantic layout attribution', () => {
  let browser: Browser

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true })
  })

  afterAll(async () => {
    await browser?.close()
  })

  it('attributes hero, navigation, section stack, and repeated card grid from DOM layout evidence', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
    try {
      await page.setContent(`
        <header class="site-header">
          <nav class="top-nav" aria-label="Primary">
            <a href="/">StyleLens</a>
            <a href="/product">Product</a>
            <a href="/pricing">Pricing</a>
            <a class="nav-cta" href="/demo">Request demo</a>
          </nav>
        </header>
        <main>
          <section class="hero">
            <div class="hero-copy">
              <h1>Extract design systems from real websites</h1>
              <p>Turn live pages into evidence-backed colors, typography, components, and layout tokens.</p>
              <a class="hero-button" href="/start">Get started</a>
            </div>
            <div class="hero-media" aria-label="Product preview"></div>
          </section>
          <section class="features">
            <h2>Built for professional extraction</h2>
            <div class="feature-grid">
              <article class="feature-card">
                <h3>Evidence graph</h3>
                <p>Each token records where it came from.</p>
              </article>
              <article class="feature-card">
                <h3>Semantic scoring</h3>
                <p>DOM, CSSOM, and visual geometry agree before export.</p>
              </article>
              <article class="feature-card">
                <h3>Regression gates</h3>
                <p>Real websites keep the extraction pipeline honest.</p>
              </article>
            </div>
          </section>
        </main>
        <style>
          body {
            margin: 0;
            background: #f8f5ef;
            color: #161616;
            font-family: Inter, Arial, sans-serif;
          }
          .site-header {
            position: sticky;
            top: 0;
            z-index: 2;
            background: #ffffff;
            border-bottom: 1px solid #e6e0d5;
          }
          .top-nav {
            width: min(1180px, calc(100vw - 64px));
            height: 72px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 28px;
          }
          .top-nav a {
            color: #161616;
            text-decoration: none;
            font-size: 15px;
            font-weight: 600;
          }
          .nav-cta,
          .hero-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 148px;
            height: 44px;
            padding: 0 22px;
            border-radius: 999px;
            background: #1f8f62;
            color: #ffffff !important;
          }
          .hero {
            min-height: 560px;
            padding: 92px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(360px, 0.86fr);
            gap: 64px;
            align-items: center;
            background: #d7f27d;
          }
          .hero h1 {
            margin: 0 0 20px;
            max-width: 680px;
            font-size: 72px;
            line-height: 0.96;
            letter-spacing: -0.06em;
          }
          .hero p {
            max-width: 560px;
            font-size: 20px;
            line-height: 1.45;
          }
          .hero-media {
            min-height: 360px;
            border-radius: 32px;
            background: #ffffff;
            box-shadow: 0 24px 70px rgba(28, 28, 28, 0.18);
          }
          .features {
            padding: 88px 92px 112px;
            background: #f8f5ef;
          }
          .features h2 {
            margin: 0 0 32px;
            font-size: 44px;
            letter-spacing: -0.04em;
          }
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 24px;
          }
          .feature-card {
            min-height: 180px;
            padding: 28px;
            border-radius: 24px;
            border: 1px solid #ded6c9;
            background: #ffffff;
          }
        </style>
      `)

      const analysis = await analyzePageStylesFromPage(page, 'https://fixture.local/layout-semantics')
      const labels = analysis.layoutEvidence.map(item => item.label)

      expect(labels).toEqual(expect.arrayContaining([
        'Top navigation',
        'Hero split layout',
        'Feature card grid',
        'Section stack',
      ]))
      expect(analysis.pageSections).toEqual(expect.arrayContaining([
        expect.objectContaining({
          purpose: 'hero',
          layout: '2-column',
          columns: 2,
          hasCTA: true,
          hasImage: true,
          measured: true,
        }),
        expect.objectContaining({
          purpose: 'features',
          layout: '3-column-grid',
          columns: 3,
          measured: true,
        }),
      ]))
      expect(analysis.layoutEvidence.find(item => item.label === 'Feature card grid')).toMatchObject({
        kind: 'grid',
        componentKinds: expect.arrayContaining(['card', 'section']),
      })
    } finally {
      await page.close()
    }
  }, 15_000)
})
