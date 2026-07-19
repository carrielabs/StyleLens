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

    const shell = screen.getByTestId('publisher-shell')
    const toolbar = screen.getByTestId('publisher-gallery-toolbar')
    const switcher = screen.getByTestId('publisher-category-switcher')

    expect(screen.getByRole('heading', { name: '探索模板' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: '模板库' })).toBeNull()
    expect(screen.getByRole('button', { name: '网站官网' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '数据看板' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getAllByTestId(/^template-card-(website|dashboard)-/)).toHaveLength(8)
    expect(shell.getAttribute('style')).toContain('background: rgb(255, 255, 255)')
    expect(toolbar.getAttribute('style')).toContain('justify-content: space-between')
    expect(switcher.getAttribute('style')).not.toContain('238, 242, 247')
  })

  it('shows real portrait template thumbnails with bottom hover actions', () => {
    renderPublisher()

    const card = screen.getByTestId('template-card-website-01-fui')
    const actionBar = within(card).getByTestId('template-card-actions-website-01-fui')
    expect(card.getAttribute('data-preview-card')).toBe('true')
    expect(card.getAttribute('data-portrait-card')).toBe('true')
    expect(card.getAttribute('style')).toContain('aspect-ratio: 3 / 4')
    expect(actionBar.getAttribute('style')).toContain('bottom: 12px')

    const thumbnail = within(card).getByTitle('FUI 模板缩略图')
    expect(thumbnail.getAttribute('src')).toBe('/api/template-preview/website-01-fui')
    expect(thumbnail.getAttribute('data-real-template-thumbnail')).toBe('true')
    expect(thumbnail.getAttribute('data-preview-fit')).toBe('desktop-width')
    expect(thumbnail.getAttribute('data-preview-width')).toBe('1440')
    expect(thumbnail.getAttribute('style')).toContain('pointer-events: none')

    expect(within(card).queryByText('FUI')).toBeNull()
    expect(within(card).queryByText('极简科技感产品介绍')).toBeNull()
    expect(within(actionBar).getByRole('button', { name: '预览 FUI' })).toBeTruthy()
    expect(within(actionBar).getByRole('button', { name: '使用模板 FUI' })).toBeTruthy()
  })

  it('mounts real gallery preview iframes when switching template categories', () => {
    renderPublisher()

    expect(document.querySelectorAll('iframe[title$="模板缩略图"]')).toHaveLength(8)

    fireEvent.click(screen.getByRole('button', { name: '数据看板' }))

    expect(screen.getAllByTestId(/^template-card-dashboard-/)).toHaveLength(28)
    expect(document.querySelectorAll('iframe[title$="模板缩略图"]')).toHaveLength(28)
  })

  it('switches to dashboard templates without leaving the workspace', () => {
    renderPublisher()

    fireEvent.click(screen.getByRole('button', { name: '数据看板' }))

    expect(screen.getByRole('button', { name: '数据看板' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByTestId(/^template-card-(website|dashboard)-/)).toHaveLength(28)
    expect(screen.getByTestId('template-card-dashboard-15-consulting-data-report')).toBeTruthy()
  })

  it('opens fullscreen template preview and then uses the same template', () => {
    renderPublisher()

    fireEvent.click(screen.getByRole('button', { name: '预览 FUI' }))

    expect(screen.getByRole('dialog', { name: 'FUI 模板预览' })).toBeTruthy()
    expect(screen.getByRole('status', { name: '模板预览加载中' })).toBeTruthy()
    expect(screen.getByTitle('FUI 全屏模板预览').getAttribute('src')).toBe('/api/template-preview/website-01-fui')
    expect(screen.getByRole('button', { name: '立即使用此模板' }).getAttribute('style')).not.toContain('37, 99, 235')

    fireEvent.click(screen.getByRole('button', { name: '立即使用此模板' }))

    expect(screen.queryByRole('dialog', { name: 'FUI 模板预览' })).toBeNull()
    const drawer = screen.getByRole('dialog', { name: '配置数据源' })
    expect(drawer).toBeTruthy()
    expect(within(drawer).getByTitle('FUI 当前模板预览')).toBeTruthy()
    expect(drawer.querySelector('iframe[title="FUI 当前模板预览"]')?.getAttribute('src')).toBe('/api/template-preview/website-01-fui')
    expect(within(drawer).queryByText('正在使用')).toBeNull()
    expect(within(drawer).queryByText('FUI')).toBeNull()
  })

  it('opens a non-modal drawer that pushes the gallery instead of showing an overlay', () => {
    renderPublisher()

    fireEvent.click(screen.getByRole('button', { name: '使用模板 FUI' }))

    const shell = screen.getByTestId('publisher-shell')
    const gallery = screen.getByTestId('publisher-gallery-pane')
    const drawer = screen.getByRole('dialog', { name: '配置数据源' })

    expect(shell.getAttribute('style')).toContain('display: flex')
    expect(gallery.getAttribute('style')).toContain('flex: 1 1 0%')
    expect(drawer.getAttribute('aria-modal')).toBe('false')
    expect(screen.queryByLabelText('关闭配置抽屉遮罩')).toBeNull()
  })

  it('generates a website from drawer text with the selected template', async () => {
    const generatePage = vi.fn(async () => ({ html: '', title: '', templateId: 'website-01-fui' } as GeneratedPageResult))
    renderPublisher({ generatePage })

    fireEvent.click(screen.getByRole('button', { name: '使用模板 FUI' }))
    expect(screen.getByText('目标进度')).toBeTruthy()
    expect(screen.getByText(/第 1\/3 步/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/输入文本内容/), {
      target: { value: '# 产品介绍' },
    })
    fireEvent.click(screen.getByRole('button', { name: '立即生成 HTML' }))

    await waitFor(() => {
      expect(generatePage).toHaveBeenCalledWith('# 产品介绍', 'website-01-fui', 'product-website', undefined)
    })
  })

  it('shows drawer errors near the input and action instead of behind the overlay', () => {
    renderPublisher({ error: '请先输入文本或上传文档' })

    fireEvent.click(screen.getByRole('button', { name: '使用模板 FUI' }))

    const drawer = screen.getByRole('dialog', { name: '配置数据源' })
    expect(within(drawer).getAllByRole('alert')).toHaveLength(2)
    expect(within(drawer).getAllByText('请先输入文本或上传文档')).toHaveLength(2)
  })

  it('generates a dashboard from an uploaded csv file', async () => {
    const generateDashboardFromFile = vi.fn(async () => ({ html: '', title: '', templateId: 'dashboard-01-blue-business' } as GeneratedPageResult))
    renderPublisher({ generateDashboardFromFile })
    const file = new File(['date,revenue\n2026-01-01,100'], 'sales.csv', { type: 'text/csv' })

    fireEvent.click(screen.getByRole('button', { name: '数据看板' }))
    fireEvent.click(screen.getByRole('button', { name: '使用模板 Blue Business' }))
    fireEvent.change(screen.getByLabelText('上传文档文件'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: '立即生成 HTML' }))

    await waitFor(() => {
      expect(generateDashboardFromFile).toHaveBeenCalledWith(file, 'dashboard-01-blue-business', undefined)
    })
  })
})
