'use client'

import type { DesignDetails as DetailsType } from '@/lib/types'

export default function DesignDetails({ data, lang, fullWidth = false }: { data: DetailsType, lang: 'zh' | 'en', fullWidth?: boolean }) {
  const t = {
    radius: lang === 'zh' ? '边框圆角 RADIUS' : 'Border Radius',
    shadow: lang === 'zh' ? '阴影层级 SHADOWS' : 'Drop Shadows',
    layout: lang === 'zh' ? '布局网格 LAYOUT' : 'Layout Structure',
    spacing: lang === 'zh' ? '空间配比 SPACING' : 'Spacing System',
    motion: lang === 'zh' ? '动效偏好 MOTION' : 'Motion Rhythm'
  }

  const radiuses = data.cssRadius ? data.cssRadius.split('|').map(s => s.trim()).filter(Boolean) : []
  const shadows = data.cssShadow ? data.cssShadow.split('|').map(s => s.trim()).filter(Boolean) : []

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: fullWidth ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', 
      gap: '20px' 
    }}>
      
      {/* 1. Radius Specimen Gallery */}
      {radiuses.length > 0 && (
        <SpecimenCard title={t.radius} code={`border-radius: ${radiuses.join(' | ')};`}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {radiuses.map((radius, i) => (
              <div key={i} style={{ 
                flex: 1, minWidth: '120px', position: 'relative', height: '100px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                background: '#F2F2F7', borderRadius: '12px', overflow: 'hidden' 
              }}>
                <div style={{ 
                  width: '60px', height: '40px', background: '#1D1D1F', 
                  borderRadius: radius, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}>
                  {/* Redline Label */}
                  <div style={{ 
                    position: 'absolute', top: '-8px', right: '-8px', 
                    background: '#FF3B30', color: '#FFF', fontSize: '9px', 
                    padding: '2px 4px', borderRadius: '3px', fontWeight: 700, fontFamily: 'var(--font-mono)' 
                  }}>
                    {radius}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SpecimenCard>
      )}

      {/* 2. Shadow Elevation Gallery */}
      {shadows.length > 0 && (
        <SpecimenCard title={t.shadow} code={`box-shadow: ${shadows[0].substring(0, 20)}...;`}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {shadows.map((shadow, i) => (
              <div key={i} style={{ 
                flex: 1, minWidth: '140px', height: '100px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                background: '#F8F8F8', borderRadius: '12px', position: 'relative' 
              }}>
                <div style={{ 
                  width: '60px', height: '40px', background: '#FFF', 
                  borderRadius: '6px', boxShadow: shadow, position: 'relative' 
                }}>
                   <div style={{ 
                     position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                     width: '4px', height: '4px', background: '#FF3B30', borderRadius: '50%' 
                   }} />
                </div>
              </div>
            ))}
          </div>
        </SpecimenCard>
      )}

      {/* 3. Layout Blueprint */}
      <SpecimenCard title={t.layout} code={data.layoutStructure}>
        <div style={{ position: 'relative', height: '100px', background: '#1D1D1F', borderRadius: '12px', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gridTemplateRows: '1fr 1fr', gap: '6px', opacity: 0.9 }}>
          <div style={{ gridRow: 'span 2', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }} />
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }} />
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }} />
        </div>
      </SpecimenCard>

      {/* 4. Spacing Redlines */}
      <SpecimenCard title={t.spacing} code={data.spacingSystem}>
        <div style={{ height: '100px', background: '#FFF', border: '1px solid rgba(0,0,0,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ width: '80px', height: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '3px' }} />
          <div style={{ width: '80px', height: '16px', borderLeft: '1px solid #FF3B30', borderRight: '1px solid #FF3B30', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '1px', background: '#FF3B30' }} />
            <div style={{ position: 'absolute', background: '#FFF', padding: '0 4px', fontSize: '9px', color: '#FF3B30', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {data.spacingSystem?.match(/\d+px/)?.[0] || 'VAR'}
            </div>
          </div>
          <div style={{ width: '80px', height: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '3px' }} />
        </div>
      </SpecimenCard>

      {/* 5. Motion Curve */}
      <SpecimenCard title={t.motion} code={data.animationTendency}>
        <div style={{ position: 'relative', height: '100px', background: '#F2F2F7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div className="motion-specimen" style={{ width: '30px', height: '30px', background: '#1D1D1F', borderRadius: '8px' }} />
          <style jsx>{`
            @keyframes slide {
              0%, 100% { transform: scale(1) translateX(-25px); opacity: 0.5; }
              50% { transform: scale(1.1) translateX(25px); opacity: 1; }
            }
            .motion-specimen {
              animation: slide 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
          `}</style>
        </div>
      </SpecimenCard>
    </div>
  )
}

function SpecimenCard({ title, code, children }: { title: string, code: string, children: React.ReactNode }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', gap: '14px', 
      background: '#FFFFFF', borderRadius: '16px', padding: '16px',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
      <div style={{ 
        marginTop: '4px', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', 
        borderRadius: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)', 
        color: '#8E8E93', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
      }}>
        {code}
      </div>
    </div>
  )
}

