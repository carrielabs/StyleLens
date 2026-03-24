'use client'

import React, { useState } from 'react'
import type { StyleReport } from '@/lib/types'

interface Props {
  report: StyleReport
  lang: 'zh' | 'en'
}

export default function AtomicSandbox({ report, lang }: Props) {
  const [isInjected, setIsInjected] = useState(false)

  const { colors, colorSystem, typography, designDetails } = report

  // Resolve tokens from extracted data (prefer colorSystem if available)
  const bgHex      = colorSystem?.pageBackground?.hex || colorSystem?.heroBackground?.hex || colors.find(c => c.role === 'background')?.hex || '#ffffff'
  const surfaceHex = colorSystem?.surface?.hex        || colors.find(c => c.role === 'surface')?.hex || bgHex
  const primaryHex = colorSystem?.primaryAction?.hex  || colors.find(c => c.role === 'primary')?.hex || '#000000'
  const textHex    = colorSystem?.textPrimary?.hex    || colors.find(c => c.role === 'text')?.hex || '#1a1a1a'
  const borderHex  = colorSystem?.border?.hex         || colors.find(c => c.role === 'border')?.hex || '#e5e5e5'
  const isDark     = designDetails.colorMode === 'dark'

  const radius   = designDetails.cssRadius   || inferRadius(designDetails.borderRadius)
  const shadow   = designDetails.cssShadow   || inferShadow(designDetails.shadowStyle)
  const duration = inferDuration(designDetails.animationTendency)
  const motion   = `all ${duration} cubic-bezier(0.4, 0, 0.2, 1)`

  const btnTextHex = isDark ? (bgHex) : (bgHex)
  const sourceName = report.sourceLabel.replace(/https?:\/\/(www\.)?/, '').split('/')[0]

  const t = {
    btnInject: lang === 'zh' ? `注入 ${sourceName} 风格` : `Apply ${sourceName} Style`,
    btnReset:  lang === 'zh' ? '重置' : 'Reset',
    badge1: typography.letterSpacing !== 'normal' ? typography.letterSpacing + ' 字间距' : null,
    badge2: radius + ' 圆角',
    badge3: duration + ' 动效',
  }

  const sharedBtnBase = {
    cursor: 'pointer' as const,
    transition: motion,
    fontFamily: isInjected ? typography.fontFamily : 'system-ui, sans-serif',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          {lang === 'zh'
            ? `将提取的 token 注入通用组件，直观感受这套设计语言`
            : `Inject extracted tokens into generic components to feel the design language`}
        </p>
        <button
          onClick={() => setIsInjected(!isInjected)}
          style={{
            flexShrink: 0,
            marginLeft: '16px',
            padding: '8px 20px',
            background: isInjected ? 'var(--bg-surface)' : primaryHex,
            color: isInjected ? 'var(--text-primary)' : btnTextHex,
            borderRadius: '100px',
            border: isInjected ? '1px solid var(--border-base)' : 'none',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            whiteSpace: 'nowrap' as const
          }}
        >
          {isInjected ? t.btnReset : t.btnInject}
        </button>
      </div>

      {/* Component Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
        padding: '32px', background: 'var(--bg-surface)',
        borderRadius: '12px', border: '1px solid var(--border-subtle)'
      }}>

        {/* Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary, var(--text-secondary))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Button
          </span>
          <div style={{ height: '88px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button style={{
              ...sharedBtnBase,
              padding: isInjected ? '6px 16px' : '10px 20px',
              fontSize: '13px',
              fontWeight: isInjected ? 600 : 500,
              borderRadius: isInjected ? radius : '8px',
              background: isInjected ? primaryHex : '#1D1D1F',
              color: '#FFFFFF',
              border: 'none',
              letterSpacing: isInjected ? typography.letterSpacing : 'normal',
              boxShadow: isInjected ? shadow : '0 2px 4px rgba(0,122,255,0.25)',
            }}>
              {lang === 'zh' ? '提交' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary, var(--text-secondary))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Input
          </span>
          <div style={{ height: '88px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div style={{
              width: '100%', height: '34px',
              background: isInjected ? surfaceHex : '#F2F2F7',
              borderRadius: isInjected ? radius : '6px',
              border: isInjected ? `1px solid ${borderHex}` : '1.5px solid #E5E5EA',
              padding: '0 12px',
              display: 'flex', alignItems: 'center',
              color: isInjected ? textHex + '80' : '#8E8E93',
              fontSize: '13px',
              fontFamily: isInjected ? typography.fontFamily : 'system-ui',
              letterSpacing: isInjected ? typography.letterSpacing : 'normal',
              transition: motion,
            }}>
              {lang === 'zh' ? '搜索...' : 'Search...'}
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary, var(--text-secondary))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Card
          </span>
          <div style={{ height: '88px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div style={{
              padding: isInjected ? '10px 14px' : '12px 16px',
              background: isInjected ? surfaceHex : '#FFFFFF',
              borderRadius: isInjected ? radius : '10px',
              border: isInjected ? `1px solid ${borderHex}` : '1px solid #E5E5EA',
              width: '100%',
              display: 'flex', flexDirection: 'column', gap: isInjected ? '3px' : '6px',
              transition: motion,
              boxShadow: isInjected ? shadow : 'none',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: isInjected ? textHex : '#1D1D1F', letterSpacing: isInjected ? typography.letterSpacing : 'normal', fontFamily: isInjected ? typography.fontFamily : 'system-ui' }}>
                {lang === 'zh' ? '卡片标题' : 'Card Title'}
              </div>
              <div style={{ fontSize: '11px', color: isInjected ? textHex + '80' : '#8E8E93' }}>
                {lang === 'zh' ? '说明文字' : 'Description'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Injected badges */}
      {isInjected && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[t.badge1, t.badge2, t.badge3].filter(Boolean).map(badge => (
            <span key={badge} style={{
              fontSize: '11px', padding: '3px 10px',
              background: 'transparent',
              border: `1px solid ${primaryHex}40`,
              color: primaryHex,
              borderRadius: '100px', fontWeight: 500
            }}>
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function inferRadius(d: string): string {
  const s = d.toLowerCase()
  if (s.includes('sharp') || s.includes('0px')) return '0px'
  if (s.includes('full') || s.includes('pill')) return '9999px'
  if (s.includes('large') || s.includes('xl')) return '16px'
  if (s.includes('medium')) return '8px'
  if (s.includes('small')) return '4px'
  return '6px'
}
function inferShadow(d: string): string {
  const s = d.toLowerCase()
  if (s.includes('none') || s.includes('flat')) return 'none'
  if (s.includes('heavy') || s.includes('strong')) return '0 8px 24px rgba(0,0,0,0.15)'
  return '0 1px 4px rgba(0,0,0,0.08)'
}
function inferDuration(d: string): string {
  const s = d.toLowerCase()
  if (s.includes('fast')) return '120ms'
  if (s.includes('slow')) return '350ms'
  return '200ms'
}
