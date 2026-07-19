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

  it('shows a lightweight pending page before the generate response returns', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => {
      resolveFetch = resolve
    })))

    const { result } = renderHook(() => usePublisher())

    let pending: Promise<unknown>
    await act(async () => {
      pending = result.current.generatePage('# Demo', 'website-01-fui')
    })

    expect(result.current.isGenerating).toBe(true)
    expect(result.current.generatedPage?.title).toBe('Demo')
    expect(result.current.generatedPage?.templateId).toBe('website-01-fui')
    expect(result.current.generatedPage?.html).toContain('正在生成页面')

    await act(async () => {
      resolveFetch({
        json: async () => ({
          success: true,
          result: {
            html: '<!DOCTYPE html><html><body>Demo</body></html>',
            title: 'Demo',
            templateId: 'website-01-fui',
          },
        }),
      })
      await pending
    })

    expect(result.current.isGenerating).toBe(false)
    expect(result.current.generatedPage?.html).toContain('<body>Demo</body>')
  })

  it('does not reopen a generated page after the pending page is cleared', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => {
      resolveFetch = resolve
    })))

    const { result } = renderHook(() => usePublisher())

    let pending: Promise<unknown>
    await act(async () => {
      pending = result.current.generatePage('# Demo', 'website-01-fui')
    })

    act(() => {
      result.current.clearGeneratedPage()
    })

    expect(result.current.generatedPage).toBeNull()
    expect(result.current.isGenerating).toBe(false)

    await act(async () => {
      resolveFetch({
        json: async () => ({
          success: true,
          result: {
            html: '<!DOCTYPE html><html><body>Late Demo</body></html>',
            title: 'Late Demo',
            templateId: 'website-01-fui',
          },
        }),
      })
      await pending
    })

    expect(result.current.generatedPage).toBeNull()
    expect(result.current.generatedHistory).toHaveLength(0)
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

  it('uploads one data file for dashboard generation', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        success: true,
        result: {
          html: '<!DOCTYPE html><html><body>Dashboard</body></html>',
          title: 'sales 数据看板',
          templateId: 'dashboard-15-consulting-data-report',
        },
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => usePublisher())
    const file = new File(['date,revenue\n2026-01-01,100'], 'sales.csv', { type: 'text/csv' })

    await act(async () => {
      await result.current.generateDashboardFromFile(file, 'dashboard-15-consulting-data-report')
    })

    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>
    const [url, init] = calls[0]

    expect(url).toBe('/api/generate-dashboard-data')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    expect(result.current.generatedPage?.title).toBe('sales 数据看板')
  })
})
