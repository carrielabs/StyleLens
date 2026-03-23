import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import UrlInput from '@/components/extractor/UrlInput'

describe('UrlInput', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('forwards pageAnalysis from screenshot response into extract request', async () => {
    const onStart = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    const screenshotResponse = {
      success: true,
      screenshotUrl: 'data:image/jpeg;base64,abc',
      extractedCss: 'body{background:#fff;}',
      pageAnalysis: {
        semanticColorSystem: {
          heroBackground: { hex: '#001040' },
        },
        colorCandidates: [],
        typographyCandidates: [],
        typographyTokens: [],
        radiusCandidates: [],
        radiusTokens: [],
        shadowCandidates: [],
        shadowTokens: [],
        spacingCandidates: [],
        spacingTokens: [],
        layoutHints: [],
        layoutEvidence: [],
        sourceCount: {
          inlineStyleBlocks: 0,
          linkedStylesheets: 0,
        },
      },
    }

    const extractResponse = {
      success: true,
      report: {
        sourceType: 'url',
        sourceLabel: 'notion.com',
        summary: '',
        tags: [],
        colors: [],
        gradients: [],
        typography: {},
        designDetails: {},
        createdAt: new Date().toISOString(),
      },
    }

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => screenshotResponse,
      })
      .mockResolvedValueOnce({
        json: async () => extractResponse,
      })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <UrlInput
        onStart={onStart}
        onSuccess={onSuccess}
        onError={onError}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('粘贴网页 URL，例如 https://linear.app'), {
      target: { value: 'notion.com' },
    })
    fireEvent.submit(screen.getByRole('button', { name: '解析' }).closest('form')!)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const extractRequest = fetchMock.mock.calls[1]
    const extractBody = JSON.parse(extractRequest?.[1]?.body as string)

    expect(extractRequest?.[0]).toBe('/api/extract')
    expect(extractBody.pageAnalysis).toEqual(screenshotResponse.pageAnalysis)
    expect(extractBody.screenshotUrl).toBe(screenshotResponse.screenshotUrl)
    expect(onStart).toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
