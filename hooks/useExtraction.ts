'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent as ReactClipboardEvent, DragEvent, FormEvent } from 'react'
import type { StyleReport } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface UseExtractionParams {
  user: User | null
  guestTrialUsed: boolean
  setIsAuthVisible: (visible: boolean) => void
  setReport: (report: StyleReport | null) => void
  setError: (error: string | null) => void
  setActiveItemId: (id: string | null) => void
  setIsSearchOpen: (open: boolean) => void
  saveExtraction: (report: StyleReport, thumb?: string) => Promise<void>
}

export function useExtraction({
  user,
  guestTrialUsed,
  setIsAuthVisible,
  setReport,
  setError,
  setActiveItemId,
  setIsSearchOpen,
  saveExtraction,
}: UseExtractionParams) {
  const [url, setUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [activeExtractionMode, setActiveExtractionMode] = useState<'url' | 'image' | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const [uploadZoneHovered, setUploadZoneHovered] = useState(false)

  const extractAbortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleGlobalPaste = (e: globalThis.ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) files.push(file)
        }
      }

      if (files.length > 0) {
        if (!user && guestTrialUsed) {
          setIsAuthVisible(true)
          return
        }

        const file = files[0]
        setPendingFile(file)
        setPendingPreviewUrl(URL.createObjectURL(file))
        setActiveItemId(null)
        setIsSearchOpen(false)
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [guestTrialUsed, setActiveItemId, setIsAuthVisible, setIsSearchOpen, user])

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    }
  }, [pendingPreviewUrl])

  const callExtractAPI = async (
    payload: { screenshotUrl?: string; imageBase64?: string; sourceLabel?: string },
    signal?: AbortSignal
  ) => {
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || '提取失败，请重试')
    return data.report as StyleReport
  }

  const cancelExtraction = () => {
    extractAbortRef.current?.abort()
    extractAbortRef.current = null
    setIsExtracting(false)
    setActiveExtractionMode(null)
    setError(null)
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl)
      setPendingPreviewUrl(null)
    }
  }

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })

  const handleUrlSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!url.trim() || isExtracting) return

    if (!user && guestTrialUsed) {
      setIsAuthVisible(true)
      return
    }

    const abort = new AbortController()
    extractAbortRef.current = abort

    setIsExtracting(true)
    setActiveExtractionMode('url')
    setReport(null)
    setActiveItemId(null)
    setError(null)

    try {
      const ssRes = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: abort.signal,
      })
      const ssData = await ssRes.json()
      if (!ssData.success) throw new Error(ssData.error || '截图失败')

      let label = url.trim()
      try {
        label = new URL(url.trim()).hostname.replace(/^www\./, '')
      } catch {}

      const result = await callExtractAPI({ screenshotUrl: ssData.screenshotUrl, sourceLabel: label }, abort.signal)
      result.thumbnailUrl = ssData.screenshotUrl

      await saveExtraction(result, ssData.screenshotUrl)
      setReport(result)
      setUrl('')
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      let msg = err instanceof Error ? err.message : '未知错误'
      if (msg.includes('Failed to fetch')) msg = '网络连接失败，请检查网络后重试'
      setError(msg)
    } finally {
      setIsExtracting(false)
      setActiveExtractionMode(null)
      extractAbortRef.current = null
    }
  }

  const handleFilePreview = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('图片过大，请上传 20MB 以内的图片')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPendingFile(file)
    setPendingPreviewUrl(objectUrl)
    setError(null)
  }

  const handleExtractFile = async () => {
    if (!pendingFile) return

    if (!user && guestTrialUsed) {
      setIsAuthVisible(true)
      return
    }

    const abort = new AbortController()
    extractAbortRef.current = abort

    setIsExtracting(true)
    setActiveExtractionMode('image')
    setReport(null)
    setActiveItemId(null)
    setError(null)
    const file = pendingFile
    const previewUrl = pendingPreviewUrl
    setPendingFile(null)

    try {
      const base64 = await toBase64(file)
      const result = await callExtractAPI({ imageBase64: base64, sourceLabel: file.name }, abort.signal)
      result.thumbnailUrl = base64

      await saveExtraction(result, base64)
      setReport(result)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : '上传分析失败')
    } finally {
      setIsExtracting(false)
      setActiveExtractionMode(null)
      extractAbortRef.current = null
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPendingPreviewUrl(null)
    }
  }

  const clearPendingFile = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(null)
    setPendingPreviewUrl(null)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFilePreview(file)
  }

  const handlePaste = async (e: ReactClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) handleFilePreview(file)
        break
      }
    }
  }

  const isUrlExtracting = isExtracting && activeExtractionMode === 'url'
  const isImageExtracting = isExtracting && activeExtractionMode === 'image'
  const isImageExtraction = Boolean(pendingFile || pendingPreviewUrl)
  const uploadState = isImageExtraction && isImageExtracting
    ? 'extracting'
    : pendingFile
      ? 'selected'
      : isDragging
        ? 'dragover'
        : uploadZoneHovered
          ? 'hover'
          : 'idle'

  return {
    url,
    setUrl,
    isDragging,
    setIsDragging,
    isExtracting,
    isUrlExtracting,
    isImageExtracting,
    pendingFile,
    pendingPreviewUrl,
    uploadZoneHovered,
    setUploadZoneHovered,
    uploadState,
    fileInputRef,
    urlInputRef,
    handleUrlSubmit,
    handleFilePreview,
    handleExtractFile,
    clearPendingFile,
    handleDrop,
    handlePaste,
    cancelExtraction,
  }
}
