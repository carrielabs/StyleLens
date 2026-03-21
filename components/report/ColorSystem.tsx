'use client'

import { useState } from 'react'
import type { ColorToken } from '@/lib/types'

export default function ColorSystem({ colors, lang }: { colors: ColorToken[], lang: 'zh' | 'en' }) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

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

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(8, 1fr)', 
      gap: '12px' 
    }}>
      {colors.map((c, i) => (
        <div 
          key={i}
          onClick={() => copyColor(c.hex)}
          onMouseEnter={() => window.dispatchEvent(new CustomEvent('color-hover', { detail: c.hex }))}
          onMouseLeave={() => window.dispatchEvent(new CustomEvent('color-hover', { detail: null }))}
          style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            cursor: 'crosshair', transition: 'opacity 0.2s, transform 0.2s',
            opacity: copiedHex && copiedHex !== c.hex ? 0.3 : 1
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
              {getRoleLabel(c.role)}
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
      ))}
    </div>
  )
}
