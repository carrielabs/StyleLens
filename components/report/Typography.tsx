'use client'

import type { Typography as TypoType } from '@/lib/types'

export default function Typography({ data, lang }: { data: TypoType, lang: 'zh' | 'en' }) {
  const fontNames = data.fontFamily.split(',').map(f => {
    let clean = f.replace(/['"]/g, '').replace(/e\.g\.,/gi, '').trim()
    if (clean.includes(':')) clean = clean.split(':')[1]?.trim() || clean
    if (clean.length > 25) clean = clean.substring(0, 25) + '...'
    return clean
  }).filter(Boolean)

  // Remove generic fallbacks unless it's the only one
  let displayFonts = fontNames.filter(f => !['sans-serif', 'serif', 'system-ui', '-apple-system', 'blinkmacsystemfont'].includes(f.toLowerCase()))
  if (displayFonts.length === 0) displayFonts = [fontNames[0] || 'System Font']
  
  // Cap at 3 for a focused, high-end editorial look
  displayFonts = displayFonts.slice(0, 3)

  while (displayFonts.length < 3) {
    displayFonts.push(displayFonts[0])
  }

  const styles = [
    {
      label: lang === 'zh' ? '主标题 HEADING' : 'HEADING',
      size: '48px',
      weight: data.headingWeight || 700,
      lh: 1.1,
      text: lang === 'zh' ? '探索设计的内在秩序。' : 'Discover the internal order of design.',
      isBody: false
    },
    {
      label: lang === 'zh' ? '副标题 SUBHEADER' : 'SUBHEADER',
      size: '24px',
      weight: data.headingWeight ? Math.max(400, Number(data.headingWeight) - 200) : 500,
      lh: 1.3,
      text: lang === 'zh' ? '去掉非必要元素，纯粹即是力量。' : 'Less, but better. Purity is power.',
      isBody: false
    },
    {
      label: lang === 'zh' ? '正文 BODY' : 'BODY',
      size: '16px',
      weight: data.bodyWeight || 400,
      lh: data.lineHeight || 1.6,
      text: lang === 'zh' 
        ? '优秀的设计是尽可能少的设计。它专注于最本质的方面，使得产品不被非必要元素所拖累。抛弃繁芜，回归本真。当界面变得隐形时，内容才能真正与用户产生共鸣与连接。' 
        : 'Good design is as little design as possible. It concentrates on the essential aspects, not burdening the product with non-essentials. When the interface becomes invisible, content truly connects.',
      isBody: true
    }
  ]

  let parsedSpacing = String(data.letterSpacing || 'normal')
  if (parsedSpacing.length > 15) parsedSpacing = 'normal' // hard truncate AI paragraph bleed

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', 
      border: '1px solid var(--border-subtle)', 
      borderRadius: '16px', overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
        
        {displayFonts.map((font, idx) => {
          const style = styles[idx]
          
          return (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              borderBottom: idx < displayFonts.length - 1 ? '1px solid var(--border-subtle)' : 'none' 
            }}>
              
              {/* Preview Canvas (Left) */}
              <div style={{ 
                flex: 1, 
                padding: '40px 32px', 
                background: 'var(--bg-elevated)', 
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  fontSize: style.size, 
                  fontWeight: style.weight, 
                  color: 'var(--text-primary)', 
                  fontFamily: `"${font}", var(--font-sans), sans-serif`, 
                  lineHeight: style.lh, 
                  letterSpacing: parsedSpacing, 
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                  transition: 'all 0.2s ease'
                }}>
                  {style.text}
                </div>
              </div>

              {/* CSS Inspector Panel (Right) */}
              <div style={{ 
                width: '320px', flexShrink: 0,
                padding: '32px 24px', 
                borderLeft: '1px solid var(--border-subtle)', 
                background: '#fff',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center'
              }}>
                 {/* Header Row */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                      {style.label}
                    </div>
                 </div>
                 
                 {/* CSS Properties (Mimicking Developer Tools) */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <CssProp label="font-family" value={font} />
                    <CssProp label="font-weight" value={style.weight} />
                    <CssProp label="font-size" value={style.size} />
                    <CssProp label="line-height" value={style.lh} />
                    <CssProp label="letter-spacing" value={parsedSpacing} />
                 </div>
              </div>

            </div>
          )
        })}

    </div>
  )
}

function CssProp({ label, value }: { label: string; value: any }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        :
      </span>
      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500 }}>
        {value}
      </span>
      <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        ;
      </span>
    </div>
  )
}
