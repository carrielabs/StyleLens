'use client'

import React, { useState } from 'react'
import type { ClipboardEvent, Dispatch, DragEvent, FormEvent, KeyboardEvent, RefObject, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowUp, FileText, HelpCircle, Link2, Loader2, Upload, X } from 'lucide-react'
import StyleReportView from '@/components/report/StyleReport'
import MagicalHeroLogo from './MagicalHeroLogo'
import type { DisplayStyleReport, HomeHistoryRecord } from '@/lib/types'
import type { UploadState } from '@/hooks/useExtraction'
import { detectInputIntent, isDataUpload, isTextUpload } from '@/lib/publisher/inputIntent'
import type { GeneratedPageResult, GeneratedPageType } from '@/hooks/usePublisher'

const WEBSITE_TEMPLATES = [
  { id: 'website-01-fui', name: 'FUI' },
  { id: 'website-02-soft-surrealism', name: 'Soft Surrealism' },
  { id: 'website-03-red-clay', name: 'Red Clay' },
  { id: 'website-04-premium-midnight', name: 'Premium Midnight' },
  { id: 'website-05-voltflow-cyber-saas', name: 'Voltflow Cyber SaaS' },
  { id: 'website-07-blueprint-agent-platform', name: 'Blueprint Agent' },
  { id: 'website-08-editorial-apple-tech', name: 'Editorial Apple Tech' },
  { id: 'website-09-blue-shift-portfolio', name: 'Blue Shift Portfolio' },
]

const DASHBOARD_TEMPLATES = [
  { id: 'dashboard-01-blue-business', name: 'Blue Business' },
  { id: 'dashboard-02-premium-dark', name: 'Premium Dark' },
  { id: 'dashboard-03-lean-cyber-analytics', name: 'Lean Cyber Analytics' },
  { id: 'dashboard-04-premium-midnight', name: 'Premium Midnight' },
  { id: 'dashboard-05-premium-cyber-dark', name: 'Premium Cyber Dark' },
  { id: 'dashboard-06-warm-paper-analytics', name: 'Warm Paper Analytics' },
  { id: 'dashboard-07-dark-bento-analytics', name: 'Dark Bento Analytics' },
  { id: 'dashboard-08-saas-executive-analytics', name: 'SaaS Executive' },
  { id: 'dashboard-09-editorial-corporate-analytics', name: 'Editorial Corporate' },
  { id: 'dashboard-10-executive-logic-report', name: 'Executive Logic' },
  { id: 'dashboard-11-saas-growth-health-report', name: 'SaaS Growth Health' },
  { id: 'dashboard-12-atomic-bento-strategy-report', name: 'Atomic Bento Strategy' },
  { id: 'dashboard-13-corporate-blue-analytics-report', name: 'Corporate Blue' },
  { id: 'dashboard-14-financial-blue-analytics-report', name: 'Financial Blue' },
  { id: 'dashboard-15-consulting-data-report', name: 'Consulting Data' },
]

const PAGE_TYPES: Array<{ id: GeneratedPageType; name: string }> = [
  { id: 'product-website', name: '产品官网' },
  { id: 'dashboard', name: 'Dashboard' },
]

interface HomeWorkspaceProps {
  activeItemId: string | null
  report: DisplayStyleReport | null
  isExtracting: boolean
  isGenerating: boolean
  isUrlExtracting: boolean
  isImageExtracting: boolean
  extractions: HomeHistoryRecord[]
  reportLang: 'zh' | 'en'
  setReportLang: Dispatch<SetStateAction<'zh' | 'en'>>
  setLightboxUrl: Dispatch<SetStateAction<string>>
  setIsLightboxOpen: Dispatch<SetStateAction<boolean>>
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
  greeting: { prefix: string; name: string } | null
  handleUrlSubmit: (e?: FormEvent) => Promise<void>
  generatePage: (sourceText: string, templateId: string, pageType?: GeneratedPageType) => Promise<GeneratedPageResult>
  generateDashboardFromFile: (file: File, templateId?: string) => Promise<GeneratedPageResult>
  urlInputRef: RefObject<HTMLInputElement | null>
  url: string
  setUrl: Dispatch<SetStateAction<string>>
  pendingFile: File | null
  pendingPreviewUrl: string | null
  uploadState: UploadState
  isDragging: boolean
  setIsDragging: Dispatch<SetStateAction<boolean>>
  setUploadZoneHovered: Dispatch<SetStateAction<boolean>>
  user: User | null
  guestTrialUsed: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  setIsAuthVisible: Dispatch<SetStateAction<boolean>>
  handlePaste: (e: ClipboardEvent) => Promise<void>
  handleExtractFile: () => Promise<void>
  clearPendingFile: () => void
  cancelExtraction: () => void
  handleFilePreview: (file: File) => void
  extractionPhase: 'screenshot' | 'ai' | 'saving' | null
}

export default function HomeWorkspace({
  activeItemId,
  report,
  isExtracting,
  isGenerating,
  isUrlExtracting,
  isImageExtracting,
  extractions,
  reportLang,
  setReportLang,
  setLightboxUrl,
  setIsLightboxOpen,
  error,
  setError,
  greeting,
  handleUrlSubmit,
  generatePage,
  generateDashboardFromFile,
  urlInputRef,
  url,
  setUrl,
  pendingFile,
  pendingPreviewUrl,
  uploadState,
  isDragging,
  setIsDragging,
  setUploadZoneHovered,
  user,
  guestTrialUsed,
  fileInputRef,
  setIsAuthVisible,
  handlePaste,
  handleExtractFile,
  clearPendingFile,
  cancelExtraction,
  handleFilePreview,
  extractionPhase,
}: HomeWorkspaceProps) {
  const [hoveredSection, setHoveredSection] = useState<{ yStart: number; yEnd: number } | null>(null)
  const [selectedPageType, setSelectedPageType] = useState<GeneratedPageType>('product-website')
  const [selectedTemplateId, setSelectedTemplateId] = useState('website-01-fui')
  const [textUploadFile, setTextUploadFile] = useState<File | null>(null)
  const [textUploadPhase, setTextUploadPhase] = useState<'idle' | 'generating' | 'error'>('idle')
  const isTextUploadActive = Boolean(textUploadFile)
  const isBusy = isExtracting || isGenerating || textUploadPhase === 'generating'
  const templateOptions = selectedPageType === 'dashboard' ? DASHBOARD_TEMPLATES : WEBSITE_TEMPLATES
  const shouldShowPublisherOptions = !url.trim() || detectInputIntent(url) === 'generate-page'

  const handlePageTypeChange = (pageType: GeneratedPageType) => {
    setSelectedPageType(pageType)
    setSelectedTemplateId(pageType === 'dashboard' ? 'dashboard-01-blue-business' : 'website-01-fui')
  }

  const handleUnifiedSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const value = url.trim()
    if (!value || isBusy) return

    if (detectInputIntent(value) === 'extract-style') {
      await handleUrlSubmit(e)
      return
    }

    setError(null)
    try {
      await generatePage(value, selectedTemplateId, selectedPageType)
      setUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    }
  }

  const handleTextUpload = async (file: File) => {
    if (isBusy) return
    setError(null)
    setTextUploadFile(file)
    setTextUploadPhase('generating')
    try {
      await generatePage(await file.text(), selectedTemplateId, selectedPageType)
      setTextUploadFile(null)
      setTextUploadPhase('idle')
    } catch (err) {
      setTextUploadPhase('error')
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    }
  }

  const handleDataUpload = async (file: File) => {
    if (isBusy) return
    setError(null)
    const dashboardTemplateId = selectedPageType === 'dashboard' ? selectedTemplateId : 'dashboard-01-blue-business'
    setSelectedPageType('dashboard')
    setSelectedTemplateId(dashboardTemplateId)
    setTextUploadFile(file)
    setTextUploadPhase('generating')
    try {
      await generateDashboardFromFile(file, dashboardTemplateId)
      setTextUploadFile(null)
      setTextUploadPhase('idle')
    } catch (err) {
      setTextUploadPhase('error')
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    }
  }

  const handleUnifiedFile = (file: File) => {
    if (isDataUpload(file)) {
      void handleDataUpload(file)
      return
    }
    if (isTextUpload(file)) {
      void handleTextUpload(file)
      return
    }
    handleFilePreview(file)
  }

  const handleUnifiedDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUnifiedFile(file)
  }

  return (
    <>
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
          50% { transform: translateY(-8px) rotate(3deg); filter: drop-shadow(0 15px 30px rgba(0,0,0,0.08)); }
        }
        .hero-logo-animate {
          animation: heroFloat 6s ease-in-out infinite;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
        }
        .hero-logo-animate:hover {
          transform: scale(1.15) rotate(7deg);
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.12));
        }
      `}</style>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#FFFFFF', overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
          <HelpCircle size={18} strokeWidth={1} style={{ color: '#C7C7CC', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#8E8E93'}
            onMouseLeave={e => e.currentTarget.style.color = '#C7C7CC'}
          />
        </div>

        {report && !isExtracting && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
          {!(report.id === 'preset_linear_v2' || report.id === 'preset_linear_v3') && (
            <div className="no-scrollbar" style={{
              width: '40%', height: '100%', backgroundColor: '#FFFFFF',
              position: 'relative'
            }}>
            <div className="scroll-mask-top" />
            <div style={{ height: '100%', overflowY: 'auto', padding: '64px 40px 40px', overscrollBehavior: 'contain' }} className="no-scrollbar">
              <div
                onClick={() => { setLightboxUrl(report.screenshotUrl || report.thumbnailUrl || ''); setIsLightboxOpen(true) }}
                style={{
                  cursor: 'zoom-in', borderRadius: '16px', overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.06)', transition: 'transform 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img
                  src={report.screenshotUrl || report.thumbnailUrl}
                  alt="Source"
                  style={{ width: '100%', display: 'block' }}
                />
                {hoveredSection && (
                  <div style={{
                    position: 'absolute',
                    left: 0, right: 0,
                    top: `${hoveredSection.yStart}%`,
                    height: `${hoveredSection.yEnd - hoveredSection.yStart}%`,
                    backgroundColor: 'rgba(59,130,246,0.12)',
                    border: '2px solid rgba(59,130,246,0.6)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)',
                    pointerEvents: 'none',
                    transition: 'top 0.25s ease, height 0.25s ease',
                    zIndex: 5,
                  }} />
                )}
              </div>
            </div>
          </div>
          )}

          <div className="no-scrollbar" style={{ flex: 1, height: '100%', overflowY: 'auto', backgroundColor: '#FFFFFF', position: 'relative' }}>
            <div className="scroll-mask-top" />
            <div style={{
              position: 'sticky', top: 0, backgroundColor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)', zIndex: 10, padding: '24px 48px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(['zh', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setReportLang(l)} style={{
                    fontSize: '11px', fontWeight: reportLang === l ? 700 : 500,
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: reportLang === l ? '#1D1D1F' : '#A1A1A6',
                    padding: '2px 6px', transition: 'color 0.2s'
                  }}>
                    {l === 'zh' ? '中文' : 'EN'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: (report.id === 'preset_linear_v2' || report.id === 'preset_linear_v3') ? '0' : '20px 48px 80px' }}>
              {!(report.id === 'preset_linear_v2' || report.id === 'preset_linear_v3') && (
                <h1 style={{
                  fontSize: '36px', fontWeight: 700, color: '#1D1D1F', margin: '0 0 40px 0',
                  lineHeight: 1.1, letterSpacing: '-0.03em'
                }}>
                  {extractions.find(e => e.id === activeItemId)?.source_label || report.sourceLabel}
                </h1>
              )}
              <StyleReportView report={report} lang={reportLang} fullWidth={true} onSectionHover={setHoveredSection} />
            </div>
          </div>
        </div>
      )}

      {(!report || isExtracting) && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
          padding: '48px', paddingTop: '18vh', gap: '0', position: 'relative', animation: 'fadeIn 0.4s ease-out'
        }}>
          {error && (
            <div style={{
              position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: '500px', padding: '14px 18px', borderRadius: '12px',
              backgroundColor: '#FFF2F1', border: '1px solid rgba(255,59,48,0.12)',
              display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideUp 0.25s ease-out',
              boxShadow: '0 4px 16px rgba(255,59,48,0.08)', zIndex: 100
            }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#FF3B30', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>!</div>
              <span style={{ flex: 1, fontSize: '13px', color: '#C0392B', fontWeight: 500 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', opacity: 0.5, display: 'flex', padding: 0 }}><X size={14} /></button>
            </div>
          )}

          <div style={{ width: '100%', maxWidth: '640px' }}>
            <div style={{
              textAlign: 'left', marginBottom: '56px', display: 'flex', flexDirection: 'column',
              alignItems: 'flex-start', gap: '0', animation: 'fadeIn 0.6s ease-out'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', width: '100%' }}>
              <MagicalHeroLogo />
              <h1 style={{
                fontSize: '52px', color: '#4B4B4B', fontWeight: 300,
                fontFamily: 'var(--font-sans)', letterSpacing: '-0.04em',
                margin: 0, transition: 'all 0.3s ease',
                lineHeight: '1.1', display: 'flex', alignItems: 'baseline', gap: '0.2em'
              }}>
                <span>{greeting?.prefix}</span>
                <span style={{ opacity: 1.0 }}>{greeting?.name}</span>
              </h1>
            </div>
            </div>

            <form onSubmit={handleUnifiedSubmit} style={{ position: 'relative', marginBottom: '18px' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '99px', height: '54px', overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onFocusCapture={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(0,0,0,0.12)'
                el.style.boxShadow = '0 10px 40px rgba(0,0,0,0.08)'
              }}
              onBlurCapture={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(0,0,0,0.06)'
                el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)'
              }}
              >
                <div style={{ paddingLeft: '18px', paddingRight: '10px', color: '#8E8E93', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Link2 size={18} strokeWidth={1.8} />
                </div>
                <input
                  ref={urlInputRef}
                  type="text"
                  placeholder="粘贴网址、产品文案、PRD、报告内容..."
                  className="url-input-placeholder"
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: '15px',
                    color: '#1D1D1F', fontWeight: 450, backgroundColor: 'transparent',
                    fontFamily: 'var(--font-sans)', height: '100%'
                  }}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={isBusy}
                />
                <style>{`
                  .url-input-placeholder::placeholder {
                    color: #989999 !important;
                    opacity: 1;
                  }
                `}</style>
                <button
                  type="submit"
                  disabled={isBusy}
                  style={{
                    height: '34px', width: '34px', margin: '0 10px',
                    backgroundColor: url.trim() ? '#1D1D1F' : 'transparent',
                    color: url.trim() ? '#FFFFFF' : '#C7C7CC',
                    border: 'none', borderRadius: '50%',
                    cursor: url.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: url.trim() ? 1 : 0,
                    transform: url.trim() ? 'scale(1)' : 'scale(0.8)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    flexShrink: 0
                  }}
                >
                  {isUrlExtracting || isGenerating ? (
                    <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%' }} />
                  ) : (
                    <ArrowUp size={18} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </form>

            {shouldShowPublisherOptions && (
              <div style={{ margin: '0 0 24px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#8E8E93', flexShrink: 0 }}>页面类型</span>
                  <select
                    aria-label="页面类型"
                    value={selectedPageType}
                    onChange={e => handlePageTypeChange(e.target.value as GeneratedPageType)}
                    disabled={isBusy}
                    style={{
                      flex: 1,
                      height: '34px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '10px',
                      background: '#FFFFFF',
                      color: '#1D1D1F',
                      fontSize: '12px',
                      padding: '0 10px',
                      outline: 'none',
                    }}
                  >
                    {PAGE_TYPES.map(pageType => (
                      <option key={pageType.id} value={pageType.id}>{pageType.name}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#8E8E93', flexShrink: 0 }}>模板</span>
                  <select
                    aria-label="模板"
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    disabled={isBusy}
                    style={{
                      flex: 1,
                      height: '34px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '10px',
                      background: '#FFFFFF',
                      color: '#1D1D1F',
                      fontSize: '12px',
                      padding: '0 10px',
                      outline: 'none',
                    }}
                  >
                    {templateOptions.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '4px 0 24px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
              <span style={{
                fontSize: '9px', color: '#BDBDBD', fontWeight: 600,
                letterSpacing: '0.02em', textTransform: 'none', fontFamily: 'var(--font-sans)'
              }}>或</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
            </div>

            <div
              style={{
                width: '100%', height: '200px', borderRadius: '24px',
                border: isTextUploadActive
                  ? '1px solid rgba(0,0,0,0.12)'
                  : uploadState === 'dragover'
                  ? '1.5px solid rgba(0,0,0,0.22)'
                  : uploadState === 'hover'
                  ? '1px solid rgba(0,0,0,0.12)'
                  : uploadState === 'selected' || uploadState === 'extracting'
                  ? 'none'
                  : '1px dashed rgba(0,0,0,0.10)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '12px', cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: isTextUploadActive
                  ? '#FBFBFD'
                  : uploadState === 'dragover'
                  ? 'rgba(0,0,0,0.015)'
                  : uploadState === 'hover'
                  ? 'rgba(255,255,255,0.6)'
                  : 'transparent',
                boxShadow: isTextUploadActive || uploadState === 'selected' || uploadState === 'extracting'
                  ? 'none'
                  : 'inset 0 1px 4px rgba(0,0,0,0.01)',
                transform: uploadState === 'hover' ? 'scale(1.002)' : 'scale(1)',
                opacity: uploadState === 'extracting' ? 0.85 : 1,
                pointerEvents: isBusy ? 'none' : 'auto',
                overflow: 'hidden', position: 'relative'
              }}
              role={pendingFile ? undefined : 'button'}
              aria-label={pendingFile ? undefined : '上传文件'}
              onMouseEnter={() => !isDragging && !pendingFile && setUploadZoneHovered(true)}
              onMouseLeave={() => setUploadZoneHovered(false)}
              onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
              onDrop={handleUnifiedDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => {
                if (isBusy) return
                if (pendingFile) return
                if (isTextUploadActive) {
                  if (textUploadPhase === 'error') {
                    setTextUploadFile(null)
                    setTextUploadPhase('idle')
                    fileInputRef.current?.click()
                  }
                  return
                }
                if (user || !guestTrialUsed) fileInputRef.current?.click()
                else setIsAuthVisible(true)
              }}
              onPaste={handlePaste}
              onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.currentTarget.click()
                }
              }}
              tabIndex={pendingFile ? -1 : 0}
            >
              {(uploadState === 'selected' || uploadState === 'extracting') && pendingPreviewUrl && (
                <>
                  <img
                    src={pendingPreviewUrl}
                    alt="Preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)'
                  }} />
                  {isImageExtracting && (
                    <div className="animate-scan" style={{
                      position: 'absolute', top: 0, width: '60%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      pointerEvents: 'none'
                    }} />
                  )}
                  {uploadState === 'selected' && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          {pendingFile?.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                          {pendingFile ? (pendingFile.size / 1024 / 1024).toFixed(1) + ' MB' : ''}
                        </span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleExtractFile() }}
                        style={{
                          height: '28px', padding: '0 14px', borderRadius: '14px',
                          background: 'rgba(255,255,255,0.95)', border: 'none',
                          fontSize: '12px', fontWeight: 600, color: '#1D1D1F',
                          cursor: 'pointer', transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFFFFF'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
                      >
                        立即解析 →
                      </button>
                    </div>
                  )}
                  {uploadState === 'selected' && (
                    <button
                      onClick={e => { e.stopPropagation(); clearPendingFile() }}
                      style={{
                        position: 'absolute', top: '10px', right: '10px',
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: 'rgba(0,0,0,0.4)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#FFFFFF', transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  )}
                </>
              )}

              {isTextUploadActive && (
                <>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    backgroundColor: '#F2F2F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#3C3C3E'
                  }}>
                    {textUploadPhase === 'generating' ? (
                      <Loader2 className="animate-spin" size={18} strokeWidth={1.8} />
                    ) : (
                      <FileText size={18} strokeWidth={1.8} />
                    )}
                  </div>
                  <div style={{ textAlign: 'center', maxWidth: '80%' }}>
                    <div style={{ fontSize: '14px', fontWeight: 650, color: '#1D1D1F', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                      {textUploadFile?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 450 }}>
                      {textUploadPhase === 'generating'
                        ? textUploadFile && isDataUpload(textUploadFile)
                          ? '正在生成数据看板…'
                          : '正在生成官网…'
                        : '生成失败，请重新上传'}
                    </div>
                    {textUploadFile && (
                      <div style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '4px' }}>
                        {(textUploadFile.size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                </>
              )}

              {!isTextUploadActive && uploadState !== 'selected' && uploadState !== 'extracting' && (
                <>
                  <div className="upload-icon-float" style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#3C3C3E',
                    transform: uploadState === 'hover' ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'transform 0.2s ease'
                  }}>
                    <Upload size={16} strokeWidth={1.8} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F', marginBottom: '5px', letterSpacing: '-0.01em' }}>
                      {uploadState === 'dragover' ? '释放以解析' : '点击上传 / 将图片、.md 或 .txt 拖拽至此'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#AEAEB2', fontWeight: 400 }}>图片用于提取风格，Markdown/TXT 用于生成页面，CSV/JSON/XLSX 用于生成 Dashboard</div>
                  </div>
                </>
              )}
            </div>

            {isExtracting && (() => {
              const phaseText =
                extractionPhase === 'screenshot' ? '正在打开页面，分析视觉结构…' :
                extractionPhase === 'ai'         ? 'AI 正在识别设计语言…' :
                extractionPhase === 'saving'     ? '整理结果中…' :
                '准备中…'
              const progressPct =
                extractionPhase === 'screenshot' ? 30 :
                extractionPhase === 'ai'         ? 65 :
                extractionPhase === 'saving'     ? 92 : 5
              return (
                <div style={{
                  position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                  width: '100%', maxWidth: '500px', animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#1D1D1F', opacity: 0.5, fontWeight: 500, transition: 'all 0.4s ease' }}>
                      {phaseText}
                    </span>
                    {extractionPhase !== 'saving' && (
                      <button
                        onClick={cancelExtraction}
                        style={{
                          background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px',
                          padding: '3px 10px', fontSize: '11px', fontWeight: 500, color: '#8E8E93',
                          cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.22)'; e.currentTarget.style.color = '#3C3C3E' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.color = '#8E8E93' }}
                      >
                        取消
                      </button>
                    )}
                  </div>
                  <div style={{
                    width: '100%', height: '1px', backgroundColor: '#F0F0F0',
                    borderRadius: '1px', overflow: 'hidden', position: 'relative'
                  }}>
                    {/* 阶段进度底层 */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, height: '100%',
                      width: `${progressPct}%`,
                      backgroundColor: '#E0E0E0',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                    {/* 扫光层：在已填充区域内持续扫动 */}
                    <div className="animate-scan" style={{
                      position: 'absolute', top: 0, height: '100%',
                      width: '30%',
                      background: 'linear-gradient(90deg, transparent, rgba(29,29,31,0.7), transparent)',
                    }} />
                  </div>
                </div>
              )
            })()}

            <input ref={fileInputRef} type="file" accept="image/*,.md,.txt,.csv,.json,.xlsx,text/plain,text/markdown,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleUnifiedFile(e.target.files[0]) }} />
          </div>
        </div>
      )}
    </main>
    </>
  )
}
