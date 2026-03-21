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
  
  // Cap at 3 for UI layout bounds
  displayFonts = displayFonts.slice(0, 3)

  // CRITICAL FIX: The user wants to see the visual hierarchy (Heading vs Body sizes),
  // so if AI only extracted 1 font family, we explicitly duplicate it to show both styles.
  if (displayFonts.length === 1) {
    displayFonts.push(displayFonts[0])
  }

  const styles = [
    {
      label: lang === 'zh' ? '标题 HEADING' : 'HEADING',
      size: '44px',
      weight: data.headingWeight || 700,
      lh: 1.1,
      text: lang === 'zh' ? '探索设计的内在秩序' : 'The quick brown fox'
    },
    {
      label: lang === 'zh' ? '正文 BODY' : 'BODY',
      size: '16px',
      weight: data.bodyWeight || 400,
      lh: data.lineHeight || 1.6,
      text: lang === 'zh' 
        ? '优秀的设计是尽可能少的设计。它专注于最本质的方面，使得产品不被非必要元素所拖累。纯粹，简单。' 
        : 'Good design is as little design as possible. It concentrates on the essential aspects.'
    },
    {
      label: lang === 'zh' ? '辅助字 ACCENT' : 'ACCENT',
      size: '13px',
      weight: 500,
      lh: 1.4,
      text: lang === 'zh' ? '细节决定成败。0123456789' : 'Details make the design. 0123456789'
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Visual Hierarchy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
        
        {displayFonts.map((font, idx) => {
          // If we run out of predefined styles, inherit the previous one but scale down
          const style = styles[idx] || { ...styles[idx-1], size: '12px', label: 'SECONDARY' }
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ padding: '4px 8px', background: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                   {style.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{font} / W{style.weight}</span>
              </div>
              <div style={{ 
                fontSize: style.size, fontWeight: style.weight, color: 'var(--text-primary)', 
                fontFamily: `"${font}", var(--font-sans), sans-serif`, 
                lineHeight: style.lh, letterSpacing: data.letterSpacing, maxWidth: '580px'
              }}>
                {style.text}
              </div>
              
              {/* Divider between specimens, except the last one */}
              {idx < displayFonts.length - 1 && (
                <div style={{ height: '1px', background: 'var(--border-subtle)', width: '40px', marginTop: '20px' }} />
              )}
            </div>
          )
        })}

      </div>

    </div>
  )
}
