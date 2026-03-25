'use client'

import { useState } from 'react'
import type { StyleReport, RadiusToken, ShadowToken, BorderToken, TransitionToken, ButtonSnapshot, PageSection, VisualStyleAnalysis, InteractionStyleAI } from '@/lib/types'
import { gradeTokens, confidenceLabel } from '@/lib/design-details/gradeTokens'
import type { GradedTokenSet } from '@/lib/design-details/gradeTokens'

// Zone = physical separation between measured data and AI impressions
type Zone = 'measured' | 'impression'
type MeasuredTab = 'components' | 'shape' | 'space'
type ImpressionTab = 'interaction' | 'style'
type ComponentTab = 'button' | 'input' | 'card' | 'badge'

interface Props {
  report: StyleReport
  lang: 'zh' | 'en'
  onSectionHover?: (section: { yStart: number; yEnd: number } | null) => void
}

export default function DesignInspector({ report, lang, onSectionHover }: Props) {
  const [zone, setZone] = useState<Zone>('measured')
  const [measuredTab, setMeasuredTab] = useState<MeasuredTab>('components')
  const [impressionTab, setImpressionTab] = useState<ImpressionTab>('interaction')
  const [compTab, setCompTab] = useState<ComponentTab>('button')
  const [expandedShadows, setExpandedShadows] = useState<Set<number>>(new Set())
  function toggleShadow(i: number) {
    setExpandedShadows(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }
  const [btnHovered, setBtnHovered] = useState(false)
  const [btnActive, setBtnActive] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const [hoveredWireframe, setHoveredWireframe] = useState<string | null>(null)

  const { colors, colorSystem, typography, designDetails } = report
  const analysis = report.pageAnalysis
  const sourceIsUrl = report.sourceType === 'url'

  // ── Snapshot data (DOM-measured button) ──────────────────────────────────
  const snap: ButtonSnapshot | undefined = analysis?.buttonSnapshot

  // ── Color tokens (fallback chain: colorSystem → colors array → defaults) ──
  const primaryHex   = snap?.backgroundColor
    || colorSystem?.primaryAction?.hex
    || colorSystem?.heroPrimaryAction?.hex
    || colors.find(c => c.role === 'primary')?.hex
    || '#1D1D1F'
  const primaryFgHex = snap?.color
    || (primaryHex ? (isLight(primaryHex) ? '#000000' : '#FFFFFF') : '#FFFFFF')
  const surfaceHex   = colorSystem?.surface?.hex       || colors.find(c => c.role === 'surface')?.hex  || '#F5F5F7'
  const textHex      = colorSystem?.textPrimary?.hex   || colors.find(c => c.role === 'text')?.hex     || '#1a1a1a'
  const borderHex    = colorSystem?.border?.hex        || colors.find(c => c.role === 'border')?.hex   || '#e5e5e5'
  const bgHex        = colorSystem?.pageBackground?.hex || colors.find(c => c.role === 'background')?.hex || '#FFFFFF'

  // ── Preview-safe derived colors (guards against saturated bg, invisible component text) ──
  const previewBg = safePreviewBg(bgHex, designDetails.colorMode)
  const { surface: previewSurface, text: previewText } = safeComponentColors(surfaceHex, textHex, designDetails.colorMode)

  // ── Source name label ─────────────────────────────────────────────────────
  const sourceName = report.sourceLabel.replace(/https?:\/\/(www\.)?/, '').split('/')[0]

  // ── Always show extracted styles directly — no neutral baseline toggle ────
  const effBg        = previewBg
  const effSurface   = previewSurface
  const effText      = previewText
  const effPrimary   = primaryHex
  const effPrimaryFg = primaryFgHex
  const effRadius    = (k: string) => bestRadius(k).value
  const effBorder    = (k: string) => bestBorder(k).value
  const effShadow    = (k: string) => bestShadow(k).value
  const effFont      = typography.fontFamily

  // ── Measured tokens ───────────────────────────────────────────────────────
  const radiusTokens: RadiusToken[]         = analysis?.radiusTokens     || []
  const shadowTokens: ShadowToken[]         = analysis?.shadowTokens     || []
  const borderTokens: BorderToken[]         = analysis?.borderTokens     || []
  const transitionTokens: TransitionToken[] = analysis?.transitionTokens || []
  const spacingTokens                       = analysis?.spacingTokens    || []
  const layoutEvidence                      = analysis?.layoutEvidence   || []
  const stateTokens                         = analysis?.stateTokens      || {}
  const pageMaxWidth                        = analysis?.pageMaxWidth
  const gridColumns                         = analysis?.gridColumns
  // Page sections: DOM-measured (URL) or AI-inferred (image)
  const pageSections: PageSection[]         = analysis?.pageSections?.length
    ? analysis.pageSections
    : (designDetails.pageSections || [])
  const pageSecsMeasured                    = !!(analysis?.pageSections?.length)

  // ── Graded token set (pure function layer) ───────────────────────────────────
  const graded: GradedTokenSet = gradeTokens(radiusTokens, shadowTokens, spacingTokens, layoutEvidence, borderTokens)

  // ── AI-inferred style ─────────────────────────────────────────────────────
  const visualStyle: VisualStyleAnalysis | undefined  = designDetails.visualStyle
  const interactionStyle: InteractionStyleAI | undefined = designDetails.interactionStyle

  const hasStateData = Object.values(stateTokens).some(
    (arr) => (arr as Array<{ state: string }>).some(v => v.state !== 'default')
  )

  // ── AI fallback CSS values ────────────────────────────────────────────────
  const cssRadius = designDetails.cssRadius || inferRadius(designDetails.borderRadius)
  const cssShadow = designDetails.cssShadow || 'none'
  const radiusFallbackValues = cssRadius
    .split('|').map(v => v.trim()).filter(v => v && v !== 'none' && !v.includes('var('))
  const shadowFallbackValues = cssShadow === 'none' ? [] :
    cssShadow.split('|').map(v => v.trim()).filter(v => v && v !== 'none' && !v.includes('var('))
  // For UI components, 50%/100% means avatar/icon circles — exclude them from button/card/input radius
  const componentRadiusFallback = radiusFallbackValues.find(v => !v.includes('%')) || '6px'
  const primaryShadow = shadowFallbackValues[0] || 'none'

  // ── meta.source → friendly label ──────────────────────────────────────────
  function sourceLabel(meta?: { source?: string; confidence?: string; evidenceCount?: number }): string {
    if (!meta?.source) return ''
    if (meta.source === 'dom-computed') return lang === 'zh' ? 'DOM 实测' : 'DOM'
    if (meta.source === 'screenshot-sampled') return lang === 'zh' ? '截图采样' : 'screenshot'
    return lang === 'zh' ? 'AI 推断' : 'AI inferred'
  }
  function sourceDotColor(meta?: { source?: string }): string {
    if (meta?.source === 'dom-computed') return '#34C759'
    if (meta?.source === 'screenshot-sampled') return '#FF9F0A'
    return '#AEAEB2'
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function bestRadius(kind: string): { value: string; measured: boolean } {
    // Prefer DOM-measured radius tokens scoped to this component kind
    const match = radiusTokens.find(t => (t.componentKinds as string[])?.includes(kind))
    if (match) return { value: match.value, measured: true }
    // Fall back to any measured radius token (prefer non-percentage)
    const nonPctToken = radiusTokens.find(t => !t.value.includes('%'))
    if (nonPctToken) return { value: nonPctToken.value, measured: true }
    if (radiusTokens.length > 0) return { value: radiusTokens[0].value, measured: true }
    // Use buttonSnapshot for button kind
    if (snap?.borderRadius && kind === 'button' && !snap.borderRadius.includes('%'))
      return { value: snap.borderRadius, measured: true }
    // AI fallback — never use percentage for UI components
    return { value: componentRadiusFallback, measured: false }
  }

  function bestShadow(kind: string): { value: string; measured: boolean } {
    const match = shadowTokens.find(t => (t.componentKinds as string[])?.includes(kind))
    if (match) return { value: match.value, measured: true }
    if (shadowTokens.length > 0) return { value: shadowTokens[0].value, measured: true }
    return { value: primaryShadow, measured: false }
  }

  function bestBorder(kind: string): { value: string; measured: boolean } {
    const match = borderTokens.find(t => (t.componentKinds as string[])?.includes(kind))
    if (match) return { value: `${match.width} ${match.style}${match.color ? ' ' + match.color : ''}`, measured: true }
    if (borderTokens.length > 0) {
      const t = borderTokens[0]
      return { value: `${t.width} ${t.style}${t.color ? ' ' + t.color : ''}`, measured: true }
    }
    return { value: `1px solid ${borderHex}`, measured: false }
  }

  function getStates(kind: string) {
    const entries = (stateTokens as Record<string, Array<{ state: string; property: string; value: string }>>)[kind] || []
    return entries.filter(e => e.state !== 'default' && e.value).slice(0, 6)
  }

  // Convert stateTokens for a given kind+state into React inline style (camelCase keys).
  // Skips border sub-properties (borderColor etc.) to avoid React shorthand/longhand conflict.
  function getStateStyle(kind: string, state: 'hover' | 'focus' | 'active'): React.CSSProperties {
    const entries = (stateTokens as Record<string, Array<{ state: string; property: string; value: string }>>)[kind] || []
    const result: Record<string, string> = {}
    // These conflict with the `border` shorthand used in btnStyle
    const skipProps = new Set(['borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderWidth', 'borderStyle'])
    entries
      .filter(e => e.state === state && e.value)
      .forEach(e => {
        const key = e.property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
        if (!skipProps.has(key)) result[key] = e.value
      })
    return result as React.CSSProperties
  }

  // ── Button style (uses exact snapshot if available) ───────────────────────
  const btnStyle: React.CSSProperties = snap ? {
    backgroundColor: snap.backgroundColor,
    color: snap.color,
    borderRadius: snap.borderRadius,
    padding: snap.paddingV && snap.paddingH ? `${snap.paddingV} ${snap.paddingH}` : undefined,
    fontSize: snap.fontSize,
    fontWeight: snap.fontWeight,
    fontFamily: snap.fontFamily || typography.fontFamily,
    border: snap.border || 'none',
    boxShadow: snap.boxShadow,
    letterSpacing: snap.letterSpacing,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } : {
    background: primaryHex,
    color: primaryFgHex,
    border: 'none',
    cursor: 'pointer',
    borderRadius: bestRadius('button').value,
    boxShadow: bestShadow('button').value,
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: typography.headingWeight || 600,
    letterSpacing: typography.letterSpacing || 'normal',
    fontFamily: typography.fontFamily,
    whiteSpace: 'nowrap' as const,
  }

  // Always use real extracted button style
  const effBtnStyle = btnStyle

  // ── Styles ────────────────────────────────────────────────────────────────
  const outerWrap: React.CSSProperties = {
    background: '#FFFFFF', borderRadius: '16px',
    border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden',
  }
  const tabBar: React.CSSProperties = {
    display: 'flex', gap: '0', borderBottom: '1px solid rgba(0,0,0,0.06)',
    padding: '0 24px', overflowX: 'auto',
  }
  const tabBtn = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '14px 0',
    marginRight: '24px', fontSize: '14px', fontWeight: active ? 600 : 400,
    color: active ? '#1D1D1F' : '#8E8E93',
    borderBottom: active ? '2px solid #1D1D1F' : '2px solid transparent',
    transition: 'all 0.15s ease', flexShrink: 0,
  })
  const tabContent: React.CSSProperties = { padding: '24px' }
  const sectionLabel: React.CSSProperties = {
    margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600,
    color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em',
  }
  const dot = (measured: boolean): React.CSSProperties => ({
    width: '6px', height: '6px', borderRadius: '50%',
    background: measured ? '#34C759' : '#AEAEB2',
    flexShrink: 0, display: 'inline-block',
  })
  const chip: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '3px 8px', borderRadius: '6px', background: '#F5F5F7',
    fontSize: '12px', color: '#3C3C43',
  }
  const subTabBar: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '20px' }
  const subTabBtn = (active: boolean): React.CSSProperties => ({
    background: active ? '#1D1D1F' : '#F5F5F7',
    border: 'none', cursor: 'pointer',
    padding: '6px 14px', borderRadius: '99px',
    fontSize: '13px', fontWeight: active ? 600 : 400,
    color: active ? '#FFFFFF' : '#3C3C43',
    transition: 'all 0.12s ease',
  })

  // Zone-specific accent colors
  const measuredAccent = '#34C759'  // green — DOM evidence
  const impressionAccent = '#AEAEB2' // gray — AI inferred

  const MEASURED_TABS: [MeasuredTab, string][] = [
    ['components', lang === 'zh' ? '组件' : 'Components'],
    ['shape',      lang === 'zh' ? '形态' : 'Shape'],
    ['space',      lang === 'zh' ? '布局' : 'Layout'],
  ]
  const IMPRESSION_TABS: [ImpressionTab, string][] = [
    ['interaction', lang === 'zh' ? '交互感' : 'Interaction'],
    ['style',       lang === 'zh' ? '视觉性格' : 'Personality'],
  ]

  return (
    <div style={outerWrap}>

      {/* ── Zone selector ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Measured zone pill */}
        <button
          onClick={() => setZone('measured')}
          style={{
            flex: 1, padding: '14px 20px', border: 'none', cursor: 'pointer',
            background: zone === 'measured' ? '#FFFFFF' : '#FAFAFA',
            borderBottom: zone === 'measured' ? `2px solid ${measuredAccent}` : '2px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: zone === 'measured' ? measuredAccent : '#D1D1D6',
            transition: 'background 0.15s ease',
          }} />
          <span style={{
            fontSize: '13px', fontWeight: zone === 'measured' ? 600 : 400,
            color: zone === 'measured' ? '#1D1D1F' : '#8E8E93',
          }}>
            {lang === 'zh' ? 'DOM 测量' : 'DOM Measured'}
          </span>
        </button>

        {/* Divider */}
        <div style={{ width: '1px', background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />

        {/* AI impression zone pill */}
        <button
          onClick={() => setZone('impression')}
          style={{
            flex: 1, padding: '14px 20px', border: 'none', cursor: 'pointer',
            background: zone === 'impression' ? '#FFFFFF' : '#FAFAFA',
            borderBottom: zone === 'impression' ? `2px solid ${impressionAccent}` : '2px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: zone === 'impression' ? impressionAccent : '#D1D1D6',
            transition: 'background 0.15s ease',
          }} />
          <span style={{
            fontSize: '13px', fontWeight: zone === 'impression' ? 600 : 400,
            color: zone === 'impression' ? '#1D1D1F' : '#8E8E93',
          }}>
            {lang === 'zh' ? 'AI 印象' : 'AI Impression'}
          </span>
        </button>
      </div>

      {/* ── Sub-tab bar (zone-specific) ──────────────────────────────── */}
      <div style={{ ...tabBar, borderBottom: '1px solid rgba(0,0,0,0.04)', background: zone === 'measured' ? 'rgba(52,199,89,0.03)' : 'rgba(174,174,178,0.06)' }}>
        {zone === 'measured'
          ? MEASURED_TABS.map(([id, label]) => (
              <button key={id} style={tabBtn(measuredTab === id)} onClick={() => setMeasuredTab(id)}>{label}</button>
            ))
          : IMPRESSION_TABS.map(([id, label]) => (
              <button key={id} style={tabBtn(impressionTab === id)} onClick={() => setImpressionTab(id)}>{label}</button>
            ))
        }
      </div>

      {/* ── AI disclaimer banner (impression zone only) ──────────────── */}
      {zone === 'impression' && (
        <div style={{
          padding: '8px 24px', background: 'rgba(174,174,178,0.08)',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '11px', color: '#8E8E93' }}>
            {lang === 'zh'
              ? '⚠️ 以下内容由 AI 从截图推断，无法通过 DOM 测量验证，仅供设计参考'
              : '⚠️ Inferred by AI from screenshot — not DOM-measurable, for design reference only'}
          </span>
        </div>
      )}

      <div style={tabContent}>

        {/* ══════════════ 组件 COMPONENTS ══════════════ */}
        {zone === 'measured' && measuredTab === 'components' && (
          <>
            {/* Source label */}
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#8E8E93' }}>
              {lang === 'zh' ? `来自 ${sourceName} 的提取样式` : `Extracted from ${sourceName}`}
            </p>

            <div style={subTabBar}>
              {(['button','input','card','badge'] as ComponentTab[]).map(k => (
                <button key={k} style={subTabBtn(compTab === k)} onClick={() => setCompTab(k)}>
                  {k === 'button' ? (lang === 'zh' ? '按钮' : 'Button')
                    : k === 'input' ? (lang === 'zh' ? '输入框' : 'Input')
                    : k === 'card' ? (lang === 'zh' ? '卡片' : 'Card')
                    : (lang === 'zh' ? '标签' : 'Badge')}
                </button>
              ))}
            </div>

            {/* ── Full-width component preview ── */}
            <div>
              {compTab === 'button' && (
                <ComponentPreview bg={effBg}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {/* Primary button — hover/active states from stateTokens */}
                      <button
                        style={{
                          ...effBtnStyle,
                          transition: 'all 0.15s ease',
                          ...(btnHovered && !btnActive ? getStateStyle('button', 'hover') : {}),
                          ...(btnActive ? { ...getStateStyle('button', 'active'), transform: 'scale(0.98)' } : {}),
                        }}
                        onMouseEnter={() => setBtnHovered(true)}
                        onMouseLeave={() => { setBtnHovered(false); setBtnActive(false) }}
                        onMouseDown={() => setBtnActive(true)}
                        onMouseUp={() => setBtnActive(false)}
                      >
                        {isValidButtonText(snap?.text) ? snap!.text : (lang === 'zh' ? '主要按钮' : 'Primary Button')}
                      </button>
                      {/* Secondary button */}
                      <button style={{
                        background: 'transparent', color: effPrimary,
                        border: `1px solid ${effPrimary}`, cursor: 'pointer',
                        borderRadius: effRadius('button'),
                        padding: snap?.paddingV && snap?.paddingH ? `${snap.paddingV} ${snap.paddingH}` : '10px 20px',
                        fontSize: snap?.fontSize || '14px',
                        fontFamily: effFont, whiteSpace: 'nowrap' as const,
                        transition: 'all 0.15s ease',
                      }}>
                        {lang === 'zh' ? '次要按钮' : 'Secondary'}
                      </button>
                    </div>
                    {getStates('button').length > 0 && (
                      <p style={{ margin: 0, fontSize: '11px', color: '#AEAEB2' }}>
                        {lang === 'zh' ? '↑ 悬停 / 点击感受真实交互效果' : '↑ Hover & click to feel real interaction states'}
                      </p>
                    )}
                  </div>
                </ComponentPreview>
              )}
              {compTab === 'input' && (
                <ComponentPreview bg={effBg}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <input readOnly defaultValue="" placeholder={lang === 'zh' ? '输入框示例' : 'Input placeholder'} style={{
                      background: effSurface, color: effText, border: effBorder('input'),
                      borderRadius: effRadius('input'), padding: '10px 14px', fontSize: '14px',
                      fontFamily: effFont, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
                    }} />
                    <input readOnly defaultValue="" placeholder={lang === 'zh' ? '禁用状态' : 'Disabled state'} disabled style={{
                      background: effSurface, color: effText, border: effBorder('input'),
                      borderRadius: effRadius('input'), padding: '10px 14px', fontSize: '14px',
                      fontFamily: effFont, outline: 'none', width: '100%', boxSizing: 'border-box' as const, opacity: 0.4,
                    }} />
                  </div>
                </ComponentPreview>
              )}
              {compTab === 'card' && (
                <ComponentPreview bg={effBg}>
                  <div style={{
                    background: effSurface, color: effText, border: effBorder('card'),
                    borderRadius: effRadius('card'), boxShadow: effShadow('card'),
                    padding: '16px 20px', width: '100%', boxSizing: 'border-box' as const,
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: typography.headingWeight || 600, fontFamily: effFont, marginBottom: '6px' }}>
                      {lang === 'zh' ? '卡片标题' : 'Card Title'}
                    </div>
                    <div style={{ fontSize: '13px', color: effText, opacity: 0.6, fontFamily: effFont }}>
                      {lang === 'zh' ? '说明文字内容' : 'Description text content'}
                    </div>
                  </div>
                </ComponentPreview>
              )}
              {compTab === 'badge' && (
                <ComponentPreview bg={isLight(bgHex) ? '#E8E8ED' : '#3A3A3C'}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { label: lang === 'zh' ? '标签' : 'Tag', bg: effPrimary, color: effPrimaryFg },
                      { label: lang === 'zh' ? '次要' : 'Secondary', bg: effSurface, color: effText },
                      { label: lang === 'zh' ? '边框' : 'Outline', bg: 'transparent', color: effPrimary, border: `1px solid ${effPrimary}` },
                    ].map((b, i) => (
                      <span key={i} style={{
                        background: b.bg, color: b.color, border: b.border || 'none',
                        borderRadius: '999px', padding: '4px 10px', fontSize: '12px',
                        fontWeight: 500, fontFamily: effFont,
                      }}>{b.label}</span>
                    ))}
                  </div>
                </ComponentPreview>
              )}
            </div>

            {/* ── Disclosure: CSS values ── */}
            <button
              onClick={() => setShowTokens(v => !v)}
              style={{
                marginTop: '10px', background: 'none', border: 'none',
                color: '#8E8E93', cursor: 'pointer', fontSize: '12px',
                padding: '4px 0', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {showTokens
                ? (lang === 'zh' ? '收起数值 ▲' : 'Hide values ▲')
                : (lang === 'zh' ? '查看数值 ▼' : 'Show values ▼')}
            </button>

            {showTokens && (
              <div style={{ marginTop: '8px' }}>
                {compTab === 'button' && <>
                  <TokenRow label="background"     value={snap?.backgroundColor || primaryHex}              measured={!!snap?.backgroundColor} />
                  <TokenRow label="color"          value={snap?.color || primaryFgHex}                      measured={!!snap?.color} />
                  <TokenRow label="border-radius"  value={snap?.borderRadius || bestRadius('button').value} measured={!!(snap?.borderRadius) || bestRadius('button').measured} />
                  {snap?.paddingV && snap?.paddingH && <TokenRow label="padding" value={`${snap.paddingV} ${snap.paddingH}`} measured={true} />}
                  {snap?.fontSize && <TokenRow label="font-size" value={snap.fontSize} measured={true} />}
                  <TokenRow label="font-weight"    value={snap?.fontWeight || String(typography.headingWeight || 600)} measured={!!snap?.fontWeight} />
                  <TokenRow label="font-family"    value={snap?.fontFamily || typography.fontFamily}       measured={!!snap?.fontFamily} />
                  <TokenRow label="box-shadow"     value={snap?.boxShadow || bestShadow('button').value}   measured={!!(snap?.boxShadow) || (bestShadow('button').measured && sourceIsUrl)} />
                  {snap?.letterSpacing && <TokenRow label="letter-spacing" value={snap.letterSpacing} measured={true} />}
                  {snap?.width && snap?.height && <TokenRow label="size" value={`${snap.width} × ${snap.height}`} measured={true} />}
                  {getStates('button').length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ ...sectionLabel, marginBottom: '8px' }}>{lang === 'zh' ? '交互状态' : 'States'}</p>
                      {getStates('button').map((s, i) => (
                        <StateRow key={i} state={s.state} prop={s.property} value={s.value} />
                      ))}
                    </div>
                  )}
                </>}
                {compTab === 'input' && <>
                  <TokenRow label="background"    value={surfaceHex}                            measured={true} />
                  <TokenRow label="border"        value={bestBorder('input').value}             measured={bestBorder('input').measured && sourceIsUrl} />
                  <TokenRow label="border-radius" value={bestRadius('input').value}             measured={bestRadius('input').measured} />
                  <TokenRow label="color"         value={textHex}                               measured={true} />
                  <TokenRow label="font-family"   value={typography.fontFamily}                 measured={true} />
                  {getStates('input').length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ ...sectionLabel, marginBottom: '8px' }}>{lang === 'zh' ? '交互状态' : 'States'}</p>
                      {getStates('input').map((s, i) => (
                        <StateRow key={i} state={s.state} prop={s.property} value={s.value} />
                      ))}
                    </div>
                  )}
                </>}
                {compTab === 'card' && <>
                  <TokenRow label="background"    value={surfaceHex}                            measured={true} />
                  <TokenRow label="border"        value={bestBorder('card').value}              measured={bestBorder('card').measured && sourceIsUrl} />
                  <TokenRow label="border-radius" value={bestRadius('card').value}              measured={bestRadius('card').measured} />
                  <TokenRow label="box-shadow"    value={bestShadow('card').value}              measured={bestShadow('card').measured && sourceIsUrl} />
                  <TokenRow label="color"         value={textHex}                               measured={true} />
                </>}
                {compTab === 'badge' && <>
                  <TokenRow label="border-radius" value="999px (pill)"                          measured={false} />
                  <TokenRow label="background"    value={primaryHex}                            measured={true} />
                  <TokenRow label="color"         value={primaryFgHex}                          measured={true} />
                </>}
              </div>
            )}
          </>
        )}

        {/* ══════════════ 形态 SHAPE ══════════════ */}
        {zone === 'measured' && measuredTab === 'shape' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

            {/* 边框圆角 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>{lang === 'zh' ? '边框圆角' : 'Border Radius'}</div>
                <div style={{ padding: '2px 8px', backgroundColor: '#F3F3F4', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: 600 }}>{lang === 'zh' ? 'DOM 测量' : 'DOM Measured'}</div>
              </div>
              {graded.radius.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                  {graded.radius.map((t, i) => (
                    <RadiusGalleryItem key={i} token={{ value: t.value, count: t.sampleCount }} />
                  ))}
                </div>
              ) : <EmptyTab lang={lang} />}
            </div>

            {/* 阴影层级 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>{lang === 'zh' ? '阴影层级 & 深度' : 'Shadow Elevation'}</div>
              </div>
              {graded.shadow.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {graded.shadow.map((t, i) => (
                    <ShadowGalleryItem key={i} token={{ value: t.value, count: t.sampleCount }} />
                  ))}
                </div>
              ) : <EmptyTab lang={lang} />}
            </div>

            {/* 边框样式 */}
            {borderTokens.length > 0 && (
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '边框样式' : 'Border Style'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {borderTokens.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F5F5F7', borderRadius: '10px' }}>
                      <div style={{ width: '32px', height: '0', border: `${t.width} ${t.style} ${t.color || borderHex}` }} />
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#3C3C43' }}>
                        {t.width} {t.style}{t.color ? ` · ${t.color}` : ''}
                      </span>
                      <span style={{ fontSize: '11px', color: '#AEAEB2' }}>{t.sampleCount}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ 布局 LAYOUT ══════════════ */}
        {zone === 'measured' && measuredTab === 'space' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

            {/* ── 1. 布局参考画廊 ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>
                  {lang === 'zh' ? '布局参考画廊' : 'Layout Gallery'}
                </div>
                <div style={{ padding: '2px 8px', backgroundColor: '#F3F3F4', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: 600 }}>
                  {lang === 'zh' ? '悬停联动' : 'Hover'}
                </div>
              </div>
              {pageSections.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  {pageSections.map((sec, idx) => {
                    const key = `sec-${idx}`
                    const isHov = hoveredWireframe === key
                    return (
                      <div key={idx}
                        style={{ display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '12px', transition: 'background 0.2s', backgroundColor: isHov ? '#FAFAFA' : 'transparent' }}
                        onMouseEnter={() => {
                          setHoveredWireframe(key)
                          if (onSectionHover && sec.yStartPct != null && sec.yEndPct != null) {
                            onSectionHover({ yStart: sec.yStartPct, yEnd: sec.yEndPct })
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredWireframe(null)
                          onSectionHover?.(null)
                        }}
                      >
                        <WireframePreview purpose={sec.purpose} layout={sec.layout} isHovered={isHov} />
                        <div style={{ paddingLeft: '4px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: isHov ? '#3B82F6' : '#111', transition: 'color 0.2s' }}>
                            {lang === 'zh' ? purposeLabel(sec.purpose) : (sec.heading || sec.purpose)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <code style={{ fontSize: '11px', color: '#888', fontFamily: 'ui-monospace, monospace' }}>{sec.layout}</code>
                            {pageSecsMeasured && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34C759', flexShrink: 0 }} />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                  {sourceIsUrl
                    ? (lang === 'zh' ? '未检测到页面结构' : 'No page sections detected')
                    : (lang === 'zh' ? '分析中（AI 推断）' : 'AI inferred from screenshot')}
                </p>
              )}
            </div>

            {/* ── 2. 宏观结构特征 ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>
                  {lang === 'zh' ? '宏观结构特征' : 'Technical Traits'}
                </div>
                <div style={{ padding: '2px 8px', backgroundColor: '#F3F3F4', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: 600 }}>
                  {lang === 'zh' ? 'DOM 验证' : 'DOM Verified'}
                </div>
              </div>
              {(() => {
                const hasLayout = graded.layout.length > 0 || !!gridColumns
                if (!hasLayout && !designDetails.layoutEn) {
                  return (
                    <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                      {sourceIsUrl ? (lang === 'zh' ? '未检测到' : 'Not detected') : (lang === 'zh' ? '需要 URL' : 'Requires URL')}
                    </p>
                  )
                }
                return (
                  <>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {gridColumns && (
                        <span style={{ padding: '8px 16px', backgroundColor: '#FAFAFA', borderRadius: '8px', fontSize: '13px', color: '#111', border: '1px solid #EAEAEA', fontWeight: 500 }}>
                          {lang === 'zh' ? `列数: ${gridColumns}` : `Columns: ${gridColumns}`}
                        </span>
                      )}
                      {graded.layout.length > 0
                        ? graded.layout.map((item, i) => (
                            <span key={i} style={{ padding: '8px 16px', backgroundColor: '#FAFAFA', borderRadius: '8px', fontSize: '13px', color: '#111', border: '1px solid #EAEAEA', fontWeight: 500 }}>
                              {item.label}
                            </span>
                          ))
                        : (lang === 'zh' ? designDetails.layoutZh || designDetails.layoutEn : designDetails.layoutEn)
                            ?.split('|').map((v, i) => (
                              <span key={i} style={{ padding: '8px 16px', backgroundColor: '#FAFAFA', borderRadius: '8px', fontSize: '13px', color: '#AEAEB2', border: '1px solid #EAEAEA', fontWeight: 500 }}>
                                {v.trim()}
                              </span>
                            ))
                      }
                    </div>
                    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#888' }}>
                      {lang === 'zh' ? '这些是构建该网页底层宏观框架时使用的核心 CSS 技术栈。' : 'Core CSS techniques used to build the page structure.'}
                    </p>
                  </>
                )
              })()}
            </div>

            {/* ── 3. 间距系统 + 页面宽度 ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Spacing */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>
                    {lang === 'zh' ? '间距系统' : 'Spacing Scale'}
                  </div>
                  <div style={{ padding: '2px 8px', backgroundColor: '#F3F3F4', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: 600 }}>
                    {lang === 'zh' ? '高频测量' : 'High-freq'}
                  </div>
                </div>
                {graded.spacing.length > 0 ? (
                  <div style={{ border: '1px solid #EAEAEA', borderRadius: '12px', padding: '4px 20px' }}>
                    {graded.spacing.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '9px 0' }}>
                        <code style={{ width: '40px', fontFamily: 'ui-monospace, monospace', fontSize: '13px', fontWeight: 500, color: '#111', flexShrink: 0 }}>{t.value}</code>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ height: '14px', backgroundColor: '#E0E0E0', borderRadius: '2px', width: `${Math.max(4, t.freqRatio * 160)}px`, transition: 'width 0.3s ease' }} />
                          {t.sampleCount > 100 && (
                            <span style={{ fontSize: '10px', backgroundColor: '#FEF08A', color: '#854D0E', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {lang === 'zh' ? '高频核心' : 'Top hit'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>{t.sampleCount}× usage</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                    {sourceIsUrl ? (lang === 'zh' ? '暂未检测到间距数据' : 'No spacing data') : (lang === 'zh' ? '需要 URL' : 'Requires URL')}
                  </p>
                )}
              </div>

              {/* Page width */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>
                    {lang === 'zh' ? '页面宽度' : 'Page Width'}
                  </div>
                </div>
                {pageMaxWidth ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '20px', background: '#F5F5F7', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, background: '#1D1D1F', borderRadius: '4px', width: `${Math.min(100, (parseFloat(pageMaxWidth) / 1920) * 100)}%` }} />
                      </div>
                      <code style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1D1D1F', flexShrink: 0 }}>{pageMaxWidth}</code>
                    </div>
                    <span style={{ fontSize: '11px', color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={dot(true)} />{lang === 'zh' ? '测量值' : 'Measured'}
                    </span>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                    {sourceIsUrl ? (lang === 'zh' ? '未检测到' : 'Not detected') : (lang === 'zh' ? '需要 URL' : 'Requires URL')}
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ══════════════ 交互 INTERACTION ══════════════ */}
        {zone === 'impression' && impressionTab === 'interaction' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* AI motion character — always show if available */}
            {(interactionStyle || designDetails.motionEn || designDetails.animationTendency) && (
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '动效性格' : 'Motion Character'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {interactionStyle?.transitionFeel && isUsefulAiValue(interactionStyle.transitionFeel) && (
                    <InteractionChip
                      label={lang === 'zh' ? '过渡感' : 'Transition Feel'}
                      value={interactionStyle.transitionFeel}
                      measured={false}
                    />
                  )}
                  {interactionStyle?.hoverEffect && isUsefulAiValue(interactionStyle.hoverEffect) && (
                    <InteractionChip
                      label={lang === 'zh' ? '悬停效果' : 'Hover Effect'}
                      value={interactionStyle.hoverEffect}
                      measured={false}
                    />
                  )}
                  {interactionStyle?.animationCharacter && isUsefulAiValue(interactionStyle.animationCharacter) && (
                    <InteractionChip
                      label={lang === 'zh' ? '动画风格' : 'Animation Character'}
                      value={interactionStyle.animationCharacter}
                      measured={false}
                    />
                  )}
                  {!interactionStyle && (() => {
                    const raw = lang === 'zh'
                      ? (designDetails.motionZh || designDetails.motionEn || designDetails.animationTendency || '')
                      : (designDetails.motionEn || designDetails.animationTendency || '')
                    const parts = raw.split('|').map(v => v.trim()).filter(Boolean)
                    const labels = lang === 'zh'
                      ? ['过渡感', '动效', '风格']
                      : ['Transition', 'Motion', 'Character']
                    return parts.map((part, i) => (
                      <InteractionChip
                        key={i}
                        label={labels[i] || (lang === 'zh' ? '动效' : 'Motion')}
                        value={part}
                        measured={false}
                      />
                    ))
                  })()}
                </div>
              </div>
            )}

            {/* Transition timing cards */}
            <div>
              <p style={sectionLabel}>{lang === 'zh' ? '过渡时长' : 'Transition Timing'}</p>
              {transitionTokens.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {transitionTokens.map((t, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: '#F5F5F7', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={dot(true)} />
                        <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#1D1D1F' }}>{t.duration}</code>
                        <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#8E8E93' }}>{t.easing}</code>
                      </div>
                      <div style={{ fontSize: '11px', color: '#AEAEB2' }}>
                        {t.property} · {t.sampleCount}×
                        {t.componentKinds?.length ? ' · ' + t.componentKinds.join(', ') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                  {sourceIsUrl
                    ? (lang === 'zh' ? '未检测到过渡属性' : 'No transition data detected')
                    : (lang === 'zh' ? '需要 URL 才能测量' : 'Requires URL analysis')}
                </p>
              )}
            </div>

            {/* State diffs */}
            <div>
              <p style={sectionLabel}>{lang === 'zh' ? '状态变化' : 'State Changes'}</p>
              {hasStateData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.entries(stateTokens as Record<string, Array<{ state: string; property: string; value: string }>>)
                    .map(([component, values]) => {
                      const nonDefault = values.filter(v => v.state !== 'default')
                      if (!nonDefault.length) return null
                      // Group by pseudo-class state
                      const byState = nonDefault.reduce((acc, item) => {
                        if (!acc[item.state]) acc[item.state] = []
                        acc[item.state].push(item)
                        return acc
                      }, {} as Record<string, typeof nonDefault>)
                      return (
                        <div key={component}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#1D1D1F', textTransform: 'capitalize', borderBottom: '1px solid #1D1D1F', paddingBottom: '4px' }}>{component}</p>
                          {Object.entries(byState).map(([state, props]) => (
                            <div key={state} style={{ marginBottom: '10px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', marginBottom: '4px', paddingLeft: '8px', borderLeft: '2px solid #E5E5EA' }}>:{state}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '12px' }}>
                                {props.map((s, i) => {
                                  const swatch = extractColorFromCssValue(s.value)
                                  return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0' }}>
                                      <span style={{ color: '#8E8E93', fontFamily: 'var(--font-mono)', minWidth: '120px', flexShrink: 0 }}>{s.property}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {swatch && (
                                          <span style={{ display: 'inline-block', width: '11px', height: '11px', borderRadius: '2px', border: '1px solid rgba(0,0,0,0.12)', background: swatch, flexShrink: 0 }} />
                                        )}
                                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1D1D1F', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</code>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                  {sourceIsUrl
                    ? (lang === 'zh' ? '未检测到状态变化' : 'No state changes detected')
                    : (lang === 'zh' ? '需要 URL 才能测量交互状态' : 'Requires URL analysis')}
                </p>
              )}
            </div>

          </div>
        )}

        {/* ══════════════ 风格 STYLE ══════════════ */}
        {zone === 'impression' && impressionTab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ── Brand Fingerprint card — styled with the site's own colors ── */}
            <div>
              <p style={sectionLabel}>{lang === 'zh' ? '品牌指纹' : 'Brand Fingerprint'}</p>
              <div style={{
                borderRadius: '14px',
                border: `1px solid rgba(${hexToRgbParts(primaryHex)},0.22)`,
                background: `rgba(${hexToRgbParts(primaryHex)},0.04)`,
                padding: '20px 22px',
                display: 'flex', flexDirection: 'column', gap: '18px',
              }}>

                {/* Color swatches row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#8E8E93', minWidth: '48px', fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>
                    {lang === 'zh' ? '色彩' : 'Color'}
                  </span>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {[
                      { hex: primaryHex,  title: lang === 'zh' ? '主色' : 'Primary' },
                      { hex: bgHex,       title: lang === 'zh' ? '背景' : 'Background' },
                      { hex: surfaceHex,  title: lang === 'zh' ? '表面' : 'Surface' },
                      { hex: textHex,     title: lang === 'zh' ? '文字' : 'Text' },
                      ...(colorSystem?.heroAccentColors?.slice(0, 2).map(c => ({ hex: c.hex, title: c.name })) || []),
                    ].map((c, i) => (
                      <div key={i} title={`${c.title}: ${c.hex}`} style={{
                        width: '22px', height: '22px', borderRadius: '5px',
                        background: c.hex, border: '1px solid rgba(0,0,0,0.09)',
                        flexShrink: 0,
                      }} />
                    ))}
                  </div>
                  <code style={{ fontSize: '11px', color: '#8E8E93', fontFamily: 'var(--font-mono)', marginLeft: '2px' }}>
                    {primaryHex}
                  </code>
                </div>

                {/* Typography specimen */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#8E8E93', minWidth: '48px', fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>
                    {lang === 'zh' ? '字体' : 'Font'}
                  </span>
                  <span style={{
                    fontSize: '18px', fontWeight: typography.headingWeight || 600,
                    fontFamily: typography.fontFamily, color: '#1D1D1F', lineHeight: 1,
                  }}>
                    {typography.fontFamily.split(',')[0].replace(/["']/g, '').trim()}
                  </span>
                  <span style={{ fontSize: '12px', color: '#8E8E93' }}>
                    {lang === 'zh'
                      ? `标题 ${typography.headingWeight || '—'} · 正文 ${typography.bodyWeight || '—'}`
                      : `H: ${typography.headingWeight || '—'} · B: ${typography.bodyWeight || '—'}`}
                  </span>
                </div>

                {/* Style character tags — personality tags merged from report tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#8E8E93', minWidth: '48px', fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>
                    {lang === 'zh' ? '气质' : 'Style'}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {(visualStyle?.personality?.length
                      ? visualStyle.personality
                      : (lang === 'zh' ? (report.tagsZh || report.tags) : (report.tagsEn || report.tags))
                    ).slice(0, 6).map((tag, i) => (
                      <span key={i} style={{
                        padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 500,
                        background: i === 0 ? primaryHex : `rgba(${hexToRgbParts(primaryHex)},0.12)`,
                        color: i === 0 ? (isLight(primaryHex) ? '#000000' : '#FFFFFF') : primaryHex,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── AI 印象 ── visual inferences from screenshot, all translated ── */}
            {(visualStyle?.iconStyle || visualStyle?.density || visualStyle?.colorTemperature ||
              (visualStyle?.imageStyle && visualStyle.imageStyle !== 'none')) && (
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? 'AI 印象' : 'AI Impressions'}</p>
                <p style={{ margin: '-8px 0 12px 0', fontSize: '11px', color: '#AEAEB2' }}>
                  {lang === 'zh'
                    ? '来自截图的视觉推断，无法 DOM 测量'
                    : 'Visually inferred from screenshot — not DOM-measurable'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                  {visualStyle?.iconStyle && (
                    <StyleFactCard
                      label={lang === 'zh' ? '图标风格' : 'Icon Style'}
                      value={lang === 'zh' ? translateIconStyle(visualStyle.iconStyle) : visualStyle.iconStyle}
                      sub={visualStyle.iconLibrary}
                      measured={false}
                      lang={lang}
                    />
                  )}
                  {visualStyle?.density && (
                    <StyleFactCard
                      label={lang === 'zh' ? '内容密度' : 'Density'}
                      value={lang === 'zh' ? translateDensity(visualStyle.density) : visualStyle.density}
                      measured={false}
                      lang={lang}
                    />
                  )}
                  {visualStyle?.colorTemperature && (
                    <StyleFactCard
                      label={lang === 'zh' ? '色温' : 'Color Temp'}
                      value={lang === 'zh' ? translateColorTemp(visualStyle.colorTemperature) : visualStyle.colorTemperature}
                      measured={false}
                      lang={lang}
                      accent={visualStyle.colorTemperature === 'warm' ? '#FF9F0A' : visualStyle.colorTemperature === 'cool' ? '#007AFF' : undefined}
                    />
                  )}
                  {visualStyle?.imageStyle && visualStyle.imageStyle !== 'none' && (
                    <StyleFactCard
                      label={lang === 'zh' ? '图片风格' : 'Image Style'}
                      value={lang === 'zh' ? translateImageStyle(visualStyle.imageStyle) : visualStyle.imageStyle}
                      measured={false}
                      lang={lang}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── 色彩模式 — iOS-style segmented control ── */}
            <div>
              <p style={sectionLabel}>{lang === 'zh' ? '色彩模式' : 'Color Mode'}</p>
              <div style={{
                display: 'inline-flex', borderRadius: '10px', overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.08)', background: '#F5F5F7',
              }}>
                {([
                  { id: 'light',  zh: '浅色', en: 'Light' },
                  { id: 'dark',   zh: '深色', en: 'Dark' },
                  { id: 'system', zh: '跟随系统', en: 'Adaptive' },
                ] as const).map((m, i) => {
                  const active = designDetails.colorMode === m.id
                  return (
                    <div key={m.id} style={{
                      padding: '8px 16px', fontSize: '13px',
                      fontWeight: active ? 600 : 400,
                      background: active ? '#FFFFFF' : 'transparent',
                      color: active ? '#1D1D1F' : '#8E8E93',
                      borderRight: i < 2 ? '1px solid rgba(0,0,0,0.07)' : 'none',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.09)' : 'none',
                    }}>
                      <span style={{
                        width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                        background: m.id === 'dark' ? '#3A3A3C' : m.id === 'system' ? 'linear-gradient(135deg,#F5F5F7 50%,#3A3A3C 50%)' : '#E5E5EA',
                        border: '1px solid rgba(0,0,0,0.12)',
                      }} />
                      {lang === 'zh' ? m.zh : m.en}
                    </div>
                  )
                })}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={dot(false)} />
                {lang === 'zh' ? 'AI 推断' : 'AI inferred'}
              </p>
            </div>

          </div>
        )}

      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '10px 24px', display: 'flex', gap: '16px' }}>
        <LegendItem color="#34C759" label={lang === 'zh' ? '测量值' : 'Measured'} />
        <LegendItem color="#AEAEB2" label={lang === 'zh' ? 'AI 推断' : 'AI inferred'} />
      </div>
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────────────────────

function ComponentPreview({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: bg, borderRadius: '12px', padding: '32px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '140px', border: '1px solid rgba(0,0,0,0.06)',
    }}>
      {children}
    </div>
  )
}

function TokenRow({ label, value, measured }: { label: string; value: string; measured: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.04)',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: '#8E8E93', minWidth: '108px', flexShrink: 0 }}>{label}</span>
      <code style={{ fontSize: '12px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {value}
      </code>
    </div>
  )
}

function StateRow({ state, prop, value }: { state: string; prop: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 12px', background: '#F5F5F7', borderRadius: '8px',
    }}>
      <code style={{ fontSize: '11px', color: '#8E8E93', minWidth: '60px' }}>:{state}</code>
      <span style={{ fontSize: '11px', color: '#AEAEB2', flex: 1 }}>{prop}</span>
      <code style={{ fontSize: '11px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </code>
    </div>
  )
}

// ── Wireframe preview for layout gallery ────────────────────────────────────
// ── Gemini: useCopy hook + CopyToast ────────────────────────────────────────
function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return [copied, copy]
}

function CopyToast({ show }: { show: boolean }) {
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#111', color: '#fff', fontSize: '12px', padding: '6px 12px', borderRadius: '100px', opacity: show ? 1 : 0, pointerEvents: 'none', transition: 'all 0.2s ease', zIndex: 10 }}>已复制</div>
  )
}

function RadiusGalleryItem({ token }: { token: { value: string; count: number } }) {
  const [copied, copy] = useCopy()
  return (
    <div onClick={() => copy(`border-radius: ${token.value};`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', position: 'relative' }}>
      <div style={{ width: '64px', height: '64px', backgroundColor: '#F7F7F8', border: '1px solid #E5E5E5', borderRadius: token.value, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s ease' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E5E5'}>
        <CopyToast show={copied} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#111', fontWeight: 500 }}>{token.value}</span>
        <span style={{ fontSize: '11px', color: '#AEAEB2' }}>{token.count}×</span>
      </div>
    </div>
  )
}

function ShadowGalleryItem({ token }: { token: { value: string; count: number } }) {
  const [copied, copy] = useCopy()
  return (
    <div onClick={() => copy(`box-shadow: ${token.value};`)} style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s ease', position: 'relative' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9F9FA'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
      <CopyToast show={copied} />
      <div style={{ width: '80px', height: '80px', borderRadius: '8px', flexShrink: 0, background: 'radial-gradient(#E5E5E5 1px, transparent 1px)', backgroundSize: '8px 8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #F0F0F0', boxShadow: token.value }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{token.value}</span>
        <span style={{ fontSize: '11px', color: '#AEAEB2' }}>{token.count}×</span>
      </div>
    </div>
  )
}

function purposeLabel(purpose: string): string {
  const map: Record<string, string> = {
    hero: '主视觉', features: '功能区', pricing: '定价', testimonials: '评价',
    cta: '行动区', footer: '页脚', section: '内容区',
  }
  return map[purpose] || purpose
}

function WireframePreview({ purpose, layout, isHovered }: {
  purpose: string; layout: string; isHovered: boolean
}) {
  const containerStyle: React.CSSProperties = {
    width: '100%', height: '100px', backgroundColor: isHovered ? '#EFF6FF' : '#F9F9FA',
    borderRadius: '8px', border: isHovered ? '1px solid rgba(59,130,246,0.6)' : '1px solid #EAEAEA',
    display: 'flex', boxSizing: 'border-box', overflow: 'hidden',
    transition: 'all 0.2s ease', boxShadow: isHovered ? '0 4px 12px rgba(59,130,246,0.12)' : 'none',
  }
  const accent = isHovered ? '#3B82F6' : '#D1D1D1'
  const secondary = isHovered ? 'rgba(59,130,246,0.2)' : '#E5E5E5'
  const block = isHovered ? 'rgba(59,130,246,0.1)' : '#EAEAEA'

  if (purpose === 'hero' || layout === 'full-width') {
    return (
      <div style={{ ...containerStyle, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '16px' }}>
        <div style={{ width: '60%', height: '14px', backgroundColor: accent, borderRadius: '3px', transition: 'all 0.2s' }} />
        <div style={{ width: '40%', height: '8px', backgroundColor: secondary, borderRadius: '3px', transition: 'all 0.2s' }} />
        <div style={{ width: '64px', height: '20px', backgroundColor: isHovered ? '#3B82F6' : '#A1A1AA', borderRadius: '3px', marginTop: '4px', transition: 'all 0.2s' }} />
      </div>
    )
  }
  if (layout === '2-column' || layout === 'asymmetric') {
    return (
      <div style={{ ...containerStyle, padding: '14px', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ width: '80%', height: '12px', backgroundColor: accent, borderRadius: '3px' }} />
          <div style={{ width: '100%', height: '7px', backgroundColor: secondary, borderRadius: '3px' }} />
          <div style={{ width: '90%', height: '7px', backgroundColor: secondary, borderRadius: '3px' }} />
        </div>
        <div style={{ flex: 1, height: '100%', backgroundColor: block, borderRadius: '5px' }} />
      </div>
    )
  }
  if (layout === '3-column-grid' || layout === '4-column-grid' || layout === 'grid') {
    const cols = layout === '4-column-grid' ? 4 : 3
    return (
      <div style={{ ...containerStyle, padding: '12px', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '6px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{ backgroundColor: block, borderRadius: '5px' }} />
        ))}
      </div>
    )
  }
  // Default: footer / section / other
  return (
    <div style={{ ...containerStyle, flexDirection: 'column', gap: '6px', padding: '14px' }}>
      <div style={{ width: '40%', height: '10px', backgroundColor: accent, borderRadius: '3px' }} />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '4px' }}>
        {[0, 1, 2].map(i => <div key={i} style={{ backgroundColor: block, borderRadius: '4px' }} />)}
      </div>
    </div>
  )
}

function SectionRow({ section, measured, lang, primaryHex }: {
  section: PageSection; measured: boolean; lang: 'zh' | 'en'; primaryHex: string
}) {
  const purposeColors: Record<string, string> = {
    hero: primaryHex,
    features: '#34C759',
    pricing: '#FF9F0A',
    testimonials: '#AF52DE',
    cta: '#FF3B30',
    footer: '#8E8E93',
    section: '#007AFF',
  }
  const purposeLabel: Record<string, { en: string; zh: string }> = {
    hero:         { en: 'Hero',         zh: '主视觉' },
    features:     { en: 'Features',     zh: '功能介绍' },
    pricing:      { en: 'Pricing',      zh: '定价' },
    testimonials: { en: 'Testimonials', zh: '用户评价' },
    cta:          { en: 'CTA',          zh: '行动召唤' },
    footer:       { en: 'Footer',       zh: '页脚' },
    section:      { en: 'Section',      zh: '内容区' },
  }
  const color = purposeColors[section.purpose] || '#8E8E93'
  const label = lang === 'zh'
    ? (purposeLabel[section.purpose]?.zh || section.purpose)
    : (purposeLabel[section.purpose]?.en || section.purpose)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', borderRadius: '10px', background: '#F5F5F7',
    }}>
      {/* Color indicator */}
      <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: color, flexShrink: 0 }} />
      {/* Purpose badge */}
      <div style={{
        padding: '3px 8px', borderRadius: '6px',
        background: `${color}20`, color,
        fontSize: '11px', fontWeight: 700, flexShrink: 0, minWidth: '64px', textAlign: 'center',
      }}>
        {label}
      </div>
      {/* Heading — strip AI qualifier suffixes like "(implied)", "(skeleton)", "(inferred)" */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: '12px', color: '#3C3C43', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {section.heading
            ? section.heading.replace(/\s*\((implied|skeleton|inferred|estimated|assumed|unknown)[^)]*\)/gi, '').trim() || (lang === 'zh' ? '（无标题）' : '(no heading)')
            : (lang === 'zh' ? '（无标题）' : '(no heading)')}
        </div>
        <div style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '2px' }}>
          {section.layout}{section.columns > 1 ? ` · ${section.columns} col` : ''}
          {section.hasCTA ? ` · ${lang === 'zh' ? '有CTA' : 'has CTA'}` : ''}
          {section.hasImage ? ` · ${lang === 'zh' ? '有图' : 'has image'}` : ''}
        </div>
      </div>
      {/* Measured dot */}
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', flexShrink: 0 }} />
    </div>
  )
}

function InteractionChip({ label, value, measured }: { label: string; value: string; measured: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', background: '#F5F5F7', borderRadius: '10px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: '#8E8E93', minWidth: '80px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1D1D1F' }}>{value}</span>
    </div>
  )
}

function StyleFactCard({ label, value, sub, measured, accent, lang }: {
  label: string; value: string; sub?: string; measured: boolean; accent?: string; lang?: 'zh' | 'en'
}) {
  // Only apply capitalize for purely ASCII/Latin values (English); Chinese values don't need it
  const isLatinValue = /^[\x00-\x7F\s-]+$/.test(value)
  return (
    <div style={{
      padding: '14px 16px', background: '#F5F5F7', borderRadius: '12px',
      borderLeft: accent ? `3px solid ${accent}` : '3px solid #E5E5EA',
    }}>
      <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1D1D1F', textTransform: isLatinValue ? 'capitalize' : 'none' }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#AEAEB2' }}>
          {sub}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', display: 'inline-block' }} />
        <span style={{ fontSize: '10px', color: '#AEAEB2' }}>
          {measured
            ? (lang === 'zh' ? '测量值' : 'Measured')
            : (lang === 'zh' ? 'AI 推断' : 'AI inferred')}
        </span>
      </div>
    </div>
  )
}

function EmptyTab({ lang }: { lang: 'zh' | 'en' }) {
  return (
    <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
      {lang === 'zh' ? '未检测到数据' : 'No data detected'}
    </p>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: '#8E8E93' }}>{label}</span>
    </span>
  )
}

/** Convert #RRGGBB to "r,g,b" for use in rgba() strings */
function hexToRgbParts(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '0,0,0'
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ].join(',')
}

function translateIconStyle(v: string): string {
  const m: Record<string, string> = {
    'minimal': '极简线条', 'outline': '描边', 'solid': '实心填充',
    'rounded-outline': '圆角描边', 'duotone': '双色调', 'mixed': '混合风格',
    'none': '无图标',
  }
  return m[v] || v
}

function translateDensity(v: string): string {
  const m: Record<string, string> = {
    'sparse': '稀疏', 'comfortable': '适中', 'dense': '紧凑',
  }
  return m[v] || v
}

function translateColorTemp(v: string): string {
  const m: Record<string, string> = {
    'warm': '暖色调', 'cool': '冷色调', 'neutral': '中性',
  }
  return m[v] || v
}

function translateImageStyle(v: string): string {
  const m: Record<string, string> = {
    'photography': '摄影图片', 'illustration': '插图',
    'product-screenshots': '产品截图', 'abstract': '抽象图形',
    'mixed': '混合', 'none': '无图片',
  }
  return m[v] || v
}

function inferRadius(d: string): string {
  const s = (d || '').toLowerCase()
  if (s.includes('sharp') || s.includes('0px')) return '0px'
  if (s.includes('full') || s.includes('pill')) return '9999px'
  if (s.includes('large') || s.includes('xl')) return '16px'
  if (s.includes('medium')) return '8px'
  if (s.includes('small')) return '4px'
  return '6px'
}

/** Extract a color value (rgb/rgba/hex) from a CSS value string, for swatch rendering */
function extractColorFromCssValue(v: string): string | null {
  const m = v.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}\b/)
  return m ? m[0] : null
}

/** Filter out useless AI non-answers like "None observed in provided data." */
function isUsefulAiValue(v: string): boolean {
  if (!v) return false
  const lower = v.toLowerCase()
  return !(
    lower.startsWith('none observed') ||
    lower.startsWith('not observed') ||
    lower.startsWith('not detected') ||
    lower.startsWith('no data') ||
    lower.startsWith('no information') ||
    lower.startsWith('unable to') ||
    lower.startsWith('cannot determine') ||
    lower.includes('provided data') ||
    lower === 'none' ||
    lower === 'n/a' ||
    lower === 'unknown'
  )
}

function isLight(hex: string): boolean {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

/**
 * Guard against saturated action/accent colors being used as preview backgrounds.
 * If the hex has HSL saturation > 0.25, it's a chromatic color (e.g. Linear's #5E6AD2),
 * not a neutral page background — fall back to a safe neutral based on colorMode.
 */
function safePreviewBg(hex: string, colorMode: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  if (s > 0.25) {
    return colorMode === 'dark' ? '#1C1C1E' : '#F5F5F7'
  }
  return hex
}

/**
 * Return contrast-safe surface + text colors for component previews.
 * Fixes cases where dark-mode sites have surfaceHex incorrectly assigned as white,
 * or where both extracted colors are the same luminance (invisible text).
 */
function safeComponentColors(
  surface: string,
  text: string,
  colorMode: string
): { surface: string; text: string } {
  const surfaceLight = isLight(surface)
  const textLight = isLight(text)

  // Dark site but both extracted colors are light → surface is wrong, use dark surface
  if (colorMode === 'dark' && surfaceLight && textLight) {
    return { surface: '#2C2C2E', text }
  }
  // Light site but both are dark → text is probably wrong
  if (colorMode === 'light' && !surfaceLight && !textLight) {
    return { surface, text: '#1D1D1F' }
  }
  // Same luminance bucket → flip text
  if (surfaceLight === textLight) {
    return { surface, text: surfaceLight ? '#1D1D1F' : '#FFFFFF' }
  }
  return { surface, text }
}

/**
 * Validate that snap.text is actually a usable button label, not error text or garbage.
 */
function isValidButtonText(text: string | undefined): text is string {
  if (!text) return false
  const t = text.trim()
  if (t.length === 0 || t.length > 60) return false
  const lower = t.toLowerCase()
  if (
    lower.includes('错误') || lower.includes('error') || lower.includes('failed') ||
    lower.includes('undefined') || lower.includes('null') ||
    lower.startsWith('http') || lower.includes('@') ||
    lower.includes('exception') || lower.includes('warning')
  ) return false
  return true
}
