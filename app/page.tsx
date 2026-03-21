'use client'

import { useState, useEffect } from 'react'
import ImageUploader from '@/components/extractor/ImageUploader'
import UrlInput from '@/components/extractor/UrlInput'
import StyleReportView from '@/components/report/StyleReport'
import ColorHighlighter from '@/components/report/ColorHighlighter'
import type { StyleReport } from '@/lib/types'
import Link from 'next/link'

export default function Home() {
  const [isExtracting, setIsExtracting] = useState(false)
  const [report, setReport] = useState<StyleReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('')
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const [reportLang, setReportLang] = useState<'zh'|'en'>('zh')
  const [hoveredHex, setHoveredHex] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'url' | 'image'>('url')

  // Listen to color swatch hovers for canvas highlighting
  useEffect(() => {
    const handleColorHover = (e: any) => setHoveredHex(e.detail)
    window.addEventListener('color-hover', handleColorHover)
    return () => window.removeEventListener('color-hover', handleColorHover)
  }, [])

  const handleExtractionSuccess = (result: StyleReport) => {
    setReport(result)
    setIsExtracting(false)
    setStatusText('')
    setError(null)
  }

  const handleExtractionError = (err: string) => {
    setError(err)
    setIsExtracting(false)
    setStatusText('')
  }

  const startExtraction = (text: string) => {
    setIsExtracting(true)
    setStatusText(text)
    setReport(null)
    setError(null)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
      {/* Lightbox Overlay */}
      {lightboxImg && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(4px)' }}
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }} alt="Zoomed Graphic" />
        </div>
      )}

      {/* Editorial Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: '80px',
        borderBottom: 'none'
      }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, fontStyle: 'italic',
          letterSpacing: '0.02em', color: 'var(--text-primary)'
        }}>
          StyleLens
        </div>
        <div style={{ display: 'flex', gap: '40px', fontSize: '14px', fontWeight: 500, letterSpacing: '0.04em' }}>
          <a href="/" className="nav-link" style={{ color: 'var(--text-primary)', paddingBottom: '4px', borderBottom: '1px solid var(--text-primary)' }}>提取中心</a>
          <a href="/library" className="nav-link" style={{ color: 'var(--text-secondary)' }}>分析记录</a>
        </div>
        <Link href="/auth" style={{ fontSize: '13px', color: 'var(--text-inverse)', background: 'var(--text-primary)', padding: '8px 20px', borderRadius: '100px', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.04em', border: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          登录
        </Link>
      </nav>

      {/* Main Studio Canvas - True Dribbble Asymmetric Layout */}
      <main style={{ 
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '0 64px 80px', maxWidth: '1440px', margin: '0 auto', gap: '80px', width: '100%',
        flexWrap: 'wrap'
      }}>
        
        {/* Left: Interactive Input Zone */}
        <div style={{ flex: 1, minWidth: '400px', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <div>
            <h1 style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
              fontSize: '72px', fontWeight: 900,
              color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.04em', lineHeight: 1.05
            }}>
              解构全球顶级<br/>设计资产
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, letterSpacing: '0.01em', fontWeight: 500 }}>
              输入网页链接或拖拽设计图，系统将极其精准地逆向工程并解析其深层色彩与排版体系。
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <button 
                onClick={() => setInputMode('url')}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: '15px', fontWeight: inputMode === 'url' ? 700 : 500, color: inputMode === 'url' ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer', position: 'relative' }}
              >
                🌐 网页解析
                {inputMode === 'url' && <div style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '2px', background: 'var(--text-primary)' }} />}
              </button>
              <button 
                onClick={() => setInputMode('image')}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: '15px', fontWeight: inputMode === 'image' ? 700 : 500, color: inputMode === 'image' ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer', position: 'relative' }}
              >
                🖼️ 图像解析
                {inputMode === 'image' && <div style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '2px', background: 'var(--text-primary)' }} />}
              </button>
            </div>

            {/* Dynamic Input Area */}
            {inputMode === 'url' ? (
              <>
                <UrlInput
                  onStart={() => startExtraction('正在解析网页链路，重构设计树 (约需 15 秒)...')}
                  onSuccess={handleExtractionSuccess}
                  onError={handleExtractionError}
                  disabled={isExtracting}
                />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '-8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Popular:</span>
                  <span style={{ padding: '6px 16px', borderRadius: '100px', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>dashboard</span>
                  <span style={{ padding: '6px 16px', borderRadius: '100px', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>landing page</span>
                  <span style={{ padding: '6px 16px', borderRadius: '100px', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>e-commerce</span>
                </div>
              </>
            ) : (
              <ImageUploader 
                onStart={() => startExtraction('正在深入像素层，提取全局排版规范与色彩矩阵...')}
                onSuccess={handleExtractionSuccess}
                onError={handleExtractionError}
                disabled={isExtracting}
              />
            )}
          </div>

          {error && (
            <div style={{ padding: '14px 20px', background: '#FDF7F7', borderRadius: '12px', color: 'var(--error)', fontSize: '14px', border: '1px solid var(--error)', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {isExtracting && (
             <div style={{ animation: 'fadeIn 0.3s' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 500, letterSpacing: '0.02em' }}>{statusText}</p>
                <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', position: 'relative', overflow: 'hidden', borderRadius: '100px' }}>
                   <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '30%', background: 'var(--text-primary)', animation: 'slideRight 1.5s infinite ease-in-out', borderRadius: '100px' }} />
                </div>
             </div>
          )}
        </div>

        {/* Right: Massive Dark-Mode Hero Graphic */}
        <div style={{ flex: 1, minWidth: '500px', display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <div style={{
            width: '100%', maxWidth: '720px', height: '540px',
            background: '#0d0c22',
            borderRadius: '32px',
            boxShadow: '0 32px 64px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ width: '300px', height: '300px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF7B93 0%, #FF8D5C 100%)', filter: 'blur(100px)', opacity: 0.15, position: 'absolute', top: '-50px', right: '-50px' }} />
            <div style={{ width: '400px', height: '400px', borderRadius: '50%', background: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)', filter: 'blur(120px)', opacity: 0.15, position: 'absolute', bottom: '-100px', left: '-100px' }} />
            
            <div style={{ width: '80%', height: '80%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', padding: '40px', gap: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #EA4C89 0%, #FF7B93 100%)' }} />
                 <div>
                   <div style={{ width: '120px', height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', marginBottom: '8px' }} />
                   <div style={{ width: '80px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px' }} />
                 </div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }} />
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, height: '48px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
                <div style={{ flex: 1, height: '48px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
                <div style={{ flex: 1, height: '48px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Gallery Modal Overlay */}
      {report && !isExtracting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(250, 249, 246, 0.85)',
          backdropFilter: 'blur(24px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px',
          animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Modal Card */}
          <div style={{
            background: 'var(--bg-surface)',
            width: '100%', maxWidth: '1440px', height: '100%', maxHeight: '920px',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            border: 'none',
            position: 'relative'
          }}>
             {/* Floating Close Button & Global Toggle */}
             <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10, display: 'flex', gap: '16px', alignItems: 'center' }}>
               {/* Global Modal Toggle */}
               <div style={{ display: 'flex', gap: '4px', background: 'rgba(250, 249, 246, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.05)', padding: '4px', borderRadius: '100px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                 <button onClick={() => setReportLang('zh')} style={{ padding: '6px 16px', borderRadius: '100px', border: 'none', background: reportLang === 'zh' ? 'var(--bg-surface)' : 'transparent', fontSize: '13px', fontWeight: reportLang === 'zh' ? 600 : 500, color: reportLang === 'zh' ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'zh' ? '0 2px 4px rgba(0,0,0,0.04)' : 'none' }}>中文</button>
                 <button onClick={() => setReportLang('en')} style={{ padding: '6px 16px', borderRadius: '100px', border: 'none', background: reportLang === 'en' ? 'var(--bg-surface)' : 'transparent', fontSize: '13px', fontWeight: reportLang === 'en' ? 600 : 500, color: reportLang === 'en' ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'en' ? '0 2px 4px rgba(0,0,0,0.04)' : 'none' }}>EN</button>
               </div>

               <button 
                 onClick={() => setReport(null)}
                 style={{ 
                   width: '40px', height: '40px', borderRadius: '50%',
                   background: 'rgba(250, 249, 246, 0.6)', backdropFilter: 'blur(12px)',
                   border: '1px solid rgba(0,0,0,0.05)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   fontSize: '16px', color: 'var(--text-primary)', cursor: 'pointer',
                   transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                 }}
                 onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                 onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
               >✕</button>
             </div>
             
             {/* Split View */}
             <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                 {/* Left: Original Thumbnail Gallery */}
                 <div className="no-scrollbar" style={{ width: '45%', background: 'var(--bg-elevated)', padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center', position: 'relative' }}>
                      {report.thumbnailUrl ? (
                         <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                           <img 
                             src={report.thumbnailUrl} 
                             alt="Source" 
                             title="点击查看大图"
                             onClick={() => setLightboxImg(report.thumbnailUrl!)}
                             style={{ width: '100%', display: 'block', objectFit: 'contain', cursor: 'zoom-in', borderRadius: '8px', boxShadow: 'rgba(0, 0, 0, 0.08) 0px 4px 24px' }} 
                           />
                           {/* The Magic Color Canvas Highlighter */}
                           <ColorHighlighter src={report.thumbnailUrl} targetHex={hoveredHex} />
                         </div>
                      ) : (
                        <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>原图未缓存</div>
                      )}
                    </div>
                 </div>

                 {/* Right: Extracted Data */}
                 <div className="no-scrollbar" style={{ width: '55%', padding: '64px', overflowY: 'auto', background: 'var(--bg-surface)' }}>
                    <StyleReportView report={report} lang={reportLang} />
                 </div>
             </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nav-link:hover { opacity: 0.7; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}
