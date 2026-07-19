'use client'

import { useRef, useState } from 'react'

export interface GeneratedPageResult {
  html: string
  title: string
  templateId: string
  sourceFileName?: string
  pageType?: GeneratedPageType
  backgroundColor?: string
  isPending?: boolean
}

export type GeneratedPageType = 'product-website' | 'dashboard'

export interface GeneratedPageHistoryRecord extends GeneratedPageResult {
  id: string
  pageType: GeneratedPageType
  createdAt: string
}

export function usePublisher() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPage, setGeneratedPage] = useState<GeneratedPageResult | null>(null)
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedPageHistoryRecord[]>([])
  const generationRunIdRef = useRef(0)

  function saveGeneratedHistory(result: GeneratedPageResult, pageType: GeneratedPageType, sourceFileName?: string) {
    const record: GeneratedPageHistoryRecord = {
      ...result,
      id: `generated_${Date.now()}`,
      pageType,
      sourceFileName: sourceFileName || result.sourceFileName,
      createdAt: new Date().toISOString(),
    }
    setGeneratedHistory(prev => [record, ...prev])
    setGeneratedPage(record)
    return record
  }

  async function generatePage(sourceText: string, templateId: string, pageType: GeneratedPageType = 'product-website', backgroundColor?: string) {
    const runId = generationRunIdRef.current + 1
    generationRunIdRef.current = runId
    setIsGenerating(true)
    const pendingTitle = extractGeneratedTitle(sourceText, pageType)
    setGeneratedPage({
      html: buildPendingHtml(pendingTitle, pageType),
      title: pendingTitle,
      templateId,
      pageType,
      backgroundColor,
      isPending: true,
    })

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          templateId,
          pageType,
          backgroundColor,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '生成失败，请重试')
      const result = data.result as GeneratedPageResult
      if (generationRunIdRef.current !== runId) return result
      return saveGeneratedHistory(result, pageType)
    } catch (error) {
      if (generationRunIdRef.current === runId) setGeneratedPage(null)
      throw error
    } finally {
      if (generationRunIdRef.current === runId) setIsGenerating(false)
    }
  }

  async function generateDashboardFromFile(file: File, templateId = 'dashboard-15-consulting-data-report', backgroundColor?: string) {
    const runId = generationRunIdRef.current + 1
    generationRunIdRef.current = runId
    setIsGenerating(true)
    const pendingTitle = `${fileBaseName(file.name)} 数据看板`
    setGeneratedPage({
      html: buildPendingHtml(pendingTitle, 'dashboard'),
      title: pendingTitle,
      templateId,
      sourceFileName: file.name,
      pageType: 'dashboard',
      backgroundColor,
      isPending: true,
    })

    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('templateId', templateId)
      if (backgroundColor) formData.set('backgroundColor', backgroundColor)

      const res = await fetch('/api/generate-dashboard-data', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '生成失败，请重试')
      const result = data.result as GeneratedPageResult
      if (generationRunIdRef.current !== runId) return result
      return saveGeneratedHistory(result, 'dashboard', file.name)
    } catch (error) {
      if (generationRunIdRef.current === runId) setGeneratedPage(null)
      throw error
    } finally {
      if (generationRunIdRef.current === runId) setIsGenerating(false)
    }
  }

  function clearGeneratedPage() {
    generationRunIdRef.current += 1
    setIsGenerating(false)
    setGeneratedPage(null)
  }

  function openGeneratedPage(record: GeneratedPageHistoryRecord) {
    generationRunIdRef.current += 1
    setIsGenerating(false)
    setGeneratedPage(record)
  }

  return {
    isGenerating,
    generatedPage,
    generatedHistory,
    generatePage,
    generateDashboardFromFile,
    clearGeneratedPage,
    openGeneratedPage,
  }
}

function extractGeneratedTitle(sourceText: string, pageType: GeneratedPageType): string {
  const lines = sourceText.split(/\r?\n/)
  const heading = lines.find(line => /^#\s+/.test(line.trim()))
  const raw = heading
    ? heading.replace(/^#\s+/, '')
    : lines.find(line => line.trim())

  return String(raw || (pageType === 'dashboard' ? '生成看板' : '生成官网'))
    .replace(/[*_`>#]/g, '')
    .trim()
    .slice(0, 28) || (pageType === 'dashboard' ? '生成看板' : '生成官网')
}

function fileBaseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || '数据文件'
}

function buildPendingHtml(title: string, pageType: GeneratedPageType): string {
  const label = pageType === 'dashboard' ? '正在生成看板' : '正在生成页面'
  const safeTitle = escapeHtml(title)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>html,body{margin:0;min-height:100%;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;background:#fff;color:#111}main{min-height:100vh;display:grid;place-items:center;padding:32px;box-sizing:border-box}.box{width:min(520px,100%);border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:28px;background:#fff;box-shadow:0 18px 42px rgba(0,0,0,.08)}.bar{height:10px;border-radius:999px;background:#eee;overflow:hidden}.bar:before{content:"";display:block;width:44%;height:100%;background:#111}h1{margin:18px 0 8px;font-size:28px;line-height:1.2;letter-spacing:0}p{margin:0;color:#666;font-size:14px}</style></head><body><main><section class="box"><div class="bar"></div><h1>${safeTitle}</h1><p>${label}</p></section></main></body></html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
