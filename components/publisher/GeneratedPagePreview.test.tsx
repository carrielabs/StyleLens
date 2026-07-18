import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
        backgroundColor="#F5F4F1"
        onBack={vi.fn()}
      />
    )

    expect(screen.getByText('Demo Page')).toBeTruthy()
    expect(screen.getByText('website-01-fui')).toBeTruthy()
    expect(screen.getByText('已生成，可编辑并下载')).toBeTruthy()
    expect(screen.getByTitle('生成页面预览')).toBeTruthy()
    expect(screen.getByTestId('generated-page-preview-shell').getAttribute('style')).toContain('background: rgb(245, 244, 241)')
    expect(screen.getByTitle('生成页面预览').getAttribute('style')).toContain('background: rgb(245, 244, 241)')
    expect(screen.getByTitle('生成页面预览').getAttribute('srcdoc')).toContain('data-ahp-preview-background')
    expect(screen.getByTitle('生成页面预览').getAttribute('srcdoc')).toContain('body>main')
    expect(screen.getByText('返回画廊')).toBeTruthy()
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

    fireEvent.click(screen.getByText('返回画廊'))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('downloads the current edited html returned from the preview frame', async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(),
      configurable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    })
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:edited-html')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const appendChild = vi.spyOn(document.body, 'appendChild')
    const postMessage = vi.fn()
    const click = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement
      if (tagName === 'a') {
        Object.defineProperty(element, 'click', { value: click })
      }
      return element
    })

    render(
      <GeneratedPagePreview
        html="<!DOCTYPE html><html><body>Original</body></html>"
        title="Demo Page"
        templateId="website-01-fui"
        onBack={vi.fn()}
      />
    )

    const frame = screen.getByTitle('生成页面预览') as HTMLIFrameElement
    Object.defineProperty(frame, 'contentWindow', {
      value: { postMessage },
      configurable: true,
    })

    fireEvent.click(screen.getByText('下载 HTML'))

    expect(postMessage).toHaveBeenCalledWith({ type: 'AHP_REQUEST_EXPORT_HTML' }, '*')

    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'AHP_EXPORT_HTML',
        html: '<!DOCTYPE html><html><body>Edited</body></html>',
      },
      source: frame.contentWindow,
    }))

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(click).toHaveBeenCalledTimes(1)
    })
    expect(appendChild).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:edited-html')
  })
})
