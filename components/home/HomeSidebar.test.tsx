import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomeSidebar from './HomeSidebar'
import type { GeneratedPageHistoryRecord } from '@/hooks/usePublisher'

function renderSidebar(overrides: Partial<React.ComponentProps<typeof HomeSidebar>> = {}) {
  const urlInputRef = React.createRef<HTMLInputElement>()
  const searchInputRef = React.createRef<HTMLInputElement>()
  const publisherHistory: GeneratedPageHistoryRecord[] = [
    {
      id: 'generated_1',
      html: '<!doctype html><html></html>',
      title: '新产品着陆页',
      templateId: 'website-01-fui',
      pageType: 'product-website',
      createdAt: '2026-07-12T12:00:00.000Z',
    },
  ]
  const props: React.ComponentProps<typeof HomeSidebar> = {
    sidebarOpen: true,
    setSidebarOpen: vi.fn(),
    activeWorkspace: 'extract',
    onWorkspaceChange: vi.fn(),
    isSearchOpen: false,
    pinnedCollapsed: false,
    setPinnedCollapsed: vi.fn(),
    historyCollapsed: false,
    setHistoryCollapsed: vi.fn(),
    pinnedList: [],
    recentList: [],
    publisherHistory,
    activePublisherHistoryId: null,
    onOpenPublisherHistory: vi.fn(),
    activeItemId: null,
    contextMenuId: null,
    setContextMenuId: vi.fn(),
    renamingId: null,
    renameValue: '',
    setRenameValue: vi.fn(),
    showUserMenu: false,
    setShowUserMenu: vi.fn(),
    user: null,
    isLoadingHistory: false,
    isAuthResolved: true,
    searchQuery: '',
    setIsSearchOpen: vi.fn(),
    setModalSearchQuery: vi.fn(),
    setActiveItemId: vi.fn(),
    setReport: vi.fn(),
    setError: vi.fn(),
    openHistoryItem: vi.fn(),
    setUrl: vi.fn(),
    clearPendingFile: vi.fn(),
    urlInputRef,
    searchInputRef,
    togglePin: vi.fn(),
    deleteItem: vi.fn(),
    startRename: vi.fn(),
    submitRename: vi.fn(),
    cancelRename: vi.fn(),
    supabase: { auth: { signOut: vi.fn() } } as never,
    setIsAuthVisible: vi.fn(),
    onOpenSettings: vi.fn(),
    onCloseSettings: vi.fn(),
    ...overrides,
  }
  render(<HomeSidebar {...props} />)
  return props
}

describe('HomeSidebar', () => {
  it('renders two workspace switches', () => {
    renderSidebar()

    expect(screen.getByRole('button', { name: '提取视觉风格' }).getAttribute('data-active')).toBe('true')
    expect(screen.getByRole('button', { name: '生成页面与看板' }).getAttribute('data-active')).toBe('false')
  })

  it('switches to publisher workspace from the sidebar', () => {
    const onWorkspaceChange = vi.fn()
    renderSidebar({ onWorkspaceChange })

    fireEvent.click(screen.getByRole('button', { name: '生成页面与看板' }))

    expect(onWorkspaceChange).toHaveBeenCalledWith('publisher')
  })

  it('shows publisher history only in publisher workspace', () => {
    renderSidebar({ activeWorkspace: 'publisher' })

    expect(screen.getByText('新产品着陆页')).toBeTruthy()
    expect(screen.getByText('官网 HTML')).toBeTruthy()
    expect(screen.queryByText('登录后查看历史记录')).toBeNull()
  })

  it('shows the current build version in the sidebar', () => {
    renderSidebar()

    expect(screen.getByText(/版本/)).toBeTruthy()
  })
})
