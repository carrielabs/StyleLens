'use client'

import { useState } from 'react'

export interface GeneratedPageResult {
  html: string
  title: string
  templateId: string
  sourceFileName?: string
  pageType?: GeneratedPageType
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

  async function generatePage(sourceText: string, templateId: string, pageType: GeneratedPageType = 'product-website') {
    setIsGenerating(true)
    setGeneratedPage(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          templateId,
          pageType,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '生成失败，请重试')
      return saveGeneratedHistory(data.result as GeneratedPageResult, pageType)
    } finally {
      setIsGenerating(false)
    }
  }

  async function generateDashboardFromFile(file: File, templateId = 'dashboard-15-consulting-data-report') {
    setIsGenerating(true)
    setGeneratedPage(null)

    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('templateId', templateId)

      const res = await fetch('/api/generate-dashboard-data', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '生成失败，请重试')
      return saveGeneratedHistory(data.result as GeneratedPageResult, 'dashboard', file.name)
    } finally {
      setIsGenerating(false)
    }
  }

  function clearGeneratedPage() {
    setGeneratedPage(null)
  }

  function openGeneratedPage(record: GeneratedPageHistoryRecord) {
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
