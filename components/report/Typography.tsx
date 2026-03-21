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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
        
        {displayFonts.map((font, idx) => {
          // If we run out of predefined styles, inherit the previous one but scale down
          const style = styles[idx] || { ...styles[idx-1], size: '12px', label: 'SECONDARY' }
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              
              {/* The label itself IS the styled specimen */}
              <div style={{ 
                fontSize: style.size, fontWeight: style.weight, color: 'var(--text-primary)', 
                fontFamily: `"${font}", var(--font-sans), sans-serif`, 
                lineHeight: style.lh, letterSpacing: 'normal', maxWidth: '100%',
                wordBreak: 'break-word', margin: 0
              }}>
                {style.label}
              </div>
              
              {/* Technical Data Points Boxed Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                 <MetricTag label={tFont} value={font} />
                 <MetricTag label={tWeight} value={style.weight} />
                 <MetricTag label={tSize} value={style.size} />
                 <MetricTag label={tLh} value={style.lh} />
                 <MetricTag label={tLs} value={data.letterSpacing} />
              </div>
              
              {/* Sub-divider */}
              {idx < displayFonts.length - 1 && (
                <div style={{ height: '1px', background: 'var(--border-subtle)', width: '100%', marginTop: '16px' }} />
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}

function MetricTag({ label, value }: { label: string, value: any }) {
  if (!value) return null
  let displayValue = String(value)
  // Hard truncation to defensively prevent AI paragraphs from breaking the UI
  if (displayValue.length > 20) {
    displayValue = displayValue.substring(0, 18) + '...'
  }
  return (
    <div style={{ 
      display: 'inline-flex', alignItems: 'center', gap: '6px', 
      padding: '4px 10px', background: '#fff', borderRadius: '6px', 
      border: '1px solid rgba(0,0,0,0.06)', fontSize: '11px', fontFamily: 'var(--font-mono)'
    }} title={String(value)}>
      <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{displayValue}</span>
    </div>
  )
}
