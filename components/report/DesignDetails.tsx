'use client'

import React, { useState } from 'react'
import type { DesignDetails as DetailsType } from '@/lib/types'

type TabKey = 'radius' | 'shadow' | 'layout' | 'spacing' | 'motion'

export default function DesignDetails({ data, lang, fullWidth = false }: { data: DetailsType, lang: 'zh' | 'en', fullWidth?: boolean }) {
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

  const parse = (val?: string) => val ? val.split('|').map(s => s.trim()).filter(Boolean) : []
  
  const items = {
    radius: parse(data.cssRadius),
    shadow: parse(data.cssShadow),
    layout: lang === 'zh' ? parse(data.layoutZh || data.layoutEn) : parse(data.layoutEn || data.layoutZh),
    spacing: lang === 'zh' ? parse(data.spacingZh || data.spacingEn) : parse(data.spacingEn || data.spacingZh),
    motion: lang === 'zh' ? parse(data.motionZh || data.motionEn) : parse(data.motionEn || data.motionZh)
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
              fontSize: '11px', fontWeight: activeTab === tab.key ? 600 : 400,
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
        {activeTab === 'radius' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
               {items.radius.length > 0 ? items.radius.map((r, i) => (
                 <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ height: '120px', background: '#F9F9F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                       <div style={{ width: '60px', height: '45px', background: '#1D1D1F', borderRadius: r, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <RedlineLabel value={r} />
                       </div>
                    </div>
                    <code style={{ fontSize: '10px', color: '#AEAEB2', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>border-radius: {r};</code>
                 </div>
               )) : <EmptyState lang={lang} />}
             </div>
          </div>
        )}

        {activeTab === 'shadow' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {items.shadow.length > 0 ? items.shadow.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '120px', background: '#F9F9F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '60px', height: '45px', background: '#FFFFFF', borderRadius: '8px', boxShadow: s, position: 'relative' }}>
                     <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '3px', height: '3px', background: '#FF3B30', borderRadius: '50%' }} />
                     <div style={{ position: 'absolute', top: '-10px', right: '-12px', fontSize: '9px', fontWeight: 800, color: '#FF3B30', whiteSpace: 'nowrap' }}>
                       {lang === 'zh' ? `阴影层级 ${i+1}` : `Shadow ${i+1}`}
                     </div>
                  </div>
                </div>
                <code style={{ fontSize: '10px', color: '#AEAEB2', fontFamily: 'var(--font-mono)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.substring(0, 30)}...</code>
              </div>
            )) : <EmptyState lang={lang} />}
          </div>
        )}

        {activeTab === 'layout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {items.layout.map((l, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '140px', background: '#1D1D1F', borderRadius: '12px', padding: '12px' }}>
                    <LayoutSpecimen type={l} />
                  </div>
                  <TagBadge label={l} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'spacing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ height: '140px', background: '#FFFFFF', border: '1px dashed #E5E5EA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                   <div style={{ width: '40px', height: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '2px' }} />
                   <div style={{ width: '40px', height: '24px', borderTop: '1px solid #FF3B30', borderBottom: '1px solid #FF3B30', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ height: '100%', width: '1px', background: '#FF3B30' }} />
                      <div style={{ position: 'absolute', background: '#FFF', padding: '0 4px', fontSize: '10px', color: '#FF3B30', fontWeight: 700, fontFamily: 'var(--font-mono)', left: '44px', whiteSpace: 'nowrap' }}>
                         {items.spacing[0]?.match(/\d+px/)?.[0] || 'VAR'} GAP
                      </div>
                   </div>
                   <div style={{ width: '40px', height: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '2px' }} />
                </div>
             </div>
             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
               {items.spacing.map((s, i) => <TagBadge key={i} label={s} />)}
             </div>
          </div>
        )}

        {activeTab === 'motion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ height: '140px', background: '#F9F9F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
               <div className="motion-ball" style={{ width: '24px', height: '24px', background: '#1D1D1F', borderRadius: '50%' }} />
               <style jsx>{`
                 @keyframes travel {
                   0%, 100% { transform: translateX(-80px) scale(0.9); opacity: 0.5; }
                   50% { transform: translateX(80px) scale(1.1); opacity: 1; }
                 }
                 .motion-ball {
                   animation: travel 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                 }
               `}</style>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
               {items.motion.map((m, i) => <TagBadge key={i} label={m} theme="dark" />)}
               <code style={{ fontSize: '10px', color: '#AEAEB2', fontFamily: 'var(--font-mono)', marginLeft: '8px' }}>
                 cubic-bezier(0.4, 0, 0.2, 1)
               </code>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LayoutSpecimen({ type }: { type: string }) {
  const norm = type.toLowerCase()
  if (norm.includes('bento') || norm.includes('grid')) {
    return (
      <div style={{ display: 'grid', height: '100%', gridTemplateColumns: '1fr 2fr', gridTemplateRows: '1fr 1fr', gap: '8px' }}>
        <div style={{ gridRow: 'span 2', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }} />
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }} />
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }} />
      </div>
    )
  }
  if (norm.includes('sidebar') || norm.includes('navigate')) {
    return (
      <div style={{ display: 'grid', height: '100%', gridTemplateColumns: '40px 1fr', gap: '8px' }}>
         <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }} />
         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: '24px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
         </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
       <div style={{ height: '32px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
       </div>
    </div>
  )
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
      padding: '4px 12px', 
      background: theme === 'light' ? '#F2F2F7' : '#1D1D1F', 
      color: theme === 'light' ? '#1D1D1F' : '#FFF', 
      borderRadius: '6px', fontSize: '11px', fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      whiteSpace: 'nowrap'
    }}>
      {label}
    </span>
  )
}

function EmptyState({ lang }: { lang: 'zh' | 'en' }) {
  return (
    <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#AEAEB2', fontSize: '13px' }}>
      {lang === 'zh' ? '未提取到该细节' : 'No details detected'}
    </div>
  )
}

