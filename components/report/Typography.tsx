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
  
  // Cap at 4 for UI layout bounds
  displayFonts = displayFonts.slice(0, 4)

  // CRITICAL FIX: The user wants to see the full visual hierarchy scale.
  // We expand the array to always have 4 elements (Heading, Subheading, Body, Menu)
  // by inheriting the primary font if the AI didn't extract enough distinct fonts.
  while (displayFonts.length < 4) {
    displayFonts.push(displayFonts[0])
  }

  const styles = [
    {
      label: lang === 'zh' ? '标题 HEADING' : 'HEADING',
      size: '44px',
      weight: data.headingWeight || 700,
      lh: 1.1,
    },
    {
      label: lang === 'zh' ? '副标题 SUBHEAD' : 'SUBHEAD',
      size: '24px',
      weight: data.headingWeight ? Math.max(400, Number(data.headingWeight) - 100) : 600,
      lh: 1.3,
    },
    {
      label: lang === 'zh' ? '正文 BODY' : 'BODY',
      size: '16px',
      weight: data.bodyWeight || 400,
      lh: data.lineHeight || 1.6,
    },
    {
      label: lang === 'zh' ? '菜单 MENU' : 'MENU',
      size: '13px',
      weight: 500,
      lh: 1.4,
    }
  ]

  const tFont = lang === 'zh' ? '字体' : 'Font'
  const tWeight = lang === 'zh' ? '字重' : 'Weight'
  const tSize = lang === 'zh' ? '字号' : 'Size'
  const tLh = lang === 'zh' ? '行高' : 'Line-Height'
  const tLs = lang === 'zh' ? '字间距' : 'Letter-Spacing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Visual Hierarchy */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {displayFonts.map((font, idx) => {
          // If we run out of predefined styles, inherit the previous one but scale down
          const style = styles[idx] || { ...styles[idx-1], size: '12px', label: 'SECONDARY' }
          
          return (
            <div key={idx} style={{ 
              background: 'var(--bg-elevated)', borderRadius: '16px', padding: '24px', 
              border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', 
              justifyContent: 'space-between', minHeight: '220px', position: 'relative', overflow: 'hidden' 
            }}>
              
              {/* Top: Massive Decorative Letter Aa */}
              <div style={{ 
                fontSize: Number(style.size.replace('px', '')) > 20 ? '72px' : '48px', 
                fontWeight: style.weight, color: 'var(--text-primary)', 
                fontFamily: `"${font}", var(--font-sans), sans-serif`, 
                lineHeight: 1, letterSpacing: '-0.04em', margin: '-8px 0 32px -4px'
              }}>
                Aa
              </div>
              
              {/* Bottom: Structured Specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: 'auto' }}>
                 
                 {/* Roles & Font Family */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                      {style.label}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                      {font}
                    </div>
                 </div>

                 {/* Engineering Data Sheet Grid */}
                 <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <MetricBlock label={tWeight} value={style.weight} />
                    <MetricBlock label={tSize} value={style.size} />
                    <MetricBlock label={tLh} value={style.lh} />
                    <MetricBlock label={tLs} value={data.letterSpacing} />
                 </div>

              </div>

            </div>
          )
        })}

      </div>
    </div>
  )
}

function MetricBlock({ label, value }: { label: string, value: any }) {
  if (!value) return null
  let displayValue = String(value)
  // Hard truncation for historical legacy data paragraphs
  if (displayValue.length > 15) {
    displayValue = displayValue.substring(0, 12) + '...'
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} title={String(value)}>
      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
        {displayValue}
      </span>
    </div>
  )
}
