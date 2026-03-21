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
        background: 'var(--bg-elevated)',
        borderRadius: '100px',
        padding: '6px',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: disabled ? 0.5 : 1,
        width: '100%'
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface)'
        e.currentTarget.style.boxShadow = '0 24px 48px rgba(0,0,0,0.06)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = 'var(--bg-elevated)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
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
          height: '48px',
          padding: '0 24px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          fontSize: '15px',
          outline: 'none',
          letterSpacing: '-0.01em'
        }}
      />
      <button
        type="submit"
        disabled={disabled || !url}
        style={{
          height: '48px',
          padding: '0 32px',
          background: 'var(--text-primary)',
          color: 'var(--text-inverse)',
          border: 'none',
          borderRadius: '100px',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: disabled || !url ? 'not-allowed' : 'pointer',
          transition: 'all var(--duration-fast)',
          boxShadow: disabled || !url ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={e => !disabled && url && (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => !disabled && url && (e.currentTarget.style.opacity = '1')}
      >
        提取风格
      </button>
    </form>
  )
}
