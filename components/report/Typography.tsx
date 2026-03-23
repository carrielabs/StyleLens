'use client'

import type { PageStyleAnalysis, Typography as TypoType } from '@/lib/types'

export default function Typography({
  data,
  analysis,
  sourceType,
  lang,
  fullWidth = false
}: {
  data: TypoType
  analysis?: PageStyleAnalysis
  sourceType: 'image' | 'url'
  lang: 'zh' | 'en'
  fullWidth?: boolean
}) {
  const normalizeWeight = (value: unknown, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const normalizeLineHeight = (value: unknown, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

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

  const baseSize = 16
  const scale = parseFloat(data.fontSizeScale || '1.25')
  
  const styles = [
    {
      label: lang === 'zh' ? '主标题' : 'Heading',
      size: `${Math.round(baseSize * scale * scale)}px`,
      weight: normalizeWeight(data.headingWeight, 700),
      lh: 1.1,
      text: lang === 'zh' ? '探索设计的内在秩序。' : 'Discover the internal order of design.',
      isBody: false
    },
    {
      label: lang === 'zh' ? '副标题' : 'Subheader',
      size: `${Math.round(baseSize * scale)}px`,
      weight: Math.max(400, normalizeWeight(data.headingWeight, 700) - 100),
      lh: 1.3,
      text: lang === 'zh' ? '去掉非必要元素，纯粹即是力量。' : 'Less, but better. Purity is power.',
      isBody: false
    },
    {
      label: lang === 'zh' ? '正文' : 'Body',
      size: `${baseSize}px`,
      weight: normalizeWeight(data.bodyWeight, 400),
      lh: normalizeLineHeight(data.lineHeight, 1.6),
      text: lang === 'zh' 
        ? '优秀的设计是尽可能少的设计。它专注于最本质的方面，使得产品不被非必要元素所拖累。抛弃繁芜，回归本真。当界面变得隐形时，内容才能真正与用户产生共鸣与连接。' 
        : 'Good design is as little design as possible. It concentrates on the essential aspects, not burdening the product with non-essentials. When the interface becomes invisible, content truly connects.',
      isBody: true
    },
    {
      label: lang === 'zh' ? '辅助说明' : 'Caption',
      size: `${Math.round(baseSize / scale)}px`,
      weight: 400,
      lh: 1.4,
      text: lang === 'zh' ? '细节决定成败。' : 'Details make the design.',
      isBody: false
    }
  ]

  let parsedSpacing = String(data.letterSpacing || 'normal')
  if (parsedSpacing.length > 15) parsedSpacing = 'normal' // hard truncate AI paragraph bleed

  const measuredTypography = sourceType === 'url' ? (analysis?.typographyTokens || []).slice(0, 8) : []
  const hasMeasuredTypography = measuredTypography.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'auto', paddingBottom: '16px' }}>
      <div style={{ minWidth: fullWidth ? '100%' : '640px' }}>
        {hasMeasuredTypography ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {lang === 'zh' ? '基于页面测量的字体样式' : 'Measured page typography'}
              </div>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                padding: '3px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                {lang === 'zh' ? '真实页面样式' : 'Measured'}
              </span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'baseline', padding: '16px 0',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600
            }}>
              <div style={{ flex: '0 0 28%' }}>{lang === 'zh' ? '字体' : 'Font'}</div>
              <div style={{ flex: '0 0 14%', textAlign: 'right' }}>{lang === 'zh' ? '字号' : 'Size'}</div>
              <div style={{ flex: '0 0 14%', textAlign: 'right' }}>{lang === 'zh' ? '字重' : 'Weight'}</div>
              <div style={{ flex: '0 0 14%', textAlign: 'right' }}>{lang === 'zh' ? '字间距' : 'Spacing'}</div>
              <div style={{ flex: '0 0 14%', textAlign: 'right' }}>{lang === 'zh' ? '行高' : 'Line Height'}</div>
              <div style={{ flex: '0 0 16%', textAlign: 'right' }}>{lang === 'zh' ? '频次' : 'Count'}</div>
            </div>

            {measuredTypography.map((token, idx) => (
              <div key={`${token.id}-${idx}`} style={{
                display: 'flex',
                alignItems: 'baseline',
                padding: '20px 0',
                borderBottom: idx < measuredTypography.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
              }}>
                <div style={{
                  flex: '0 0 28%',
                  fontSize: `clamp(14px, ${token.fontSize || '18px'}, 32px)`,
                  fontWeight: normalizeWeight(token.fontWeight, 500),
                  color: 'var(--text-primary)',
                  fontFamily: token.fontFamily || `"${displayFonts[0]}", var(--font-sans), sans-serif`,
                  lineHeight: 1.2,
                  paddingRight: '16px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }} title={token.fontFamily}>
                  {token.fontFamily}
                </div>
                <div style={{ flex: '0 0 14%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {token.fontSize || '—'}
                </div>
                <div style={{ flex: '0 0 14%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {token.fontWeight || '—'}
                </div>
                <div style={{ flex: '0 0 14%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {token.letterSpacing || 'normal'}
                </div>
                <div style={{ flex: '0 0 14%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {token.lineHeight || '—'}
                </div>
                <div style={{ flex: '0 0 16%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {token.sampleCount}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ 
              display: 'flex', alignItems: 'baseline', paddingBottom: '16px', 
              borderBottom: '1px solid var(--border-subtle)', 
              fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600
            }}>
              <div style={{ flex: '0 0 32%' }}>{lang === 'zh' ? '字体' : 'Font'}</div>
              <div style={{ flex: '0 0 16%' }}>{lang === 'zh' ? '场景' : 'Scenario'}</div>
              <div style={{ flex: '0 0 13%', textAlign: 'right' }}>{lang === 'zh' ? '字号' : 'Size'}</div>
              <div style={{ flex: '0 0 13%', textAlign: 'right' }}>{lang === 'zh' ? '字重' : 'Weight'}</div>
              <div style={{ flex: '0 0 13%', textAlign: 'right' }}>{lang === 'zh' ? '字间距' : 'Spacing'}</div>
              <div style={{ flex: '0 0 13%', textAlign: 'right' }}>{lang === 'zh' ? '行高' : 'Line Height'}</div>
            </div>

            {displayFonts.map((font, idx) => {
              const style = styles[idx] || { ...styles[2], size: '14px', label: lang === 'zh' ? '其他' : 'OTHER' }
              
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  padding: '24px 0', 
                  borderBottom: idx < displayFonts.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' 
                }}>
                  <div style={{ 
                    flex: '0 0 32%', 
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

                  <div style={{ flex: '0 0 16%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                    {style.label}
                  </div>

                  <div style={{ flex: '0 0 13%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {style.size}
                  </div>

                  <div style={{ flex: '0 0 13%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {String(style.weight)}
                  </div>

                  <div style={{ flex: '0 0 13%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {parsedSpacing}
                  </div>

                  <div style={{ flex: '0 0 13%', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {String(style.lh)}
                  </div>
                </div>
              )
            })}
          </>
        )}

      </div>
    </div>
  )
}
