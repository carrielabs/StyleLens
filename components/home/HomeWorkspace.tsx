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
  { id: 'website-01-fui', name: 'FUI', description: '简洁产品介绍', tone: '#1D1D1F' },
  { id: 'website-02-soft-surrealism', name: 'Soft Surrealism', description: '柔和品牌官网', tone: '#E8B4C8' },
  { id: 'website-03-red-clay', name: 'Red Clay', description: '内容型产品页', tone: '#B85C38' },
  { id: 'website-04-premium-midnight', name: 'Premium Midnight', description: '高端深色官网', tone: '#111827' },
  { id: 'website-05-voltflow-cyber-saas', name: 'Voltflow Cyber SaaS', description: '科技 SaaS', tone: '#D9EB26' },
  { id: 'website-07-blueprint-agent-platform', name: 'Blueprint Agent', description: '平台型产品', tone: '#2563EB' },
  { id: 'website-08-editorial-apple-tech', name: 'Editorial Apple Tech', description: '编辑感科技页', tone: '#A3A3A3' },
  { id: 'website-09-blue-shift-portfolio', name: 'Blue Shift Portfolio', description: '作品集/品牌展示', tone: '#38BDF8' },
]

const DASHBOARD_TEMPLATES = [
  { id: 'dashboard-01-blue-business', name: 'Blue Business', description: '经营分析 / KPI', tone: '#2563EB' },
  { id: 'dashboard-02-premium-dark', name: 'Premium Dark', description: '深色数据大屏', tone: '#18181B' },
  { id: 'dashboard-03-lean-cyber-analytics', name: 'Lean Cyber Analytics', description: '科技监控', tone: '#A3E635' },
  { id: 'dashboard-04-premium-midnight', name: 'Premium Midnight', description: '高级深色报告', tone: '#312E81' },
  { id: 'dashboard-05-premium-cyber-dark', name: 'Premium Cyber Dark', description: '安全 / 系统指标', tone: '#22D3EE' },
  { id: 'dashboard-06-warm-paper-analytics', name: 'Warm Paper Analytics', description: '温和汇报页', tone: '#D97706' },
  { id: 'dashboard-07-dark-bento-analytics', name: 'Dark Bento Analytics', description: '模块化分析', tone: '#DC2626' },
  { id: 'dashboard-08-saas-executive-analytics', name: 'SaaS Executive', description: 'SaaS 高管看板', tone: '#7C3AED' },
  { id: 'dashboard-09-editorial-corporate-analytics', name: 'Editorial Corporate', description: '企业分析报告', tone: '#0F172A' },
  { id: 'dashboard-10-executive-logic-report', name: 'Executive Logic', description: '管理层决策', tone: '#0284C7' },
  { id: 'dashboard-11-saas-growth-health-report', name: 'SaaS Growth Health', description: '增长健康度', tone: '#16A34A' },
  { id: 'dashboard-12-atomic-bento-strategy-report', name: 'Atomic Bento Strategy', description: '战略复盘', tone: '#F97316' },
  { id: 'dashboard-13-corporate-blue-analytics-report', name: 'Corporate Blue', description: '蓝色企业报告', tone: '#1D4ED8' },
  { id: 'dashboard-14-financial-blue-analytics-report', name: 'Financial Blue', description: '财务分析', tone: '#0EA5E9' },
  { id: 'dashboard-15-consulting-data-report', name: 'Consulting Data', description: '咨询数据报告', tone: '#0F2C59' },
]

const TEMPLATE_TOTAL = WEBSITE_TEMPLATES.length + DASHBOARD_TEMPLATES.length

type TemplateOption = typeof WEBSITE_TEMPLATES[number] | typeof DASHBOARD_TEMPLATES[number]
type QueuedPublisherFile = { file: File; kind: 'text' | 'data' }

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
  const [queuedPublisherFile, setQueuedPublisherFile] = useState<QueuedPublisherFile | null>(null)
  const [textUploadFile, setTextUploadFile] = useState<File | null>(null)
  const [textUploadPhase, setTextUploadPhase] = useState<'idle' | 'generating' | 'error'>('idle')
  const isTextUploadActive = Boolean(textUploadFile)
  const isPublisherFileQueued = Boolean(queuedPublisherFile)
  const isBusy = isExtracting || isGenerating || textUploadPhase === 'generating'
  const shouldShowPublisherOptions = !url.trim() || detectInputIntent(url) === 'generate-page'
  const typedSourceText = url.trim()
  const hasTypedPublisherText = Boolean(typedSourceText && detectInputIntent(typedSourceText) === 'generate-page')
  const hasPublisherSource = Boolean(queuedPublisherFile || hasTypedPublisherText)
  const hasDataSource = queuedPublisherFile?.kind === 'data'

  const handleUnifiedSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const value = url.trim()
    if (!value || isBusy) return

    if (detectInputIntent(value) === 'extract-style') {
      await handleUrlSubmit(e)
      return
    }

    setError('请在下方选择一个模板生成')
  }

  const handleTextUpload = (file: File) => {
    if (isBusy) return
    setError(null)
    setQueuedPublisherFile({ file, kind: 'text' })
    setTextUploadFile(null)
    setTextUploadPhase('idle')
  }

  const handleDataUpload = (file: File) => {
    if (isBusy) return
    setError(null)
    setQueuedPublisherFile({ file, kind: 'data' })
    setTextUploadFile(null)
    setTextUploadPhase('idle')
  }

  const handleTemplateGenerate = async (templateId: string, pageType: GeneratedPageType) => {
    if (isBusy) return
    if (hasDataSource && pageType === 'product-website') return
    if (!hasPublisherSource) {
      setError('请先上传文件或粘贴内容')
      return
    }

    setError(null)
    const activeFile = queuedPublisherFile?.file || null
    if (activeFile) {
      setTextUploadFile(activeFile)
      setTextUploadPhase('generating')
    }

    try {
      if (queuedPublisherFile?.kind === 'data') {
        await generateDashboardFromFile(queuedPublisherFile.file, templateId)
      } else {
        const sourceText = queuedPublisherFile?.kind === 'text'
          ? await queuedPublisherFile.file.text()
          : typedSourceText
        await generatePage(sourceText, templateId, pageType)
        if (!queuedPublisherFile) setUrl('')
      }
      setQueuedPublisherFile(null)
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
      handleTextUpload(file)
      return
    }
    setQueuedPublisherFile(null)
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
      <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#FFFFFF', overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
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
        <div
          data-testid="home-workspace-start"
          style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
          minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
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

          <div style={{ width: '100%', maxWidth: '1120px' }}>
            <div style={{
              textAlign: 'left', margin: '0 auto 56px', maxWidth: '640px', display: 'flex', flexDirection: 'column',
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

            <form onSubmit={handleUnifiedSubmit} style={{ position: 'relative', margin: '0 auto 18px', maxWidth: '640px' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '4px auto 24px', maxWidth: '640px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
              <span style={{
                fontSize: '9px', color: '#BDBDBD', fontWeight: 600,
                letterSpacing: '0.02em', textTransform: 'none', fontFamily: 'var(--font-sans)'
              }}>或</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
            </div>

            <div
              style={{
                width: '100%', maxWidth: '640px', margin: '0 auto', height: '200px', borderRadius: '24px',
                border: isPublisherFileQueued || isTextUploadActive
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
                backgroundColor: isPublisherFileQueued || isTextUploadActive
                  ? '#FBFBFD'
                  : uploadState === 'dragover'
                  ? 'rgba(0,0,0,0.015)'
                  : uploadState === 'hover'
                  ? 'rgba(255,255,255,0.6)'
                  : 'transparent',
                boxShadow: isPublisherFileQueued || isTextUploadActive || uploadState === 'selected' || uploadState === 'extracting'
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
                if (isPublisherFileQueued) return
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

              {queuedPublisherFile && !isTextUploadActive && (
                <>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    backgroundColor: '#F2F2F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#3C3C3E'
                  }}>
                    <FileText size={18} strokeWidth={1.8} />
                  </div>
                  <div style={{ textAlign: 'center', maxWidth: '80%' }}>
                    <div style={{ fontSize: '14px', fontWeight: 650, color: '#1D1D1F', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                      {queuedPublisherFile.file.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 450 }}>
                      {queuedPublisherFile.kind === 'data' ? '已识别为数据文件' : '已识别为文本内容'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '4px' }}>
                      {(queuedPublisherFile.file.size / 1024).toFixed(1)} KB · 请在下方选择模板
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setQueuedPublisherFile(null) }}
                    style={{
                      position: 'absolute', top: '10px', right: '10px',
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.06)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#3C3C3E'
                    }}
                    aria-label="移除已上传文件"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
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

              {!queuedPublisherFile && !isTextUploadActive && uploadState !== 'selected' && uploadState !== 'extracting' && (
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
                    <div style={{ fontSize: '12px', color: '#AEAEB2', fontWeight: 400 }}>图片用于提取风格，Markdown/TXT/CSV/JSON/XLSX 上传后选择模板生成</div>
                  </div>
                </>
              )}
            </div>

            {shouldShowPublisherOptions && (
              <div style={{ marginTop: '28px', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '15px', lineHeight: 1.2, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.01em' }}>
                        选择模板生成
                      </h2>
                      <span style={{
                        height: '22px', padding: '0 8px', borderRadius: '999px',
                        background: '#F2F2F7', color: '#636366', display: 'inline-flex',
                        alignItems: 'center', fontSize: '11px', fontWeight: 650
                      }}>
                        共 {TEMPLATE_TOTAL} 个模板
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', lineHeight: 1.4, color: '#8E8E93' }}>
                      {hasDataSource
                        ? '数据文件只支持生成 Dashboard，请选择一个看板模板。'
                        : hasPublisherSource
                        ? '选择官网或 Dashboard 模板，用当前内容生成同款页面。'
                        : '先上传文件或粘贴内容，再点击模板生成。'}
                    </p>
                  </div>
                </div>

                <TemplateSection
                  title="产品官网模板"
                  pageType="product-website"
                  templates={WEBSITE_TEMPLATES}
                  disabledReason={hasDataSource ? '数据文件不能生成官网' : !hasPublisherSource ? '请先上传或粘贴内容' : null}
                  isBusy={isBusy}
                  onGenerate={handleTemplateGenerate}
                />

                <TemplateSection
                  title="Dashboard 模板"
                  pageType="dashboard"
                  templates={DASHBOARD_TEMPLATES}
                  disabledReason={!hasPublisherSource ? '请先上传或粘贴内容' : null}
                  isBusy={isBusy}
                  onGenerate={handleTemplateGenerate}
                />
              </div>
            )}

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

function TemplateSection({
  title,
  pageType,
  templates,
  disabledReason,
  isBusy,
  onGenerate,
}: {
  title: string
  pageType: GeneratedPageType
  templates: TemplateOption[]
  disabledReason: string | null
  isBusy: boolean
  onGenerate: (templateId: string, pageType: GeneratedPageType) => void
}) {
  return (
    <section style={{ marginTop: '20px' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#3C3C3E', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            pageType={pageType}
            disabledReason={disabledReason}
            isBusy={isBusy}
            onGenerate={onGenerate}
          />
        ))}
      </div>
    </section>
  )
}

function TemplateCard({
  template,
  pageType,
  disabledReason,
  isBusy,
  onGenerate,
}: {
  template: TemplateOption
  pageType: GeneratedPageType
  disabledReason: string | null
  isBusy: boolean
  onGenerate: (templateId: string, pageType: GeneratedPageType) => void
}) {
  const isDisabled = Boolean(disabledReason) || isBusy
  const pageLabel = pageType === 'dashboard' ? 'Dashboard' : '官网'
  const actionLabel = `用 ${template.name} 生成${pageLabel === '官网' ? '官网' : ` ${pageLabel}`}`
  const disabledLabel = disabledReason === '数据文件不能生成官网'
    ? `数据文件不能生成 ${template.name} 官网`
    : `${disabledReason || '生成中'}：${template.name}`

  return (
    <article
      style={{
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '12px',
        background: isDisabled ? '#FAFAFA' : '#FFFFFF',
        opacity: isDisabled ? 0.56 : 1,
        overflow: 'hidden',
      }}
    >
      <div
        data-testid={`template-preview-${template.id}`}
        style={{
          height: '132px',
          background: '#F5F5F7',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <iframe
          title={`${template.name} 模板预览`}
          src={`/api/template-preview/${template.id}`}
          loading="lazy"
          sandbox="allow-scripts"
          tabIndex={-1}
          style={{
            width: '1280px',
            height: '760px',
            border: 'none',
            transform: 'scale(0.18)',
            transformOrigin: '0 0',
            pointerEvents: 'none',
            background: '#FFFFFF',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: `inset 0 -28px 40px ${template.tone}10`,
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ padding: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', lineHeight: 1.2, color: '#1D1D1F', fontWeight: 700 }}>
            {template.name}
          </h4>
          <span style={{ fontSize: '10px', color: '#AEAEB2', flexShrink: 0 }}>{pageLabel}</span>
        </div>
        <p style={{ margin: '5px 0 10px', minHeight: '28px', fontSize: '11px', lineHeight: 1.3, color: '#8E8E93' }}>
          {template.description}
        </p>
        <button
          type="button"
          disabled={isDisabled}
          aria-label={isDisabled ? disabledLabel : actionLabel}
          onClick={() => onGenerate(template.id, pageType)}
          style={{
            width: '100%',
            height: '30px',
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.08)',
            background: isDisabled ? '#F2F2F7' : '#1D1D1F',
            color: isDisabled ? '#8E8E93' : '#FFFFFF',
            fontSize: '11px',
            fontWeight: 650,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {isDisabled ? disabledReason || '生成中...' : `用这个生成${pageLabel === '官网' ? '官网' : ' Dashboard'}`}
        </button>
      </div>
    </article>
  )
}
