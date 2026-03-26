'use client'

import { useState } from 'react'
import type { ClipboardEvent, Dispatch, DragEvent, FormEvent, RefObject, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowUp, HelpCircle, Link2, Upload, X } from 'lucide-react'
import StyleReportView from '@/components/report/StyleReport'
import MagicalHeroLogo from './MagicalHeroLogo'
import type { DisplayStyleReport, HomeHistoryRecord } from '@/lib/types'
import type { UploadState } from '@/hooks/useExtraction'

interface HomeWorkspaceProps {
  activeItemId: string | null
  report: DisplayStyleReport | null
  isExtracting: boolean
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
  urlInputRef: RefObject<HTMLInputElement | null>
  url: string
  setUrl: Dispatch<SetStateAction<string>>
  pendingFile: File | null
  pendingPreviewUrl: string | null
  uploadState: UploadState
  isDragging: boolean
  setIsDragging: Dispatch<SetStateAction<boolean>>
  setUploadZoneHovered: Dispatch<SetStateAction<boolean>>
  handleDrop: (e: DragEvent) => void
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
  urlInputRef,
  url,
  setUrl,
  pendingFile,
  pendingPreviewUrl,
  uploadState,
  isDragging,
  setIsDragging,
  setUploadZoneHovered,
  handleDrop,
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

            <form onSubmit={handleUrlSubmit} style={{ position: 'relative', marginBottom: '28px' }}>
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
                  placeholder="粘贴网页链接，如 https://linear.app"
                  className="url-input-placeholder"
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: '15px',
                    color: '#1D1D1F', fontWeight: 450, backgroundColor: 'transparent',
                    fontFamily: 'var(--font-sans)', height: '100%'
                  }}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={isExtracting}
                />
                <style>{`
                  .url-input-placeholder::placeholder {
                    color: #989999 !important;
                    opacity: 1;
                  }
                `}</style>
                <button
                  type="submit"
                  disabled={isExtracting}
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
                  {isUrlExtracting ? (
                    <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%' }} />
                  ) : (
                    <ArrowUp size={18} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </form>

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
                border: uploadState === 'dragover'
                  ? '1.5px solid rgba(0,0,0,0.22)'
                  : uploadState === 'hover'
                  ? '1px solid rgba(0,0,0,0.12)'
                  : uploadState === 'selected' || uploadState === 'extracting'
                  ? 'none'
                  : '1px dashed rgba(0,0,0,0.10)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '12px', cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: uploadState === 'dragover'
                  ? 'rgba(0,0,0,0.015)'
                  : uploadState === 'hover'
                  ? 'rgba(255,255,255,0.6)'
                  : 'transparent',
                boxShadow: uploadState === 'selected' || uploadState === 'extracting'
                  ? 'none'
                  : 'inset 0 1px 4px rgba(0,0,0,0.01)',
                transform: uploadState === 'hover' ? 'scale(1.002)' : 'scale(1)',
                opacity: uploadState === 'extracting' ? 0.85 : 1,
                pointerEvents: isExtracting ? 'none' : 'auto',
                overflow: 'hidden', position: 'relative'
              }}
              onMouseEnter={() => !isDragging && !pendingFile && setUploadZoneHovered(true)}
              onMouseLeave={() => setUploadZoneHovered(false)}
              onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => {
                if (isExtracting) return
                if (pendingFile) return
                if (user || !guestTrialUsed) fileInputRef.current?.click()
                else setIsAuthVisible(true)
              }}
              onPaste={handlePaste}
              tabIndex={0}
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

              {uploadState !== 'selected' && uploadState !== 'extracting' && (
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
                      {uploadState === 'dragover' ? '释放以解析' : '点击上传 / 将图片拖拽至此 / 直接粘贴图片'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#AEAEB2', fontWeight: 400 }}>支持 JPG、PNG、WebP，最大 20MB</div>
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
                    <div style={{
                      position: 'absolute', top: 0, left: 0, height: '100%',
                      width: `${progressPct}%`,
                      backgroundColor: '#1D1D1F', opacity: 0.8,
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              )
            })()}

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFilePreview(e.target.files[0]) }} />
          </div>
        </div>
      )}
    </main>
    </>
  )
}
