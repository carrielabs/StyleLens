'use client'

import { useState } from 'react'
import type { ColorToken, LayeredColorSystem, PageStyleAnalysis } from '@/lib/types'

export default function ColorSystem({
  colors,
  colorSystem,
  analysis,
  sourceType,
  lang
}: {
  colors: ColorToken[]
  colorSystem?: LayeredColorSystem
  analysis?: PageStyleAnalysis
  sourceType: 'image' | 'url'
  lang: 'zh' | 'en'
}) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

  const hexDistance = (hexA?: string, hexB?: string) => {
    if (!hexA || !hexB) return Number.POSITIVE_INFINITY
    const parse = (hex: string) => {
      const clean = hex.replace('#', '')
      return [
        Number.parseInt(clean.slice(0, 2), 16),
        Number.parseInt(clean.slice(2, 4), 16),
        Number.parseInt(clean.slice(4, 6), 16),
      ]
    }
    const [r1, g1, b1] = parse(hexA)
    const [r2, g2, b2] = parse(hexB)
    return Math.sqrt(((r1 - r2) ** 2) + ((g1 - g2) ** 2) + ((b1 - b2) ** 2))
  }

  const isExtremeNoiseColor = (hex?: string) => {
    if (!hex) return false
    const clean = hex.replace('#', '').toUpperCase()
    return clean === '00FF00' || clean === 'FFFF00'
  }

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1500)
  }

  const getRoleLabel = (role: string) => {
    const map: Record<string, {zh: string, en: string}> = {
      'background': { zh: '背景色', en: 'Background' },
      'surface': { zh: '面板色', en: 'Surface' },
      'primary': { zh: '主品牌色', en: 'Primary' },
      'secondary': { zh: '次强调色', en: 'Secondary' },
      'accent': { zh: '点缀色', en: 'Accent' },
      'text': { zh: '主文字', en: 'Text Primary' },
      'border': { zh: '边框线', en: 'Border' }
    }
    return map[role]?.[lang] || (lang === 'zh' ? '其他' : 'Other')
  }

  const measuredCandidates = new Map(
    (analysis?.colorCandidates || []).map(candidate => [candidate.hex.toUpperCase(), candidate])
  )
  type DisplayColor = ColorToken & { roleLabelOverride?: string }
  const contentColors = sourceType === 'url'
    ? (colorSystem?.contentColors || [])
    : []

  const measuredContentCandidates = sourceType === 'url'
    ? (analysis?.colorCandidates || [])
        .filter(candidate =>
          candidate.layerHints.includes('content') &&
          !candidate.layerHints.includes('hero') &&
          !colors.some(color => color.hex.toUpperCase() === candidate.hex.toUpperCase())
        )
        .slice(0, 6)
    : []

  const systemPalette: DisplayColor[] = sourceType === 'url' && colorSystem
    ? [
        colorSystem.heroBackground && { ...colorSystem.heroBackground, roleLabelOverride: lang === 'zh' ? 'Hero 背景' : 'Hero background' },
        colorSystem.heroTextPrimary && { ...colorSystem.heroTextPrimary, roleLabelOverride: lang === 'zh' ? 'Hero 文字' : 'Hero text' },
        colorSystem.heroPrimaryAction && { ...colorSystem.heroPrimaryAction, roleLabelOverride: lang === 'zh' ? 'Hero 主按钮' : 'Hero primary action' },
        colorSystem.heroSecondaryAction && { ...colorSystem.heroSecondaryAction, roleLabelOverride: lang === 'zh' ? 'Hero 次按钮' : 'Hero secondary action' },
        colorSystem.pageBackground && { ...colorSystem.pageBackground, roleLabelOverride: lang === 'zh' ? '页面背景' : 'Page background' },
        colorSystem.surface && { ...colorSystem.surface, roleLabelOverride: lang === 'zh' ? '面板色' : 'Surface' },
        colorSystem.textPrimary && { ...colorSystem.textPrimary, roleLabelOverride: lang === 'zh' ? '主文字' : 'Text primary' },
        colorSystem.textSecondary && { ...colorSystem.textSecondary, roleLabelOverride: lang === 'zh' ? '辅助文字' : 'Text secondary' },
        colorSystem.border && { ...colorSystem.border, roleLabelOverride: lang === 'zh' ? '边框线' : 'Border' },
        colorSystem.primaryAction && { ...colorSystem.primaryAction, roleLabelOverride: lang === 'zh' ? '主动作色' : 'Primary action' },
        colorSystem.secondaryAction && { ...colorSystem.secondaryAction, roleLabelOverride: lang === 'zh' ? '次动作色' : 'Secondary action' },
      ].filter(Boolean) as DisplayColor[]
    : colors.map(color => ({ ...color }))

  const dedupedSystemPalette = systemPalette.filter((color, index, list) => {
    if (isExtremeNoiseColor(color.hex)) return false

    const sameHexIndex = list.findIndex(item => item.hex.toUpperCase() === color.hex.toUpperCase())
    if (sameHexIndex !== index) return false

    const isTextRole = (label?: string) => ['主文字', '辅助文字', 'Hero 文字', 'Text primary', 'Text secondary', 'Hero text'].includes(label || '')
    if (!isTextRole(color.roleLabelOverride)) return true

    return list.findIndex(item =>
      isTextRole(item.roleLabelOverride) &&
      hexDistance(item.hex, color.hex) < 20
    ) === index
  })

  const accentPalette: DisplayColor[] = sourceType === 'url' && colorSystem
    ? [
        ...(colorSystem.heroAccentColors || []).map(color => ({ ...color, roleLabelOverride: lang === 'zh' ? 'Hero 点缀色' : 'Hero accent' })),
        ...contentColors.map(color => ({ ...color, roleLabelOverride: lang === 'zh' ? '内容点缀色' : 'Content accent' })),
      ].filter((color, index, list) =>
        !isExtremeNoiseColor(color.hex) &&
        list.findIndex(item => item.hex.toUpperCase() === color.hex.toUpperCase()) === index
      )
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {sourceType === 'url' && analysis && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {lang === 'zh'
              ? 'URL 模式下，颜色优先基于页面样式测量结果；插图、截图和媒体内容中的装饰色会被降权。'
              : 'For URL analysis, colors prioritize measured page style signals; decorative colors from illustrations, screenshots, and media are deprioritized.'}
          </p>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            padding: '3px 8px',
            borderRadius: '999px',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            {lang === 'zh' ? '系统色优先' : 'System colors prioritized'}
          </span>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(8, 1fr)', 
        gap: '12px' 
      }}>
      {dedupedSystemPalette.map((c, i) => {
        const isLowPriorityOther = sourceType === 'url' && c.role === 'other'
        return (
        <div 
          key={i}
          onClick={() => copyColor(c.hex)}
          onMouseEnter={() => window.dispatchEvent(new CustomEvent('color-hover', { detail: c.hex }))}
          onMouseLeave={() => window.dispatchEvent(new CustomEvent('color-hover', { detail: null }))}
          style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            cursor: 'crosshair', transition: 'opacity 0.2s, transform 0.2s',
            opacity: copiedHex && copiedHex !== c.hex ? 0.3 : isLowPriorityOther ? 0.7 : 1
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          title={c.name}
        >
          {/* Swatch - Soft Square without borders */}
          <div style={{
              width: '100%', aspectRatio: '1/1',
              backgroundColor: c.hex,
              borderRadius: '12px',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' // extremely subtle inner line so white doesn't bleed, but no visible border
            }}
          />
          {/* Strict Label Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.roleLabelOverride || getRoleLabel(c.role)}
            </div>
            <div style={{ 
              fontSize: '11px', 
              fontFamily: 'var(--font-mono)', 
              color: copiedHex === c.hex ? 'var(--success)' : 'var(--text-tertiary)',
              fontWeight: copiedHex === c.hex ? 600 : 400
            }}>
              {copiedHex === c.hex ? (lang === 'zh' ? '已复制' : 'Copied') : c.hex.toUpperCase()}
            </div>
          </div>
        </div>
      )})}
      </div>

      {(accentPalette.length > 0 || measuredContentCandidates.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {lang === 'zh' ? '辅助点缀色' : 'Secondary accents'}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {accentPalette.map(candidate => (
              <div
                key={`${candidate.hex}-layered`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '999px',
                  background: '#F6F6F6',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
                >
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '999px',
                  background: candidate.hex,
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)'
                }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {candidate.hex.toUpperCase()}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  {candidate.roleLabelOverride || getRoleLabel(candidate.role)}
                </span>
              </div>
            ))}
            {accentPalette.length === 0 && measuredContentCandidates.map(candidate => (
              <div
                key={`${candidate.hex}-${candidate.property}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '999px',
                  background: '#F6F6F6',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '999px',
                  background: candidate.hex,
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)'
                }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {candidate.hex.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
