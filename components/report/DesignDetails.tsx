'use client'

import { useMemo, useState } from 'react'
import type { DesignDetails as DetailsType, PageStyleAnalysis, StateTokenValue } from '@/lib/types'

type TabKey = 'radius' | 'shadow' | 'layout' | 'spacing' | 'motion'

export default function DesignDetails({
  data,
  analysis,
  sourceType,
  lang,
  fullWidth = false
}: {
  data: DetailsType
  analysis?: PageStyleAnalysis
  sourceType: 'image' | 'url'
  lang: 'zh' | 'en'
  fullWidth?: boolean
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('radius')

  const t = {
    radius: lang === 'zh' ? '边框圆角' : 'Border Radius',
    shadow: lang === 'zh' ? '阴影层级' : 'Shadows',
    layout: lang === 'zh' ? '布局网格' : 'Layout',
    spacing: lang === 'zh' ? '空间配比' : 'Spacing',
    motion: lang === 'zh' ? '动效偏好' : 'Motion',
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'radius', label: t.radius },
    { key: 'shadow', label: t.shadow },
    { key: 'layout', label: t.layout },
    { key: 'spacing', label: t.spacing },
    { key: 'motion', label: t.motion },
  ]

  const measuredRadius  = sourceType === 'url' ? analysis?.radiusTokens  || [] : []
  const measuredShadow  = sourceType === 'url' ? analysis?.shadowTokens  || [] : []
  const measuredSpacing = sourceType === 'url' ? analysis?.spacingTokens || [] : []
  const measuredLayout  = sourceType === 'url' ? analysis?.layoutEvidence || [] : []
  const measuredStates  = sourceType === 'url'
    ? Object.entries(analysis?.stateTokens || {}).flatMap(([component, values]) =>
        ((values || []) as StateTokenValue[]).map(v => ({ component, ...v }))
      )
    : []

  const items = useMemo(() => ({
    radius:  measuredRadius,
    shadow:  measuredShadow,
    layout:  measuredLayout,
    spacing: measuredSpacing,
    motion:  measuredStates,
  }), [measuredLayout, measuredRadius, measuredShadow, measuredSpacing, measuredStates])

  const hasMeasured: Record<TabKey, boolean> = {
    radius:  items.radius.length  > 0,
    shadow:  items.shadow.length  > 0,
    layout:  items.layout.length  > 0,
    spacing: items.spacing.length > 0,
    motion:  items.motion.length  > 0,
  }

  // AI-inferred text fallbacks (from extraction pipeline)
  const aiFallback: Record<TabKey, string> = {
    radius:  data.cssRadius   || data.borderRadius        || '',
    shadow:  data.cssShadow   || data.shadowStyle         || '',
    layout:  data.layoutStructure                         || '',
    spacing: data.spacingSystem                           || '',
    motion:  data.animationTendency                       || '',
  }

  const isCurrentMeasured = hasMeasured[activeTab]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Tabs */}
      <div
        style={{ display: 'flex', gap: '32px', borderBottom: '1px solid rgba(0,0,0,0.06)', width: '100%', overflowX: 'auto', alignItems: 'baseline' }}
        className="no-scrollbar"
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 0', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 500,
              background: 'none',
              color: activeTab === tab.key ? '#1D1D1F' : '#AEAEB2',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap', position: 'relative',
              fontFamily: 'var(--font-sans)'
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '1.5px', background: '#1D1D1F', borderRadius: '1px' }} />
            )}
          </button>
        ))}
      </div>

      {/* Content card */}
      <div style={{
        minHeight: '220px', background: '#FFFFFF', borderRadius: '16px',
        border: '1px solid rgba(0,0,0,0.06)', padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
      }}>

        {/* Source badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <span style={{
            fontSize: '11px', color: 'var(--text-secondary)',
            padding: '3px 8px', borderRadius: '999px',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            {isCurrentMeasured
              ? (lang === 'zh' ? '基于页面测量' : 'Measured from page')
              : (lang === 'zh' ? 'AI 推断' : 'AI inferred')}
          </span>
        </div>

        {/* ── Radius ── */}
        {activeTab === 'radius' && (
          hasMeasured.radius ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
              {items.radius.map((token, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '100%', height: '96px', background: '#F5F5F7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '64px', height: '40px', background: '#1D1D1F', borderRadius: token.value }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1D1D1F' }}>
                      {token.value}
                    </code>
                    <div style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '3px' }}>
                      {token.sampleCount} {lang === 'zh' ? '次' : 'hits'}
                      {token.componentKinds?.length ? ' · ' + token.componentKinds.slice(0, 2).join(', ') : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AiFallback value={aiFallback.radius} lang={lang} />
          )
        )}

        {/* ── Shadow ── */}
        {activeTab === 'shadow' && (
          hasMeasured.shadow ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
              {items.shadow.map((token, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '100%', height: '96px', background: '#F5F5F7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '80px', height: '48px', background: '#FFFFFF', borderRadius: '8px', boxShadow: token.value }} />
                  </div>
                  <div style={{ textAlign: 'center', width: '100%', padding: '0 4px' }}>
                    <code style={{ fontSize: '10px', color: '#8E8E93', fontFamily: 'var(--font-mono)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {token.value}
                    </code>
                    <div style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '3px' }}>
                      {token.sampleCount} {lang === 'zh' ? '次' : 'hits'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AiFallback value={aiFallback.shadow} lang={lang} />
          )
        )}

        {/* ── Layout ── */}
        {activeTab === 'layout' && (
          hasMeasured.layout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.layout.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: '10px',
                  background: '#F5F5F7'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#1D1D1F' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: '#8E8E93' }}>
                    {item.sampleCount} {lang === 'zh' ? '处' : 'found'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <AiFallback value={aiFallback.layout} lang={lang} />
          )
        )}

        {/* ── Spacing ── */}
        {activeTab === 'spacing' && (
          hasMeasured.spacing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.spacing.map((token, i) => {
                const numeric = Number.parseFloat(token.value)
                const pct = Number.isFinite(numeric) ? Math.max(4, Math.min(100, (numeric / 80) * 100)) : 10
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1D1D1F', minWidth: '52px' }}>
                      {token.value}
                    </code>
                    <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: '#EFEFEF' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: '#1D1D1F' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#AEAEB2', minWidth: '36px', textAlign: 'right' }}>
                      {token.sampleCount}×
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <AiFallback value={aiFallback.spacing} lang={lang} />
          )
        )}

        {/* ── Motion ── */}
        {activeTab === 'motion' && (
          hasMeasured.motion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.motion.map((token, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px', padding: '12px 16px', borderRadius: '10px',
                  background: '#F5F5F7'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1D1D1F', textTransform: 'capitalize' }}>
                      {token.component} · {token.state}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8E8E93' }}>{token.property}</span>
                  </div>
                  <code style={{ fontSize: '12px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {token.value}
                  </code>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px', color: '#AEAEB2', fontSize: '13px', textAlign: 'center', lineHeight: 1.6 }}>
              {lang === 'zh'
                ? '未检测到稳定的交互状态参数'
                : 'No reliable interaction state measurements found'}
            </div>
          )
        )}

      </div>
    </div>
  )
}

function AiFallback({ value, lang }: { value: string; lang: 'zh' | 'en' }) {
  if (!value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px', color: '#AEAEB2', fontSize: '13px' }}>
        {lang === 'zh' ? '未提取到该细节' : 'No details detected'}
      </div>
    )
  }
  return (
    <div style={{ padding: '16px 20px', background: '#F5F5F7', borderRadius: '12px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: '#3C3C43', lineHeight: 1.7 }}>{value}</p>
    </div>
  )
}
