/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import type { PageColorCandidate } from '@/lib/types'
import { buildSemanticColorSystem, createEmptyPageAnalysis, sanitizePageAnalysis } from '@/lib/api/pageAnalyzer'

describe('buildSemanticColorSystem', () => {
  it('filters third-party cookie consent colors before semantic slot selection', () => {
    const analysis = createEmptyPageAnalysis()
    analysis.colorCandidates = [
      {
        hex: '#C2D0E0',
        property: 'css-variable',
        selectorHint: ':root(--cc-btn-primary-bg)',
        count: 20,
        roleHints: ['primary'],
        layerHints: ['global'],
        componentKinds: ['button'],
        evidenceScore: 260,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 20,
          context: 'cookie consent primary action',
        },
      },
      {
        hex: '#98A7B6',
        property: 'css-variable',
        selectorHint: '.cc--darkmode',
        count: 18,
        roleHints: ['secondary'],
        layerHints: ['global'],
        componentKinds: ['button'],
        evidenceScore: 230,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 18,
          context: 'cookie consent secondary action',
        },
      },
      {
        hex: '#8ED462',
        property: 'cta-background',
        selectorHint: 'a.c-button.button-green',
        count: 8,
        roleHints: ['primary', 'cta', 'background'],
        layerHints: ['hero'],
        componentKinds: ['button', 'hero'],
        evidenceScore: 150,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 8,
          context: 'primary action',
        },
      },
      {
        hex: '#F5F1E4',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 12,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 180,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 12,
        },
      },
      {
        hex: '#2C2E2A',
        property: 'color',
        selectorHint: '[anchor:body-text]',
        count: 24,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        evidenceScore: 190,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 24,
        },
      },
    ]
    analysis.semanticColorSystem = buildSemanticColorSystem(analysis.colorCandidates)

    const sanitized = sanitizePageAnalysis(analysis)

    expect(sanitized?.colorCandidates.map(candidate => candidate.hex)).not.toContain('#C2D0E0')
    expect(sanitized?.colorCandidates.map(candidate => candidate.hex)).not.toContain('#98A7B6')
    expect(sanitized?.semanticColorSystem?.primaryAction?.hex).toBe('#8ED462')
    expect(sanitized?.semanticColorSystem?.textPrimary?.hex).toBe('#2C2E2A')
  })

  it('does not build semantic slots from css-only inferred colors', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#FF3B30',
        property: 'background-color',
        selectorHint: '.debug-error',
        count: 3,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['section'],
        evidenceScore: 80,
        meta: {
          source: 'inferred',
          confidence: 'medium',
          evidenceCount: 3,
        },
      },
      {
        hex: '#FFFFFF',
        property: 'color',
        selectorHint: '.debug-error',
        count: 2,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        evidenceScore: 60,
        meta: {
          source: 'inferred',
          confidence: 'medium',
          evidenceCount: 2,
        },
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic).toBeUndefined()
  })

  it('prefers body text color over CTA foreground for primary text', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#F6F9FC',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 12,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 180,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 12,
        },
      },
      {
        hex: '#425466',
        property: 'color',
        selectorHint: '[anchor:body-text]',
        count: 24,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        evidenceScore: 140,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 24,
        },
      },
      {
        hex: '#635BFF',
        property: 'color',
        selectorHint: 'a.primary-link',
        count: 18,
        roleHints: ['text', 'primary'],
        layerHints: ['hero', 'global'],
        componentKinds: ['link', 'text'],
        evidenceScore: 220,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 18,
        },
      },
      {
        hex: '#635BFF',
        property: 'cta-background',
        selectorHint: 'a.primary-link',
        count: 18,
        roleHints: ['primary', 'cta', 'background'],
        layerHints: ['hero', 'global'],
        componentKinds: ['button'],
        evidenceScore: 220,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 18,
        },
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.textPrimary?.hex).toBe('#425466')
  })

  it('does not let logo links become primary action colors', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#FFFFFF',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 20,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 180,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 20,
        },
      },
      {
        hex: '#F7F8F8',
        property: 'cta-foreground',
        selectorHint: 'a.globalNavigation_logoLink',
        count: 30,
        roleHints: ['primary', 'cta', 'accent'],
        layerHints: ['hero', 'global'],
        componentKinds: ['button', 'link'],
        evidenceScore: 400,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 30,
        },
      },
      {
        hex: '#635BFF',
        property: 'cta-background',
        selectorHint: 'a.primary-button',
        count: 6,
        roleHints: ['primary', 'cta', 'background'],
        layerHints: ['hero', 'global'],
        componentKinds: ['button'],
        evidenceScore: 120,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 6,
        },
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.primaryAction?.hex).toBe('#635BFF')
  })

  it('prefers repeated neutral text over saturated link text for primary text', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#F6F9FC',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 16,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 160,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 16,
        },
      },
      {
        hex: '#425466',
        property: 'color',
        selectorHint: 'p.body-copy',
        count: 40,
        roleHints: ['text'],
        layerHints: ['global', 'content'],
        componentKinds: ['text'],
        evidenceScore: 180,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 40,
        },
      },
      {
        hex: '#000EFF',
        property: 'color',
        selectorHint: 'a.nav-link',
        count: 8,
        roleHints: ['text', 'primary'],
        layerHints: ['global'],
        componentKinds: ['link', 'text'],
        evidenceScore: 260,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 8,
        },
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.textPrimary?.hex).toBe('#425466')
  })

  it('keeps text color even when the same hex is also used as a surface', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#FFFFFF',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 20,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 180,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 20,
        },
      },
      {
        hex: '#000000',
        property: 'background-color',
        selectorHint: '.logo-lockup',
        count: 6,
        roleHints: ['background', 'surface'],
        layerHints: ['content', 'global'],
        componentKinds: ['surface'],
        evidenceScore: 80,
        meta: {
          source: 'dom-computed',
          confidence: 'medium',
          evidenceCount: 6,
        },
      },
      {
        hex: '#000000',
        property: 'color',
        selectorHint: '[anchor:body-text]',
        count: 18,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        evidenceScore: 120,
        meta: {
          source: 'dom-computed',
          confidence: 'high',
          evidenceCount: 18,
        },
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.pageBackground?.hex).toBe('#FFFFFF')
    expect(semantic?.surface?.hex).toBe('#000000')
    expect(semantic?.textPrimary?.hex).toBe('#000000')
  })

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

  it('does not use action-colored surfaces as page background when the page shell is measured', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#F5F1E4',
        property: 'background-color',
        selectorHint: '[anchor:main]',
        count: 20,
        roleHints: ['background', 'surface', 'hero'],
        layerHints: ['hero', 'content', 'global'],
        componentKinds: ['section', 'surface'],
        evidenceScore: 220,
      },
      {
        hex: '#FFFFFF',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 16,
        roleHints: ['background', 'surface'],
        layerHints: ['global', 'content'],
        componentKinds: ['surface'],
        evidenceScore: 180,
      },
      {
        hex: '#8ED462',
        property: 'background-color',
        selectorHint: ':root(--button-background-active)',
        count: 12,
        roleHints: ['background', 'primary', 'cta'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 260,
      },
      {
        hex: '#2C2E2A',
        property: 'color',
        selectorHint: '[anchor:body-text]',
        count: 24,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        evidenceScore: 200,
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.heroBackground?.hex).toBe('#F5F1E4')
    expect(semantic?.pageBackground?.hex).toBe('#FFFFFF')
    expect(semantic?.primaryAction?.hex).toBe('#8ED462')
  })

  it('prefers measured CTA backgrounds over pale accent surface variables for primary action', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#FFFFFF',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 24,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 220,
      },
      {
        hex: '#000000',
        property: 'color',
        selectorHint: '[anchor:body-text]',
        count: 24,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        evidenceScore: 220,
      },
      {
        hex: '#191918',
        property: 'cta-background',
        selectorHint: 'a.button_buttonVariantPrimary',
        count: 3,
        roleHints: ['primary', 'cta', 'background'],
        layerHints: ['hero', 'global'],
        componentKinds: ['button'],
        evidenceScore: 120,
      },
      {
        hex: '#E6F3FE',
        property: 'css-variable',
        selectorHint: ':root(--color-background-surface-accent-soft)',
        count: 18,
        roleHints: ['background', 'surface', 'accent', 'secondary'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 500,
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.primaryAction?.hex).toBe('#191918')
  })

  it('uses measured dark body background over light global CSS variables', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#08090A',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 16,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 180,
      },
      {
        hex: '#FFFFFF',
        property: 'css-variable',
        selectorHint: ':root(--color-border-translucent)',
        count: 20,
        roleHints: ['background', 'border'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 260,
      },
      {
        hex: '#F7F8F8',
        property: 'color',
        selectorHint: '[anchor:body-text]',
        count: 30,
        roleHints: ['text'],
        layerHints: ['global', 'hero'],
        componentKinds: ['text'],
        evidenceScore: 240,
      },
      {
        hex: '#828FFF',
        property: 'css-variable',
        selectorHint: ':root(--color-accent-hover)',
        count: 10,
        roleHints: ['primary', 'accent'],
        layerHints: ['global'],
        componentKinds: ['section'],
        evidenceScore: 120,
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.pageBackground?.hex).toBe('#08090A')
    expect(semantic?.textPrimary?.hex).toBe('#F7F8F8')
  })

  it('does not promote saturated illustration blocks to the surface slot', () => {
    const candidates: PageColorCandidate[] = [
      {
        hex: '#FFFFFF',
        property: 'background-color',
        selectorHint: '[anchor:body]',
        count: 24,
        roleHints: ['background'],
        layerHints: ['global'],
        componentKinds: ['surface'],
        evidenceScore: 220,
      },
      {
        hex: '#93CDFE',
        property: 'background-color',
        selectorHint: '.homepage-illustration-panel',
        count: 30,
        roleHints: ['surface', 'accent'],
        layerHints: ['content'],
        componentKinds: ['surface'],
        evidenceScore: 520,
      },
      {
        hex: '#000000',
        property: 'color',
        selectorHint: '[anchor:body-text]',
        count: 30,
        roleHints: ['text'],
        layerHints: ['global'],
        componentKinds: ['text'],
        evidenceScore: 220,
      },
      {
        hex: '#0075DE',
        property: 'cta-background',
        selectorHint: 'a.primary-button',
        count: 4,
        roleHints: ['primary', 'cta', 'background'],
        layerHints: ['hero', 'global'],
        componentKinds: ['button'],
        evidenceScore: 140,
      },
    ]

    const semantic = buildSemanticColorSystem(candidates)

    expect(semantic?.pageBackground?.hex).toBe('#FFFFFF')
    expect(semantic?.surface).toBeUndefined()
    expect(semantic?.primaryAction?.hex).toBe('#0075DE')
  })
})
