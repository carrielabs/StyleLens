'use client'

import type { PageStyleAnalysis, Typography as TypoType } from '@/lib/types'
import { useState } from 'react'

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
  // Tab order: 蓝图透视, 海报画廊, 瀑布流, 阅读流
  const [typeView, setTypeView] = useState<'inspector' | 'poster' | 'waterfall' | 'editorial'>('inspector')

  // ── helpers ──────────────────────────────────────────────────────────
  const normalizeWeight = (value: unknown, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const parseFontSize = (value?: string) => {
    if (!value) return 0
    const n = Number.parseFloat(value.trim().toLowerCase())
    return Number.isFinite(n) ? n : 0
  }

  const hasRealSize = (value?: string) => {
    if (!value) return false
    return !value.toLowerCase().includes('nan') && /\d/.test(value)
  }

  const hasRealMetric = (value?: string) => {
    if (!value) return false
    const n = value.trim().toLowerCase()
    if (!n || n.includes('nan') || n === 'unknown') return false
    return /\d/.test(n) || n === 'normal'
  }

  // Truncate long preview text to keep blueprint view clean
  const truncate = (text: string, max = 32) =>
    text.length > max ? text.slice(0, max) + '…' : text

  // ── font fallback display names ────────────────────────────────────
  const fontNames = data.fontFamily.split(',').map(f => {
    let clean = f.replace(/['"]/g, '').replace(/e\.g\.,/gi, '').trim()
    if (clean.includes(':')) clean = clean.split(':')[1]?.trim() || clean
    if (clean.length > 25) clean = clean.substring(0, 25) + '...'
    return clean
  }).filter(Boolean)

  let displayFonts = fontNames.filter(f =>
    !['sans-serif','serif','system-ui','-apple-system','blinkmacsystemfont'].includes(f.toLowerCase()))
  if (displayFonts.length === 0) displayFonts = [fontNames[0] || 'System Font']
  displayFonts = displayFonts.slice(0, 4)
  while (displayFonts.length < 3) displayFonts.push(displayFonts[0])

  // ── typography token list ─────────────────────────────────────────
  const recoveredTypography = sourceType === 'url'
    ? (analysis?.typographyCandidates || [])
        .filter(c => hasRealSize(c.fontSize))
        .slice(0, 8)
        .map((c, i) => ({
          id: `candidate-${i + 1}`,
          label: undefined as string | undefined,
          fontFamily: c.fontFamily,
          fontSize: c.fontSize || '—',
          fontWeight: c.fontWeight || '—',
          letterSpacing: hasRealMetric(c.letterSpacing) ? c.letterSpacing! : 'normal',
          lineHeight: hasRealMetric(c.lineHeight) ? c.lineHeight! : '—',
          sampleCount: c.count,
          sampleText: c.sampleText,
        }))
    : []

  const measuredTypography = sourceType === 'url'
    ? (analysis?.typographyTokens || []).filter(t => hasRealSize(t.fontSize)).slice(0, 8)
    : []

  const displayTypography = measuredTypography.length
    ? measuredTypography.map(t => ({
        id: t.id,
        label: t.label,
        fontFamily: t.fontFamily,
        fontSize: t.fontSize || '—',
        fontWeight: t.fontWeight || '—',
        letterSpacing: t.letterSpacing || 'normal',
        lineHeight: t.lineHeight || '—',
        sampleCount: t.sampleCount,
        sampleText: t.sampleText,
      }))
    : recoveredTypography

  const sortedTypography = [...displayTypography].sort((a, b) => {
    const sd = parseFontSize(b.fontSize) - parseFontSize(a.fontSize)
    if (sd !== 0) return sd
    const cd = (b.sampleCount || 0) - (a.sampleCount || 0)
    if (cd !== 0) return cd
    return normalizeWeight(b.fontWeight, 400) - normalizeWeight(a.fontWeight, 400)
  })

  const hasMeasuredTypography = displayTypography.length > 0

  // ── map to Gemini token shape ──────────────────────────────────────
  const geminiTokens: GeminiToken[] = sortedTypography.map((t, i) => {
    const cleanPrimary = (t.fontFamily || '')
      .split(',')[0].replace(/['"]/g, '').trim() || 'System Font'
    const name = t.label ? t.label.toUpperCase() : `STYLE ${i + 1}`
    const rawPreview = t.sampleText || cleanPrimary
    const previewText = truncate(rawPreview, 36)
    return {
      name,
      previewText,
      family: t.fontFamily || 'sans-serif',
      size: t.fontSize,
      weight: normalizeWeight(t.fontWeight, 400),
      tracking: t.letterSpacing,
      leading: t.lineHeight,
      count: t.sampleCount ?? 0,
    }
  })

  // ── view config (ordered: 蓝图透视, 海报画廊, 瀑布流, 阅读流) ──────
  const views = [
    { id: 'inspector',  labelZh: '蓝图透视', labelEn: 'Blueprint' },
    { id: 'poster',     labelZh: '海报画廊', labelEn: 'Poster' },
    { id: 'waterfall',  labelZh: '瀑布流',   labelEn: 'Waterfall' },
    { id: 'editorial',  labelZh: '阅读流',   labelEn: 'Editorial' },
  ] as const

  const sectionTitle = lang === 'zh' ? '字体排版' : 'Typography'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden', paddingBottom: '16px' }}>
      <div style={{ width: '100%' }}>

        {/* ── View switcher (title removed — "字体" tab label above already identifies this section) ── */}
        {hasMeasuredTypography && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F3F3F4', padding: '4px', borderRadius: '6px' }}>
              {views.map(v => (
                <button key={v.id} onClick={() => setTypeView(v.id)} style={{
                  padding: '4px 12px', fontSize: '12px', fontWeight: 500,
                  borderRadius: '4px', cursor: 'pointer', border: 'none',
                  color: typeView === v.id ? '#111' : '#666',
                  backgroundColor: typeView === v.id ? '#FFF' : 'transparent',
                  boxShadow: typeView === v.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap' as const,
                }}>
                  {lang === 'zh' ? v.labelZh : v.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMeasuredTypography ? (
          <>
            {/* ── Blueprint / Inspector view ── */}
            {typeView === 'inspector' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {geminiTokens.map((t, i) => (
                  <TypeViewBlueprint key={`${t.name}-${i}`} token={t} lang={lang} />
                ))}
              </div>
            )}

            {/* ── Poster view ── */}
            {typeView === 'poster' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {geminiTokens.map((t, i) => (
                  <TypeViewPoster key={`${t.name}-${i}`} token={t} lang={lang} />
                ))}
              </div>
            )}

            {/* ── Waterfall view ── */}
            {typeView === 'waterfall' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {geminiTokens.map((t, i) => (
                  <div key={`${t.name}-${i}`} style={{ borderBottom: i !== geminiTokens.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                    <TypeViewWaterfall token={t} lang={lang} />
                  </div>
                ))}
              </div>
            )}

            {/* ── Editorial view ── */}
            {typeView === 'editorial' && (
              <TypeViewEditorial tokens={geminiTokens} lang={lang} />
            )}
          </>
        ) : (
          /* No data fallback */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {lang === 'zh' ? '暂未提取到可靠的字体尺寸数据' : 'Reliable typography measurements are not available yet'}
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '560px' }}>
              {lang === 'zh'
                ? '当前只展示从真实页面样式中恢复出的字号、字重、字距和行高。'
                : 'Only typography values recovered from real page styles are shown here.'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {displayFonts.slice(0, 3).map((font, idx) => (
                <span key={`${font}-${idx}`} style={{
                  padding: '6px 12px', borderRadius: '999px', background: '#F5F5F7',
                  border: '1px solid rgba(0,0,0,0.06)', fontSize: '12px', color: 'var(--text-secondary)'
                }}>
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

// ─────────────────────────────────────────────────────────────────────
// Token shape
// ─────────────────────────────────────────────────────────────────────
type GeminiToken = {
  name: string
  previewText: string
  family: string
  size: string
  weight: number
  tracking: string
  leading: string
  count: number
}

function getCleanFamily(rawFamily: string) {
  return rawFamily.split(',')[0].replace(/['"]/g, '').trim() || 'System Font'
}

// ─────────────────────────────────────────────────────────────────────
// View 1 — 蓝图透视 (Blueprint / Inspector)
// ─────────────────────────────────────────────────────────────────────
function TypeViewBlueprint({ token, lang }: { token: GeminiToken; lang: 'zh' | 'en' }) {
  const cleanFamily = getCleanFamily(token.family)
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', padding: '32px 36px 44px',
        backgroundColor: hovered ? '#F0F4FA' : '#F8FAFC',
        border: `1px solid ${hovered ? '#C8D6E8' : '#E2E8F0'}`,
        borderRadius: '12px',
        backgroundImage: 'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        cursor: 'default',
      }}>
      {/* top-left label */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px',
        fontSize: '11px', color: '#64748B', fontWeight: 600,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        {token.name}
      </div>
      {/* top-right usage badge */}
      <div style={{
        position: 'absolute', top: '16px', right: '16px',
        fontSize: '10px', color: '#5E6AD2', fontWeight: 600,
        backgroundColor: '#F0F4FF', padding: '2px 6px', borderRadius: '4px',
        whiteSpace: 'nowrap',
      }}>
        {token.count}× {lang === 'zh' ? '频次' : 'USAGE'}
      </div>

      {/* Annotated text wrapper */}
      <div style={{
        position: 'relative',
        borderTop: '1px dashed #4F46E5', borderBottom: '1px dashed #4F46E5',
        display: 'inline-block', maxWidth: '100%',
      }}>
        {/* line-height bracket */}
        <div style={{ position: 'absolute', left: '-32px', top: 0, bottom: 0, width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: '1px', backgroundColor: '#4F46E5', top: 0, bottom: 0 }} />
          <div style={{ position: 'absolute', width: '6px', height: '1px', backgroundColor: '#4F46E5', top: 0, right: '11px' }} />
          <div style={{ position: 'absolute', width: '6px', height: '1px', backgroundColor: '#4F46E5', bottom: 0, right: '11px' }} />
          <div style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '10px', fontWeight: 600, padding: '2px 4px', borderRadius: '4px', transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
            {token.leading}
          </div>
        </div>

        {/* bottom metadata pills */}
        <div style={{
          position: 'absolute', bottom: '-34px', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: '6px',
          flexWrap: 'nowrap',
        }}>
          {[
            { label: lang === 'zh' ? '字体' : 'Fam',    value: cleanFamily,    color: '#0F172A' },
            { label: lang === 'zh' ? '字间距' : 'Track', value: token.tracking, color: '#D97706' },
            { label: lang === 'zh' ? '字号' : 'Size',   value: token.size,     color: '#0F172A' },
          ].map(p => (
            <div key={p.label} style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px',
              flexWrap: 'nowrap',
              backgroundColor: '#FFF', border: '1px solid #E2E8F0',
              padding: '4px 8px', borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '10px', color: '#64748B', whiteSpace: 'nowrap' }}>{p.label}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: p.color, whiteSpace: 'nowrap', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.value}</span>
            </div>
          ))}
        </div>

        {/* preview text */}
        <div style={{
          fontFamily: token.family,
          fontSize: `clamp(14px, ${token.size}, 56px)`,
          fontWeight: token.weight,
          letterSpacing: token.tracking,
          lineHeight: token.leading,
          color: '#0F172A',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '0 12px',
          maxWidth: '100%',
        }}>
          {token.previewText}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// View 2 — 海报画廊 (Poster)
// ─────────────────────────────────────────────────────────────────────
function TypeViewPoster({ token, lang }: { token: GeminiToken; lang: 'zh' | 'en' }) {
  const cleanFamily = getCleanFamily(token.family)
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', border: `1px solid ${hovered ? '#D0D0D0' : '#EAEAEA'}`, borderRadius: '14px', padding: '20px 18px',
        backgroundColor: hovered ? '#F4F4F6' : '#FAFAFA', overflow: 'hidden', flex: '1 1 240px',
        display: 'flex', flexDirection: 'column', gap: '16px',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        cursor: 'default',
      }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute', right: '-10px', bottom: '-20px',
        fontSize: '160px', fontWeight: 700, color: '#111', opacity: 0.03,
        lineHeight: 1, fontFamily: token.family, pointerEvents: 'none'
      }}>Aa</div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-block', padding: '3px 8px', backgroundColor: '#111',
          color: '#FFF', borderRadius: '100px', fontSize: '10px', fontWeight: 600, marginBottom: '12px'
        }}>
          {token.name}
        </div>
        <div style={{
          fontFamily: token.family,
          fontSize: `clamp(14px, ${token.size}, 40px)`,
          fontWeight: token.weight, letterSpacing: token.tracking, lineHeight: token.leading,
          color: '#111', wordBreak: 'break-word',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        } as React.CSSProperties}>
          {token.previewText}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: 'auto', position: 'relative', zIndex: 1 }}>
        {[
          { label: lang === 'zh' ? '字体'   : 'Family',  value: cleanFamily,          color: '#111'    },
          { label: lang === 'zh' ? '字号'   : 'Size',    value: token.size,            color: '#111'    },
          { label: lang === 'zh' ? '频次'   : 'Usage',   value: `${token.count}×`,     color: '#5E6AD2' },
          { label: lang === 'zh' ? '字重'   : 'Weight',  value: String(token.weight),  color: '#111'    },
          { label: lang === 'zh' ? '字间距' : 'Tracking', value: token.tracking,        color: '#D97706' },
          { label: lang === 'zh' ? '行高'   : 'Leading', value: token.leading,         color: '#111'    },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: '#FFF', border: '1px solid #EAEAEA', padding: '6px 8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '9px', color: '#888', marginBottom: '2px', whiteSpace: 'nowrap' }}>{item.label}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: item.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// View 3 — 瀑布流 (Waterfall)
// ─────────────────────────────────────────────────────────────────────
function TypeViewWaterfall({ token, lang }: { token: GeminiToken; lang: 'zh' | 'en' }) {
  const cleanFamily = getCleanFamily(token.family)
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '16px 12px', margin: '0 -12px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        borderRadius: '8px',
        backgroundColor: hovered ? '#F5F5F7' : 'transparent',
        transition: 'background-color 0.15s ease',
        cursor: 'default',
      }}>
      <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {token.name}
      </div>
      <div style={{
        fontFamily: token.family,
        fontSize: `clamp(16px, ${token.size}, 56px)`,
        fontWeight: token.weight,
        letterSpacing: token.tracking,
        lineHeight: token.leading,
        color: '#111',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {token.previewText}
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666', marginTop: '4px', flexWrap: 'wrap' }}>
        {[
          { label: lang === 'zh' ? 'Family'   : 'Family',   value: cleanFamily,    color: '#111'    },
          { label: lang === 'zh' ? 'Size'     : 'Size',     value: token.size,     color: '#111'    },
          { label: lang === 'zh' ? 'Weight'   : 'Weight',   value: String(token.weight), color: '#111' },
          { label: lang === 'zh' ? 'Tracking' : 'Tracking', value: token.tracking, color: '#D97706' },
          { label: lang === 'zh' ? 'Leading'  : 'Leading',  value: token.leading,  color: '#111'    },
        ].map(p => (
          <span key={p.label} style={{ whiteSpace: 'nowrap' }}>
            <span style={{ color: '#A1A1AA', marginRight: '6px' }}>{p.label}</span>
            <span style={{ fontWeight: 600, color: p.color }}>{p.value}</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#A1A1AA', marginRight: '6px' }}>{lang === 'zh' ? 'Usage' : 'Usage'}</span>
          <span style={{ fontWeight: 600, color: '#5E6AD2' }}>{token.count}×</span>
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// View 4 — 阅读流 (Editorial)
// ─────────────────────────────────────────────────────────────────────
function TypeViewEditorial({ tokens, lang }: { tokens: GeminiToken[]; lang: 'zh' | 'en' }) {
  return (
    <div style={{ display: 'flex', gap: '32px', padding: '20px', backgroundColor: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px' }}>
      <div style={{ flex: 1, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {tokens.map((token, i) => (
          <EditorialRow key={i} token={token} lang={lang} />
        ))}
      </div>
    </div>
  )
}

function EditorialRow({ token, lang }: { token: GeminiToken; lang: 'zh' | 'en' }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '16px',
        padding: '12px 10px', margin: '0 -10px',
        borderRadius: '8px',
        backgroundColor: hovered ? '#F5F5F7' : 'transparent',
        transition: 'background-color 0.15s ease',
        cursor: 'default',
      }}>
            {/* Sidebar metadata */}
            <div style={{
              flex: '0 0 100px', paddingTop: '4px',
              textAlign: 'right', borderRight: '1px solid #EAEAEA', paddingRight: '12px'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#111', textTransform: 'uppercase', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {token.name}
              </div>
              <div style={{ fontSize: '11px', color: '#111', fontWeight: 500, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getCleanFamily(token.family)}
              </div>
              <div style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap' }}>{token.size} / {token.leading}</div>
              <div style={{ fontSize: '10px', color: '#D97706', marginTop: '2px', whiteSpace: 'nowrap' }}>{token.tracking}</div>
              <div style={{
                fontSize: '10px', color: '#5E6AD2', fontWeight: 600, marginTop: '8px',
                backgroundColor: '#F0F4FF', padding: '2px 4px', borderRadius: '4px', display: 'inline-block'
              }}>
                {token.count}×
              </div>
            </div>
            {/* Preview text */}
            <div style={{
              flex: 1, minWidth: 0,
              fontFamily: token.family,
              fontSize: `clamp(13px, ${token.size}, 40px)`,
              fontWeight: token.weight,
              letterSpacing: token.tracking,
              lineHeight: token.leading,
              color: '#111',
              overflow: 'hidden',
            }}>
              {token.previewText}
            </div>
    </div>
  )
}
