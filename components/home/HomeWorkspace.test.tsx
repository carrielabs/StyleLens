import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomeWorkspace from './HomeWorkspace'

vi.mock('./MagicalHeroLogo', () => ({
  default: () => null,
}))

function renderWorkspace(overrides: Partial<React.ComponentProps<typeof HomeWorkspace>> = {}) {
  const fileInputRef = React.createRef<HTMLInputElement>()
  const urlInputRef = React.createRef<HTMLInputElement>()
  const props: React.ComponentProps<typeof HomeWorkspace> = {
    activeItemId: null,
    report: null,
    isExtracting: false,
    isUrlExtracting: false,
    isImageExtracting: false,
    extractions: [],
    reportLang: 'zh',
    setReportLang: vi.fn(),
    setLightboxUrl: vi.fn(),
    setIsLightboxOpen: vi.fn(),
    error: null,
    setError: vi.fn(),
    greeting: { prefix: 'Welcome to', name: 'StyleLens...' },
    handleUrlSubmit: vi.fn(),
    urlInputRef,
    url: '',
    setUrl: vi.fn(),
    pendingFile: null,
    pendingPreviewUrl: null,
    uploadState: 'idle',
    isDragging: false,
    setIsDragging: vi.fn(),
    setUploadZoneHovered: vi.fn(),
    user: null,
    guestTrialUsed: false,
    fileInputRef,
    setIsAuthVisible: vi.fn(),
    handlePaste: vi.fn(),
    handleExtractFile: vi.fn(),
    clearPendingFile: vi.fn(),
    cancelExtraction: vi.fn(),
    handleFilePreview: vi.fn(),
    extractionPhase: null,
    ...overrides,
  }
  render(<HomeWorkspace {...props} />)
  return props
}

describe('HomeWorkspace', () => {
  it('keeps the extraction workspace focused on URL and image input only', () => {
    renderWorkspace()

    expect(screen.getByPlaceholderText('粘贴要分析的网址')).toBeTruthy()
    expect(screen.getByRole('button', { name: '上传图片' })).toBeTruthy()
    expect(screen.queryByText('选择模板生成')).toBeNull()
  })

  it('submits URLs to the extraction flow', async () => {
    const handleUrlSubmit = vi.fn()
    renderWorkspace({ url: 'https://example.com', handleUrlSubmit })

    fireEvent.submit(screen.getByTestId('extract-url-form'))

    await waitFor(() => {
      expect(handleUrlSubmit).toHaveBeenCalledTimes(1)
    })
  })

  it('rejects non-url text instead of routing it to publisher templates', async () => {
    const setError = vi.fn()
    const handleUrlSubmit = vi.fn()
    renderWorkspace({ url: '这是产品介绍文案', setError, handleUrlSubmit })

    fireEvent.submit(screen.getByTestId('extract-url-form'))

    await waitFor(() => {
      expect(handleUrlSubmit).not.toHaveBeenCalled()
      expect(setError).toHaveBeenCalledWith('请粘贴一个有效网址')
    })
  })

  it('passes dropped images to the extraction file preview flow', () => {
    const handleFilePreview = vi.fn()
    renderWorkspace({ handleFilePreview })
    const file = new File(['image'], 'screen.png', { type: 'image/png' })

    fireEvent.drop(screen.getByRole('button', { name: '上传图片' }), {
      dataTransfer: {
        files: [file],
      },
    })

    expect(handleFilePreview).toHaveBeenCalledWith(file)
  })
})
