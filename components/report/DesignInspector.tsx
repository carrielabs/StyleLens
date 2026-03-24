'use client'

import { useState } from 'react'
import type { StyleReport, RadiusToken, ShadowToken, BorderToken, TransitionToken } from '@/lib/types'

type MainTab = 'components' | 'shape' | 'space' | 'interaction'
type ComponentTab = 'button' | 'input' | 'card' | 'badge'

interface Props {
  report: StyleReport
  lang: 'zh' | 'en'
}

export default function DesignInspector({ report, lang }: Props) {
  const [mainTab, setMainTab] = useState<MainTab>('components')
  const [compTab, setCompTab] = useState<ComponentTab>('button')

  const { colors, colorSystem, typography, designDetails } = report
  const analysis = report.pageAnalysis
  const sourceIsUrl = report.sourceType === 'url'

  // ── Color tokens ──────────────────────────────────────────────────────────
  const primaryHex   = colorSystem?.primaryAction?.hex || colors.find(c => c.role === 'primary')?.hex  || '#1D1D1F'
  const surfaceHex   = colorSystem?.surface?.hex       || colors.find(c => c.role === 'surface')?.hex  || '#F5F5F7'
  const textHex      = colorSystem?.textPrimary?.hex   || colors.find(c => c.role === 'text')?.hex     || '#1a1a1a'
  const borderHex    = colorSystem?.border?.hex        || colors.find(c => c.role === 'border')?.hex   || '#e5e5e5'
  const bgHex        = colorSystem?.pageBackground?.hex || colors.find(c => c.role === 'background')?.hex || '#FFFFFF'
  const primaryFgHex = colorSystem?.primaryAction?.hex
    ? (isLight(colorSystem.primaryAction.hex) ? '#000000' : '#FFFFFF')
    : '#FFFFFF'

  // ── Measured tokens ───────────────────────────────────────────────────────
  const radiusTokens: RadiusToken[]     = analysis?.radiusTokens   || []
  const shadowTokens: ShadowToken[]     = analysis?.shadowTokens   || []
  const borderTokens: BorderToken[]     = analysis?.borderTokens   || []
  const transitionTokens: TransitionToken[] = analysis?.transitionTokens || []
  const spacingTokens                   = analysis?.spacingTokens  || []
  const layoutEvidence                  = analysis?.layoutEvidence || []
  const stateTokens                     = analysis?.stateTokens    || {}
  const pageMaxWidth                    = analysis?.pageMaxWidth
  const gridColumns                     = analysis?.gridColumns

  const hasStateData = Object.values(stateTokens).some(
    (arr) => (arr as Array<{ state: string }>).some(v => v.state !== 'default')
  )

  // ── AI fallback CSS values ────────────────────────────────────────────────
  const cssRadius = designDetails.cssRadius || inferRadius(designDetails.borderRadius)
  const cssShadow = designDetails.cssShadow || 'none'

  // Parse "|"-joined multi-value strings → individual CSS values
  const radiusFallbackValues = cssRadius
    .split('|').map(v => v.trim()).filter(v => v && v !== 'none' && !v.includes('var('))
  const shadowFallbackValues = cssShadow === 'none' ? [] :
    cssShadow.split('|').map(v => v.trim()).filter(v => v && v !== 'none' && !v.includes('var('))

  const primaryRadius = radiusFallbackValues[0] || '4px'
  const primaryShadow = shadowFallbackValues[0] || 'none'

  // ── Helpers ───────────────────────────────────────────────────────────────
  function bestRadius(kind: string): { value: string; measured: boolean } {
    const match = radiusTokens.find(t => (t.componentKinds as string[])?.includes(kind))
    if (match) return { value: match.value, measured: true }
    if (radiusTokens.length > 0) return { value: radiusTokens[0].value, measured: true }
    return { value: primaryRadius, measured: false }
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

  // ── Styles ────────────────────────────────────────────────────────────────
  const outerWrap: React.CSSProperties = {
    background: '#FFFFFF', borderRadius: '16px',
    border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden',
  }
  const tabBar: React.CSSProperties = {
    display: 'flex', gap: '0', borderBottom: '1px solid rgba(0,0,0,0.06)',
    padding: '0 24px',
  }
  const tabBtn = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '14px 0',
    marginRight: '24px', fontSize: '14px', fontWeight: active ? 600 : 400,
    color: active ? '#1D1D1F' : '#8E8E93',
    borderBottom: active ? '2px solid #1D1D1F' : '2px solid transparent',
    transition: 'all 0.15s ease',
  })
  const tabContent: React.CSSProperties = {
    padding: '24px',
  }
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
  const subTabBar: React.CSSProperties = {
    display: 'flex', gap: '8px', marginBottom: '20px',
  }
  const subTabBtn = (active: boolean): React.CSSProperties => ({
    background: active ? '#1D1D1F' : '#F5F5F7',
    border: 'none', cursor: 'pointer',
    padding: '6px 14px', borderRadius: '99px',
    fontSize: '13px', fontWeight: active ? 600 : 400,
    color: active ? '#FFFFFF' : '#3C3C43',
    transition: 'all 0.12s ease',
  })

  return (
    <div style={outerWrap}>
      {/* ── Main tabs ───────────────────────────────────────────────────── */}
      <div style={tabBar}>
        {([
          ['components', lang === 'zh' ? '组件' : 'Components'],
          ['shape',      lang === 'zh' ? '形态' : 'Shape'],
          ['space',      lang === 'zh' ? '布局' : 'Layout'],
          ['interaction',lang === 'zh' ? '交互' : 'Interaction'],
        ] as [MainTab, string][]).map(([id, label]) => (
          <button key={id} style={tabBtn(mainTab === id)} onClick={() => setMainTab(id)}>{label}</button>
        ))}
      </div>

      <div style={tabContent}>

        {/* ══════════════ 组件 ══════════════ */}
        {mainTab === 'components' && (
          <>
            <div style={subTabBar}>
              {(['button','input','card','badge'] as ComponentTab[]).map(k => (
                <button key={k} style={subTabBtn(compTab === k)} onClick={() => setCompTab(k)}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
              {/* Left: component visual */}
              <div>
                {compTab === 'button' && (
                  <ComponentPreview bg={bgHex}>
                    <button style={{
                      background: primaryHex, color: primaryFgHex,
                      border: 'none', cursor: 'pointer',
                      borderRadius: bestRadius('button').value,
                      boxShadow: bestShadow('button').value,
                      padding: '10px 20px',
                      fontSize: '14px', fontWeight: typography.headingWeight || 600,
                      letterSpacing: typography.letterSpacing || 'normal',
                      fontFamily: typography.fontFamily,
                    }}>
                      {lang === 'zh' ? '主要按钮' : 'Primary Button'}
                    </button>
                    <button style={{
                      background: 'transparent', color: primaryHex,
                      border: bestBorder('button').value, cursor: 'pointer',
                      borderRadius: bestRadius('button').value,
                      padding: '10px 20px', marginLeft: '10px',
                      fontSize: '14px', fontFamily: typography.fontFamily,
                    }}>
                      {lang === 'zh' ? '次要按钮' : 'Secondary'}
                    </button>
                  </ComponentPreview>
                )}
                {compTab === 'input' && (
                  <ComponentPreview bg={bgHex}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                      <input
                        readOnly defaultValue=""
                        placeholder={lang === 'zh' ? '输入框示例' : 'Input placeholder'}
                        style={{
                          background: surfaceHex, color: textHex,
                          border: bestBorder('input').value,
                          borderRadius: bestRadius('input').value,
                          padding: '10px 14px', fontSize: '14px',
                          fontFamily: typography.fontFamily, outline: 'none', width: '100%', boxSizing: 'border-box',
                        }}
                      />
                      <input
                        readOnly defaultValue=""
                        placeholder={lang === 'zh' ? '禁用状态' : 'Disabled state'}
                        disabled
                        style={{
                          background: surfaceHex, color: textHex,
                          border: bestBorder('input').value,
                          borderRadius: bestRadius('input').value,
                          padding: '10px 14px', fontSize: '14px',
                          fontFamily: typography.fontFamily, outline: 'none',
                          width: '100%', boxSizing: 'border-box', opacity: 0.4,
                        }}
                      />
                    </div>
                  </ComponentPreview>
                )}
                {compTab === 'card' && (
                  <ComponentPreview bg={bgHex}>
                    <div style={{
                      background: surfaceHex, color: textHex,
                      border: bestBorder('card').value,
                      borderRadius: bestRadius('card').value,
                      boxShadow: bestShadow('card').value,
                      padding: '16px 20px', width: '100%', boxSizing: 'border-box',
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: typography.headingWeight || 600, fontFamily: typography.fontFamily, marginBottom: '6px' }}>
                        {lang === 'zh' ? '卡片标题' : 'Card Title'}
                      </div>
                      <div style={{ fontSize: '13px', color: textHex, opacity: 0.6, fontFamily: typography.fontFamily }}>
                        {lang === 'zh' ? '说明文字内容' : 'Description text content'}
                      </div>
                    </div>
                  </ComponentPreview>
                )}
                {compTab === 'badge' && (
                  <ComponentPreview bg={bgHex}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { label: lang === 'zh' ? '标签' : 'Tag', bg: primaryHex, color: primaryFgHex },
                        { label: lang === 'zh' ? '次要' : 'Secondary', bg: surfaceHex, color: textHex },
                        { label: lang === 'zh' ? '边框' : 'Outline', bg: 'transparent', color: primaryHex, border: `1px solid ${primaryHex}` },
                      ].map((b, i) => (
                        <span key={i} style={{
                          background: b.bg, color: b.color,
                          border: b.border || 'none',
                          borderRadius: '999px',
                          padding: '4px 10px', fontSize: '12px', fontWeight: 500,
                          fontFamily: typography.fontFamily,
                        }}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </ComponentPreview>
                )}
              </div>

              {/* Right: token list */}
              <div>
                {compTab === 'button' && <>
                  <TokenRow label="background"     value={primaryHex}                            measured={true} />
                  <TokenRow label="color"          value={primaryFgHex}                          measured={true} />
                  <TokenRow label="border-radius"  value={bestRadius('button').value}            measured={bestRadius('button').measured} />
                  <TokenRow label="box-shadow"     value={bestShadow('button').value}            measured={bestShadow('button').measured && sourceIsUrl} />
                  <TokenRow label="font-family"    value={typography.fontFamily}                 measured={true} />
                  <TokenRow label="font-weight"    value={String(typography.headingWeight || 600)} measured={true} />
                  <TokenRow label="letter-spacing" value={typography.letterSpacing || 'normal'}  measured={true} />
                  {getStates('button').length > 0 && (
                    <div style={{ marginTop: '16px' }}>
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
                    <div style={{ marginTop: '16px' }}>
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
                  <TokenRow label="font-size"     value="12px"                                  measured={false} />
                  <TokenRow label="padding"       value="4px 10px"                              measured={false} />
                </>}
              </div>
            </div>
          </>
        )}

        {/* ══════════════ 形态 ══════════════ */}
        {mainTab === 'shape' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Row 1: Radius + Shadow */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              {/* Radius */}
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '边框圆角' : 'Border Radius'}</p>
                {(() => {
                  const items = radiusTokens.length > 0
                    ? radiusTokens.map(t => ({ value: t.value, sub: `${t.sampleCount}×${t.componentKinds?.length ? ' · ' + t.componentKinds.slice(0, 2).join(', ') : ''}`, measured: true }))
                    : radiusFallbackValues.map(v => ({ value: v, sub: lang === 'zh' ? 'AI 推断' : 'AI inferred', measured: false }))
                  if (!items.length) return <EmptyTab lang={lang} />
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '44px', height: '44px', background: '#1D1D1F', borderRadius: item.value, flexShrink: 0 }} />
                          <div>
                            <code style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1D1D1F', display: 'block' }}>{item.value}</code>
                            <span style={{ fontSize: '11px', color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={dot(item.measured)} />
                              {item.sub}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Shadow */}
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '阴影层级' : 'Shadow Elevation'}</p>
                {(() => {
                  const items = shadowTokens.length > 0
                    ? shadowTokens.map(t => ({ value: t.value, sub: `${t.sampleCount}×`, measured: true }))
                    : shadowFallbackValues.map(v => ({ value: v, sub: lang === 'zh' ? 'AI 推断' : 'AI inferred', measured: false }))
                  if (!items.length) return <EmptyTab lang={lang} />
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '56px', height: '36px', background: '#FFFFFF',
                            borderRadius: '6px', boxShadow: item.value, flexShrink: 0,
                            border: '0.5px solid rgba(0,0,0,0.05)',
                          }} />
                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            <code style={{ fontSize: '11px', color: '#3C3C43', fontFamily: 'var(--font-mono)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.value}
                            </code>
                            <span style={{ fontSize: '11px', color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={dot(item.measured)} />
                              {item.sub}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Row 2: Border tokens */}
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

        {/* ══════════════ 布局 ══════════════ */}
        {mainTab === 'space' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Spacing scale */}
            <div>
              <p style={sectionLabel}>{lang === 'zh' ? '间距阶梯' : 'Spacing Scale'}</p>
              {spacingTokens.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {spacingTokens.map((t, i) => {
                    const n = parseFloat(t.value)
                    const pct = isFinite(n) ? Math.max(4, Math.min(100, (n / 80) * 100)) : 10
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1D1D1F', minWidth: '48px' }}>{t.value}</code>
                        <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: '#EFEFEF' }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: '#1D1D1F' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#AEAEB2', minWidth: '32px', textAlign: 'right' }}>{t.sampleCount}×</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                  {sourceIsUrl ? (lang === 'zh' ? '暂未检测到间距数据' : 'No spacing data detected') : (lang === 'zh' ? '需要 URL 才能测量间距' : 'Requires URL analysis')}
                </p>
              )}
            </div>

            {/* Page structure */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {/* Max width */}
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '页面宽度' : 'Page Max-Width'}</p>
                {pageMaxWidth ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '20px', background: '#F5F5F7', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute', inset: 0, background: '#1D1D1F', borderRadius: '4px',
                          width: `${Math.min(100, (parseFloat(pageMaxWidth) / 1920) * 100)}%`
                        }} />
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

              {/* Layout patterns */}
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '布局模式' : 'Layout Patterns'}</p>
                {layoutEvidence.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {layoutEvidence.map((item, i) => (
                      <div key={i} style={{ ...chip }}>
                        <span style={dot(true)} />
                        {item.label}
                        <span style={{ color: '#AEAEB2' }}>×{item.sampleCount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                    {sourceIsUrl ? (lang === 'zh' ? '未检测到' : 'Not detected') : (lang === 'zh' ? '需要 URL' : 'Requires URL')}
                  </p>
                )}
              </div>
            </div>

            {/* Grid columns (if detected) */}
            {gridColumns && (
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '网格系统' : 'Grid System'}</p>
                <div style={{ ...chip }}>
                  <span style={dot(true)} />
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{gridColumns}</code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ 交互 ══════════════ */}
        {mainTab === 'interaction' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* State diffs */}
            <div>
              <p style={sectionLabel}>{lang === 'zh' ? '状态变化' : 'State Changes'}</p>
              {hasStateData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.entries(stateTokens as Record<string, Array<{ state: string; property: string; value: string }>>)
                    .map(([component, values]) => {
                      const nonDefault = values.filter(v => v.state !== 'default')
                      if (!nonDefault.length) return null
                      return (
                        <div key={component}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#3C3C43', textTransform: 'capitalize' }}>{component}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {nonDefault.map((s, i) => (
                              <StateRow key={i} state={s.state} prop={s.property} value={s.value} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                  {sourceIsUrl ? (lang === 'zh' ? '未检测到状态变化' : 'No state changes detected') : (lang === 'zh' ? '需要 URL 才能测量交互状态' : 'Requires URL analysis')}
                </p>
              )}
            </div>

            {/* Transitions */}
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
                  {sourceIsUrl ? (lang === 'zh' ? '未检测到过渡属性' : 'No transition data detected') : (lang === 'zh' ? '需要 URL 才能测量' : 'Requires URL analysis')}
                </p>
              )}
            </div>

            {/* Animation tendency (AI) */}
            {designDetails.animationTendency && !designDetails.animationTendency.includes(' ') === false && (
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '动效性格' : 'Motion Character'}</p>
                <div style={{ ...chip }}>
                  <span style={dot(false)} />
                  {designDetails.motionZh && lang === 'zh' ? designDetails.motionZh : designDetails.motionEn || designDetails.animationTendency}
                </div>
              </div>
            )}
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
      background: bg, borderRadius: '12px', padding: '24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '120px', border: '1px solid rgba(0,0,0,0.06)',
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

function inferRadius(d: string): string {
  const s = (d || '').toLowerCase()
  if (s.includes('sharp') || s.includes('0px')) return '0px'
  if (s.includes('full') || s.includes('pill')) return '9999px'
  if (s.includes('large') || s.includes('xl')) return '16px'
  if (s.includes('medium')) return '8px'
  if (s.includes('small')) return '4px'
  return '6px'
}

function isLight(hex: string): boolean {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}
