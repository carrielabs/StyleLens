import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GeneratedPagePreview from './GeneratedPagePreview'

describe('GeneratedPagePreview', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders generated page metadata and preview frame', () => {
    render(
      <GeneratedPagePreview
        html="<!DOCTYPE html><html><body>Demo</body></html>"
        title="Demo Page"
        templateId="website-01-fui"
        onBack={vi.fn()}
      />
    )

    expect(screen.getByText('Demo Page')).toBeTruthy()
    expect(screen.getByText('website-01-fui')).toBeTruthy()
    expect(screen.getByTitle('生成页面预览')).toBeTruthy()
    expect(screen.getByText('下载 HTML')).toBeTruthy()
  })

  it('calls onBack when returning to input', () => {
    const onBack = vi.fn()
    render(
      <GeneratedPagePreview
        html="<!DOCTYPE html><html><body>Demo</body></html>"
        title="Demo Page"
        templateId="website-01-fui"
        onBack={onBack}
      />
    )

    fireEvent.click(screen.getByText('返回'))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
