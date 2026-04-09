/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import { scoreInteractiveTargetCandidate } from '@/lib/api/pageAnalyzer'

describe('pageAnalyzer interactive target scoring', () => {
  it('prioritizes meaningful labeled controls over decorative tiny targets', () => {
    const primaryButton = scoreInteractiveTargetCandidate({
      component: 'button',
      tagName: 'button',
      role: 'button',
      text: 'Get started',
      ariaLabel: '',
      placeholder: '',
      title: '',
      href: '',
      className: 'cta primary',
      width: 120,
      height: 44,
      disabled: false,
    })

    const decorativeLink = scoreInteractiveTargetCandidate({
      component: 'link',
      tagName: 'a',
      role: '',
      text: '',
      ariaLabel: '',
      placeholder: '',
      title: '',
      href: '#',
      className: 'icon-only',
      width: 12,
      height: 12,
      disabled: false,
    })

    expect(primaryButton).toBeGreaterThan(0)
    expect(decorativeLink).toBe(0)
    expect(primaryButton).toBeGreaterThan(decorativeLink)
  })

  it('keeps text inputs eligible even when they have no visible label text', () => {
    const inputScore = scoreInteractiveTargetCandidate({
      component: 'input',
      tagName: 'input',
      role: 'textbox',
      text: '',
      ariaLabel: '',
      placeholder: 'Search',
      title: '',
      href: '',
      className: 'search-field',
      width: 240,
      height: 40,
      disabled: false,
    })

    expect(inputScore).toBeGreaterThan(0)
  })

  it('filters disabled elements and oversized decorative cards', () => {
    const disabledButton = scoreInteractiveTargetCandidate({
      component: 'button',
      tagName: 'button',
      role: 'button',
      text: 'Submit',
      ariaLabel: '',
      placeholder: '',
      title: '',
      href: '',
      className: 'cta',
      width: 120,
      height: 44,
      disabled: true,
    })

    const emptyCard = scoreInteractiveTargetCandidate({
      component: 'card',
      tagName: 'article',
      role: '',
      text: '',
      ariaLabel: '',
      placeholder: '',
      title: '',
      href: '',
      className: 'feature-card',
      width: 320,
      height: 220,
      disabled: false,
    })

    expect(disabledButton).toBe(0)
    expect(emptyCard).toBe(0)
  })
})
