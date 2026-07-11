'use client'

import { useState } from 'react'

export interface GeneratedPageResult {
  html: string
  title: string
  templateId: string
  sourceFileName?: string
}

export type GeneratedPageType = 'product-website' | 'dashboard'

export function usePublisher() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPage, setGeneratedPage] = useState<GeneratedPageResult | null>(null)

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
      setGeneratedPage(data.result)
      return data.result as GeneratedPageResult
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
      setGeneratedPage(data.result)
      return data.result as GeneratedPageResult
    } finally {
      setIsGenerating(false)
    }
  }

  function clearGeneratedPage() {
    setGeneratedPage(null)
  }

  return {
    isGenerating,
    generatedPage,
    generatePage,
    generateDashboardFromFile,
    clearGeneratedPage,
  }
}
