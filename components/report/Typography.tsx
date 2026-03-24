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

  const splitFontStack = (value?: string) =>
    (value || '')
      .split(',')
      .map(font => font.replace(/['"]/g, '').trim())
      .filter(Boolean)

  const isGenericFont = (value: string) =>
    [
      'sans-serif',
      'serif',
      'monospace',
      'system-ui',
      '-apple-system',
      'blinkmacsystemfont',
      'ui-sans-serif',
      'ui-serif',
      'ui-monospace',
      'inherit',
      'initial',
      'unset',
    ].includes(value.toLowerCase())

  const getPrimaryFontName = (value?: string) => {
    const fonts = splitFontStack(value)
    const primary = fonts.find(font => !isGenericFont(font))
    return primary || fonts[0] || 'System Font'
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

  const hasRealSize = (value?: string) => {
    if (!value) return false
    const normalized = value.trim().toLowerCase()
    if (normalized.includes('nan')) return false
    return /\d/.test(normalized)
  }

  const hasRealMetric = (value?: string) => {
    if (!value) return false
    const normalized = value.trim().toLowerCase()
    if (!normalized || normalized.includes('nan') || normalized === 'unknown') return false
    return /\d/.test(normalized) || normalized === 'normal'
  }

  const recoveredTypography = sourceType === 'url'
    ? (analysis?.typographyCandidates || [])
        .filter(candidate => hasRealSize(candidate.fontSize))
        .slice(0, 8)
        .map((candidate, index) => ({
          id: `candidate-${index + 1}`,
          fontFamily: candidate.fontFamily,
          fontSize: candidate.fontSize || '—',
          fontWeight: candidate.fontWeight || '—',
          letterSpacing: hasRealMetric(candidate.letterSpacing) ? candidate.letterSpacing! : 'normal',
          lineHeight: hasRealMetric(candidate.lineHeight) ? candidate.lineHeight! : '—',
          sampleCount: candidate.count,
        }))
    : []

  const measuredTypography = sourceType === 'url'
    ? (analysis?.typographyTokens || [])
        .filter(token => hasRealSize(token.fontSize))
        .slice(0, 8)
    : []
  const displayTypography = measuredTypography.length
    ? measuredTypography.map(token => ({
        id: token.id,
        fontFamily: token.fontFamily,
        fontSize: token.fontSize || '—',
        fontWeight: token.fontWeight || '—',
        letterSpacing: token.letterSpacing || 'normal',
        lineHeight: token.lineHeight || '—',
        sampleCount: token.sampleCount,
      }))
    : recoveredTypography
  const hasMeasuredTypography = displayTypography.length > 0

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

            {displayTypography.map((token, idx) => (
              (() => {
                const primaryFont = getPrimaryFontName(token.fontFamily)
                const fullFontStack = splitFontStack(token.fontFamily).join(', ')
                return (
              <div key={`${token.id}-${idx}`} style={{
                display: 'flex',
                alignItems: 'baseline',
                padding: '20px 0',
                borderBottom: idx < displayTypography.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
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
                }} title={fullFontStack || token.fontFamily}>
                  {primaryFont}
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
                )
              })()
            ))}
          </>
        ) : (
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {lang === 'zh' ? '暂未提取到可靠的字体尺寸数据' : 'Reliable typography measurements are not available yet'}
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '560px' }}>
              {lang === 'zh'
                ? '当前只展示从真实页面样式中恢复出的字号、字重、字距和行高。像 NaNpx、推断出来的标题层级或示意值已被隐藏。'
                : 'Only typography values recovered from real page styles are shown here. Synthetic heading scales, NaN sizes, and illustrative values are hidden.'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {displayFonts.slice(0, 3).map((font, idx) => (
                <span
                  key={`${font}-${idx}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: '#F5F5F7',
                    border: '1px solid rgba(0,0,0,0.06)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {font}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
