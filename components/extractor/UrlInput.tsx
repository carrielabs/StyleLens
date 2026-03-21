'use client'

import { useState } from 'react'
import type { StyleReport } from '@/lib/types'

interface UrlInputProps {
  onStart: () => void
  onSuccess: (report: StyleReport) => void
  onError: (error: string) => void
  disabled?: boolean
}

export default function UrlInput({ onStart, onSuccess, onError, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled || !url) return

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    try {
      new URL(targetUrl)
    } catch {
      onError('请输入合法的网址')
      return
    }

    onStart()

    try {
      // 1. Take screenshot
      const screenRes = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      })

      const screenData = await screenRes.json()
      if (!screenData.success) {
        throw new Error(screenData.error || '网页截图失败，请确保网站可以公开访问')
      }

      // 2. Extract style from screenshot
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshotUrl: screenData.screenshotUrl,
          extractedCss: screenData.extractedCss,
          sourceType: 'url',
          sourceLabel: new URL(targetUrl).hostname
        })
      })

      const extractData = await extractRes.json()
      if (extractData.success) {
        onSuccess(extractData.report)
      } else {
        throw new Error(extractData.error || '风格提取失败')
      }
    } catch (err: any) {
      onError(err.message || '网络请求失败，请稍后重试')
    }
  }

  return (
    <form 
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        transition: 'border-color var(--duration-fast)',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <input
        type="text"
        placeholder="粘贴网站 URL 提取风格，例如 linear.app"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={disabled}
        style={{
          flex: 1,
          height: '42px',
          padding: '0 16px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none'
        }}
      />
      <button
        type="submit"
        disabled={disabled || !url}
        style={{
          height: '42px',
          padding: '0 24px',
          background: 'var(--text-primary)',
          color: 'var(--text-inverse)',
          border: 'none',
          borderLeft: '1px solid var(--border-subtle)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: disabled || !url ? 'not-allowed' : 'pointer',
          transition: 'opacity var(--duration-fast)'
        }}
        onMouseEnter={e => !disabled && url && (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => !disabled && url && (e.currentTarget.style.opacity = '1')}
      >
        提取风格
      </button>
    </form>
  )
}
