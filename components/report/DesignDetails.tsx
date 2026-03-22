'use client'

import React, { useState } from 'react'
import type { DesignDetails as DetailsType } from '@/lib/types'

type TabKey = 'radius' | 'shadow' | 'layout' | 'spacing' | 'motion'

export default function DesignDetails({ data, lang, fullWidth = false }: { data: DetailsType, lang: 'zh' | 'en', fullWidth?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabKey>('radius')

  const t = {
    radius: lang === 'zh' ? '边框圆角' : 'Border Radius',
    shadow: lang === 'zh' ? '阴影层级' : 'Drop Shadows',
    layout: lang === 'zh' ? '布局网格' : 'Layout Structure',
    spacing: lang === 'zh' ? '空间配比' : 'Spacing System',
    motion: lang === 'zh' ? '动效偏好' : 'Motion Rhythm'
  }

  const tabs: { key: TabKey, label: string }[] = [
    { key: 'radius', label: t.radius },
    { key: 'shadow', label: t.shadow },
    { key: 'layout', label: t.layout },
    { key: 'spacing', label: t.spacing },
    { key: 'motion', label: t.motion },
  ]

  // Parsing multi-variants
  const parse = (val?: string) => val ? val.split('|').map(s => s.trim()).filter(Boolean) : []
  
  const items = {
    radius: parse(data.cssRadius),
    shadow: parse(data.cssShadow),
    layout: lang === 'zh' ? parse(data.layoutZh || data.layoutEn) : parse(data.layoutEn || data.layoutZh),
    spacing: lang === 'zh' ? parse(data.spacingZh || data.spacingEn) : parse(data.spacingEn || data.spacingZh),
    motion: lang === 'zh' ? parse(data.motionZh || data.motionEn) : parse(data.motionEn || data.motionZh)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Segmented Control (Tabs) */}
      <div style={{ 
        display: 'flex', background: '#F2F2F7', padding: '4px', borderRadius: '12px',
        width: fullWidth ? 'fit-content' : '100%', overflowX: 'auto'
      }} className="no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 400,
              backgroundColor: activeTab === tab.key ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.key ? '#1D1D1F' : '#8E8E93',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Content Area */}
      <div style={{ 
        minHeight: '280px', background: '#FFFFFF', borderRadius: '20px', 
        border: '1px solid rgba(0,0,0,0.06)', padding: '32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.02)'
      }}>
        {activeTab === 'radius' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
             <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
               {items.radius.length > 0 ? items.radius.map((r, i) => (
                 <div key={i} style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ height: '140px', background: '#F8F8F8', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                       <div style={{ width: '80px', height: '60px', background: '#1D1D1F', borderRadius: r, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <RedlineLabel value={r} position="top-right" />
                       </div>
                    </div>
                    <code style={{ fontSize: '11px', color: '#8E8E93', fontFamily: 'var(--font-mono)' }}>border-radius: {r};</code>
                 </div>
               )) : <EmptyState lang={lang} />}
             </div>
          </div>
        )}

        {activeTab === 'shadow' && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {items.shadow.length > 0 ? items.shadow.map((s, i) => (
              <div key={i} style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ height: '140px', background: '#F8F8F8', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '80px', height: '60px', background: '#FFFFFF', borderRadius: '12px', boxShadow: s, position: 'relative' }}>
                     <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '4px', background: '#FF3B30', borderRadius: '50%' }} />
                  </div>
                </div>
                <code style={{ fontSize: '11px', color: '#8E8E93', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>box-shadow: {s.substring(0, 30)}...</code>
              </div>
            )) : <EmptyState lang={lang} />}
          </div>
        )}

        {activeTab === 'layout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ height: '160px', background: '#1D1D1F', borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr', gridTemplateRows: '1fr 1fr', gap: '12px' }}>
               <div style={{ gridRow: 'span 2', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }} />
               <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }} />
               <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {items.layout.map((l, i) => (
                <span key={i} style={{ padding: '4px 12px', background: '#F2F2F7', borderRadius: '6px', fontSize: '12px', color: '#1D1D1F', fontWeight: 500 }}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'spacing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
             <div style={{ height: '140px', background: '#FFFFFF', border: '1px solid #F2F2F7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                   <div style={{ width: '60px', height: '16px', background: '#F2F2F7', borderRadius: '4px' }} />
                   <div style={{ width: '60px', height: '24px', borderLeft: '1px solid #FF3B30', borderRight: '1px solid #FF3B30', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '100%', height: '1px', background: '#FF3B30' }} />
                      <div style={{ position: 'absolute', background: '#FFF', padding: '0 4px', fontSize: '10px', color: '#FF3B30', fontWeight: 700 }}>
                        {data.spacingSystem?.match(/\d+px/)?.[0] || 'VAR'}
                      </div>
                   </div>
                   <div style={{ width: '60px', height: '16px', background: '#F2F2F7', borderRadius: '4px' }} />
                </div>
             </div>
             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
               {items.spacing.map((s, i) => (
                 <span key={i} style={{ padding: '4px 12px', background: '#F2F2F7', borderRadius: '6px', fontSize: '12px', color: '#1D1D1F', fontWeight: 500 }}>{s}</span>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'motion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ height: '140px', background: '#F2F2F7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
               <div className="motion-ball" style={{ width: '32px', height: '32px', background: '#1D1D1F', borderRadius: '50%' }} />
               <style jsx>{`
                 @keyframes travel {
                   0%, 100% { transform: translateX(-60px) scale(1); opacity: 0.6; }
                   50% { transform: translateX(60px) scale(1.2); opacity: 1; }
                 }
                 .motion-ball {
                   animation: travel 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                 }
               `}</style>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
               {items.motion.map((m, i) => (
                 <span key={i} style={{ padding: '4px 12px', background: '#1D1D1F', color: '#FFF', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>{m}</span>
               ))}
               <code style={{ display: 'block', width: '100%', marginTop: '8px', fontSize: '11px', color: '#8E8E93', borderTop: '1px solid #F2F2F7', paddingTop: '12px' }}>
                 cubic-bezier(0.4, 0, 0.2, 1)
               </code>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RedlineLabel({ value, position }: { value: string, position: 'top-right' | 'bottom-left' }) {
  return (
    <div style={{ 
      position: 'absolute', 
      top: position === 'top-right' ? '-8px' : 'auto',
      bottom: position === 'bottom-left' ? '-8px' : 'auto',
      right: position === 'top-right' ? '-8px' : 'auto',
      left: position === 'bottom-left' ? '-8px' : 'auto',
      background: '#FF3B30', color: '#FFF', fontSize: '9px', 
      padding: '2px 4px', borderRadius: '3px', fontWeight: 700, 
      fontFamily: 'var(--font-mono)', zIndex: 1,
      boxShadow: '0 2px 4px rgba(255,59,48,0.3)'
    }}>
      {value}
    </div>
  )
}

function EmptyState({ lang }: { lang: 'zh' | 'en' }) {
  return (
    <div style={{ width: '100%', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93', fontSize: '13px' }}>
      {lang === 'zh' ? '未提取到相关变体' : 'No variants detected'}
    </div>
  )
}

