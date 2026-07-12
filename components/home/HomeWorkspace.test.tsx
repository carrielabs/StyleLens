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
        generateDashboardFromFile={vi.fn()}
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

  it('uses dashboard settings for markdown upload when dashboard is selected', async () => {
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
        generateDashboardFromFile={vi.fn()}
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

    fireEvent.change(screen.getByLabelText('页面类型'), { target: { value: 'dashboard' } })

    const file = new File(['# Dashboard'], 'dashboard.md', { type: 'text/markdown' })
    Object.defineProperty(file, 'text', {
      value: vi.fn().mockResolvedValue('# Dashboard'),
    })

    fireEvent.drop(screen.getByRole('button', { name: '上传文件' }), {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(generatePage).toHaveBeenCalledWith('# Dashboard', 'dashboard-01-blue-business', 'dashboard')
    })
  })

  it('uploads csv files through the data dashboard generator', async () => {
    const generateDashboardFromFile = vi.fn(() => new Promise<never>(() => {}))
    const handleFilePreview = vi.fn()
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
        generatePage={vi.fn()}
        generateDashboardFromFile={generateDashboardFromFile}
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
        handleFilePreview={handleFilePreview}
        extractionPhase={null}
      />
    )

    const file = new File(['date,revenue\n2026-01-01,100'], 'sales.csv', { type: 'text/csv' })

    fireEvent.drop(screen.getByRole('button', { name: '上传文件' }), {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(generateDashboardFromFile).toHaveBeenCalledWith(file, 'dashboard-01-blue-business')
      expect(handleFilePreview).not.toHaveBeenCalled()
    })
  })

  it('uploads csv files with the selected dashboard template', async () => {
    const generateDashboardFromFile = vi.fn(() => new Promise<never>(() => {}))
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
        generatePage={vi.fn()}
        generateDashboardFromFile={generateDashboardFromFile}
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

    fireEvent.change(screen.getByLabelText('页面类型'), { target: { value: 'dashboard' } })
    fireEvent.change(screen.getByLabelText('模板'), { target: { value: 'dashboard-14-financial-blue-analytics-report' } })

    const file = new File(['date,revenue\n2026-01-01,100'], 'sales.csv', { type: 'text/csv' })
    fireEvent.drop(screen.getByRole('button', { name: '上传文件' }), {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(generateDashboardFromFile).toHaveBeenCalledWith(file, 'dashboard-14-financial-blue-analytics-report')
    })
  })
})
