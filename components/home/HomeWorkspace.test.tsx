import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomeWorkspace from './HomeWorkspace'
import type { GeneratedPageResult } from '@/hooks/usePublisher'

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
    isGenerating: false,
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
    generatePage: vi.fn(async () => ({ html: '', title: '', templateId: '' } as GeneratedPageResult)),
    generateDashboardFromFile: vi.fn(async () => ({ html: '', title: '', templateId: '' } as GeneratedPageResult)),
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
  it('queues markdown uploads until the user chooses a website template', async () => {
    const generatePage = vi.fn(async () => ({ html: '', title: '', templateId: 'website-01-fui' } as GeneratedPageResult))
    renderWorkspace({ generatePage })
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
      expect(screen.getByText('已识别为文本内容')).toBeTruthy()
    })
    expect(generatePage).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '用 FUI 生成官网' }))

    await waitFor(() => {
      expect(generatePage).toHaveBeenCalledWith('# Demo', 'website-01-fui', 'product-website')
    })
  })

  it('generates a dashboard from markdown after the user chooses a dashboard template', async () => {
    const generatePage = vi.fn(async () => ({ html: '', title: '', templateId: 'dashboard-01-blue-business' } as GeneratedPageResult))
    renderWorkspace({ generatePage })
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
      expect(screen.getByText('dashboard.md')).toBeTruthy()
    })
    expect(generatePage).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '用 Blue Business 生成 Dashboard' }))

    await waitFor(() => {
      expect(generatePage).toHaveBeenCalledWith('# Dashboard', 'dashboard-01-blue-business', 'dashboard')
    })
  })

  it('queues csv uploads and disables website templates', async () => {
    const generateDashboardFromFile = vi.fn(async () => ({ html: '', title: '', templateId: 'dashboard-01-blue-business' } as GeneratedPageResult))
    const handleFilePreview = vi.fn()
    renderWorkspace({ generateDashboardFromFile, handleFilePreview })
    const file = new File(['date,revenue\n2026-01-01,100'], 'sales.csv', { type: 'text/csv' })

    fireEvent.drop(screen.getByRole('button', { name: '上传文件' }), {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('sales.csv')).toBeTruthy()
      expect(screen.getByText('已识别为数据文件')).toBeTruthy()
    })
    expect(generateDashboardFromFile).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '数据文件不能生成 FUI 官网' })).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: '用 Blue Business 生成 Dashboard' }))

    await waitFor(() => {
      expect(generateDashboardFromFile).toHaveBeenCalledWith(file, 'dashboard-01-blue-business')
      expect(handleFilePreview).not.toHaveBeenCalled()
    })
  })

  it('generates csv dashboards with the clicked dashboard template', async () => {
    const generateDashboardFromFile = vi.fn(async () => ({ html: '', title: '', templateId: 'dashboard-14-financial-blue-analytics-report' } as GeneratedPageResult))
    renderWorkspace({ generateDashboardFromFile })
    const file = new File(['date,revenue\n2026-01-01,100'], 'sales.csv', { type: 'text/csv' })

    fireEvent.drop(screen.getByRole('button', { name: '上传文件' }), {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('sales.csv')).toBeTruthy()
    })
    fireEvent.click(screen.getByRole('button', { name: '用 Financial Blue 生成 Dashboard' }))

    await waitFor(() => {
      expect(generateDashboardFromFile).toHaveBeenCalledWith(file, 'dashboard-14-financial-blue-analytics-report')
    })
  })

  it('renders all website and dashboard templates with preview frames', () => {
    renderWorkspace()

    expect(screen.getByText('共 23 个模板')).toBeTruthy()
    expect(screen.getAllByTestId(/template-preview-/)).toHaveLength(23)
    expect(screen.getByRole('button', { name: '请先上传或粘贴内容：Blue Shift Portfolio' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '请先上传或粘贴内容：Consulting Data' })).toBeTruthy()
  })

  it('makes the template gallery page scrollable', () => {
    renderWorkspace()

    expect(screen.getByTestId('home-workspace-start').style.overflowY).toBe('auto')
  })
})
