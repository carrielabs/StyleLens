/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import type { PageTypographyCandidate } from '@/lib/types'
import { toTypographyTokens } from '@/lib/api/pageAnalyzer'

describe('toTypographyTokens', () => {
  it('keeps heading, body, navigation, and button typography as separate semantic tokens', () => {
    const candidates: PageTypographyCandidate[] = [
      {
        fontFamily: 'Inter',
        fontSize: '72px',
        fontWeight: '700',
        lineHeight: '1',
        letterSpacing: '-0.06em',
        count: 2,
        componentKinds: ['hero', 'text'],
        sampleText: 'AI workspace',
        evidenceScore: 420,
      },
      {
        fontFamily: 'Inter',
        fontSize: '48px',
        fontWeight: '650',
        lineHeight: '1.08',
        letterSpacing: '-0.04em',
        count: 6,
        componentKinds: ['section', 'text'],
        sampleText: 'Everything teams need',
        evidenceScore: 360,
      },
      {
        fontFamily: 'Inter',
        fontSize: '40px',
        fontWeight: '650',
        lineHeight: '1.12',
        letterSpacing: '-0.03em',
        count: 5,
        componentKinds: ['section', 'text'],
        sampleText: 'Built for speed',
        evidenceScore: 340,
      },
      {
        fontFamily: 'Inter',
        fontSize: '36px',
        fontWeight: '650',
        lineHeight: '1.15',
        letterSpacing: '-0.03em',
        count: 5,
        componentKinds: ['section', 'text'],
        sampleText: 'Ship with confidence',
        evidenceScore: 330,
      },
      {
        fontFamily: 'Inter',
        fontSize: '32px',
        fontWeight: '650',
        lineHeight: '1.2',
        letterSpacing: '-0.02em',
        count: 4,
        componentKinds: ['section', 'text'],
        sampleText: 'Measure outcomes',
        evidenceScore: 320,
      },
      {
        fontFamily: 'Inter',
        fontSize: '28px',
        fontWeight: '650',
        lineHeight: '1.22',
        letterSpacing: '-0.02em',
        count: 4,
        componentKinds: ['section', 'text'],
        sampleText: 'Coordinate work',
        evidenceScore: 310,
      },
      {
        fontFamily: 'Inter',
        fontSize: '24px',
        fontWeight: '600',
        lineHeight: '1.3',
        letterSpacing: '-0.01em',
        count: 4,
        componentKinds: ['section', 'text'],
        sampleText: 'Plan better',
        evidenceScore: 300,
      },
      {
        fontFamily: 'Inter',
        fontSize: '20px',
        fontWeight: '600',
        lineHeight: '1.35',
        letterSpacing: '-0.01em',
        count: 4,
        componentKinds: ['section', 'text'],
        sampleText: 'Move faster',
        evidenceScore: 290,
      },
      {
        fontFamily: 'Inter',
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '-0.01em',
        count: 24,
        componentKinds: ['text'],
        sampleText: 'Body copy describes the product in plain language.',
        evidenceScore: 260,
      },
      {
        fontFamily: 'Inter',
        fontSize: '14px',
        fontWeight: '500',
        lineHeight: '1.4',
        letterSpacing: '0',
        count: 12,
        componentKinds: ['nav', 'link', 'text'],
        sampleText: 'Product Pricing Docs',
        evidenceScore: 190,
      },
      {
        fontFamily: 'Inter',
        fontSize: '15px',
        fontWeight: '600',
        lineHeight: '1.2',
        letterSpacing: '-0.01em',
        count: 8,
        componentKinds: ['button'],
        sampleText: 'Get started',
        evidenceScore: 180,
      },
    ]

    const tokens = toTypographyTokens(candidates)

    expect(tokens.find(token => token.label === 'Navigation')).toMatchObject({
      fontSize: '14px',
      fontWeight: '500',
      componentKinds: expect.arrayContaining(['nav']),
      usage: 'label',
    })
    expect(tokens.find(token => token.label === 'Button')).toMatchObject({
      fontSize: '15px',
      fontWeight: '600',
      componentKinds: expect.arrayContaining(['button']),
      usage: 'label',
    })
    expect(tokens.find(token => token.label === 'Body')).toMatchObject({
      fontSize: '16px',
      fontWeight: '400',
      usage: 'body',
    })
    expect(tokens[0]).toMatchObject({
      label: 'Display',
      fontSize: '72px',
    })
  })
})
