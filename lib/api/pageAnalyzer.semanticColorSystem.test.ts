/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import type { PageColorCandidate } from '@/lib/types'
import { buildSemanticColorSystem } from '@/lib/api/pageAnalyzer'

describe('buildSemanticColorSystem', () => {
  it('keeps hero and page shell colors separated when screenshot hero evidence exists', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#16132C',
        property: 'screenshot-hero',
        selectorHint: 'hero-region',
        count: 42,
        roleHints: ['background', 'hero'],
        layerHints: ['hero'],
        componentKinds: ['hero', 'section', 'surface'],
        areaWeight: 40,
        viewportWeight: 10,
        repetitionWeight: 2,
        evidenceScore: 240,
      },
      {
        hex: '#5B6CFF',
        property: 'cta-background',
        selectorHint: 'hero-cta',
        count: 18,
        roleHints: ['primary', 'accent'],
        layerHints: ['hero'],
        componentKinds: ['hero', 'button'],
        areaWeight: 12,
        viewportWeight: 8,
        repetitionWeight: 1,
        evidenceScore: 160,
      },
      {
        hex: '#FFFFFF',
        property: 'visual-page',
        selectorHint: 'page-shell',
        count: 28,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['section', 'surface'],
        areaWeight: 28,
        viewportWeight: 6,
        repetitionWeight: 2,
        evidenceScore: 180,
      },
      {
        hex: '#F6F6F6',
        property: 'background-color',
        selectorHint: 'card',
        count: 14,
        roleHints: ['surface'],
        layerHints: ['content'],
        componentKinds: ['card', 'surface'],
        areaWeight: 12,
        viewportWeight: 3,
        repetitionWeight: 2,
        evidenceScore: 120,
      },
      {
        hex: '#000000',
        property: 'color',
        selectorHint: 'body',
        count: 20,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        areaWeight: 8,
        viewportWeight: 4,
        repetitionWeight: 2,
        evidenceScore: 140,
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.heroBackground?.hex).toBe('#16132C')
    expect(semantic?.pageBackground?.hex).toBe('#FFFFFF')
    expect(semantic?.surface?.hex).toBe('#F6F6F6')
    expect(semantic?.textPrimary?.hex).toBe('#000000')
    expect(semantic?.heroPrimaryAction?.hex).toBe('#5B6CFF')
  })

  it('keeps content-region colors out of page background selection', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#0F0F18',
        property: 'screenshot-hero',
        selectorHint: 'hero-region',
        count: 24,
        roleHints: ['background', 'hero'],
        layerHints: ['hero'],
        componentKinds: ['hero', 'section', 'surface'],
        evidenceScore: 180,
      },
      {
        hex: '#FFFFFF',
        property: 'background-color',
        selectorHint: 'body',
        count: 22,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['section', 'surface'],
        evidenceScore: 170,
      },
      {
        hex: '#E0E0E0',
        property: 'visual-page',
        selectorHint: 'page-shell',
        count: 20,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['section', 'surface'],
        evidenceScore: 150,
      },
      {
        hex: '#83ABE1',
        property: 'screenshot-content',
        selectorHint: 'content-region',
        count: 18,
        roleHints: ['surface', 'accent'],
        layerHints: ['global', 'content'],
        componentKinds: ['card', 'surface'],
        evidenceScore: 160,
      },
      {
        hex: '#F7F7F7',
        property: 'visual-content',
        selectorHint: 'content-grid',
        count: 16,
        roleHints: ['surface'],
        layerHints: ['content'],
        componentKinds: ['card', 'surface'],
        evidenceScore: 145,
      },
      {
        hex: '#111111',
        property: 'color',
        selectorHint: 'body',
        count: 20,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        evidenceScore: 130,
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.pageBackground?.hex).toBe('#FFFFFF')
    expect(semantic?.surface?.hex).toBe('#F7F7F7')
  })
})
