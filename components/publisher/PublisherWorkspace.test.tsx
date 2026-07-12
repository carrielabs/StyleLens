import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PublisherWorkspace from './PublisherWorkspace'
import type { GeneratedPageResult } from '@/hooks/usePublisher'

function renderPublisher(overrides: Partial<React.ComponentProps<typeof PublisherWorkspace>> = {}) {
  const props: React.ComponentProps<typeof PublisherWorkspace> = {
    isGenerating: false,
    generatePage: vi.fn(async () => ({ html: '', title: '', templateId: 'website-01-fui' } as GeneratedPageResult)),
    generateDashboardFromFile: vi.fn(async () => ({ html: '', title: '', templateId: 'dashboard-01-blue-business' } as GeneratedPageResult)),
    error: null,
    setError: vi.fn(),
    ...overrides,
  }
  render(<PublisherWorkspace {...props} />)
  return props
}

describe('PublisherWorkspace', () => {
  it('renders the template gallery as an independent publisher workspace', () => {
    renderPublisher()

    expect(screen.getByRole('heading', { name: '探索模板' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: '模板库' })).toBeNull()
    expect(screen.getByRole('button', { name: '网站官网' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '数据看板' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getAllByTestId(/template-card-/)).toHaveLength(8)
  })

  it('uses real template iframe thumbnails and hides preview text until hover', () => {
    renderPublisher()

    const card = screen.getByTestId('template-card-website-01-fui')
    expect(card.getAttribute('data-preview-card')).toBe('true')

    const thumbnail = within(card).getByTitle('FUI 模板缩略图')
    expect(thumbnail.getAttribute('src')).toBe('/api/template-preview/website-01-fui')
    expect(thumbnail.getAttribute('data-real-template-thumbnail')).toBe('true')
    expect(thumbnail.getAttribute('style')).toContain('position: absolute')

    const previewLabel = within(card).getByText('全屏沉浸预览')
    expect(previewLabel.getAttribute('data-preview-label')).toBe('true')
    expect(previewLabel.getAttribute('style')).toContain('opacity: 0')
  })

  it('switches to dashboard templates without leaving the workspace', () => {
    renderPublisher()

    fireEvent.click(screen.getByRole('button', { name: '数据看板' }))

    expect(screen.getByRole('button', { name: '数据看板' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByTestId(/template-card-/)).toHaveLength(15)
    expect(screen.getByText('Consulting Data')).toBeTruthy()
  })

  it('opens fullscreen template preview and then uses the same template', () => {
    renderPublisher()

    fireEvent.click(screen.getByRole('button', { name: '全屏沉浸预览 FUI' }))

    expect(screen.getByRole('dialog', { name: 'FUI 模板预览' })).toBeTruthy()
    expect(screen.getByRole('status', { name: '模板预览加载中' })).toBeTruthy()
    expect(screen.getByTitle('FUI 全屏模板预览').getAttribute('src')).toBe('/api/template-preview/website-01-fui')

    fireEvent.click(screen.getByRole('button', { name: '立即使用此模板' }))

    expect(screen.queryByRole('dialog', { name: 'FUI 模板预览' })).toBeNull()
    const drawer = screen.getByRole('dialog', { name: '配置数据源' })
    expect(drawer).toBeTruthy()
    expect(within(drawer).getByText('正在使用')).toBeTruthy()
    expect(within(drawer).getByText('FUI')).toBeTruthy()
  })

  it('generates a website from drawer text with the selected template', async () => {
    const generatePage = vi.fn(async () => ({ html: '', title: '', templateId: 'website-01-fui' } as GeneratedPageResult))
    renderPublisher({ generatePage })

    fireEvent.click(screen.getByRole('button', { name: '使用 FUI 模板' }))
    expect(screen.getByText('目标进度')).toBeTruthy()
    expect(screen.getByText(/第 1\/3 步/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/输入文本内容/), {
      target: { value: '# 产品介绍' },
    })
    fireEvent.click(screen.getByRole('button', { name: '立即生成 HTML' }))

    await waitFor(() => {
      expect(generatePage).toHaveBeenCalledWith('# 产品介绍', 'website-01-fui', 'product-website')
    })
  })

  it('shows drawer errors near the input and action instead of behind the overlay', () => {
    renderPublisher({ error: '请先输入文本或上传文档' })

    fireEvent.click(screen.getByRole('button', { name: '使用 FUI 模板' }))

    const drawer = screen.getByRole('dialog', { name: '配置数据源' })
    expect(within(drawer).getAllByRole('alert')).toHaveLength(2)
    expect(within(drawer).getAllByText('请先输入文本或上传文档')).toHaveLength(2)
  })

  it('generates a dashboard from an uploaded csv file', async () => {
    const generateDashboardFromFile = vi.fn(async () => ({ html: '', title: '', templateId: 'dashboard-01-blue-business' } as GeneratedPageResult))
    renderPublisher({ generateDashboardFromFile })
    const file = new File(['date,revenue\n2026-01-01,100'], 'sales.csv', { type: 'text/csv' })

    fireEvent.click(screen.getByRole('button', { name: '数据看板' }))
    fireEvent.click(screen.getByRole('button', { name: '使用 Blue Business 模板' }))
    fireEvent.change(screen.getByLabelText('上传文档文件'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: '立即生成 HTML' }))

    await waitFor(() => {
      expect(generateDashboardFromFile).toHaveBeenCalledWith(file, 'dashboard-01-blue-business')
    })
  })
})
