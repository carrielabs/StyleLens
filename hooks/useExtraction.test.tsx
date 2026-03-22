import { act, renderHook, waitFor } from '@testing-library/react'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useExtraction } from '@/hooks/useExtraction'
import type { DisplayStyleReport } from '@/lib/types'

const originalFetch = global.fetch
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

function createReport(overrides: Partial<DisplayStyleReport> = {}): DisplayStyleReport {
  return {
    sourceType: 'image',
    sourceLabel: 'Sample',
    thumbnailUrl: 'thumb.jpg',
    summary: 'summary',
    tags: ['tag'],
    colors: [],
    gradients: [],
    typography: {
      fontFamily: 'Inter',
      confidence: 'inferred',
      headingWeight: 700,
      bodyWeight: 400,
      fontSizeScale: 'base',
      lineHeight: '1.5',
      letterSpacing: 'normal',
      alignment: 'left',
      textTreatment: 'solid',
    },
    designDetails: {
      overallStyle: 'Minimal',
      colorMode: 'light',
      borderRadius: '8px',
      shadowStyle: 'soft',
      spacingSystem: 'comfortable',
      borderStyle: 'subtle',
      animationTendency: 'minimal',
      imageHandling: 'cover',
      layoutStructure: 'stack',
    },
    createdAt: '2026-03-22T00:00:00.000Z',
    ...overrides,
  }
}

function createFile(name = 'sample.png', type = 'image/png') {
  return new File(['file'], name, { type })
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useExtraction', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn(() => undefined)
  })

  afterAll(() => {
    global.fetch = originalFetch
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('uses url-only loading state during successful URL extraction', async () => {
    const setReport = vi.fn()
    const saveExtraction = vi.fn().mockResolvedValue(undefined)
    const screenshotDeferred = createDeferred<Response>()
    const extractDeferred = createDeferred<Response>()

    vi.mocked(global.fetch)
      .mockImplementationOnce(() => screenshotDeferred.promise)
      .mockImplementationOnce(() => extractDeferred.promise)

    const { result } = renderHook(() =>
      useExtraction({
        user: { id: 'user-1' } as never,
        guestTrialUsed: false,
        setIsAuthVisible: vi.fn(),
        setReport,
        setError: vi.fn(),
        setActiveItemId: vi.fn(),
        setIsSearchOpen: vi.fn(),
        saveExtraction,
      })
    )

    act(() => {
      result.current.setUrl('https://example.com')
    })

    let promise!: Promise<void>
    act(() => {
      promise = result.current.handleUrlSubmit()
    })

    await waitFor(() => {
      expect(result.current.isExtracting).toBe(true)
      expect(result.current.isUrlExtracting).toBe(true)
      expect(result.current.isImageExtracting).toBe(false)
    })

    screenshotDeferred.resolve({
        json: async () => ({ success: true, screenshotUrl: 'https://example.com/shot.jpg' }),
      } as Response)
    extractDeferred.resolve({
        json: async () => ({ success: true, report: createReport({ sourceType: 'url' }) }),
      } as Response)

    await act(async () => {
      await promise
    })

    expect(saveExtraction).toHaveBeenCalledTimes(1)
    expect(setReport).toHaveBeenCalled()
    expect(result.current.isExtracting).toBe(false)
    expect(result.current.isUrlExtracting).toBe(false)
  })

  it('uses image-only loading state during image extraction', async () => {
    const setReport = vi.fn()
    const saveExtraction = vi.fn().mockResolvedValue(undefined)
    const extractDeferred = createDeferred<Response>()

    vi.mocked(global.fetch).mockImplementation(() => extractDeferred.promise)

    const fileReaderSpy = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function mockRead(this: FileReader) {
      Object.defineProperty(this, 'result', {
        configurable: true,
        value: 'data:image/png;base64,ZmFrZQ==',
      })
      queueMicrotask(() => {
        const onload = this.onload as ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null
        onload?.call(this, new ProgressEvent('load') as ProgressEvent<FileReader>)
      })
    })

    const { result } = renderHook(() =>
      useExtraction({
        user: { id: 'user-1' } as never,
        guestTrialUsed: false,
        setIsAuthVisible: vi.fn(),
        setReport,
        setError: vi.fn(),
        setActiveItemId: vi.fn(),
        setIsSearchOpen: vi.fn(),
        saveExtraction,
      })
    )

    act(() => {
      result.current.handleFilePreview(createFile())
    })

    await waitFor(() => {
      expect(result.current.pendingFile).not.toBeNull()
      expect(result.current.uploadState).toBe('selected')
    })

    let promise!: Promise<void>
    act(() => {
      promise = result.current.handleExtractFile()
    })

    await waitFor(() => {
      expect(result.current.isExtracting).toBe(true)
      expect(result.current.isUrlExtracting).toBe(false)
      expect(result.current.isImageExtracting).toBe(true)
      expect(result.current.uploadState).toBe('extracting')
    })

    extractDeferred.resolve({
      json: async () => ({ success: true, report: createReport() }),
    } as Response)

    await act(async () => {
      await promise
    })

    expect(fileReaderSpy).toHaveBeenCalledTimes(1)
    expect(saveExtraction).toHaveBeenCalledTimes(1)
    expect(result.current.isExtracting).toBe(false)
    expect(result.current.isImageExtracting).toBe(false)
  })

  it('cancels extraction and clears shared loading state', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')
    const extractDeferred = createDeferred<Response>()

    vi.mocked(global.fetch).mockImplementation(() => extractDeferred.promise)
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function mockRead(this: FileReader) {
      Object.defineProperty(this, 'result', {
        configurable: true,
        value: 'data:image/png;base64,ZmFrZQ==',
      })
      queueMicrotask(() => {
        const onload = this.onload as ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null
        onload?.call(this, new ProgressEvent('load') as ProgressEvent<FileReader>)
      })
    })

    const { result } = renderHook(() =>
      useExtraction({
        user: { id: 'user-1' } as never,
        guestTrialUsed: false,
        setIsAuthVisible: vi.fn(),
        setReport: vi.fn(),
        setError: vi.fn(),
        setActiveItemId: vi.fn(),
        setIsSearchOpen: vi.fn(),
        saveExtraction: vi.fn(),
      })
    )

    act(() => {
      result.current.handleFilePreview(createFile())
    })

    await waitFor(() => {
      expect(result.current.pendingFile).not.toBeNull()
      expect(result.current.uploadState).toBe('selected')
    })

    let promise!: Promise<void>
    act(() => {
      promise = result.current.handleExtractFile()
      result.current.cancelExtraction()
    })

    extractDeferred.reject(new DOMException('Aborted', 'AbortError'))
    await act(async () => {
      await promise.catch(() => undefined)
    })

    expect(abortSpy).toHaveBeenCalledTimes(1)
    expect(result.current.isExtracting).toBe(false)
    expect(result.current.isUrlExtracting).toBe(false)
    expect(result.current.isImageExtracting).toBe(false)
  })
})
