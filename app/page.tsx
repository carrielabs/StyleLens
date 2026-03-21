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

  useEffect(() => {
    const handleColorHover = (e: CustomEvent<string>) => setHoveredHex(e.detail)
    window.addEventListener('color-hover', handleColorHover as EventListener)
    return () => window.removeEventListener('color-hover', handleColorHover as EventListener)
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', fontFamily: "'Inter', 'PingFang SC', system-ui, sans-serif" }}>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(8px)' }}
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} alt="Zoomed" />
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: '68px' }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600, fontStyle: 'italic', color: '#1A1A1A', letterSpacing: '0.01em' }}>
          StyleLens
        </span>
        <div style={{ display: 'flex', gap: '36px', fontSize: '13px', fontWeight: 500 }}>
          <Link href="/" style={{ color: '#1A1A1A', textDecoration: 'none' }}>提取中心</Link>
          <Link href="/library" style={{ color: '#999', textDecoration: 'none' }}>分析记录</Link>
        </div>
        <Link href="/auth" style={{ fontSize: '13px', color: '#fff', background: '#1A1A1A', padding: '9px 22px', borderRadius: '100px', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.02em' }}>
          登录
        </Link>
      </nav>

      {/* ── CENTERED STACK ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 80px' }}>

        {/* Hero Text */}
        <div style={{ textAlign: 'center', marginBottom: '56px', maxWidth: '600px' }}>
          <h1 style={{
            fontSize: '60px',
            fontWeight: 800,
            color: '#1A1A1A',
            letterSpacing: '-0.04em',
            lineHeight: 1.06,
            marginBottom: '20px',
          }}>
            解构全球<br />顶级设计
          </h1>
          <p style={{ fontSize: '17px', color: '#999', lineHeight: 1.7, fontWeight: 400, letterSpacing: '0.005em' }}>
            上传设计图或粘贴网页链接，AI 将精准逆向解析色彩、排版与视觉结构体系。
          </p>
        </div>

        {/* ── Central Hub ── */}
        <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column' }}>

          {/* URL Input */}
          <UrlInput
            onStart={() => startExtraction('正在解析网页链路，重构设计树（约需 15 秒）...')}
            onSuccess={handleExtractionSuccess}
            onError={handleExtractionError}
            disabled={isExtracting}
          />

          {/* OR Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#EBEBEB' }} />
            <span style={{ fontSize: '12px', color: '#BBBBB B', letterSpacing: '0.08em', fontWeight: 500 }}>或</span>
            <div style={{ flex: 1, height: '1px', background: '#EBEBEB' }} />
          </div>

          {/* Image Uploader */}
          <ImageUploader
            onStart={() => startExtraction('正在深入像素层，提取色彩矩阵与排版规范...')}
            onSuccess={handleExtractionSuccess}
            onError={handleExtractionError}
            disabled={isExtracting}
          />

          {/* Error */}
          {error && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: '10px', color: '#B84D4D', fontSize: '13px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Progress */}
          {isExtracting && (
            <div style={{ marginTop: '24px', animation: 'fadeUp 0.4s ease' }}>
              <p style={{ fontSize: '13px', color: '#999', marginBottom: '12px', letterSpacing: '0.01em' }}>{statusText}</p>
              <div style={{ width: '100%', height: '2px', background: '#F0F0F0', borderRadius: '100px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '35%', background: '#1A1A1A', borderRadius: '100px', animation: 'slideRight 1.8s ease-in-out infinite' }} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Result Modal ── */}
      {report && !isExtracting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px',
          animation: 'fadeUp 0.4s ease'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%', maxWidth: '1440px', height: '100%', maxHeight: '900px',
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid #F0F0F0'
          }}>
            {/* Floating Controls */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2px', background: '#F5F5F5', padding: '4px', borderRadius: '100px' }}>
                <button onClick={() => setReportLang('zh')} style={{ padding: '5px 14px', borderRadius: '100px', border: 'none', background: reportLang === 'zh' ? '#fff' : 'transparent', fontSize: '12px', fontWeight: reportLang === 'zh' ? 600 : 400, color: reportLang === 'zh' ? '#1A1A1A' : '#999', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'zh' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>中文</button>
                <button onClick={() => setReportLang('en')} style={{ padding: '5px 14px', borderRadius: '100px', border: 'none', background: reportLang === 'en' ? '#fff' : 'transparent', fontSize: '12px', fontWeight: reportLang === 'en' ? 600 : 400, color: reportLang === 'en' ? '#1A1A1A' : '#999', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'en' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>EN</button>
              </div>
              <button
                onClick={() => setReport(null)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F5F5F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#1A1A1A', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EBEBEB' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F5' }}
              >✕</button>
            </div>

            {/* Split View */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div className="no-scrollbar" style={{ width: '44%', background: '#FAFAFA', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                {report.thumbnailUrl ? (
                  <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
                    <img
                      src={report.thumbnailUrl}
                      alt="Source"
                      title="点击查看大图"
                      onClick={() => setLightboxImg(report.thumbnailUrl!)}
                      style={{ width: '100%', display: 'block', objectFit: 'contain', cursor: 'zoom-in', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                    />
                    <ColorHighlighter src={report.thumbnailUrl} targetHex={hoveredHex} />
                  </div>
                ) : (
                  <div style={{ padding: '64px 0', textAlign: 'center', color: '#BBBBBB', fontSize: '13px' }}>原图未缓存</div>
                )}
              </div>
              <div className="no-scrollbar" style={{ width: '56%', padding: '60px', overflowY: 'auto', background: '#FFFFFF' }}>
                <StyleReportView report={report} lang={reportLang} />
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        a.nav-link:hover { opacity: 0.6; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}
