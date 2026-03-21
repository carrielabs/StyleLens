'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Link2, HelpCircle, UserIcon, Sparkles, X, ChevronLeft, Star } from 'lucide-react'
import StyleReportView from '@/components/report/StyleReport'
import ColorHighlighter from '@/components/report/ColorHighlighter'
import AuthOverlay from '@/components/auth/AuthOverlay'
import { createClient } from '@/lib/storage/supabaseClient'
import type { StyleReport } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  // ── Core state ──
  const [url, setUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [report, setReport] = useState<StyleReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reportLang, setReportLang] = useState<'zh' | 'en'>('zh')
  const [hoveredHex, setHoveredHex] = useState<string | null>(null)
  const [extractionProgress, setExtractionProgress] = useState(0)

  // ── Auth state ──
  const [isAuthVisible, setIsAuthVisible] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // ── Sidebar state ──
  const [extractions, setExtractions] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'recent' | 'pinned'>('recent')
  const [isModalImageLoading, setIsModalImageLoading] = useState(true)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // ── Modal Background Lock ──
  useEffect(() => {
    if (isExtracting || (report && !activeItemId) || isLightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => { document.body.style.overflow = 'auto' }
  }, [isExtracting, report, activeItemId, isLightboxOpen])

  // ── Keyboard & global events ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session) loadHistory(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session) {
        setIsAuthVisible(false)
        loadHistory(session.user.id)
      } else {
        setExtractions([])
      }
    })

    const handleColorHover = (e: CustomEvent<string>) => setHoveredHex(e.detail)
    window.addEventListener('color-hover', handleColorHover as EventListener)

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-menu-trigger')) setShowUserMenu(false)
    }
    window.addEventListener('click', handleClickOutside)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (report) { setReport(null); setActiveItemId(null); return }
        if (isSearchOpen) { setIsSearchOpen(false); setSearchQuery(''); return }
        setShowUserMenu(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('color-hover', handleColorHover as EventListener)
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [report, isSearchOpen])

  useEffect(() => {
    if (report) setIsModalImageLoading(true)
  }, [report])

  // ── Extraction Progress Timer ──
  useEffect(() => {
    let interval: any
    if (isExtracting && !report) {
      setExtractionProgress(0)
      interval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 95) return 95
          // Linear progress for 15s (approx 6.6% per sec, but we'll do 1% per 150ms for smoothness)
          return prev + 1
        })
      }, 150)
    } else {
      setExtractionProgress(0)
      if (interval) clearInterval(interval)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isExtracting, report])

  // ── Data loading ──
  const loadHistory = async (userId: string) => {
    setIsLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('style_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      setExtractions(data || [])
    } catch (err: any) {
      console.error('Failed to load history:', err.message || err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const saveExtraction = async (report: StyleReport, thumb?: string) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('style_records')
        .insert({
          user_id: user.id,
          source_label: report.sourceLabel,
          thumbnail_url: thumb || report.thumbnailUrl || null,
          style_data: report
        })
      if (error) throw error
      // Refresh to get the new item with DB-generated id
      await loadHistory(user.id)
    } catch (err) {
      console.error('Failed to save extraction:', err)
    }
  }

  const togglePin = async (itemId: string) => {
    setExtractions(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const isPinned = item.style_data?.__pinned === true
      return {
        ...item,
        style_data: { ...item.style_data, __pinned: !isPinned }
      }
    }))
    // Persist: update tags in supabase
    const item = extractions.find(e => e.id === itemId)
    if (item) {
      const isPinned = item.style_data?.__pinned === true
      await supabase
        .from('style_records')
        .update({ style_data: { ...item.style_data, __pinned: !isPinned } })
        .eq('id', itemId)
    }
  }

  // ── Extraction ──
  const callExtractAPI = async (payload: { screenshotUrl?: string; imageBase64?: string; sourceLabel?: string }) => {
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.success) {
      console.error('Extraction API Failure Details:', data)
      throw new Error(data.error || '提取失败，请重试')
    }
    return data.report as StyleReport
  }

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })

  const handleUrlSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!url.trim() || isExtracting) return
    if (!user) { setIsAuthVisible(true); return }

    setIsExtracting(true)
    setReport(null)
    setActiveItemId(null)
    setError(null)
    try {
      // 1. Screenshot
      const ssRes = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const ssData = await ssRes.json()
      if (!ssData.success) throw new Error(ssData.error || '截图失败')
      
      // 2. Extract
      const labelStr = url.trim()
      let label = labelStr
      try { label = new URL(labelStr).hostname.replace(/^www\./, '') } catch(e){}
      
      const result = await callExtractAPI({ screenshotUrl: ssData.screenshotUrl, sourceLabel: label })
      result.thumbnailUrl = ssData.screenshotUrl
      
      // 3. Save
      await saveExtraction(result, ssData.screenshotUrl)
      
      // 4. Show portal
      setReport(result)
      setIsExtracting(false)
      setUrl('')
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : '未知错误'
      if (msg.includes('Failed to fetch')) msg = '网络连接失败，请检查网络后重试'
      setError(msg)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return }
    if (file.size > 20 * 1024 * 1024) { setError('图片过大，请上传 20MB 以内的图片'); return }
    if (!user) { setIsAuthVisible(true); return }

    setIsExtracting(true)
    setReport(null)
    setActiveItemId(null)
    setError(null)
    try {
      const base64 = await toBase64(file)
      const result = await callExtractAPI({ imageBase64: base64, sourceLabel: file.name })
      result.thumbnailUrl = base64
      
      await saveExtraction(result, base64)
      
      setReport(result)
      setIsExtracting(false)
    } catch (err: any) {
      setError(err.message || '上传分析失败')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) handleFileSelect(file)
        break
      }
    }
  }

  // ── Avatar helpers ──
  const getInitials = (email: string) => email.charAt(0).toUpperCase()
  const getAvatarColor = (email: string) => {
    const colors = ['#FF9500', '#FF2D55', '#5856D6', '#34C759', '#007AFF', '#AF52DE']
    let hash = 0
    for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  // ── Filtered lists ──
  const allFiltered = extractions.filter(item =>
    !searchQuery || (item.source_label || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  const pinnedList = allFiltered.filter(item => item.style_data?.__pinned === true)
  const recentList = allFiltered.filter(item => !item.style_data?.__pinned)

  const displayList = sidebarTab === 'pinned' ? pinnedList : recentList

  return (
    <>
      <style>{`
        @keyframes scan {
          0% { left: -40%; }
          100% { left: 100%; }
        }
        .animate-scan {
          animation: scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .scroll-mask-top {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: linear-gradient(to bottom, #FFFFFF 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
          z-index: 20;
        }
        .scroll-mask-modal-left {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: linear-gradient(to bottom, #F5F4F1 0%, rgba(245,244,241,0) 100%);
          pointer-events: none;
          z-index: 20;
        }
      `}</style>
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'row',
        fontFamily: 'var(--font-sans)', WebkitFontSmoothing: 'antialiased' as any,
        userSelect: 'none', overflow: 'hidden', backgroundColor: '#FFFFFF'
      }}>

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside style={{
        width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        backgroundColor: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.03)'
      }}>
        {/* Top: Brand wordmark */}
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#1D1D1F', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', WebkitFontSmoothing: 'auto' }}>StyleLens</span>
        </div>

        {/* Top Actions */}
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <SidebarBtn
            icon={<Plus size={16} strokeWidth={2} />}
            label="New Extraction"
            active={!activeItemId && !report && !isExtracting}
            onClick={() => {
              setReport(null)
              setActiveItemId(null)
              setError(null)
              setUrl('')
              setTimeout(() => urlInputRef.current?.focus(), 50)
            }}
          />
          <SidebarBtn
            icon={<Search size={16} strokeWidth={2} />}
            label="Search"
            active={isSearchOpen}
            onClick={() => {
              setIsSearchOpen(true)
              setTimeout(() => searchInputRef.current?.focus(), 100)
            }}
          />
        </div>

        {/* Tab switcher: Recent / Pinned -> Changed to static headers on the list */}
        <div style={{ padding: '24px 24px 8px', display: 'flex', gap: '0' }}>
           <span style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
             PINNED
           </span>
        </div>

        {/* Pinned List */}
        <div className="no-scrollbar" style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {pinnedList.map(item => (
            <HistoryItem
              key={item.id} label={item.source_label || 'Untitled'}
              isActive={activeItemId === item.id} isPinned={true}
              onClick={() => { setActiveItemId(item.id); setReport(item.style_data); setError(null) }}
              onPin={() => togglePin(item.id)}
            />
          ))}
          {pinnedList.length === 0 && <div style={{ padding: '8px 12px', fontSize: '13px', color: '#C7C7CC', textAlign: 'left' }}>No pinned items</div>}
        </div>

        <div style={{ padding: '24px 24px 8px', display: 'flex', gap: '0' }}>
           <span style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
             HISTORY
           </span>
        </div>

        {/* History list */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {!user ? (
            <EmptyState>Sign in to view history</EmptyState>
          ) : isLoadingHistory ? (
            <div style={{ padding: '16px 8px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: '32px', borderRadius: '6px', marginBottom: '4px',
                  backgroundColor: 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s infinite'
                }} />
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <EmptyState>
              {searchQuery ? 'No matched records' : sidebarTab === 'pinned' ? 'No pinned items' : 'No history yet'}
            </EmptyState>
          ) : (
            recentList.map(item => (
              <HistoryItem
                key={item.id}
                label={item.source_label || '未命名分析'}
                isActive={activeItemId === item.id}
                isPinned={item.style_data?.__pinned === true}
                onClick={() => {
                  setActiveItemId(item.id)
                  setReport(item.style_data)
                  setError(null)
                  setIsModalImageLoading(true)
                }}
                onPin={() => togglePin(item.id)}
              />
            ))
          )}
        </div>

        {/* User footer */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(0,0,0,0.03)', position: 'relative' }}>
          {showUserMenu && user && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '16px', right: '16px', marginBottom: '8px',
              backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.04)', padding: '6px', zIndex: 50, animation: 'slideUp 0.15s ease-out'
            }}>
              <div style={{ padding: '8px 12px 6px', fontSize: '12px', color: '#8E8E93', borderBottom: '1px solid rgba(0,0,0,0.03)', marginBottom: '4px' }}>
                {user.email}
              </div>
              <button
                onClick={async () => { await supabase.auth.signOut(); setShowUserMenu(false) }}
                style={{
                  width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none',
                  backgroundColor: 'transparent', color: '#FF3B30', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', borderRadius: '8px', fontFamily: 'var(--font-sans)', transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,59,48,0.05)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                退出登录
              </button>
            </div>
          )}

          <div
            className="user-menu-trigger"
            onClick={e => {
              e.stopPropagation()
              if (!user) setIsAuthVisible(true)
              else setShowUserMenu(!showUserMenu)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
              borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: showUserMenu ? 'rgba(0,0,0,0.03)' : 'transparent',
              border: '1px solid transparent'
            }}
            onMouseEnter={e => !showUserMenu && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)')}
            onMouseLeave={e => !showUserMenu && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {user ? (
               <UserIcon size={14} style={{ color: '#8E8E93', flexShrink: 0 }} strokeWidth={2} />
            ) : (
               <UserIcon size={14} style={{ color: '#8E8E93', flexShrink: 0 }} strokeWidth={2} />
            )}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1D1D1F', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user ? (user.email?.split('@')[0] || 'User') : '登录 / 注册'}
            </span>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN WORKSPACE
      ══════════════════════════════════════════ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>

        {/* Help icon */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
          <HelpCircle size={18} strokeWidth={1} style={{ color: '#C7C7CC', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#8E8E93'}
            onMouseLeave={e => e.currentTarget.style.color = '#C7C7CC'}
          />
        </div>

        {/* ── 1. History Page View (Active) ── */}
        {activeItemId && report && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
            
            {/* Left: Image Panel (Independent Scroll) */}
            <div className="no-scrollbar" style={{ 
              width: '48%', height: '100%', backgroundColor: '#FFFFFF', 
              position: 'relative'
            }}>
              <div className="scroll-mask-top" />
              <div style={{ height: '100%', overflowY: 'auto', padding: '40px', overscrollBehavior: 'contain' }} className="no-scrollbar">
                <div 
                  onClick={() => { setLightboxUrl((report as any).screenshotUrl || (report as any).thumbnailUrl); setIsLightboxOpen(true) }}
                  style={{ 
                    cursor: 'zoom-in', borderRadius: '16px', overflow: 'hidden', 
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)', transition: 'transform 0.2s' 
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img 
                    src={(report as any).screenshotUrl || (report as any).thumbnailUrl} 
                    alt="Source" 
                    style={{ width: '100%', display: 'block' }} 
                  />
                </div>
              </div>
            </div>

            {/* Right: Content Panel (Independent Scroll) */}
            <div className="no-scrollbar" style={{ flex: 1, height: '100%', overflowY: 'auto', backgroundColor: '#FFFFFF', position: 'relative' }}>
              <div className="scroll-mask-top" />
              
              {/* Sticky Header inside the scrollable area for report context */}
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

              {/* Report Body */}
              <div style={{ padding: '0 48px 80px' }}>
                <h1 style={{ 
                  fontSize: '32px', fontWeight: 700, color: '#1D1D1F', margin: '0 0 40px 0', 
                  lineHeight: 1.1, letterSpacing: '-0.03em' 
                }}>
                  {report.sourceLabel}
                </h1>
                <StyleReportView report={report} lang={reportLang} />
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Home Content (Idle/Initial/Extracting) ── */}
        {(!activeItemId || !report || isExtracting) && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px', gap: '0', position: 'relative', animation: 'fadeIn 0.4s ease-out'
          }}>

            {/* Error toast */}
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

            <div style={{ width: '100%', maxWidth: '500px' }}>

              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D1D1F' }}>
                  <Sparkles size={24} strokeWidth={1.5} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1D1D1F', letterSpacing: '-0.02em', margin: 0 }}>开始解析设计</h1>
              </div>

              {/* URL input */}
              <form onSubmit={handleUrlSubmit} style={{ position: 'relative', marginBottom: '32px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  backgroundColor: '#FFFFFF', border: `1px solid ${isExtracting ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: '16px', height: '64px', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isExtracting ? '0 8px 32px rgba(0,0,0,0.08)' : '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ paddingLeft: '24px', paddingRight: '12px', color: '#8E8E93', flexShrink: 0 }}>
                    <Link2 size={22} strokeWidth={2} />
                  </div>
                  <input
                    ref={urlInputRef}
                    type="text"
                    placeholder="粘贴网页链接，如 https://linear.app"
                    style={{
                      flex: 1, border: 'none', outline: 'none', fontSize: '16px',
                      color: '#1D1D1F', fontWeight: 500, backgroundColor: 'transparent',
                      fontFamily: 'var(--font-sans)', height: '100%'
                    }}
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    disabled={isExtracting}
                  />
                  <button
                    type="submit"
                    disabled={isExtracting || !url.trim()}
                    style={{
                      margin: '8px 10px', padding: '0 24px', height: '44px',
                      borderRadius: '10px', border: 'none',
                      backgroundColor: isExtracting ? '#8E8E93' : '#1D1D1F', color: '#FFFFFF', 
                      fontSize: '14px', fontWeight: 600, cursor: (isExtracting || !url.trim()) ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: (!isExtracting && !url.trim()) ? 0.3 : 1,
                      transition: 'all 0.2s', flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={e => { if(!isExtracting && !!url.trim()) e.currentTarget.style.backgroundColor = '#333333' }}
                    onMouseLeave={e => { if(!isExtracting && !!url.trim()) e.currentTarget.style.backgroundColor = '#1D1D1F' }}
                  >
                    {isExtracting ? '解析中' : '立即解析'}
                  </button>
                </div>
              </form>

              {/* OR divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '6px 0 24px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
                <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>或</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
              </div>

              {/* Drop zone */}
              <div
                style={{
                  width: '100%', height: '180px', borderRadius: '12px',
                  border: `1px solid ${isDragging ? '#1D1D1F' : 'rgba(0,0,0,0.06)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '12px', cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isDragging ? 'rgba(0,0,0,0.01)' : '#FFFFFF',
                  opacity: isExtracting ? 0.45 : 1,
                  pointerEvents: isExtracting ? 'none' : 'auto',
                  borderStyle: 'dashed'
                }}
                onMouseEnter={e => !isDragging && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)')}
                onMouseLeave={e => !isDragging && (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => user ? fileInputRef.current?.click() : setIsAuthVisible(true)}
                onPaste={handlePaste}
                tabIndex={0}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: '#F5F5F7', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#1D1D1F'
                }}>
                  <Plus size={16} strokeWidth={1.5} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1D1D1F', marginBottom: '8px' }}>
                    {isDragging ? '释放以上传' : '拖拽设计图至此处'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 400 }}>支持 JPG、PNG、WebP，最大 20MB</div>
                </div>
              </div>

              {/* Progress UI - Scanner Style (Below Drop Zone) */}
              {isExtracting && (
                <div style={{ marginTop: '48px', animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ fontSize: '12px', color: '#1D1D1F', marginBottom: '12px', opacity: 0.6, fontWeight: 500 }}>
                    正在解析网页链路，重构设计树 (约需 15 秒) ...
                  </div>
                  <div style={{ 
                    width: '100%', height: '1px', backgroundColor: '#F5F5F7', 
                    borderRadius: '1px', overflow: 'hidden', position: 'relative' 
                  }}>
                    <div className="animate-scan" style={{ 
                      position: 'absolute', top: 0, width: '40%', height: '100%', 
                      backgroundColor: '#1D1D1F', opacity: 0.8
                    }} />
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }} />
            </div>
          </div>
        )}

        {/* ── 3. Extraction Result Modal (Vercel Production Style) ── */}
        {report && !activeItemId && !isExtracting && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px',
            animation: 'fadeIn 0.4s ease'
          }} onClick={() => { 
            const latest = extractions[0];
            if (latest) {
              setActiveItemId(latest.id);
              setReport(latest.style_data);
            } else {
              setReport(null);
            }
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
            }} onClick={e => e.stopPropagation()}>
              
              {/* Floating Controls (No SOURCE text) */}
              <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '2px', background: '#F5F5F5', padding: '4px', borderRadius: '100px' }}>
                  <button onClick={() => setReportLang('zh')} style={{ padding: '5px 14px', borderRadius: '100px', border: 'none', background: reportLang === 'zh' ? '#fff' : 'transparent', fontSize: '11px', fontWeight: reportLang === 'zh' ? 600 : 400, color: reportLang === 'zh' ? '#1D1D1F' : '#999', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'zh' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>中文</button>
                  <button onClick={() => setReportLang('en')} style={{ padding: '5px 14px', borderRadius: '100px', border: 'none', background: reportLang === 'en' ? '#fff' : 'transparent', fontSize: '12px', fontWeight: reportLang === 'en' ? 600 : 400, color: reportLang === 'en' ? '#1D1D1F' : '#999', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'en' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>EN</button>
                </div>
                <button
                  onClick={() => {
                    const latest = extractions[0];
                    if (latest) {
                      setActiveItemId(latest.id);
                      setReport(latest.style_data);
                    } else {
                      setReport(null);
                    }
                  }}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F5F5F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#1A1A1A', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EBEBEB' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F5' }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Split View */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left: Component View (44%) */}
                <div className="no-scrollbar" style={{ width: '44%', background: '#FFFFFF', padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
                    <img
                      src={(report as any).screenshotUrl || (report as any).thumbnailUrl}
                      alt="Source"
                      style={{ width: '100%', display: 'block', objectFit: 'contain', cursor: 'zoom-in', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                      onClick={() => { setLightboxUrl((report as any).screenshotUrl || (report as any).thumbnailUrl); setIsLightboxOpen(true) }}
                    />
                  </div>
                </div>

                {/* Right: Analysis View (56%) */}
                <div className="no-scrollbar" style={{ width: '56%', padding: '64px', overflowY: 'auto', background: '#FFFFFF' }}>
                  <StyleReportView report={report!} lang={reportLang} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            SEARCH OVERLAY MODAL
        ════════════════════════════════════════ */}
        {isSearchOpen && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 100,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh',
            backdropFilter: 'blur(2px)', animation: 'overlayFade 0.2s ease-out'
          }} onClick={() => setIsSearchOpen(false)}>
            <div style={{
              width: '100%', maxWidth: '640px', backgroundColor: '#FFFFFF', borderRadius: '12px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              animation: 'tooltipPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)', margin: '0 20px'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Search size={18} strokeWidth={1.5} style={{ color: '#8E8E93', marginRight: '12px' }} />
                <input
                  ref={searchInputRef}
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search extractions and history..."
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#1D1D1F',
                    backgroundColor: 'transparent', fontFamily: 'var(--font-sans)', padding: '6px 0'
                  }}
                />
                <button onClick={() => setIsSearchOpen(false)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#8E8E93',
                  borderRadius: '6px', transition: 'background 0.1s'
                }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <X size={16} />
                </button>
              </div>
              <div className="no-scrollbar" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '8px 0' }}>
                {allFiltered.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#A1A1A6', fontSize: '14px' }}>
                    未找到包含该关键词的记录
                  </div>
                ) : (
                  allFiltered.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveItemId(item.id)
                        setReport(item.style_data)
                        setError(null)
                        setIsSearchOpen(false)
                        setIsModalImageLoading(true)
                      }}
                      style={{
                        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px',
                        cursor: 'pointer', transition: 'background 0.1s', borderBottom: '1px solid rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {(item.style_data as any)?.__pinned ? (
                          <Star size={14} fill="#FF9500" strokeWidth={0} />
                        ) : (item.thumbnail_url?.startsWith('http') ? (
                          <img src={`https://www.google.com/s2/favicons?domain=${new URL(item.thumbnail_url).hostname}&sz=32`} alt="" style={{ width: '16px', height: '16px' }} onError={e => e.currentTarget.style.display = 'none'} />
                        ) : (
                          <Sparkles size={14} strokeWidth={1.5} color="#8E8E93" />
                        ))}
                      </div>
                      <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F' }}>{item.source_label || '未命名分析'}</div>
                        <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>{new Date(item.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ color: '#C7C7CC' }}>
                        <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Lightbox full-screen viewer */}
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
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
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

      {/* Auth overlay */}
      {isAuthVisible && <AuthOverlay onClose={() => setIsAuthVisible(false)} />}
    </div>
    </>
  )
}

// ── Sub-components ──────────────────────────────────────────────────

function SidebarBtn({ icon, label, onClick, active = false }: {
  icon: React.ReactNode, label: string, onClick: () => void, active?: boolean
}) {
  return (
      <button
        onClick={onClick}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 12px', borderRadius: '8px', border: 'none',
          backgroundColor: active ? '#F5F5F7' : 'transparent',
          color: active ? '#1D1D1F' : '#1D1D1F', cursor: 'pointer', textAlign: 'left',
          fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-sans)',
          transition: 'background 0.1s'
        }}
        onMouseEnter={e => !active && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)')}
        onMouseLeave={e => !active && (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span style={{ opacity: 0.8, display: 'flex', width: '20px', justifyContent: 'flex-start' }}>{icon}</span>
      {label}
    </button>
  )
}

function HistoryItem({ label, isActive, isPinned, onClick, onPin }: {
  label: string, isActive: boolean, isPinned: boolean,
  onClick: () => void, onPin: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ position: 'relative', borderRadius: '8px', marginBottom: '1px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        style={{
          width: '100%', padding: '10px 28px 10px 12px', borderRadius: '8px',
          fontSize: '14px', fontWeight: isActive ? 500 : 400,
          color: isActive ? '#1D1D1F' : '#8E8E93',
          backgroundColor: isActive ? '#F5F5F7' : (hovered ? 'rgba(0,0,0,0.02)' : 'transparent'),
          border: 'none', cursor: 'pointer', textAlign: 'left',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'var(--font-sans)', display: 'block', transition: 'all 0.1s'
        }}
      >
        {label}
      </button>
      {/* Pin button appears on hover */}
      {(hovered || isPinned) && (
        <button
          onClick={e => { e.stopPropagation(); onPin() }}
          title={isPinned ? '取消收藏' : '收藏'}
          style={{
            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
            width: '20px', height: '20px', border: 'none', background: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isPinned ? '#FF9500' : '#C7C7CC', transition: 'color 0.15s', padding: 0
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#FF9500'}
          onMouseLeave={e => e.currentTarget.style.color = isPinned ? '#FF9500' : '#C7C7CC'}
        >
          <Star size={13} strokeWidth={isPinned ? 0 : 1.5} fill={isPinned ? '#FF9500' : 'none'} />
        </button>
      )}
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 12px', textAlign: 'left', fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
      {children}
    </div>
  )
}
