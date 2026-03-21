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
  
  // Cap at 4 to cover full hierarchy without breaking UI bounds
  displayFonts = displayFonts.slice(0, 4)

  // Ensure we always have at least enough base levels for visual structure
  while (displayFonts.length < 3) {
    displayFonts.push(displayFonts[0])
  }

  const styles = [
    {
      label: lang === 'zh' ? '主标题' : 'HEADING',
      size: '48px',
      weight: data.headingWeight || 700,
      lh: 1.1,
      text: lang === 'zh' ? '探索设计的内在秩序。' : 'Discover the internal order of design.',
      isBody: false
    },
    {
      label: lang === 'zh' ? '副标题' : 'SUBHEADER',
      size: '24px',
      weight: data.headingWeight ? Math.max(400, Number(data.headingWeight) - 200) : 500,
      lh: 1.3,
      text: lang === 'zh' ? '去掉非必要元素，纯粹即是力量。' : 'Less, but better. Purity is power.',
      isBody: false
    },
    {
      label: lang === 'zh' ? '正文' : 'BODY',
      size: '16px',
      weight: data.bodyWeight || 400,
      lh: data.lineHeight || 1.6,
      text: lang === 'zh' 
        ? '优秀的设计是尽可能少的设计。它专注于最本质的方面，使得产品不被非必要元素所拖累。抛弃繁芜，回归本真。当界面变得隐形时，内容才能真正与用户产生共鸣与连接。' 
        : 'Good design is as little design as possible. It concentrates on the essential aspects, not burdening the product with non-essentials. When the interface becomes invisible, content truly connects.',
      isBody: true
    },
    {
      label: lang === 'zh' ? '辅助说明' : 'CAPTION',
      size: '13px',
      weight: 400,
      lh: 1.4,
      text: lang === 'zh' ? '细节决定成败。' : 'Details make the design.',
      isBody: false
    }
  ]

  let parsedSpacing = String(data.letterSpacing || 'normal')
  if (parsedSpacing.length > 15) parsedSpacing = 'normal' // hard truncate AI paragraph bleed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      <div style={{ width: '100%' }}>
        
        {/* Explicit 6-Column Header */}
        <div style={{ 
          display: 'flex', alignItems: 'center', paddingBottom: '16px', 
          borderBottom: '1px solid var(--border-subtle)', 
          fontSize: '13px', color: 'var(--text-tertiary)' 
        }}>
          <div style={{ flex: '0 0 35%' }}>{lang === 'zh' ? '字体' : 'Font'}</div>
          <div style={{ flex: '0 0 15%' }}>{lang === 'zh' ? '场景' : 'Scenario'}</div>
          <div style={{ flex: '0 0 10%' }}>{lang === 'zh' ? '字号' : 'Size'}</div>
          <div style={{ flex: '0 0 12%' }}>{lang === 'zh' ? '字重' : 'Weight'}</div>
          <div style={{ flex: '0 0 15%' }}>{lang === 'zh' ? '行高' : 'Line Height'}</div>
          <div style={{ flex: '0 0 13%' }}>{lang === 'zh' ? '字间距' : 'Spacing'}</div>
        </div>

        {displayFonts.map((font, idx) => {
          // If extracted array is longer than predefined styles, fallback to BODY style scaling
          const style = styles[idx] || { ...styles[2], size: '14px', label: lang === 'zh' ? '其他' : 'OTHER' }
          
          return (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '24px 0', 
              borderBottom: idx < displayFonts.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' 
            }}>
              
              {/* 1. FONT (The Specimen) */}
              <div style={{ 
                flex: '0 0 35%', 
                fontSize: `clamp(13px, ${style.size}, 36px)`, 
                fontWeight: style.weight, 
                color: 'var(--text-primary)', 
                fontFamily: `"${font}", var(--font-sans), sans-serif`, 
                lineHeight: 1.2, 
                paddingRight: '16px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} title={font}>
                {font}
              </div>

              {/* 2. SCENARIO */}
              <div style={{ flex: '0 0 15%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {style.label}
              </div>

              {/* 3. SIZE */}
              <div style={{ flex: '0 0 10%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {style.size}
              </div>

              {/* 4. WEIGHT */}
              <div style={{ flex: '0 0 12%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {style.weight}
              </div>

              {/* 5. LINE HEIGHT */}
              <div style={{ flex: '0 0 15%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {style.lh}
              </div>

              {/* 6. SPACING */}
              <div style={{ flex: '0 0 13%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {parsedSpacing}
              </div>

            </div>
          )
        })}

      </div>
    </div>
  )
}


