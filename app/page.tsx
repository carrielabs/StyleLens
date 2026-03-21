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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
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
        <Link href="/auth" style={{ fontSize: '13px', color: 'var(--text-primary)', background: 'transparent', padding: '8px 20px', borderRadius: '100px', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.04em', border: '1px solid var(--border-strong)', transition: 'all 0.2s' }}>
          登录
        </Link>
      </nav>

      {/* Main Studio Canvas */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', position: 'relative' }}>
        
        {/* Title Area */}
        <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
          {/* Subtle architectural background texture metric */}
          <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', color: 'var(--border-strong)', letterSpacing: '0.1em', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
            [ ALGORITHM : GEMINI 2.5 FLASH PRO ]
          </div>
          
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: '56px', fontWeight: 600,
            color: 'var(--text-primary)', marginBottom: '24px', letterSpacing: '0.02em'
          }}>
            探寻视觉内在秩序
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.8, letterSpacing: '0.02em' }}>
            上传高精度设计稿或直接解析目标公网网站，系统将在极短时间内深度剖析构成美学的色彩、排版参数与架构规则。
          </p>
        </div>

        {/* Naked Input Cluster */}
        <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {error && (
            <div style={{ padding: '14px 20px', background: '#FDF7F7', borderRadius: '12px', color: 'var(--error)', fontSize: '13px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <ImageUploader 
            onStart={() => startExtraction('正在深入像素层，提取全局排版规范与色彩矩阵...')}
            onSuccess={handleExtractionSuccess}
            onError={handleExtractionError}
            disabled={isExtracting}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: '8px 0', color: 'var(--text-tertiary)', fontSize: '12px', letterSpacing: '0.2em', fontWeight: 600 }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            直接解析网站链路
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          <UrlInput
            onStart={() => startExtraction('正在全时域解析网页，AI 深度重构中 (这可能需要 15 秒)...')}
            onSuccess={handleExtractionSuccess}
            onError={handleExtractionError}
            disabled={isExtracting}
          />
          
          {isExtracting && (
             <div style={{ marginTop: '32px', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 500, letterSpacing: '0.02em' }}>{statusText}</p>
                <div style={{ width: '120px', height: '1px', background: 'var(--border-subtle)', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '40%', background: 'var(--text-primary)', animation: 'slideRight 1.5s infinite ease-in-out' }} />
                </div>
             </div>
          )}
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
