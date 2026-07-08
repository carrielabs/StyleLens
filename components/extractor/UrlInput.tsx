'use client'

import React, { useState } from 'react'
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
          pageAnalysis: screenData.pageAnalysis,
          sourceType: 'url',
          sourceLabel: new URL(targetUrl).hostname
        })
      })

      const extractData = await extractRes.json()
      if (extractData.success) {
        const report = {
          ...extractData.report,
          pageAnalysis: extractData.report?.pageAnalysis || screenData.pageAnalysis,
        }
        onSuccess(report)
      } else {
        throw new Error(extractData.error || '风格提取失败')
      }
    } catch (err: any) {
      onError(err.message || '网络请求失败，请稍后重试')
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <form 
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#F5F5F5',
          border: '1px solid transparent',
          borderRadius: '100px',
          padding: '6px 6px 6px 24px',
          transition: 'all 0.25s ease',
          opacity: disabled ? 0.5 : 1,
          width: '100%',
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
          e.currentTarget.style.border = '1px solid #E0E0E0'
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = '#F5F5F5'
          e.currentTarget.style.border = '1px solid transparent'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <input
          type="text"
          placeholder="粘贴网页 URL，例如 https://linear.app"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
          style={{
            flex: 1,
            height: '44px',
            border: 'none',
            background: 'transparent',
            color: '#1A1A1A',
            fontSize: '15px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={disabled || !url}
          style={{
            height: '44px',
            padding: '0 28px',
            background: !url ? '#E0E0E0' : '#1A1A1A',
            color: !url ? '#999' : '#FFFFFF',
            border: 'none',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: disabled || !url ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (!disabled && url) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { if (!disabled && url) e.currentTarget.style.opacity = '1' }}
        >
          解析
        </button>
      </form>

      <div style={{
        paddingLeft: '18px',
        fontSize: '12px',
        lineHeight: 1.5,
        color: '#8E8E93',
      }}>
        本次分析已含结构化测量
      </div>
    </div>
  )
}
