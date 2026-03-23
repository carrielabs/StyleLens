'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Target, Layers, Terminal, Boxes, Zap, MousePointer2, Layout as LayoutIcon, Palette, Type, Box, Sparkles, Code, Info } from 'lucide-react'
import AtomicSandbox from './AtomicSandbox'

interface Hotspot {
  id: string
  label: string
  labelEn: string
  category: 'layout' | 'ui' | 'light' | 'icon' | 'motion' | 'color'
  top: string
  left: string
  width: string
  height: string
  color: string
  insight: string
  expertInsight: string // "Plain language" discovery
  specs: string[]
}

const hotspots: Hotspot[] = [
  // --- 1. Colors (Interactive Palette Mapping) ---
  {
    id: 'color_bg',
    label: '核心背景色 (Core BG)',
    labelEn: 'Core Background Color',
    category: 'color',
    top: '2%', left: '0%', width: '100%', height: '8%',
    color: '#08090A',
    insight: '实测值为 #08090A。这是 Linear 沉浸感的基石。',
    expertInsight: '深度沉浸感：这种接近全黑但不全黑的色值，能极大地减少视觉疲劳，配合 OLED 屏幕能产生无限深邃的质感。',
    specs: ['HEX: #08090A', 'LCH: 3, 1, 250']
  },
  {
    id: 'color_primary',
    label: '品牌主色 (Primary)',
    labelEn: 'Brand Primary Color',
    category: 'color',
    top: '4.8%', left: '18%', width: '12%', height: '2%',
    color: '#5E6AD2',
    insight: 'Indigo #5E6AD2 配合 12px 圆角。',
    expertInsight: '高效引导：高饱和度的靛蓝色在深色背景中极具穿透力，能瞬间抓住用户的操作视觉重心。',
    specs: ['HEX: #5E6AD2', '应用: 主按钮']
  },

  // --- 2. Layout (布局与结构) ---
  {
    id: 'layout_sidebar',
    label: '标准侧边栏 (Sidebar)',
    labelEn: 'Standard Sidebar',
    category: 'layout',
    top: '12.5%', left: '0%', width: '20%', height: '40%',
    color: '#27AE60',
    insight: '实测宽度 240px，使用 #0F1011 背景色。',
    expertInsight: '经典左侧导航：240px 是生产力工具的黄金宽度，既能承载清晰的树状结构，又不会挤占主工作区空间。',
    specs: ['宽度: 240px', '背景: #0F1011', '边框: 0.5px Right']
  },
  {
    id: 'layout_tabs',
    label: '分段视图切换 (Tabs)',
    labelEn: 'Segmented View Toggles',
    category: 'layout',
    top: '13.5%', left: '22%', width: '20%', height: '3.5%',
    color: '#27AE60',
    insight: '使用 Inline 组件，4px 间距。',
    expertInsight: '无缝切换：紧贴标题下方的选项卡设计，减少了鼠标移动距离，符合“高效操作”的产品逻辑。',
    specs: ['间距: 4px Inline', '选中态: 背景加亮']
  },

  // --- 3. UI Items (组件细节) ---
  {
    id: 'ui_icon_spec',
    label: '图标定义规范 (Iconography)',
    labelEn: 'Iconography Standards',
    category: 'ui',
    top: '36.5%', left: '10%', width: '15%', height: '15%',
    color: '#F2C94C',
    insight: 'Linear 专用图标库，实测 1.5px 粗细。',
    expertInsight: '精致线框感：1.5px 的描边比标准的 2px 更纤细，能体现出“精密仪器”般的专业质感。',
    specs: ['笔画粗细: 1.5px', '视觉基准: 20x20px']
  },
  {
    id: 'ui_buttons',
    label: '精英级按钮 (Elite Button)',
    labelEn: 'Elite Button Details',
    category: 'ui',
    top: '4.8%', left: '18%', width: '10%', height: '2%',
    color: '#F2C94C',
    insight: '实测 4px/8px 嵌套圆角。',
    expertInsight: '嵌套美学：按钮圆角通常比卡片圆角小 4px，这种“大套小”的圆角逻辑能让 UI 看起来非常规整。',
    specs: ['圆角: 4px', '高度: 32px']
  },

  // --- 4. Light & Depth (光影与材质) ---
  {
    id: 'material_glass',
    label: '背景模糊材质 (Glass)',
    labelEn: 'Backdrop Blur Material',
    category: 'light',
    top: '58.5%', left: '6%', width: '40%', height: '30%',
    color: '#EB5757',
    insight: '实测 20px 背景模糊 (Backdrop-blur)。',
    expertInsight: '层级深度：通过模糊背景而非单纯变暗，保留了界面的通透感和“空间高度”，让顶层面板更有分量。',
    specs: ['模糊值: 20px', '混合模式: Soft Light']
  },

  // --- 5. Motion (动态交互) ---
  {
    id: 'motion_curve',
    label: '瞬时响应曲线 (Motion)',
    labelEn: 'Instant Response Curve',
    category: 'motion',
    top: '13.5%', left: '22%', width: '5%', height: '3%',
    color: '#BB6BD9',
    insight: '实测 150ms 响应，快速 Bezier。',
    expertInsight: '爆发式体感：起步极快，结尾丝滑，这种动效会让用户觉得软件运行非常轻快，毫无粘涩感。',
    specs: ['时长: 150ms', '曲线: cubic-bezier(0.4, 0, 0.2, 1)']
  }
]

export default function DesignDetailsEliteV3({ data, lang = 'zh', report }: any) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  
  // Interaction Logic: When hovering an ID, scroll the image
  const handleHover = (id: string | null) => {
    setActiveHotspot(id)
    if (!id || !imageContainerRef.current) return

    const hotspot = hotspots.find(h => h.id === id)
    if (hotspot) {
      const topPercent = parseFloat(hotspot.top)
      const containerHeight = imageContainerRef.current.scrollHeight
      const viewportHeight = imageContainerRef.current.clientHeight
      
      const targetScroll = (topPercent / 100) * containerHeight - (viewportHeight / 3)
      imageContainerRef.current.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      })
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(380px, 0.6fr)', gap: '0', background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', height: '90vh' }}>
      
      {/* LEFT: Sticky Viewport */}
      <div 
        ref={imageContainerRef}
        className="no-scrollbar"
        style={{ 
          position: 'relative', 
          overflowY: 'auto', 
          height: '100%', 
          background: '#F2F2F7',
          borderRight: '1px solid rgba(0,0,0,0.08)',
          scrollBehavior: 'smooth'
        }}
      >
        <img 
          src="/linear_homepage.png" 
          alt="Linear DNA Source" 
          style={{ width: '100%', display: 'block', imageRendering: '-webkit-optimize-contrast' }}
        />
        
        {/* Render Hotspots as dynamic overlays */}
        {hotspots.map(h => (
          <div
            key={h.id}
            style={{
              position: 'absolute',
              top: h.top,
              left: h.left,
              width: h.width,
              height: h.height,
              border: activeHotspot === h.id ? `2px solid ${h.color}` : 'none',
              backgroundColor: activeHotspot === h.id ? `${h.color}15` : 'transparent',
              boxShadow: activeHotspot === h.id ? `0 0 40px ${h.color}40` : 'none',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
             {activeHotspot === h.id && (
                <div style={{
                  position: 'absolute',
                  top: '-32px',
                  left: '0',
                  background: h.color,
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {lang === 'zh' ? h.label : h.labelEn}
                </div>
             )}
          </div>
        ))}
      </div>

      {/* RIGHT: Scrollable Specs */}
      <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '32px', position: 'relative', background: '#FFFFFF' }}>
        
        {/* Section 1: Brand DNA Intro */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Sparkles size={24} style={{ color: '#5E6AD2' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
              Linear (上帝视角版)
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: '#86868B', lineHeight: 1.6, marginBottom: '24px' }}>
            {report.summaryZh}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {report.tagsZh.map((tag: string) => (
              <span key={tag} style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: '100px', color: '#86868B', border: '1px solid rgba(0,0,0,0.05)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Section 2: Interactive Palette */}
        <div style={{ marginBottom: '48px' }}>
          <SectionTitle icon={<Palette size={16} />} title="互动色盘 (Interaction Palette)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.colors.map((c: any) => {
              const hotspot = hotspots.find(h => h.id === `color_${c.role}`)
              return (
                <div 
                  key={c.hex} 
                  onMouseEnter={() => handleHover(hotspot?.id || null)}
                  onMouseLeave={() => handleHover(null)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: activeHotspot === hotspot?.id ? 'rgba(0,0,0,0.02)' : 'transparent', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s' 
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: c.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1D1D1F' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#86868B' }}>{c.hex} • {c.role}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 3: Typography Table */}
        <div style={{ marginBottom: '48px' }}>
          <SectionTitle icon={<Type size={16} />} title="排版系统 (Typography)" />
          <div style={{ background: '#FBFBFD', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ color: '#86868B', fontSize: '11px', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>属性</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>参数</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>解读</th>
                 </tr>
               </thead>
               <tbody style={{ fontSize: '12px', color: '#1D1D1F' }}>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '10px 0', color: '#86868B' }}>字体</td>
                    <td>Inter Variable</td>
                    <td style={{ color: '#86868B' }}>官方指定</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '10px 0', color: '#86868B' }}>间距</td>
                    <td>-0.022em</td>
                    <td style={{ color: '#86868B' }}>紧凑型排版</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 0', color: '#86868B' }}>字重</td>
                    <td>590</td>
                    <td style={{ color: '#86868B' }}>非标精英感</td>
                  </tr>
               </tbody>
             </table>
          </div>
        </div>

        {/* Section 4: 5D 实景实验室 */}
        <div style={{ marginBottom: '64px' }}>
          <SectionTitle icon={<Box size={16} />} title="五维实景实验室 (Interactive Lab)" />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {['layout', 'ui', 'light', 'icon', 'motion'].map(cat => {
              const catHotspots = hotspots.filter(h => h.category === cat)
              if (catHotspots.length === 0) return null
              
              const catTitles: any = { layout: '布局与网格', ui: '组件与原子', light: '深度与材质', icon: '图标与肌理', motion: '动态体验' }
              
              return (
                <div key={cat}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '4px' }}>
                    {catTitles[cat]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {catHotspots.map(h => (
                       <div 
                        key={h.id}
                        onMouseEnter={() => handleHover(h.id)}
                        onMouseLeave={() => handleHover(null)}
                        style={{
                          padding: '16px',
                          background: activeHotspot === h.id ? `${h.color}10` : '#FBFBFD',
                          border: `1px solid ${activeHotspot === h.id ? h.color : 'rgba(0,0,0,0.05)'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                       >
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                           <div style={{ width: '4px', height: '14px', background: h.color, borderRadius: '2px' }} />
                           <span style={{ fontSize: '14px', fontWeight: 700, color: '#191919' }}>{lang === 'zh' ? h.label : h.labelEn}</span>
                         </div>
                         <div style={{ fontSize: '12px', color: '#636366', lineHeight: 1.5, marginBottom: '12px' }}>
                           {h.expertInsight}
                         </div>
                         <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                           {h.specs.map(s => (
                             <span key={s} style={{ fontSize: '10px', padding: '2px 6px', background: '#F2F2F7', borderRadius: '4px', color: h.color, border: `1px solid ${h.color}30`, fontWeight: 500 }}>
                               {s}
                             </span>
                           ))}
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 5: Sandbox & Export */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '48px', marginBottom: '48px' }}>
             <SectionTitle icon={<Sparkles size={16} />} title="原子沙盒 (Atomic Sandbox)" />
             <AtomicSandbox report={report} lang={lang} />
        </div>

        <div style={{ marginBottom: '48px' }}>
             <SectionTitle icon={<Code size={16} />} title="代码导出 (V3 Export)" />
             <div style={{ background: '#F2F2F7', padding: '16px', borderRadius: '12px', fontSize: '11px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', lineHeight: 1.6, border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#86868B' }}>/* Linear DNA Tokens */</div>
                <div>--primary: #5E6AD2;</div>
                <div>--bg: #08090A;</div>
                <div>--radius-btn: 4px;</div>
                <div>--motion-fast: cubic-bezier(0.4, 0, 0.2, 1);</div>
             </div>
        </div>

      </div>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
      <div style={{ color: '#636366' }}>{icon}</div>
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#E5E5EA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
    </div>
  )
}
