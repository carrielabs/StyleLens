import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePublisher } from './usePublisher'

describe('usePublisher', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('generates and stores page result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({
        success: true,
        result: {
          html: '<!DOCTYPE html><html><body>Demo</body></html>',
          title: 'Demo',
          templateId: 'website-01-fui',
        },
      }),
    })))

    const { result } = renderHook(() => usePublisher())

    await act(async () => {
      await result.current.generatePage('# Demo', 'website-01-fui')
    })

    expect(result.current.generatedPage?.title).toBe('Demo')
    expect(result.current.isGenerating).toBe(false)
  })

  it('sends dashboard page type when requested', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        success: true,
        result: {
          html: '<!DOCTYPE html><html><body>Dashboard</body></html>',
          title: 'Dashboard',
          templateId: 'dashboard-01-blue-business',
        },
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => usePublisher())

    await act(async () => {
      await result.current.generatePage('# Dashboard', 'dashboard-01-blue-business', 'dashboard')
    })

    expect(fetchMock).toHaveBeenCalled()
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>
    const [, init] = calls[0]

    expect(JSON.parse(String(init.body))).toEqual({
      sourceText: '# Dashboard',
      templateId: 'dashboard-01-blue-business',
      pageType: 'dashboard',
    })
  })
})
