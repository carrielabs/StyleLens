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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {displayFonts.map((font, idx) => {
          const style = styles[idx]
          
          return (
            <div key={idx} style={{ 
              padding: idx === 0 ? '0 0 40px 0' : '40px 0', 
              borderBottom: idx < displayFonts.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
              
              {/* Top Row: Meta & Metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                    {style.label}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                    {font}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                   <span>W{style.weight}</span>
                   <span>{style.size}</span>
                   <span>{style.lh} LH</span>
                   <span>{parsedSpacing} LS</span>
                </div>
              </div>
              
              {/* Bottom Row: Editorial Specimen Text */}
              <div style={{ 
                fontSize: style.size, 
                fontWeight: style.weight, 
                color: 'var(--text-primary)', 
                fontFamily: `"${font}", var(--font-sans), sans-serif`, 
                lineHeight: style.lh, 
                letterSpacing: parsedSpacing, 
                maxWidth: style.isBody ? '800px' : '100%',
                wordBreak: 'break-word',
                transition: 'all 0.2s ease'
              }}>
                {style.text}
              </div>

            </div>
          )
        })}

    </div>
  )
}
