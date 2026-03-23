'use client'

import { useState } from 'react'
import type { StyleReport, RadiusToken, ShadowToken, StateTokenValue } from '@/lib/types'

type ComponentTab = 'button' | 'input' | 'card'

interface Props {
  report: StyleReport
  lang: 'zh' | 'en'
}

export default function StyleInspector({ report, lang }: Props) {
  const [activeTab, setActiveTab] = useState<ComponentTab>('button')

  const { colors, colorSystem, typography, designDetails } = report
  const analysis = report.pageAnalysis

  // ── Resolve base tokens ──────────────────────────────────────────────────
  const primaryHex = colorSystem?.primaryAction?.hex  || colors.find(c => c.role === 'primary')?.hex  || '#000000'
  const surfaceHex = colorSystem?.surface?.hex        || colors.find(c => c.role === 'surface')?.hex  || '#F5F5F7'
  const bgHex      = colorSystem?.pageBackground?.hex || colorSystem?.heroBackground?.hex             || colors.find(c => c.role === 'background')?.hex || '#ffffff'
  const textHex    = colorSystem?.textPrimary?.hex    || colors.find(c => c.role === 'text')?.hex     || '#1a1a1a'
  const borderHex  = colorSystem?.border?.hex         || colors.find(c => c.role === 'border')?.hex   || '#e5e5e5'

  const cssRadius = designDetails.cssRadius || inferRadius(designDetails.borderRadius)
  const cssShadow = designDetails.cssShadow || 'none'

  // ── Measured tokens ──────────────────────────────────────────────────────
  const radiusTokens: RadiusToken[] = analysis?.radiusTokens || []
  const shadowTokens: ShadowToken[] = analysis?.shadowTokens || []
  const stateTokens = analysis?.stateTokens || {}

  const hasMeasured = radiusTokens.length > 0 || shadowTokens.length > 0

  // Find best radius for a component kind
  function getBestRadius(kind: string): { value: string; measured: boolean } {
    const match = radiusTokens.find(t => t.componentKinds?.includes(kind))
    if (match) return { value: match.value, measured: true }
    if (radiusTokens.length > 0) return { value: radiusTokens[0].value, measured: true }
    return { value: cssRadius, measured: false }
  }

  // Find best shadow for a component kind
  function getBestShadow(kind: string): { value: string; measured: boolean } {
    const match = shadowTokens.find(t => t.componentKinds?.includes(kind))
    if (match) return { value: match.value, measured: true }
    if (shadowTokens.length > 0) return { value: shadowTokens[0].value, measured: false }
    return { value: cssShadow, measured: false }
  }

  // Find hover/focus state for a component
  function getStates(kind: string): Array<{ state: string; property: string; value: string }> {
    const entries = (stateTokens as Record<string, StateTokenValue[]>)[kind] || []
    return entries
      .filter(e => e.state !== 'default' && e.value)
      .map(e => ({ state: e.state, property: e.property, value: e.value }))
      .slice(0, 3)
  }

  const tabs: { key: ComponentTab; label: string }[] = [
    { key: 'button', label: 'Button' },
    { key: 'input',  label: 'Input' },
    { key: 'card',   label: 'Card' },
  ]

  const t = {
    measured: lang === 'zh' ? '测量值' : 'Measured',
    inferred: lang === 'zh' ? 'AI 推断' : 'AI inferred',
    noState:  lang === 'zh' ? '未检测到交互态' : 'No states detected',
    states:   lang === 'zh' ? '交互状态' : 'Interaction States',
    tokens:   lang === 'zh' ? 'Token' : 'Token',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 0 12px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 500,
              color: activeTab === tab.key ? '#1D1D1F' : '#AEAEB2',
              position: 'relative', fontFamily: 'var(--font-sans)',
              transition: 'color 0.2s ease'
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '1.5px', background: '#1D1D1F', borderRadius: '1px' }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        background: '#FFFFFF', borderRadius: '0 0 16px 16px',
        border: '1px solid rgba(0,0,0,0.06)', borderTop: 'none',
        padding: '28px'
      }}>
        {activeTab === 'button' && (
          <ComponentInspector
            visual={
              <button style={{
                padding: '9px 20px',
                background: primaryHex,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: getBestRadius('button').value,
                boxShadow: getBestShadow('button').value,
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: typography.fontFamily,
                letterSpacing: typography.letterSpacing,
                cursor: 'default'
              }}>
                {lang === 'zh' ? '提交' : 'Submit'}
              </button>
            }
            tokens={[
              { label: 'background',    value: primaryHex,                         source: 'measured' },
              { label: 'color',         value: '#FFFFFF',                           source: 'inferred' },
              { label: 'border-radius', value: getBestRadius('button').value,       source: getBestRadius('button').measured ? 'measured' : 'inferred' },
              { label: 'box-shadow',    value: getBestShadow('button').value,       source: getBestShadow('button').measured ? 'measured' : 'inferred' },
              { label: 'font-family',   value: typography.fontFamily,               source: 'measured' },
              { label: 'font-weight',   value: String(typography.headingWeight),    source: 'measured' },
            ]}
            states={getStates('button')}
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'input' && (
          <ComponentInspector
            visual={
              <div style={{
                width: '200px', height: '36px',
                background: surfaceHex,
                border: `1px solid ${borderHex}`,
                borderRadius: getBestRadius('input').value,
                display: 'flex', alignItems: 'center',
                padding: '0 12px',
                color: textHex,
                fontSize: '13px',
                fontFamily: typography.fontFamily,
                letterSpacing: typography.letterSpacing,
              }}>
                {lang === 'zh' ? '搜索...' : 'Search...'}
              </div>
            }
            tokens={[
              { label: 'background',    value: surfaceHex,                          source: 'measured' },
              { label: 'border',        value: `1px solid ${borderHex}`,            source: 'measured' },
              { label: 'border-radius', value: getBestRadius('input').value,        source: getBestRadius('input').measured ? 'measured' : 'inferred' },
              { label: 'color',         value: textHex,                             source: 'measured' },
              { label: 'font-family',   value: typography.fontFamily,               source: 'measured' },
            ]}
            states={getStates('input')}
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'card' && (
          <ComponentInspector
            visual={
              <div style={{
                width: '200px',
                background: surfaceHex,
                border: `1px solid ${borderHex}`,
                borderRadius: getBestRadius('card').value,
                boxShadow: getBestShadow('card').value,
                padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: textHex, fontFamily: typography.fontFamily, letterSpacing: typography.letterSpacing }}>
                  {lang === 'zh' ? '卡片标题' : 'Card Title'}
                </div>
                <div style={{ fontSize: '12px', color: textHex, opacity: 0.6, fontFamily: typography.fontFamily }}>
                  {lang === 'zh' ? '说明文字' : 'Description'}
                </div>
              </div>
            }
            tokens={[
              { label: 'background',    value: surfaceHex,                          source: 'measured' },
              { label: 'border',        value: `1px solid ${borderHex}`,            source: 'measured' },
              { label: 'border-radius', value: getBestRadius('card').value,         source: getBestRadius('card').measured ? 'measured' : 'inferred' },
              { label: 'box-shadow',    value: getBestShadow('card').value,         source: getBestShadow('card').measured ? 'measured' : 'inferred' },
              { label: 'color',         value: textHex,                             source: 'measured' },
            ]}
            states={getStates('card')}
            lang={lang}
            t={t}
          />
        )}
      </div>

      {/* Source note */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <SourceDot measured /> <span style={{ fontSize: '11px', color: '#8E8E93' }}>{t.measured}</span>
        <SourceDot /> <span style={{ fontSize: '11px', color: '#8E8E93' }}>{t.inferred}</span>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ComponentInspector({
  visual, tokens, states, lang, t
}: {
  visual: React.ReactNode
  tokens: Array<{ label: string; value: string; source: 'measured' | 'inferred' }>
  states: Array<{ state: string; property: string; value: string }>
  lang: 'zh' | 'en'
  t: Record<string, string>
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

      {/* Visual preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          minHeight: '140px', background: 'var(--bg-base, #F5F5F7)',
          borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }}>
          {visual}
        </div>

        {/* Interaction states */}
        {states.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.states}
            </span>
            {states.map((s, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: '#F5F5F7', borderRadius: '8px', gap: '12px'
              }}>
                <span style={{ fontSize: '11px', color: '#8E8E93', minWidth: '60px' }}>
                  :{s.state}
                </span>
                <span style={{ fontSize: '11px', color: '#8E8E93', minWidth: '80px' }}>
                  {s.property}
                </span>
                <code style={{ fontSize: '11px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                  {s.value.length > 20 ? s.value.slice(0, 20) + '…' : s.value}
                </code>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Token list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tokens.map((token, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 0',
            borderBottom: i < tokens.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none'
          }}>
            <SourceDot measured={token.source === 'measured'} />
            <span style={{ fontSize: '12px', color: '#8E8E93', minWidth: '100px', flexShrink: 0 }}>
              {token.label}
            </span>
            <code style={{
              fontSize: '12px', color: '#1D1D1F', fontFamily: 'var(--font-mono)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '160px'
            }}>
              {token.value}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourceDot({ measured = false }: { measured?: boolean }) {
  return (
    <div style={{
      width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
      background: measured ? '#34C759' : '#AEAEB2'
    }} />
  )
}

function inferRadius(d: string): string {
  const s = d.toLowerCase()
  if (s.includes('sharp') || s.includes('0px')) return '0px'
  if (s.includes('full') || s.includes('pill')) return '9999px'
  if (s.includes('large') || s.includes('xl')) return '16px'
  if (s.includes('medium')) return '8px'
  if (s.includes('small')) return '4px'
  return '6px'
}
