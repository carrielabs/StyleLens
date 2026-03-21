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
        border: '1px solid var(--border-base)',
        borderRadius: '8px',
        padding: '4px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: disabled ? 0.5 : 1,
        width: '100%'
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--text-primary)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.04)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-base)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <input
        type="text"
        placeholder="粘贴公网 URL，深入解析整个网站系统 (例如 linear.app)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={disabled}
        style={{
          flex: 1,
          height: '40px',
          padding: '0 16px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
          letterSpacing: '0.02em'
        }}
      />
      <button
        type="submit"
        disabled={disabled || !url}
        style={{
          height: '40px',
          padding: '0 24px',
          background: 'var(--text-primary)',
          color: 'var(--bg-base)',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          cursor: disabled || !url ? 'not-allowed' : 'pointer',
          transition: 'all var(--duration-fast)',
          opacity: disabled || !url ? 0.4 : 1
        }}
        onMouseEnter={e => !disabled && url && (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => !disabled && url && (e.currentTarget.style.opacity = '1')}
      >
        提取风格
      </button>
    </form>
  )
}
