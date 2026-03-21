'use client'

import type { DesignDetails as DetailsType } from '@/lib/types'

export default function DesignDetails({ data, lang }: { data: DetailsType, lang: 'zh' | 'en' }) {
  const getShortTag = (keyEn: keyof DetailsType, keyZh: keyof DetailsType, fallback: string) => {
    const tag = lang === 'en' ? data[keyEn] : data[keyZh]
    // If we only have the old paragraph fallback, clamp it severely in the UI later
    return tag || (lang === 'zh' ? '缺失精确数据' : 'Missing strict data')
  }

  const radiuses = data.cssRadius ? data.cssRadius.split('|').map(s => s.trim()).filter(Boolean) : []
  const shadows = data.cssShadow ? data.cssShadow.split('|').map(s => s.trim()).filter(Boolean) : []

  const fields = [
    { key: lang === 'zh' ? '布局网格 LAYOUT' : 'LAYOUT', value: getShortTag('layoutEn', 'layoutZh', data.layoutStructure) },
    { key: lang === 'zh' ? '空间配比 SPACING' : 'SPACING', value: getShortTag('spacingEn', 'spacingZh', data.spacingSystem) },
    { key: lang === 'zh' ? '动效偏好 MOTION' : 'MOTION', value: getShortTag('motionEn', 'motionZh', data.animationTendency) }
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
      
      {/* Visual Radius Card */}
      {radiuses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
               {lang === 'zh' ? '边框圆角 RADIUS' : 'Border Radius'}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {radiuses.map((radius, i) => (
              <div key={i} style={{ flex: 1, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
                 <div style={{ height: '40px', width: '80px', background: 'var(--text-primary)', borderRadius: radius, color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {radius}
                 </div>
                 {/* Explicit value display */}
                 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{radius}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Shadow Card */}
      {shadows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
               {lang === 'zh' ? '阴影层级 SHADOWS' : 'Drop Shadows'}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {shadows.map((shadow, i) => (
              <div key={i} style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', background: '#FAFAFA', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '32px 16px 20px 16px' }}>
                 <div style={{ width: '80px', height: '80px', background: '#FFFFFF', borderRadius: '16px', boxShadow: shadow }} />
                 {/* Explicit CSS */}
                 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textAlign: 'center', maxWidth: '100%', wordBreak: 'break-all' }}>
                   {shadow}
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fields.map((f, i) => {
        return (
          <div key={i} style={{ 
            display: 'flex', flexDirection: 'column', gap: '16px', 
            background: 'var(--bg-elevated)', borderRadius: '12px', padding: '16px',
            border: '1px solid rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {f.key}
              </span>
            </div>
            
            {/* Visual Center Metric Box */}
            <div style={{ 
              height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-subtle)',
              padding: '16px', textAlign: 'center'
            }}>
              <span style={{ 
                fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                 {f.value}
              </span>
            </div>
            
          </div>
        )
      })}
    </div>
  )
}
