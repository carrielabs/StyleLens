'use client'

import type { Dispatch, RefObject, SetStateAction } from 'react'
import { Search, X } from 'lucide-react'
import AuthOverlay from '@/components/auth/AuthOverlay'
import StyleReportView from '@/components/report/StyleReport'
import type { DisplayStyleReport, HomeHistoryRecord, HomeUndoItem, StyleReport } from '@/lib/types'
import { getTopColors } from './viewUtils'

interface HomeOverlaysProps {
  report: DisplayStyleReport | null
  activeItemId: string | null
  isExtracting: boolean
  extractions: HomeHistoryRecord[]
  setActiveItemId: Dispatch<SetStateAction<string | null>>
  setReport: Dispatch<SetStateAction<StyleReport | null>>
  reportLang: 'zh' | 'en'
  setReportLang: Dispatch<SetStateAction<'zh' | 'en'>>
  isSearchOpen: boolean
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>
  modalSearchQuery: string
  setModalSearchQuery: Dispatch<SetStateAction<string>>
  modalFiltered: HomeHistoryRecord[]
  openHistoryItem: (item: HomeHistoryRecord) => Promise<void>
  setError: Dispatch<SetStateAction<string | null>>
  searchInputRef: RefObject<HTMLInputElement | null>
  isLightboxOpen: boolean
  setIsLightboxOpen: Dispatch<SetStateAction<boolean>>
  setLightboxUrl: Dispatch<SetStateAction<string>>
  lightboxUrl: string
  undoItem: HomeUndoItem | null
  undoDelete: () => void
  isAuthVisible: boolean
  setIsAuthVisible: Dispatch<SetStateAction<boolean>>
}

export default function HomeOverlays({
  report,
  activeItemId,
  isExtracting,
  extractions,
  setActiveItemId,
  setReport,
  reportLang,
  setReportLang,
  isSearchOpen,
  setIsSearchOpen,
  modalSearchQuery,
  setModalSearchQuery,
  modalFiltered,
  openHistoryItem,
  setError,
  searchInputRef,
  isLightboxOpen,
  setIsLightboxOpen,
  setLightboxUrl,
  lightboxUrl,
  undoItem,
  undoDelete,
  isAuthVisible,
  setIsAuthVisible,
}: HomeOverlaysProps) {
  return (
    <>
      {report && !activeItemId && !isExtracting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px',
          animation: 'fadeIn 0.4s ease'
        }} onClick={() => {
          const latest = extractions[0]
          if (latest) { void openHistoryItem(latest) }
          else setReport(null)
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%', maxWidth: '1440px', height: '100%', maxHeight: '900px',
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            position: 'relative', border: '1px solid #F0F0F0'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2px', background: '#F5F5F5', padding: '4px', borderRadius: '100px' }}>
                <button onClick={() => setReportLang('zh')} style={{ padding: '5px 14px', borderRadius: '100px', border: 'none', background: reportLang === 'zh' ? '#fff' : 'transparent', fontSize: '11px', fontWeight: reportLang === 'zh' ? 600 : 400, color: reportLang === 'zh' ? '#1D1D1F' : '#999', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'zh' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>中文</button>
                <button onClick={() => setReportLang('en')} style={{ padding: '5px 14px', borderRadius: '100px', border: 'none', background: reportLang === 'en' ? '#fff' : 'transparent', fontSize: '12px', fontWeight: reportLang === 'en' ? 600 : 400, color: reportLang === 'en' ? '#1D1D1F' : '#999', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'en' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>EN</button>
              </div>
              <button
                onClick={() => {
                  const latest = extractions[0]
                  if (latest) { void openHistoryItem(latest) }
                  else setReport(null)
                }}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F5F5F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EBEBEB' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F5' }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div className="no-scrollbar" style={{ width: '44%', background: '#F5F4F1', padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
                  <img
                    src={report.screenshotUrl || report.thumbnailUrl}
                    alt="Source"
                    style={{ width: '100%', display: 'block', objectFit: 'contain', cursor: 'zoom-in', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                    onClick={() => { setLightboxUrl(report.screenshotUrl || report.thumbnailUrl || ''); setIsLightboxOpen(true) }}
                  />
                </div>
              </div>
              <div className="no-scrollbar" style={{ width: '56%', padding: '64px', overflowY: 'auto', background: '#FFFFFF' }}>
                <StyleReportView report={report} lang={reportLang} />
              </div>
            </div>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.06)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'none', animation: 'overlayFade 0.2s ease-out'
        }} onClick={() => { setIsSearchOpen(false); setModalSearchQuery('') }}>
          <div style={{
            width: '100%', maxWidth: '600px', height: '510px', backgroundColor: '#FFFFFF', borderRadius: '16px',
            boxShadow: '0 20px 70px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'searchModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
            margin: '0 20px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Search size={18} strokeWidth={1.8} style={{ color: '#8E8E93', marginRight: '14px' }} />
              <input
                ref={searchInputRef}
                autoFocus
                type="text"
                value={modalSearchQuery}
                onChange={e => setModalSearchQuery(e.target.value)}
                placeholder="搜索历史记录..."
                style={{
                  flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#1D1D1F',
                  backgroundColor: 'transparent', fontFamily: 'var(--font-sans)', padding: '4px 0',
                  fontWeight: 400
                }}
              />
              <button onClick={() => { setIsSearchOpen(false); setModalSearchQuery('') }} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#8E8E93',
                borderRadius: '6px', transition: 'background 0.1s'
              }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <X size={16} />
              </button>
            </div>
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
              {modalFiltered.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1A6', fontSize: '14px', opacity: 0.6 }}>
                  {modalSearchQuery ? '未找到匹配记录' : '暂无历史记录'}
                </div>
              ) : (
                modalFiltered.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setError(null)
                      setIsSearchOpen(false)
                      setModalSearchQuery('')
                      void openHistoryItem(item)
                    }}
                    style={{
                      padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '14px',
                      cursor: 'pointer', transition: 'background 0.1s',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                      <div style={{ width: '32px', height: '34px', borderRadius: '4px', backgroundColor: '#F5F5F7', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,0,0,0.03)' }}>
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            background: (() => {
                              const tc = getTopColors(item.style_data?.colors || [])
                              return tc.length >= 2 ? `linear-gradient(135deg, ${tc[0]?.hex || '#F0F0F0'}, ${tc[1]?.hex || '#E0E0E0'})` : '#F0F0F0'
                            })()
                          }} />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '14px', color: '#1D1D1F', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.source_label}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#A1A1A6', fontWeight: 400, flexShrink: 0 }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            animation: 'fadeIn 0.2s ease-out', cursor: 'zoom-out'
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setIsLightboxOpen(false) }}
            style={{
              position: 'absolute', top: '30px', right: '30px',
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full view"
            style={{
              maxWidth: '95%', maxHeight: '95vh', objectFit: 'contain',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              animation: 'tooltipPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {undoItem && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1D1D1F', color: '#FFFFFF', borderRadius: '12px',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 200,
          animation: 'toastIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
            已删除「<span style={{ color: '#FFFFFF', fontWeight: 500 }}>{undoItem.label}</span>」
          </span>
          <button
            onClick={undoDelete}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px',
              padding: '4px 10px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            撤销
          </button>
        </div>
      )}

      {isAuthVisible && <AuthOverlay onClose={() => setIsAuthVisible(false)} />}
    </>
  )
}
