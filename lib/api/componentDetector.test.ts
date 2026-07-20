import { describe, expect, it } from 'vitest'
import { buildReliableComponentEvidence } from '@/lib/api/componentDetector'
import type { PageColorCandidate, PageStyleAnalysis } from '@/lib/types'

function candidate(overrides: Partial<PageColorCandidate>): PageColorCandidate {
  return {
    hex: '#111111',
    property: 'color',
    selectorHint: '[anchor:body-text]',
    count: 20,
    roleHints: ['text'],
    layerHints: ['global'],
    componentKinds: ['text'],
    evidenceScore: 120,
    meta: {
      source: 'dom-computed',
      confidence: 'high',
      evidenceCount: 20,
    },
    ...overrides,
  }
}

function analysis(overrides: Partial<PageStyleAnalysis>): PageStyleAnalysis {
  return {
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
    sourceCount: {
      inlineStyleBlocks: 0,
      linkedStylesheets: 0,
    },
    ...overrides,
  }
}

describe('componentDetector', () => {
  it('keeps a real CTA button with selector, text, style, and scoring reason', () => {
    const evidence = buildReliableComponentEvidence(analysis({
      buttonSnapshots: [{
        selectorHint: 'a.c-button.button-green',
        text: 'Get a quote',
        backgroundColor: '#8ED462',
        color: '#2C2E2A',
        borderRadius: '50px',
        paddingH: '24px',
        paddingV: '14px',
        width: '148px',
        height: '44px',
      }],
      colorCandidates: [
        candidate({
          hex: '#8ED462',
          property: 'cta-background',
          selectorHint: 'a.c-button.button-green',
          roleHints: ['primary', 'cta', 'background'],
          layerHints: ['hero'],
          componentKinds: ['button', 'hero'],
        }),
      ],
    }))

    expect(evidence.button.count).toBe(1)
    expect(evidence.button.confidence).toBe('high')
    expect(evidence.button.examples[0]).toMatchObject({
      selectorHint: 'a.c-button.button-green',
      text: 'Get a quote',
      reason: expect.stringContaining('button semantics'),
    })
    expect(evidence.cta.count).toBeGreaterThan(0)
    expect(evidence.cta.examples[0].reason).toContain('CTA intent')
  })

  it('rejects logo links and body text candidates as button or CTA evidence', () => {
    const evidence = buildReliableComponentEvidence(analysis({
      buttonSnapshots: [{
        selectorHint: 'a.site-logo',
        text: 'Acme',
        color: '#F0EDE6',
        paddingH: '12px',
        paddingV: '8px',
        width: '82px',
        height: '28px',
      }],
      colorCandidates: [
        candidate({
          selectorHint: '[anchor:body-text]',
          roleHints: ['text', 'surface'],
          componentKinds: ['text'],
        }),
      ],
    }))

    expect(evidence.button.count).toBe(0)
    expect(evidence.cta.count).toBe(0)
  })

  it('does not treat plain navigation dropdown triggers as CTA evidence', () => {
    const evidence = buildReliableComponentEvidence(analysis({
      colorCandidates: [
        candidate({
          hex: '#000000',
          property: 'cta-foreground',
          selectorHint: 'button.globalNavigation_link.globalNavigation_dropdownTrigger',
          roleHints: ['primary', 'cta', 'accent'],
          componentKinds: ['button'],
          evidenceScore: 320,
        }),
      ],
    }))

    expect(evidence.cta.count).toBe(0)
  })

  it('keeps direct navigation snapshots as reliable navigation evidence', () => {
    const evidence = buildReliableComponentEvidence(analysis({
      navigationSnapshots: [{
        selectorHint: 'nav.site-nav',
        text: 'Blog Get Early Access',
        linkCount: 2,
        display: 'flex',
        position: 'relative',
        color: '#F0EDE6',
        width: '1296px',
        height: '86px',
      }],
    }))

    expect(evidence.navigation.count).toBe(1)
    expect(evidence.navigation.confidence).toBe('high')
    expect(evidence.navigation.examples[0]).toMatchObject({
      selectorHint: 'nav.site-nav',
      reason: expect.stringContaining('navigation selector'),
    })
  })

  it('keeps semantic static navigation snapshots as medium fallback evidence', () => {
    const evidence = buildReliableComponentEvidence(analysis({
      navigationSnapshots: [{
        selectorHint: 'header.site-header',
        text: 'Blog Get Early Access',
        linkCount: 4,
        source: 'inferred',
        confidence: 'medium',
      }],
    }))

    expect(evidence.navigation.count).toBe(1)
    expect(evidence.navigation.confidence).toBe('high')
    expect(evidence.navigation.examples[0]).toMatchObject({
      selectorHint: 'header.site-header',
      source: 'inferred',
      confidence: 'medium',
      reason: expect.stringContaining('semantic HTML navigation'),
    })
  })

  it('does not use plain body/content surfaces as card evidence', () => {
    const evidence = buildReliableComponentEvidence(analysis({
      colorCandidates: [
        candidate({
          hex: '#FFFFFF',
          property: 'background-color',
          selectorHint: '[anchor:body]',
          roleHints: ['background', 'surface'],
          layerHints: ['global'],
          componentKinds: ['surface'],
        }),
        candidate({
          hex: '#111111',
          property: 'color',
          selectorHint: '[anchor:body-text]',
          roleHints: ['text', 'surface'],
          layerHints: ['global', 'content'],
          componentKinds: ['text'],
        }),
      ],
    }))

    expect(evidence.card.count).toBe(0)
  })

  it('keeps structured card snapshots with selector, heading, and visual chrome', () => {
    const evidence = buildReliableComponentEvidence(analysis({
      cardSnapshots: [{
        selectorHint: 'article.pricing-card',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 8px 24px rgba(0,0,0,.08)',
        padding: '24px',
        headingText: 'Pro plan',
      }],
    }))

    expect(evidence.card.count).toBe(1)
    expect(evidence.card.confidence).toBe('high')
    expect(evidence.card.examples[0]).toMatchObject({
      selectorHint: 'article.pricing-card',
      text: 'Pro plan',
      reason: expect.stringContaining('card structure'),
    })
  })
})
