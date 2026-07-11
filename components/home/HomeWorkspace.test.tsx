import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomeWorkspace from './HomeWorkspace'

vi.mock('./MagicalHeroLogo', () => ({
  default: () => null,
}))

describe('HomeWorkspace', () => {
  it('shows markdown upload status while generating a page', async () => {
    const generatePage = vi.fn(() => new Promise<never>(() => {}))
    const fileInputRef = React.createRef<HTMLInputElement>()
    const urlInputRef = React.createRef<HTMLInputElement>()

    render(
      <HomeWorkspace
        activeItemId={null}
        report={null}
        isExtracting={false}
        isGenerating={false}
        isUrlExtracting={false}
        isImageExtracting={false}
        extractions={[]}
        reportLang="zh"
        setReportLang={vi.fn()}
        setLightboxUrl={vi.fn()}
        setIsLightboxOpen={vi.fn()}
        error={null}
        setError={vi.fn()}
        greeting={{ prefix: 'Welcome to', name: 'StyleLens...' }}
        handleUrlSubmit={vi.fn()}
        generatePage={generatePage}
        urlInputRef={urlInputRef}
        url=""
        setUrl={vi.fn()}
        pendingFile={null}
        pendingPreviewUrl={null}
        uploadState="idle"
        isDragging={false}
        setIsDragging={vi.fn()}
        setUploadZoneHovered={vi.fn()}
        user={null}
        guestTrialUsed={false}
        fileInputRef={fileInputRef}
        setIsAuthVisible={vi.fn()}
        handlePaste={vi.fn()}
        handleExtractFile={vi.fn()}
        clearPendingFile={vi.fn()}
        cancelExtraction={vi.fn()}
        handleFilePreview={vi.fn()}
        extractionPhase={null}
      />
    )

    const file = new File(['# Demo'], 'brief.md', { type: 'text/markdown' })
    Object.defineProperty(file, 'text', {
      value: vi.fn().mockResolvedValue('# Demo'),
    })

    fireEvent.drop(screen.getByRole('button', { name: '上传文件' }), {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('brief.md')).toBeTruthy()
      expect(screen.getByText('正在生成官网…')).toBeTruthy()
    })
  })
})
