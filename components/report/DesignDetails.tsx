'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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
    radius: lang === 'zh' ? '边框圆角' : 'Border radius',
    shadow: lang === 'zh' ? '阴影层级' : 'Shadows',
    layout: lang === 'zh' ? '布局网格' : 'Layout',
    spacing: lang === 'zh' ? '空间配比' : 'Spacing',
    motion: lang === 'zh' ? '动效偏好' : 'Motion'
  }

  const tabs: { key: TabKey, label: string }[] = [
    { key: 'radius', label: t.radius },
    { key: 'shadow', label: t.shadow },
    { key: 'layout', label: t.layout },
    { key: 'spacing', label: t.spacing },
    { key: 'motion', label: t.motion },
  ]

  const measuredRadius = sourceType === 'url' ? analysis?.radiusTokens || [] : []
  const measuredShadow = sourceType === 'url' ? analysis?.shadowTokens || [] : []
  const measuredSpacing = sourceType === 'url' ? analysis?.spacingTokens || [] : []
  const measuredLayout = sourceType === 'url' ? analysis?.layoutEvidence || [] : []
  const measuredStates = sourceType === 'url'
    ? Object.entries(analysis?.stateTokens || {}).flatMap(([component, values]) =>
        ((values || []) as StateTokenValue[]).map(value => ({
          component,
          ...value,
        }))
      )
    : []

  const items = useMemo(() => ({
    radius: measuredRadius,
    shadow: measuredShadow,
    layout: measuredLayout,
    spacing: measuredSpacing,
    motion: measuredStates
  }), [measuredLayout, measuredRadius, measuredShadow, measuredSpacing, measuredStates])

  const showMeasuredBadge = sourceType === 'url'
  const hasMeasuredEvidence = {
    radius: items.radius.length > 0,
    shadow: items.shadow.length > 0,
    layout: items.layout.length > 0,
    spacing: items.spacing.length > 0,
    motion: items.motion.length > 0
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. Technical Underline Tabs (Unified Style) */}
      <div style={{ 
        display: 'flex', gap: '32px', borderBottom: '1px solid rgba(0,0,0,0.06)',
        width: '100%', overflowX: 'auto', alignItems: 'baseline' 
      }} className="no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 0', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 500,
              textTransform: 'none', letterSpacing: '0',
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

      {/* 2. Content Area (Unified Card Style: 16px radius, subtle border) */}
      <div style={{ 
        minHeight: '280px', background: '#FFFFFF', borderRadius: '16px', 
        border: '1px solid rgba(0,0,0,0.06)', padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
      }}>
        {showMeasuredBadge && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '16px'
          }}>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              padding: '3px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              {lang === 'zh' ? '基于页面测量' : 'Measured from page'}
            </span>
          </div>
        )}
        {activeTab === 'radius' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
               {hasMeasuredEvidence.radius ? items.radius.map((token, i) => (
                 <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ height: '120px', background: '#F9F9F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                       <div style={{ width: '60px', height: '45px', background: '#1D1D1F', borderRadius: token.value, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <RedlineLabel value={token.value} />
                       </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <code style={{ fontSize: '10px', color: '#AEAEB2', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>border-radius: {token.value};</code>
                      <MeasuredMeta
                        lang={lang}
                        count={token.sampleCount}
                        score={token.evidenceScore}
                        kinds={token.componentKinds}
                      />
                    </div>
                 </div>
               )) : <EmptyState lang={lang} />}
             </div>
          </div>
        )}

        {activeTab === 'shadow' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {hasMeasuredEvidence.shadow ? items.shadow.map((token, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '120px', background: '#F9F9F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '60px', height: '45px', background: '#FFFFFF', borderRadius: '8px', boxShadow: token.value, position: 'relative' }}>
                     <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '3px', height: '3px', background: '#FF3B30', borderRadius: '50%' }} />
                     <div style={{ position: 'absolute', top: '-10px', right: '-12px', fontSize: '9px', fontWeight: 800, color: '#FF3B30', whiteSpace: 'nowrap' }}>
                       {lang === 'zh' ? `阴影层级 ${i+1}` : `Shadow ${i+1}`}
                     </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <code style={{ fontSize: '10px', color: '#AEAEB2', fontFamily: 'var(--font-mono)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{token.value.substring(0, 48)}</code>
                  <MeasuredMeta
                    lang={lang}
                    count={token.sampleCount}
                    score={token.evidenceScore}
                    kinds={token.componentKinds}
                  />
                </div>
              </div>
            )) : <EmptyState lang={lang} />}
          </div>
        )}

        {activeTab === 'layout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sourceType === 'url' && measuredLayout.length > 0 && (
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {lang === 'zh'
                  ? '这些布局标签来自页面可见元素的真实布局模式采样。'
                  : 'These layout tags are derived from measured visible page structure.'}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {hasMeasuredEvidence.layout ? items.layout.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '18px',
                  borderRadius: '14px',
                  background: '#F8F8FA',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {item.sampleCount || 0} {lang === 'zh' ? '处页面证据' : 'measured occurrences'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    score {Number(item.evidenceScore || 0).toFixed(2)}
                  </div>
                </div>
              )) : <EmptyState lang={lang} />}
            </div>
          </div>
        )}

        {activeTab === 'spacing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {hasMeasuredEvidence.spacing ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 260px) 1fr 120px', gap: '14px 18px', alignItems: 'center' }}>
                {items.spacing.map((token, i) => {
                  const numeric = Number.parseFloat(token.value)
                  const width = Number.isFinite(numeric) ? Math.max(12, Math.min(120, numeric * 3)) : 24
                  return (
                    <FragmentRow key={i}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: '#FF5A36' }}>
                        {token.value}
                      </div>
                      <div style={{ height: '8px', borderRadius: '999px', background: '#F5F1F1', position: 'relative' }}>
                        <div style={{ width, height: '100%', borderRadius: '999px', background: '#F6DFDF' }} />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                        {token.sampleCount} {lang === 'zh' ? '次' : 'hits'}
                      </div>
                    </FragmentRow>
                  )
                })}
              </div>
            ) : <EmptyState lang={lang} />}
          </div>
        )}

        {activeTab === 'motion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {hasMeasuredEvidence.motion ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {items.motion.map((token, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px',
                    borderRadius: '14px',
                    background: '#F8F8FA',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {token.component} / {token.state}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {token.property}
                      </span>
                    </div>
                    <code style={{ fontSize: '12px', color: '#2C2C2B', fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>
                      {token.value}
                    </code>
                    <MeasuredMeta
                      lang={lang}
                      score={token.evidenceScore}
                      kinds={token.componentKinds}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: '140px', background: '#F9F9F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', padding: '24px' }}>
                <div style={{ maxWidth: '520px', textAlign: 'center', fontSize: '13px', lineHeight: 1.7, color: '#6B6B73' }}>
                  {lang === 'zh'
                    ? '当前没有稳定测量到足够可靠的交互状态参数，因此这里不展示推断值。'
                    : 'Reliable interaction-state measurements are not available yet, so inferred motion values are intentionally hidden.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FragmentRow({ children }: { children: ReactNode }) {
  return <>{children}</>
}

function RedlineLabel({ value }: { value: string }) {
  return (
    <div style={{ 
      position: 'absolute', top: '-8px', right: '-8px',
      background: '#FF3B30', color: '#FFF', fontSize: '9px', 
      padding: '2px 4px', borderRadius: '3px', fontWeight: 800, 
      fontFamily: 'var(--font-mono)', zIndex: 1
    }}>
      {value}
    </div>
  )
}

function TagBadge({ label, theme = 'light' }: { label: string, theme?: 'light' | 'dark' }) {
  return (
    <span style={{ 
      padding: '5px 14px', 
      background: theme === 'light' ? '#F2F2F7' : '#1D1D1F', 
      color: theme === 'light' ? '#1D1D1F' : '#FFF', 
      borderRadius: '8px', fontSize: '12px', fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      whiteSpace: 'nowrap'
    }}>
      {label}
    </span>
  )
}

function MeasuredMeta({
  lang,
  count,
  score,
  kinds
}: {
  lang: 'zh' | 'en'
  count?: number
  score?: number
  kinds?: string[]
}) {
  const lines: string[] = []
  if (typeof count === 'number') lines.push(lang === 'zh' ? `${count} 次命中` : `${count} hits`)
  if (typeof score === 'number') lines.push(`score ${Number(score).toFixed(2)}`)
  if (kinds?.length) lines.push((lang === 'zh' ? '组件: ' : 'Kinds: ') + kinds.join(', '))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minHeight: '34px' }}>
      {lines.map((line, index) => (
        <div key={index} style={{ fontSize: '11px', color: '#8E8E93', textAlign: 'center' }}>
          {line}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ lang }: { lang: 'zh' | 'en' }) {
  return (
    <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#AEAEB2', fontSize: '13px' }}>
      {lang === 'zh' ? '未提取到该细节' : 'No details detected'}
    </div>
  )
}
