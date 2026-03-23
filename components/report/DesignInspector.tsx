'use client'

import { useState } from 'react'
import type { StyleReport, RadiusToken, ShadowToken } from '@/lib/types'

type MainTab = 'components' | 'shape' | 'space' | 'interaction'
type ComponentTab = 'button' | 'input' | 'card'

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

  // ── Color tokens (from semantic color system or fallback) ─────────────────
  const primaryHex = colorSystem?.primaryAction?.hex || colors.find(c => c.role === 'primary')?.hex  || '#000000'
  const surfaceHex = colorSystem?.surface?.hex       || colors.find(c => c.role === 'surface')?.hex  || '#F5F5F7'
  const textHex    = colorSystem?.textPrimary?.hex   || colors.find(c => c.role === 'text')?.hex     || '#1a1a1a'
  const borderHex  = colorSystem?.border?.hex        || colors.find(c => c.role === 'border')?.hex   || '#e5e5e5'

  // ── Measured tokens (DOM/CSS extraction via pageAnalyzer) ─────────────────
  const radiusTokens: RadiusToken[] = analysis?.radiusTokens  || []
  const shadowTokens: ShadowToken[] = analysis?.shadowTokens  || []
  const spacingTokens                = analysis?.spacingTokens || []
  const layoutEvidence               = analysis?.layoutEvidence || []
  const stateTokens                  = analysis?.stateTokens   || {}

  // ── AI fallback CSS values ────────────────────────────────────────────────
  const cssRadius = designDetails.cssRadius || inferRadius(designDetails.borderRadius)
  const cssShadow = designDetails.cssShadow || 'none'

  // ── Helpers ───────────────────────────────────────────────────────────────
  function bestRadius(kind: string): { value: string; measured: boolean } {
    const match = radiusTokens.find(t => t.componentKinds?.includes(kind))
    if (match) return { value: match.value, measured: true }
    if (radiusTokens.length > 0) return { value: radiusTokens[0].value, measured: true }
    return { value: cssRadius, measured: false }
  }

  function bestShadow(kind: string): { value: string; measured: boolean } {
    const match = shadowTokens.find(t => t.componentKinds?.includes(kind))
    if (match) return { value: match.value, measured: true }
    if (shadowTokens.length > 0) return { value: shadowTokens[0].value, measured: true }
    return { value: cssShadow, measured: false }
  }

  function getStates(kind: string) {
    const entries = (stateTokens as Record<string, Array<{ state: string; property: string; value: string }>>)[kind] || []
    return entries.filter(e => e.state !== 'default' && e.value).slice(0, 4)
  }

  const mainTabs: { key: MainTab; label: string }[] = [
    { key: 'components', label: lang === 'zh' ? '组件'  : 'Components' },
    { key: 'shape',      label: lang === 'zh' ? '形态'  : 'Shape' },
    { key: 'space',      label: lang === 'zh' ? '空间'  : 'Space' },
    { key: 'interaction',label: lang === 'zh' ? '交互'  : 'Interaction' },
  ]

  const compTabs: { key: ComponentTab; label: string }[] = [
    { key: 'button', label: 'Button' },
    { key: 'input',  label: 'Input' },
    { key: 'card',   label: 'Card' },
  ]

  // ── Styles ────────────────────────────────────────────────────────────────
  const sectionTitle: React.CSSProperties = {
    margin: 0, fontSize: '11px', fontWeight: 600,
    color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.05em'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Main tabs ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '28px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {mainTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            style={{
              padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: mainTab === tab.key ? 600 : 500,
              color: mainTab === tab.key ? '#1D1D1F' : '#AEAEB2',
              position: 'relative', fontFamily: 'var(--font-sans)',
              transition: 'color 0.2s ease', whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
            {mainTab === tab.key && (
              <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '1.5px', background: '#1D1D1F', borderRadius: '1px' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Content card ────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', borderRadius: '0 0 16px 16px',
        border: '1px solid rgba(0,0,0,0.06)', borderTop: 'none',
        padding: '28px', minHeight: '260px'
      }}>

        {/* Source badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: '999px', border: '1px solid rgba(0,0,0,0.08)' }}>
            {sourceIsUrl
              ? (lang === 'zh' ? '基于页面测量' : 'Measured from page')
              : (lang === 'zh' ? 'AI 推断' : 'AI inferred')}
          </span>
        </div>

        {/* ══════════════ 组件 ══════════════ */}
        {mainTab === 'components' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Component sub-tabs (pill style) */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {compTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCompTab(tab.key)}
                  style={{
                    padding: '5px 16px',
                    border: `1px solid ${compTab === tab.key ? '#1D1D1F' : 'rgba(0,0,0,0.10)'}`,
                    background: compTab === tab.key ? '#1D1D1F' : 'transparent',
                    color: compTab === tab.key ? '#FFFFFF' : '#8E8E93',
                    borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 2-col: visual + token list */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>

              {/* Left: visual preview + interaction states */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  height: '140px', background: '#F5F5F7', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(0,0,0,0.04)'
                }}>
                  {compTab === 'button' && (
                    <button style={{
                      padding: '9px 20px',
                      background: primaryHex,
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: bestRadius('button').value,
                      boxShadow: bestShadow('button').value,
                      fontSize: '13px', fontWeight: 600,
                      fontFamily: typography.fontFamily,
                      letterSpacing: typography.letterSpacing,
                      cursor: 'default'
                    }}>
                      {lang === 'zh' ? '提交' : 'Submit'}
                    </button>
                  )}
                  {compTab === 'input' && (
                    <div style={{
                      width: '200px', height: '36px',
                      background: surfaceHex,
                      border: `1px solid ${borderHex}`,
                      borderRadius: bestRadius('input').value,
                      display: 'flex', alignItems: 'center',
                      padding: '0 12px',
                      color: textHex,
                      fontSize: '13px',
                      fontFamily: typography.fontFamily,
                    }}>
                      {lang === 'zh' ? '搜索...' : 'Search...'}
                    </div>
                  )}
                  {compTab === 'card' && (
                    <div style={{
                      width: '200px',
                      background: surfaceHex,
                      border: `1px solid ${borderHex}`,
                      borderRadius: bestRadius('card').value,
                      boxShadow: bestShadow('card').value,
                      padding: '14px 16px',
                      display: 'flex', flexDirection: 'column', gap: '6px',
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: textHex, fontFamily: typography.fontFamily }}>
                        {lang === 'zh' ? '卡片标题' : 'Card Title'}
                      </div>
                      <div style={{ fontSize: '12px', color: textHex, opacity: 0.6 }}>
                        {lang === 'zh' ? '说明文字' : 'Description'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Interaction states */}
                {getStates(compTab).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={sectionTitle}>{lang === 'zh' ? '交互状态' : 'Interaction States'}</span>
                    {getStates(compTab).map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 10px', background: '#F5F5F7', borderRadius: '8px'
                      }}>
                        <code style={{ fontSize: '11px', color: '#8E8E93', minWidth: '52px' }}>:{s.state}</code>
                        <span style={{ fontSize: '11px', color: '#AEAEB2', flex: 1 }}>{s.property}</span>
                        <code style={{ fontSize: '11px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.value}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: token rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {compTab === 'button' && <>
                  <TokenRow label="background"     value={primaryHex}                                  measured={true} />
                  <TokenRow label="border-radius"  value={bestRadius('button').value}                  measured={bestRadius('button').measured && sourceIsUrl} />
                  <TokenRow label="box-shadow"     value={bestShadow('button').value}                  measured={bestShadow('button').measured && sourceIsUrl} />
                  <TokenRow label="font-family"    value={typography.fontFamily}                       measured={true} />
                  <TokenRow label="font-weight"    value={String(typography.headingWeight)}            measured={true} />
                  <TokenRow label="letter-spacing" value={typography.letterSpacing}                    measured={true} />
                </>}
                {compTab === 'input' && <>
                  <TokenRow label="background"    value={surfaceHex}                                   measured={true} />
                  <TokenRow label="border"        value={`1px solid ${borderHex}`}                     measured={true} />
                  <TokenRow label="border-radius" value={bestRadius('input').value}                    measured={bestRadius('input').measured && sourceIsUrl} />
                  <TokenRow label="color"         value={textHex}                                      measured={true} />
                  <TokenRow label="font-family"   value={typography.fontFamily}                        measured={true} />
                </>}
                {compTab === 'card' && <>
                  <TokenRow label="background"    value={surfaceHex}                                   measured={true} />
                  <TokenRow label="border"        value={`1px solid ${borderHex}`}                     measured={true} />
                  <TokenRow label="border-radius" value={bestRadius('card').value}                     measured={bestRadius('card').measured && sourceIsUrl} />
                  <TokenRow label="box-shadow"    value={bestShadow('card').value}                     measured={bestShadow('card').measured && sourceIsUrl} />
                  <TokenRow label="color"         value={textHex}                                      measured={true} />
                </>}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ 形态 ══════════════ */}
        {mainTab === 'shape' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>

            {/* Radius */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={sectionTitle}>{lang === 'zh' ? '边框圆角' : 'Border Radius'}</h4>
              {radiusTokens.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {radiusTokens.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', background: '#1D1D1F', borderRadius: t.value, flexShrink: 0 }} />
                      <div>
                        <code style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1D1D1F', display: 'block' }}>{t.value}</code>
                        <span style={{ fontSize: '11px', color: '#AEAEB2' }}>
                          {t.sampleCount} {lang === 'zh' ? '次' : 'hits'}
                          {t.componentKinds?.length ? ' · ' + t.componentKinds.slice(0, 2).join(', ') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <AiFallback value={designDetails.cssRadius || designDetails.borderRadius} lang={lang} />
              )}
            </div>

            {/* Shadow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={sectionTitle}>{lang === 'zh' ? '阴影层级' : 'Shadow Elevation'}</h4>
              {shadowTokens.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {shadowTokens.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '64px', height: '40px', background: '#FFFFFF',
                        borderRadius: '6px', boxShadow: t.value, flexShrink: 0,
                        border: '0.5px solid rgba(0,0,0,0.04)'
                      }} />
                      <div style={{ overflow: 'hidden' }}>
                        <code style={{ fontSize: '10px', color: '#8E8E93', fontFamily: 'var(--font-mono)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.value}
                        </code>
                        <span style={{ fontSize: '11px', color: '#AEAEB2' }}>
                          {t.sampleCount} {lang === 'zh' ? '次' : 'hits'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <AiFallback value={designDetails.cssShadow || designDetails.shadowStyle} lang={lang} />
              )}
            </div>
          </div>
        )}

        {/* ══════════════ 空间 ══════════════ */}
        {mainTab === 'space' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>

            {/* Spacing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={sectionTitle}>{lang === 'zh' ? '间距节奏' : 'Spacing Scale'}</h4>
              {spacingTokens.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {spacingTokens.map((t, i) => {
                    const n = parseFloat(t.value)
                    const pct = isFinite(n) ? Math.max(4, Math.min(100, (n / 80) * 100)) : 10
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1D1D1F', minWidth: '48px' }}>
                          {t.value}
                        </code>
                        <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: '#EFEFEF' }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: '#1D1D1F' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#AEAEB2', minWidth: '32px', textAlign: 'right' }}>
                          {t.sampleCount}×
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <AiFallback value={designDetails.spacingSystem} lang={lang} />
              )}
            </div>

            {/* Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={sectionTitle}>{lang === 'zh' ? '布局模式' : 'Layout Patterns'}</h4>
              {layoutEvidence.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {layoutEvidence.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: '#F5F5F7', borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1D1D1F' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', color: '#8E8E93' }}>
                        {item.sampleCount} {lang === 'zh' ? '处' : 'found'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <AiFallback value={designDetails.layoutStructure} lang={lang} />
              )}
            </div>
          </div>
        )}

        {/* ══════════════ 交互 ══════════════ */}
        {mainTab === 'interaction' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.keys(stateTokens).length > 0 ? (
              Object.entries(stateTokens as Record<string, Array<{ state: string; property: string; value: string }>>) .map(([component, values]) => {
                const nonDefault = values.filter(v => v.state !== 'default')
                if (!nonDefault.length) return null
                return (
                  <div key={component} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ ...sectionTitle, textTransform: 'capitalize' }}>{component}</h4>
                    {nonDefault.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '9px 12px', background: '#F5F5F7', borderRadius: '8px'
                      }}>
                        <code style={{ fontSize: '11px', color: '#8E8E93', minWidth: '56px' }}>:{s.state}</code>
                        <span style={{ fontSize: '11px', color: '#AEAEB2', flex: 1 }}>{s.property}</span>
                        <code style={{ fontSize: '11px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.value}
                        </code>
                      </div>
                    ))}
                  </div>
                )
              })
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                  {lang === 'zh' ? '未检测到交互状态数据' : 'No interaction state data detected'}
                </p>
                {designDetails.animationTendency && (
                  <AiFallback value={designDetails.animationTendency} lang={lang} />
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '16px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34C759', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#8E8E93' }}>{lang === 'zh' ? '测量值' : 'Measured'}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#AEAEB2', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#8E8E93' }}>{lang === 'zh' ? 'AI 推断' : 'AI inferred'}</span>
        </span>
      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function TokenRow({ label, value, measured }: { label: string; value: string; measured: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.04)'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: '#8E8E93', minWidth: '100px', flexShrink: 0 }}>{label}</span>
      <code style={{ fontSize: '12px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {value}
      </code>
    </div>
  )
}

function AiFallback({ value, lang }: { value: string; lang: 'zh' | 'en' }) {
  if (!value) {
    return (
      <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
        {lang === 'zh' ? '未提取到该细节' : 'No data detected'}
      </p>
    )
  }
  return (
    <div style={{ padding: '14px 16px', background: '#F5F5F7', borderRadius: '10px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#3C3C43', lineHeight: 1.6 }}>{value}</p>
    </div>
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
