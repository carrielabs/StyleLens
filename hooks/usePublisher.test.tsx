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
})
