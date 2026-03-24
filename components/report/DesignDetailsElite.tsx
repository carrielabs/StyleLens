'use client'

import React, { useState } from 'react'
import type { DesignDetails as DetailsType, PageStyleAnalysis } from '@/lib/types'
import { 
  Maximize2, Ruler, Box, Layers, Play, Sparkles, 
  MousePointer2, Command, Layout, Aperture, Info
} from 'lucide-react'

type TabKey = 'layout' | 'shape' | 'effects' | 'motion' | 'signature'

export default function DesignDetailsElite({
  data,
  lang
}: {
  data: DetailsType
  analysis?: PageStyleAnalysis
  sourceType: 'image' | 'url'
  lang: 'zh' | 'en'
  fullWidth?: boolean
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('layout')

  const t = {
    layout: lang === 'zh' ? '布局与容器' : 'Layout & Containers',
    shape: lang === 'zh' ? '形状与材质' : 'Shape & Materials',
    effects: lang === 'zh' ? '光影与深度' : 'Effects & Depth',
    motion: lang === 'zh' ? '交互与流转' : 'Interaction & Flow',
    signature: lang === 'zh' ? '品牌特征' : 'Brand Signature'
  }

  const tabs: { key: TabKey, label: string }[] = [
    { key: 'layout', label: t.layout },
    { key: 'shape', label: t.shape },
    { key: 'effects', label: t.effects },
    { key: 'motion', label: t.motion },
    { key: 'signature', label: t.signature },
  ]

  const parse = (val?: string) => val ? val.split('|').map(s => s.trim()).filter(Boolean) : []
  
  const items = {
    layout: parse(lang === 'zh' ? data.layoutZh : data.layoutEn),
    radius: parse(data.cssRadius),
    stroke: parse(data.cssStroke),
    shadow: parse(data.cssShadow),
    motion: parse(lang === 'zh' ? data.motionZh : data.motionEn),
    spacing: parse(lang === 'zh' ? data.spacingZh : data.spacingEn),
    icon: parse(lang === 'zh' ? data.iconZh : data.iconEn),
    signature: parse(lang === 'zh' ? data.signatureZh : data.signatureEn)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Professional Tab Switcher */}
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
              fontSize: '13px', fontWeight: activeTab === tab.key ? 700 : 500,
              background: 'none',
              color: activeTab === tab.key ? '#1D1D1F' : '#AEAEB2',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap', position: 'relative',
              fontFamily: 'var(--font-sans)',
              letterSpacing: activeTab === tab.key ? '-0.01em' : '0'
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', background: '#5E6AD2', borderRadius: '1px' }} />
            )}
          </button>
        ))}
      </div>

      {/* 2. Laboratory Workspace */}
      <div style={{ 
        minHeight: '480px', background: '#FFFFFF', borderRadius: '24px', 
        border: '1px solid rgba(0,0,0,0.05)', padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Lab Background Grid Decay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '16px 16px', pointerEvents: 'none', opacity: 0.3 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {activeTab === 'layout' && <DimensionLayout items={items.layout} spacing={items.spacing} lang={lang} />}
          {activeTab === 'shape' && <DimensionShape items={items.radius} strokes={items.stroke} lang={lang} />}
          {activeTab === 'effects' && <DimensionEffects items={items.shadow} lang={lang} />}
          {activeTab === 'motion' && <DimensionMotion items={items.motion} lang={lang} />}
          {activeTab === 'signature' && <DimensionSignature items={items.signature} icon={items.icon} lang={lang} />}
        </div>
      </div>
    </div>
  )
}

/**
 * DIMENSION 1: Layout & Containers
 * Shows structural skeletons with CAD-style rulers and redlines
 */
function DimensionLayout({ items, spacing, lang }: { items: string[], spacing: string[], lang: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
         {items.map((item, i) => (
           <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                height: '180px', background: '#0F1011', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
                padding: '20px', position: 'relative', overflow: 'hidden'
              }}>
                <MiniSkeleton type={item} />
                {/* Visual Rulers overlay */}
                <div style={{ position: 'absolute', top: '10px', left: '20px', right: '20px', height: '1px', background: 'rgba(255, 59, 48, 0.3)', borderLeft: '1px solid #FF3B30', borderRight: '1px solid #FF3B30' }} />
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#FF3B30', scale: '0.8' }}>W: MAX</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layout size={12} color="#8E8E93" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1D1D1F' }}>{item}</span>
              </div>
           </div>
         ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
         <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
           {lang === 'zh' ? '空间配比 (Spacing System)' : 'Spacing System'}
         </h4>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           {spacing.map((s, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#FF3B30' }}>
                  {s.split(' ')[0]}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.05)', position: 'relative', minWidth: '100px' }}>
                   <div style={{ position: 'absolute', top: '-4px', left: 0, width: s.split(' ')[0], height: '8px', background: '#FF3B30', opacity: 0.1, borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#8E8E93', whiteSpace: 'nowrap' }}>{s.split('(')[1]?.replace(')', '') || 'Token'}</div>
             </div>
           ))}
         </div>
      </div>
    </div>
  )
}

function MiniSkeleton({ type }: { type: string }) {
  const t = type.toLowerCase()
  if (t.includes('sidebar')) {
    return (
      <div style={{ display: 'flex', height: '100%', gap: '12px' }}>
        <div style={{ width: '40px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} />
      </div>
    )
  }
  if (t.includes('pane') || t.includes('grid')) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', height: '100%', gap: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} />
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} />
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      <div style={{ height: '24px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', width: '60%' }} />
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} />
    </div>
  )
}

/**
 * DIMENSION 2: Shape & Materials
 * Shows Radius and Stroke in the context of core components
 */
function DimensionShape({ items, strokes, lang }: { items: string[], strokes: string[], lang: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'zh' ? '组件实战展示 (Sample Atoms)' : 'Component Specimens'}
            </h4>
            <div style={{ 
              background: '#F9F9FB', border: '1px solid rgba(0,0,0,0.03)', borderRadius: '20px', padding: '40px',
              display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center'
            }}>
               {/* Specimen 1: Button */}
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    padding: '8px 24px', background: '#0F1011', color: '#FFF', borderRadius: '4px',
                    fontSize: '13px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                    position: 'relative'
                  }}>
                    Button
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', borderTop: '1px solid #FF3B30', borderRight: '1px solid #FF3B30', borderRadius: '4px' }} />
                    <div style={{ position: 'absolute', top: '-24px', right: '-18px', fontSize: '9px', fontWeight: 800, color: '#FF3B30' }}>R4</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#8E8E93' }}>0.5px Border</span>
               </div>
               {/* Specimen 2: Input */}
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '140px', height: '36px', background: '#F2F2F7', border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '6px', fontSize: '12px', color: '#8E8E93', display: 'flex', alignItems: 'center', padding: '0 12px',
                    position: 'relative'
                  }}>
                    Input field...
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', borderTop: '1px solid #FF3B30', borderRight: '1px solid #FF3B30', borderRadius: '6px' }} />
                    <div style={{ position: 'absolute', top: '-24px', right: '-18px', fontSize: '9px', fontWeight: 800, color: '#FF3B30' }}>R6</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#8E8E93' }}>1px Border</span>
               </div>
            </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Aperture size={16} color="#1D1D1F" />
               <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>{lang === 'zh' ? '描边细则 (Stroke Specs)' : 'Stroke Specs'}</h4>
            </div>
            {strokes.map((s, i) => (
              <div key={i} style={{ padding: '12px', background: '#F9F9FB', borderRadius: '10px', fontSize: '12px', color: '#1D1D1F', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(0,0,0,0.02)' }}>
                <code style={{ fontFamily: 'var(--font-mono)' }}>{s.split('(')[0]}</code>
                <span style={{ color: '#8E8E93' }}>{s.split('(')[1]?.replace(')', '')}</span>
              </div>
            ))}
         </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>{lang === 'zh' ? '全域圆角阶梯' : 'Radius Scale'}</h4>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '48px', height: '48px', background: '#1D1D1F', borderRadius: r.split(' ')[0] }} />
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.split(' ')[0]}</div>
                    <div style={{ fontSize: '11px', color: '#8E8E93' }}>{r.split('(')[1]?.replace(')', '')}</div>
                 </div>
              </div>
            ))}
         </div>
         <div style={{ padding: '16px', borderRadius: '12px', background: '#FFF7F7', border: '1px solid #FFEBEB', fontSize: '12px', color: '#FF3B30', lineHeight: 1.5 }}>
            <Info size={14} style={{ marginBottom: '4px' }} />
            <br />
            {lang === 'zh' ? 'Linear 极少使用 8px 以上圆角给按钮，大部分交互原子严格锁死在 4px-6px。' : 'Linear rarely uses >8px radius for buttons; atomic elements are strictly locked at 4px-6px.'}
         </div>
      </div>
    </div>
  )
}

/**
 * DIMENSION 3: Effects & Depth
 * Shows Z-Axis layer stack with interactive hover mapping
 */
function DimensionEffects({ items, lang }: { items: string[], lang: string }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) 300px', gap: '60px', alignItems: 'center' }}>
      {/* 3D Exploded View */}
      <div style={{ perspective: '1200px', height: '360px', position: 'relative' }}>
         {items.map((s, i) => {
           const isActive = hoverIdx === i
           return (
             <div 
               key={i}
               onMouseEnter={() => setHoverIdx(i)}
               onMouseLeave={() => setHoverIdx(null)}
               style={{
                position: 'absolute',
                top: `${(i * 45)}px`, left: `${(i * 30)}px`,
                width: '320px', height: '160px',
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: s.split('(')[0], 
                border: isActive ? '1.5px solid #5E6AD2' : '0.5px solid rgba(0,0,0,0.04)',
                transform: `rotateX(55deg) rotateZ(-25deg) translateY(${isActive ? '-20px' : '0'})`,
                zIndex: i,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', alignItems: 'flex-end', padding: '16px',
                cursor: 'pointer'
               }}
             >
                <div style={{ fontSize: '10px', color: isActive ? '#5E6AD2' : '#AEAEB2', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Elevation L{i+1}
                </div>
             </div>
           )
         })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} color="#1D1D1F" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{lang === 'zh' ? '光影系统 (Light & Depth)' : 'Elevation Scale'}</h4>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((s, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ 
                  padding: '16px', borderRadius: '12px', background: hoverIdx === i ? '#F2F2F7' : 'transparent',
                  border: `1px solid ${hoverIdx === i ? 'rgba(94,106,210,0.1)' : 'transparent'}`,
                  transition: 'all 0.2s ease'
                }}
              >
                 <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D1D1F', marginBottom: '4px' }}>
                    {s.split('(')[1]?.replace(')', '') || `Layer ${i+1}`}
                 </div>
                 <code style={{ fontSize: '9px', color: '#8E8E93', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>{s.split('(')[0].slice(0, 40)}...</code>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}

/**
 * DIMENSION 4: Interaction & Flow
 * Shows Bezier Curves and an interactive component demonstrating the 'soul'
 */
function DimensionMotion({ items, lang }: { items: string[], lang: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  const handleTrigger = () => {
    setIsPlaying(false)
    setTimeout(() => setIsPlaying(true), 10)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', gap: '60px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <div style={{ position: 'relative', height: '280px', background: '#0F1011', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            {/* Interactive Object: A task list item expansion simulator */}
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {[1, 2, 3].map(id => (
                 <div key={id} style={{ 
                    padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    transform: isPlaying ? 'translateX(0)' : 'translateX(-100px)',
                    opacity: isPlaying ? 1 : 0,
                    transition: `all 150ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    transitionDelay: `${id * 40}ms`,
                    display: 'flex', alignItems: 'center', gap: '12px'
                 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px solid rgba(255,255,255,0.4)' }} />
                    <div style={{ width: '120px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                 </div>
               ))}
               <button 
                  onClick={handleTrigger}
                  style={{ 
                    marginTop: '20px', padding: '10px 20px', background: '#5E6AD2', color: '#FFF', 
                    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(94,106,210,0.3)', width: 'fit-content',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
               >
                 <Play size={14} fill="currentColor" /> {lang === 'zh' ? '模拟列表展开' : 'Simulate Reveal'}
               </button>
            </div>
         </div>

         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {items.map((m, i) => (
              <div key={i} style={{ padding: '6px 12px', background: '#F2F2F7', borderRadius: '6px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {m}
              </div>
            ))}
         </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
         <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase' }}>{lang === 'zh' ? '爆发力加速度曲线' : 'The Momentum Curve'}</h4>
         <div style={{ height: '180px', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px', position: 'relative', background: '#FFF' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
               <path d="M 0 100 C 40 100, 20 0, 100 0" fill="none" stroke="#5E6AD2" strokeWidth="4" />
               <circle cx="0" cy="100" r="4" fill="#5E6AD2" />
               <circle cx="100" cy="0" r="4" fill="#5E6AD2" />
            </svg>
            <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', fontWeight: 700, color: '#AEAEB2' }}>Snappy Ease-Out</div>
         </div>
         <p style={{ fontSize: '12px', color: '#8E8E93', lineHeight: 1.6 }}>
            {lang === 'zh' 
              ? 'Linear 的交互灵魂在于“爆发力”。它的瞬时响应（150ms）配合这条极陡的贝塞尔曲线，创造了类似精密机械开关的手感。' 
              : 'Linear\'s interaction soul is "Momentum". Its snappy 150ms duration paired with this steep curve creates a high-performance mechanical switch feeling.'}
         </p>
      </div>
    </div>
  )
}

/**
 * DIMENSION 5: Brand Signature
 * Unique elements like Icons, Noise, Gradients
 */
function DimensionSignature({ items, icon, lang }: { items: string[], icon: string[], lang: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 400px', gap: '60px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>{lang === 'zh' ? '图标基因 (Iconography DNA)' : 'Iconography DNA'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
               {[Command, Aperture, Maximize2, MousePointer2].map((Icon, i) => (
                 <div key={i} style={{ height: '80px', background: '#F9F9FB', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} strokeWidth={1.5} color="#5E6AD2" />
                 </div>
               ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
               {icon.map((t, i) => (
                 <span key={i} style={{ padding: '6px 12px', background: '#F2F2F7', color: '#1D1D1F', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                   {t}
                 </span>
               ))}
            </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>{lang === 'zh' ? '品牌标记 (Signatures)' : 'Key Signatures'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
               {items.map((sig, i) => (
                 <div key={i} style={{ padding: '16px', background: '#F9F9FB', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="#5E6AD2" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1D1D1F' }}>{sig}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Signature Texture Demonstration */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
         <div style={{ 
            height: '240px', background: '#0F1011', borderRadius: '24px', position: 'relative', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")', opacity: 0.15 }} />
            <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(94,106,210,0.15) 0%, transparent 70%)' }} />
            
            <div style={{ 
              zIndex: 1, padding: '24px', background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(32px)', 
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '70%', height: '60%'
            }}>
               <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '20px' }} />
               <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
               <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '20px' }}>Signature Background Texture Showcase</p>
            </div>
         </div>
         <div style={{ fontSize: '11px', color: '#8E8E93', textAlign: 'center' }}>
           {lang === 'zh' ? 'Linear 的高级感来源于背景中细微的噪点与低频的 LCH 渐变。' : 'Linear\'s premium aura stems from subtle BG noise and low-frequency LCH gradients.'}
         </div>
      </div>
    </div>
  )
}
