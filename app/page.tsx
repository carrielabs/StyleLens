'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Link2, HelpCircle, UserIcon, Sparkles, X, ChevronLeft, MoreHorizontal, Upload, Pin, ChevronDown, SidebarClose, SidebarOpen } from 'lucide-react'
import StyleReportView from '@/components/report/StyleReport'
import AuthOverlay from '@/components/auth/AuthOverlay'
import { createClient } from '@/lib/storage/supabaseClient'
import { deleteFromLibrary, renameInLibrary } from '@/lib/storage/libraryStore'
import { getGreeting, GreetingData } from '@/lib/utils/greeting'
import type { StyleReport } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

// ── Color role priority for sidebar dots ──
const COLOR_ROLE_ORDER = ['background', 'primary', 'accent', 'secondary', 'text', 'other']
function getTopColors(colors: any[]): any[] {
  if (!colors || !Array.isArray(colors)) return []
  const sorted = [...colors].sort((a, b) => {
    const ai = COLOR_ROLE_ORDER.indexOf((a.role || 'other').toLowerCase())
    const bi = COLOR_ROLE_ORDER.indexOf((b.role || 'other').toLowerCase())
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  return sorted.slice(0, 3)
}

export default function Home() {
  // ── Core state ──
  const [url, setUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [report, setReport] = useState<StyleReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reportLang, setReportLang] = useState<'zh' | 'en'>('zh')
  const [extractionProgress, setExtractionProgress] = useState(0)

  // ── Auth state ──
  const [isAuthVisible, setIsAuthVisible] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // ── Sidebar state ──
  const [extractions, setExtractions] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalSearchQuery, setModalSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNewSelected, setIsNewSelected] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState('')

  // ── Upload preview state ──
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const [uploadZoneHovered, setUploadZoneHovered] = useState(false)

  // ── Sidebar context menu / rename state ──
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // ── Undo delete toast ──
  const [undoItem, setUndoItem] = useState<{ id: string; label: string; record: any } | null>(null)
  const deleteTimerRef = useRef<{ [key: string]: any }>({})

  // ── Sidebar section collapse ──
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false)
  const [historyCollapsed, setHistoryCollapsed] = useState(false)

  // ── Sidebar panel toggle ──
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ── Dynamic Greeting state ──
  const [greeting, setGreeting] = useState<GreetingData | null>(null)

  const historyLoadedRef = useRef(false)
  const extractAbortRef = useRef<AbortController | null>(null)
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

  // ── Auth listener (stable, empty deps) ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session && !historyLoadedRef.current) {
        historyLoadedRef.current = true
        loadHistory(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session) {
        setIsAuthVisible(false)
        if (!historyLoadedRef.current) {
          historyLoadedRef.current = true
          loadHistory(session.user.id)
        }
      } else {
        setExtractions([])
        historyLoadedRef.current = false
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update Greeting when user changes ──
  useEffect(() => {
    setGreeting(getGreeting(user?.email))
    // Update every minute to catch hour transitions
    const timer = setInterval(() => setGreeting(getGreeting(user?.email)), 60000)
    return () => clearInterval(timer)
  }, [user])

  // ── Keyboard & click-outside handler ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-menu-trigger')) setShowUserMenu(false)
      if (!target.closest('.context-menu-anchor')) setContextMenuId(null)
    }
    window.addEventListener('click', handleClickOutside)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (contextMenuId) { setContextMenuId(null); return }
        if (renamingId) { setRenamingId(null); setRenameValue(''); return }
        if (report) { setReport(null); setActiveItemId(null); return }
        if (isSearchOpen) { setIsSearchOpen(false); setSearchQuery(''); return }
        setShowUserMenu(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [report, isSearchOpen, contextMenuId, renamingId])

  useEffect(() => {
    if (report) {}
  }, [report])

  // ── Extraction Progress Timer ──
  useEffect(() => {
    let interval: any
    if (isExtracting && !report) {
      setExtractionProgress(0)
      interval = setInterval(() => {
        setExtractionProgress(prev => prev >= 95 ? 95 : prev + 1)
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
        .limit(50)
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
      await loadHistory(user.id)
    } catch (err) {
      console.error('Failed to save extraction:', err)
    }
  }

  const togglePin = async (itemId: string) => {
    setExtractions(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const isPinned = item.style_data?.__pinned === true
      return { ...item, style_data: { ...item.style_data, __pinned: !isPinned } }
    }))
    const item = extractions.find(e => e.id === itemId)
    if (item) {
      const isPinned = item.style_data?.__pinned === true
      await supabase
        .from('style_records')
        .update({ style_data: { ...item.style_data, __pinned: !isPinned } })
        .eq('id', itemId)
    }
  }

  // ── Delete with undo ──
  const deleteItem = (id: string) => {
    const record = extractions.find(e => e.id === id)
    if (!record) return
    const label = record.source_label || '未命名分析'

    // Optimistic remove
    setExtractions(prev => prev.filter(e => e.id !== id))
    if (activeItemId === id) { setActiveItemId(null); setReport(null) }
    setContextMenuId(null)

    // Show undo toast
    setUndoItem({ id, label, record })

    // 5s timer to actually delete
    deleteTimerRef.current[id] = setTimeout(async () => {
      await deleteFromLibrary(id, supabase)
      setUndoItem(prev => (prev?.id === id ? null : prev))
    }, 5000)
  }

  const undoDelete = () => {
    if (!undoItem) return
    clearTimeout(deleteTimerRef.current[undoItem.id])
    delete deleteTimerRef.current[undoItem.id]
    setExtractions(prev => {
      const exists = prev.find(e => e.id === undoItem.id)
      if (exists) return prev
      return [undoItem.record, ...prev].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
    setUndoItem(null)
  }

  // ── Rename ──
  const startRename = (id: string, currentLabel: string) => {
    setRenamingId(id)
    setRenameValue(currentLabel)
    setContextMenuId(null)
  }

  const submitRename = async (id: string) => {
    const trimmed = renameValue.trim()
    if (!trimmed) { cancelRename(); return }
    setExtractions(prev => prev.map(e => e.id === id ? { ...e, source_label: trimmed } : e))
    
    // Sync with active report if renamed item is current
    if (id === activeItemId && report) {
      setReport({ ...report, sourceLabel: trimmed })
    }

    setRenamingId(null)
    setRenameValue('')
    await renameInLibrary(id, trimmed, supabase)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  // ── Extraction ──
  const callExtractAPI = async (payload: { screenshotUrl?: string; imageBase64?: string; sourceLabel?: string }, signal?: AbortSignal) => {
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || '提取失败，请重试')
    return data.report as StyleReport
  }

  const cancelExtraction = () => {
    extractAbortRef.current?.abort()
    extractAbortRef.current = null
    setIsExtracting(false)
    setError(null)
    if (pendingPreviewUrl) { URL.revokeObjectURL(pendingPreviewUrl); setPendingPreviewUrl(null) }
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

    const abort = new AbortController()
    extractAbortRef.current = abort

    setIsExtracting(true)
    setReport(null)
    setActiveItemId(null)
    setError(null)
    try {
      const ssRes = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: abort.signal,
      })
      const ssData = await ssRes.json()
      if (!ssData.success) throw new Error(ssData.error || '截图失败')

      let label = url.trim()
      try { label = new URL(url.trim()).hostname.replace(/^www\./, '') } catch (e) {}

      const result = await callExtractAPI({ screenshotUrl: ssData.screenshotUrl, sourceLabel: label }, abort.signal)
      result.thumbnailUrl = ssData.screenshotUrl

      await saveExtraction(result, ssData.screenshotUrl)
      setReport(result)
      setUrl('')
    } catch (err: unknown) {
      if ((err as any)?.name === 'AbortError') return
      let msg = err instanceof Error ? err.message : '未知错误'
      if (msg.includes('Failed to fetch')) msg = '网络连接失败，请检查网络后重试'
      setError(msg)
    } finally {
      setIsExtracting(false)
      extractAbortRef.current = null
    }
  }

  // ── File preview (without extracting) ──
  const handleFilePreview = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return }
    if (file.size > 20 * 1024 * 1024) { setError('图片过大，请上传 20MB 以内的图片'); return }
    const objectUrl = URL.createObjectURL(file)
    setPendingFile(file)
    setPendingPreviewUrl(objectUrl)
    setError(null)
  }

  // ── Actually extract the pending file ──
  const handleExtractFile = async () => {
    if (!pendingFile) return
    if (!user) { setIsAuthVisible(true); return }

    const abort = new AbortController()
    extractAbortRef.current = abort

    setIsExtracting(true)
    setReport(null)
    setActiveItemId(null)
    setError(null)
    const file = pendingFile
    const previewUrl = pendingPreviewUrl
    setPendingFile(null)

    try {
      const base64 = await toBase64(file)
      const result = await callExtractAPI({ imageBase64: base64, sourceLabel: file.name }, abort.signal)
      result.thumbnailUrl = base64

      await saveExtraction(result, base64)
      setReport(result)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      setError(err.message || '上传分析失败')
    } finally {
      setIsExtracting(false)
      extractAbortRef.current = null
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPendingPreviewUrl(null)
    }
  }

  const clearPendingFile = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(null)
    setPendingPreviewUrl(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFilePreview(file)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) handleFilePreview(file)
        break
      }
    }
  }

  // ── Helpers ──
  const getInitials = (email: string) => email.charAt(0).toUpperCase()
  const getAvatarColor = (email: string) => {
    const colors = ['#FF9500', '#FF2D55', '#5856D6', '#34C759', '#007AFF', '#AF52DE']
    let hash = 0
    for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  const allFiltered = extractions.filter(item =>
    !searchQuery || (item.source_label || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  const modalFiltered = extractions.filter(item =>
    !modalSearchQuery || (item.source_label || '').toLowerCase().includes(modalSearchQuery.toLowerCase())
  )
  const pinnedList = allFiltered.filter(item => item.style_data?.__pinned === true)
  const recentList = allFiltered.filter(item => !item.style_data?.__pinned)

  // ── Upload zone state derivation ──
  const uploadState = isExtracting
    ? 'extracting'
    : pendingFile
    ? 'selected'
    : isDragging
    ? 'dragover'
    : uploadZoneHovered
    ? 'hover'
    : 'idle'

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
        .upload-icon-float:hover svg {
          animation: uploadIconFloat 0.6s ease-in-out;
        }
        @keyframes doodleFloat {
          0%, 100% { transform: translateY(0) scale(1.1); }
          50% { transform: translateY(-4px) scale(1.12); }
        }
        .doodle-illustration {
          animation: doodleFloat 4s ease-in-out infinite;
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
        width: sidebarOpen ? '270px' : '48px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        backgroundColor: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.06)',
        overflow: 'hidden', transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Brand wordmark + sidebar toggle */}
        <div style={{
          padding: sidebarOpen ? '22px 16px 14px' : '18px 10px 14px',
          display: 'flex', alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          flexShrink: 0, minWidth: sidebarOpen ? '270px' : '48px'
        }}>
          {sidebarOpen && (
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>StyleLens</span>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
            style={{
              width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '6px', color: 'rgba(0,0,0,0.5)', transition: 'all 0.15s', flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = 'rgba(0,0,0,0.75)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(0,0,0,0.5)' }}
          >
            {sidebarOpen
              ? <SidebarClose size={16} strokeWidth={1.6} />
              : <SidebarOpen size={16} strokeWidth={1.6} />
            }
          </button>
        </div>

        {/* Top Actions */}
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '1px', minWidth: '48px' }}>
          <SidebarBtn
            icon={<Plus size={15} strokeWidth={2} />}
            label="New Extraction"
            collapsed={!sidebarOpen}
            active={isNewSelected}
            onClick={() => {
              setIsNewSelected(true)
              setIsSearchOpen(false)
              setReport(null)
              setActiveItemId(null)
              setError(null)
              setUrl('')
              clearPendingFile()
              setTimeout(() => urlInputRef.current?.focus(), 50)
            }}
          />
          <SidebarBtn
            icon={<Search size={15} strokeWidth={2} />}
            label="Search"
            collapsed={!sidebarOpen}
            active={isSearchOpen}
            onClick={() => {
              setIsSearchOpen(true)
              setIsNewSelected(false)
              setModalSearchQuery('') // Reset modal search on open
              setTimeout(() => searchInputRef.current?.focus(), 100)
            }}
          />
        </div>

        {/* Pinned section — hidden when icon-strip mode */}
        {sidebarOpen && pinnedList.length > 0 && (
          <>
            <SectionHeader label="Pinned" collapsed={pinnedCollapsed} onToggle={() => setPinnedCollapsed(v => !v)} />
            {!pinnedCollapsed && (
              <div className="no-scrollbar" style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {pinnedList.map(item => (
                  <HistoryItem
                    key={item.id}
                    id={item.id}
                    label={item.source_label || 'Untitled'}
                    thumbnailUrl={item.thumbnail_url}
                    colors={item.style_data?.colors || []}
                    isActive={activeItemId === item.id}
                    isPinned={true}
                    contextMenuOpen={contextMenuId === item.id}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onClick={() => { setActiveItemId(item.id); setReport(item.style_data); setError(null) }}
                    onContextMenu={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === item.id ? null : item.id) }}
                    onPin={() => togglePin(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    onStartRename={() => startRename(item.id, item.source_label || 'Untitled')}
                    onRenameSubmit={() => submitRename(item.id)}
                    onRenameCancel={cancelRename}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* History section — hidden when icon-strip mode */}
        {sidebarOpen && <SectionHeader label="History" collapsed={historyCollapsed} onToggle={() => setHistoryCollapsed(v => !v)} />}

        <div className="no-scrollbar" style={{ flex: 1, overflowY: sidebarOpen ? 'auto' : 'hidden', padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {!sidebarOpen ? null : historyCollapsed ? null : !user ? (
            <EmptyState>登录后查看历史记录</EmptyState>
          ) : isLoadingHistory ? (
            <div style={{ padding: '8px 4px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  height: '50px', borderRadius: '8px', marginBottom: '2px',
                  backgroundColor: 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s infinite'
                }} />
              ))}
            </div>
          ) : recentList.length === 0 ? (
            <EmptyState>
              {searchQuery ? '未找到匹配记录' : '暂无历史记录'}
            </EmptyState>
          ) : (
            recentList.map(item => (
              <HistoryItem
                key={item.id}
                id={item.id}
                label={item.source_label || '未命名分析'}
                thumbnailUrl={item.thumbnail_url}
                colors={item.style_data?.colors || []}
                isActive={activeItemId === item.id}
                isPinned={false}
                contextMenuOpen={contextMenuId === item.id}
                renamingId={renamingId}
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onClick={() => { setActiveItemId(item.id); setReport(item.style_data); setError(null) }}
                onContextMenu={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === item.id ? null : item.id) }}
                onPin={() => togglePin(item.id)}
                onDelete={() => deleteItem(item.id)}
                onStartRename={() => startRename(item.id, item.source_label || '未命名分析')}
                onRenameSubmit={() => submitRename(item.id)}
                onRenameCancel={cancelRename}
              />
            ))
          )}
        </div>

        {/* User footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(0,0,0,0.06)', position: 'relative' }}>
          {showUserMenu && user && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '10px', right: '10px', marginBottom: '6px',
              backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
              border: '1px solid rgba(0,0,0,0.06)', padding: '6px', zIndex: 50, animation: 'slideUp 0.15s ease-out'
            }}>
              <div style={{ padding: '8px 12px 6px', fontSize: '11px', color: '#8E8E93', borderBottom: '1px solid rgba(0,0,0,0.04)', marginBottom: '4px' }}>
                {user.email}
              </div>
              <button
                onClick={async () => { await supabase.auth.signOut(); setShowUserMenu(false) }}
                style={{
                  width: '100%', padding: '7px 12px', textAlign: 'left', border: 'none',
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
            title={!sidebarOpen ? (user ? (user.email?.split('@')[0] || 'User') : '登录 / 注册') : undefined}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '8px', padding: sidebarOpen ? '6px 10px' : '8px 0',
              borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: showUserMenu ? 'rgba(0,0,0,0.04)' : 'transparent',
            }}
            onMouseEnter={e => !showUserMenu && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.025)')}
            onMouseLeave={e => !showUserMenu && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <UserIcon size={14} style={{ color: '#8E8E93', flexShrink: 0 }} strokeWidth={2} />
            {sidebarOpen && (
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)' }}>
                {user ? (user.email?.split('@')[0] || 'User') : '登录 / 注册'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN WORKSPACE
      ══════════════════════════════════════════ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#FFFFFF', overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>

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

            <div className="no-scrollbar" style={{
              width: '40%', height: '100%', backgroundColor: '#FFFFFF',
              position: 'relative'
            }}>
              <div className="scroll-mask-top" />
              <div style={{ height: '100%', overflowY: 'auto', padding: '64px 40px 40px', overscrollBehavior: 'contain' }} className="no-scrollbar">
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

            {/* Right: Content Panel */}
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
              <div style={{ padding: '0 48px 80px' }}>
                <h1 style={{
                  fontSize: '32px', fontWeight: 700, color: '#1D1D1F', margin: '0 0 40px 0',
                  lineHeight: 1.1, letterSpacing: '-0.03em'
                }}>
                  {report.sourceLabel}
                </h1>
                <StyleReportView report={report} lang={reportLang} fullWidth={true} />
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Home Content (Idle/Initial/Extracting) ── */}
        {(!activeItemId || !report || isExtracting) && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            padding: '48px', paddingTop: '18vh', gap: '0', position: 'relative', animation: 'fadeIn 0.4s ease-out'
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

            <div style={{ width: '100%', maxWidth: '640px' }}>

              {/* Heading — Dynamic Greeting (Simplified) */}
              <div style={{
                textAlign: 'left', marginBottom: '56px', display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', gap: '0', animation: 'fadeIn 0.6s ease-out'
              }}>
                <h1 style={{
                  fontSize: '52px', color: '#1D1D1F', fontWeight: 300,
                  fontFamily: 'var(--font-sans)', letterSpacing: '-0.04em',
                  margin: 0, transition: 'all 0.3s ease',
                  lineHeight: '1.1', display: 'flex', alignItems: 'baseline', gap: '0.2em'
                }}>
                  <span>{greeting?.prefix}</span>
                  <span style={{ opacity: 1.0 }}>{greeting?.name}</span>
                </h1>
              </div>

              {/* URL input */}
              <form onSubmit={handleUrlSubmit} style={{ position: 'relative', marginBottom: '28px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px', height: '54px', overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onFocusCapture={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(0,0,0,0.12)'
                  el.style.boxShadow = '0 0 0 4px rgba(0,0,0,0.03), 0 8px 30px rgba(0,0,0,0.04)'
                }}
                onBlurCapture={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(0,0,0,0.06)'
                  el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)'
                }}
                >
                  <div style={{ paddingLeft: '18px', paddingRight: '10px', color: '#8E8E93', flexShrink: 0 }}>
                    <Link2 size={18} strokeWidth={1.8} />
                  </div>
                  <input
                    ref={urlInputRef}
                    type="text"
                    placeholder="粘贴网页链接，如 https://linear.app"
                    style={{
                      flex: 1, border: 'none', outline: 'none', fontSize: '15px',
                      color: '#1D1D1F', fontWeight: 450, backgroundColor: 'transparent',
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
                      margin: '8px 8px', padding: '0 20px', height: '36px',
                      borderRadius: '8px', border: 'none',
                      background: (isExtracting || !url.trim()) ? 'rgba(0,0,0,0.12)' : 'linear-gradient(180deg, #2C2C2E 0%, #1D1D1F 100%)',
                      color: '#FFFFFF',
                      fontSize: '13px', fontWeight: 600,
                      cursor: (isExtracting || !url.trim()) ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s', flexShrink: 0,
                      letterSpacing: '-0.01em'
                    }}
                    onMouseEnter={e => { if (!isExtracting && !!url.trim()) e.currentTarget.style.background = 'linear-gradient(180deg, #3A3A3C 0%, #2C2C2E 100%)' }}
                    onMouseLeave={e => { if (!isExtracting && !!url.trim()) e.currentTarget.style.background = 'linear-gradient(180deg, #2C2C2E 0%, #1D1D1F 100%)' }}
                  >
                    {isExtracting ? '解析中' : '立即解析'}
                  </button>
                </div>
              </form>

              {/* OR divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '4px 0 24px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
                <span style={{
                  fontSize: '9px', color: '#BDBDBD', fontWeight: 600,
                  letterSpacing: '0.02em', textTransform: 'none', fontFamily: 'var(--font-sans)'
                }}>或</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
              </div>

              {/* Drop zone — 6 states */}
              <div
                style={{
                  width: '100%', height: '200px', borderRadius: '14px',
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
                  pointerEvents: uploadState === 'extracting' ? 'none' : 'auto',
                  overflow: 'hidden', position: 'relative'
                }}
                onMouseEnter={() => !isDragging && !pendingFile && setUploadZoneHovered(true)}
                onMouseLeave={() => setUploadZoneHovered(false)}
                onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => {
                  if (pendingFile) return
                  user ? fileInputRef.current?.click() : setIsAuthVisible(true)
                }}
                onPaste={handlePaste}
                tabIndex={0}
              >
                {/* State: file selected — image preview */}
                {(uploadState === 'selected' || uploadState === 'extracting') && pendingPreviewUrl && (
                  <>
                    <img
                      src={pendingPreviewUrl}
                      alt="Preview"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)'
                    }} />
                    {/* Scan overlay during extracting */}
                    {uploadState === 'extracting' && (
                      <div className="animate-scan" style={{
                        position: 'absolute', top: 0, width: '60%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        pointerEvents: 'none'
                      }} />
                    )}
                    {/* Bottom bar: filename + 立即解析 (no X here, only top-right X) */}
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
                    {/* Top-right X — only clear button */}
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

                {/* State: idle / hover / dragover */}
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
                        {uploadState === 'dragover' ? '释放以解析' : '拖拽设计图 / 点击上传'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#AEAEB2', fontWeight: 400 }}>支持 JPG、PNG、WebP，最大 20MB</div>
                    </div>
                  </>
                )}
              </div>

              {/* Progress UI — absolute bottom, won't shift layout */}
              {isExtracting && !pendingPreviewUrl && (
                <div style={{
                  position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                  width: '100%', maxWidth: '500px', animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#1D1D1F', opacity: 0.5, fontWeight: 500 }}>
                      正在解析设计，约需 15 秒 ...
                    </span>
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
                  </div>
                  <div style={{
                    width: '100%', height: '1px', backgroundColor: '#F0F0F0',
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
                onChange={e => { if (e.target.files?.[0]) handleFilePreview(e.target.files[0]) }} />
            </div>
          </div>
        )}

        {/* ── 3. Extraction Result Modal ── */}
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
            if (latest) { setActiveItemId(latest.id); setReport(latest.style_data) }
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

              {/* Controls */}
              <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '2px', background: '#F5F5F5', padding: '4px', borderRadius: '100px' }}>
                  <button onClick={() => setReportLang('zh')} style={{ padding: '5px 14px', borderRadius: '100px', border: 'none', background: reportLang === 'zh' ? '#fff' : 'transparent', fontSize: '11px', fontWeight: reportLang === 'zh' ? 600 : 400, color: reportLang === 'zh' ? '#1D1D1F' : '#999', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'zh' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>中文</button>
                  <button onClick={() => setReportLang('en')} style={{ padding: '5px 14px', borderRadius: '100px', border: 'none', background: reportLang === 'en' ? '#fff' : 'transparent', fontSize: '12px', fontWeight: reportLang === 'en' ? 600 : 400, color: reportLang === 'en' ? '#1D1D1F' : '#999', cursor: 'pointer', transition: 'all 0.2s', boxShadow: reportLang === 'en' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>EN</button>
                </div>
                <button
                  onClick={() => {
                    const latest = extractions[0]
                    if (latest) { setActiveItemId(latest.id); setReport(latest.style_data) }
                    else setReport(null)
                  }}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F5F5F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EBEBEB' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F5' }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Split View */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.06)', zIndex: 100,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
            paddingTop: '12vh', paddingLeft: '290px',
            backdropFilter: 'none', animation: 'overlayFade 0.2s ease-out'
          }} onClick={() => { setIsSearchOpen(false); setModalSearchQuery('') }}>
            <div style={{
              width: '100%', maxWidth: '600px', height: '540px', backgroundColor: '#FFFFFF', borderRadius: '16px',
              boxShadow: '0 20px 70px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              animation: 'searchModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
              margin: '0 20px'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '12px 14px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '10px 18px',
                  backgroundColor: '#F5F5F7', borderRadius: '12px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'background 0.2s'
                }}>
                  <Search size={18} strokeWidth={1.8} style={{ color: '#8E8E93', marginRight: '14px' }} />
                  <input
                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    value={modalSearchQuery}
                    onChange={e => setModalSearchQuery(e.target.value)}
                    placeholder="搜索历史记录..."
                    style={{
                      flex: 1, border: 'none', outline: 'none', fontSize: '16px', color: '#1D1D1F',
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
                        setActiveItemId(item.id)
                        setReport(item.style_data)
                        setError(null)
                        setIsSearchOpen(false)
                        setModalSearchQuery('')
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
                          <span style={{ fontSize: '14.5px', color: '#1D1D1F', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      </main>

      {/* Lightbox */}
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

      {/* Undo delete toast */}
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

      {/* Auth overlay */}
      {isAuthVisible && <AuthOverlay onClose={() => setIsAuthVisible(false)} />}
    </div>
    </>
  )
}

// ── Sub-components ──────────────────────────────────────────────────

function SidebarBtn({ icon, label, onClick, active = false, collapsed = false }: {
  icon: React.ReactNode, label: string, onClick: () => void, active?: boolean, collapsed?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : '9px',
        padding: collapsed ? '8px 0' : '7px 10px', borderRadius: '8px', border: 'none',
        backgroundColor: active ? 'rgba(0,0,0,0.05)' : 'transparent',
        color: '#1D1D1F', cursor: 'pointer', textAlign: 'left',
        fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-sans)',
        transition: 'background 0.1s'
      }}
      onMouseEnter={e => !active && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.025)')}
      onMouseLeave={e => !active && (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

function HistoryItem({
  id, label, thumbnailUrl, colors, isActive, isPinned,
  contextMenuOpen, renamingId, renameValue, onRenameChange,
  onClick, onContextMenu, onPin, onDelete, onStartRename,
  onRenameSubmit, onRenameCancel
}: {
  id: string
  label: string
  thumbnailUrl?: string | null
  colors: any[]
  isActive: boolean
  isPinned: boolean
  contextMenuOpen: boolean
  renamingId: string | null
  renameValue: string
  onRenameChange: (v: string) => void
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onPin: () => void
  onDelete: () => void
  onStartRename: () => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isRenaming = renamingId === id
  const topColors = getTopColors(colors)

  const thumbnailContent = thumbnailUrl ? (
    <img src={thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  ) : topColors.length > 0 ? (
    <div style={{
      width: '100%', height: '100%',
      background: topColors.length >= 2
        ? `linear-gradient(135deg, ${topColors[0]?.hex || '#F0F0F0'}, ${topColors[1]?.hex || '#E0E0E0'})`
        : topColors[0]?.hex || '#F0F0F0'
    }} />
  ) : (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#F0F0F0' }} />
  )

  return (
    <div
      className="context-menu-anchor"
      style={{ position: 'relative', borderRadius: '8px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={isRenaming ? undefined : onClick}
        style={{
          width: '100%', padding: '8px 10px', paddingRight: (hovered || contextMenuOpen) && !isRenaming ? '32px' : '10px',
          borderRadius: '8px',
          backgroundColor: isActive ? 'rgba(0,0,0,0.05)' : (hovered ? 'rgba(0,0,0,0.025)' : 'transparent'),
          border: 'none', cursor: isRenaming ? 'default' : 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '10px',
          transition: 'background 0.1s'
        }}
      >
        {/* Thumbnail — portrait 3:4 */}
        <div style={{
          width: '40px', height: '42px', borderRadius: '5px', overflow: 'hidden',
          flexShrink: 0, backgroundColor: '#F0F0F0'
        }}>
          {thumbnailContent}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* Label / rename input */}
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => onRenameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); onRenameSubmit() }
                if (e.key === 'Escape') { e.preventDefault(); onRenameCancel() }
              }}
              onBlur={onRenameSubmit}
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: '13px', fontWeight: 500, color: '#1D1D1F',
                border: '1px solid rgba(0,0,0,0.15)', borderRadius: '4px',
                padding: '1px 5px', outline: 'none', background: '#FFFFFF',
                fontFamily: 'var(--font-sans)', width: '100%'
              }}
            />
          ) : (
            <span style={{
              fontSize: '14px', fontWeight: isActive ? 500 : 400,
              color: isActive ? '#1D1D1F' : '#3C3C3E',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip',
              display: 'block', lineHeight: 1.3
            }}>
              {label}
            </span>
          )}

          {/* Color dots only — no hex labels */}
          {!isRenaming && topColors.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {topColors.map((c, i) => (
                <div key={i} style={{
                  width: '15px', height: '15px', borderRadius: '50%',
                  backgroundColor: c.hex || '#CCCCCC',
                  boxShadow: i === 0
                    ? '0 0 0 1px rgba(0,0,0,0.08)'
                    : '0 0 0 1.5px #FFFFFF, 0 0 0 2px rgba(0,0,0,0.08)',
                  marginLeft: i === 0 ? 0 : '-5px',
                  flexShrink: 0
                }} />
              ))}
            </div>
          )}
        </div>
      </button>

      {/* ⋯ context menu trigger */}
      {(hovered || contextMenuOpen) && !isRenaming && (
        <button
          onClick={onContextMenu}
          style={{
            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
            width: '22px', height: '22px', border: 'none',
            background: contextMenuOpen ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
            borderRadius: '5px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#3C3C3E', transition: 'background 0.1s', padding: 0
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = contextMenuOpen ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)'}
        >
          <MoreHorizontal size={13} strokeWidth={2} />
        </button>
      )}

      {/* Context menu dropdown */}
      {contextMenuOpen && (
        <div style={{
          position: 'absolute', right: '6px', top: 'calc(100% + 4px)',
          backgroundColor: '#FFFFFF', borderRadius: '10px', zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
          padding: '5px', minWidth: '160px',
          animation: 'slideDown 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <ContextMenuItem
            label={isPinned ? '取消置顶' : '置顶'}
            icon={<Pin size={13} strokeWidth={1.8} />}
            onClick={e => { e.stopPropagation(); onPin() }}
          />
          <ContextMenuItem
            label="重命名"
            icon={<span style={{ fontSize: '13px', lineHeight: 1 }}>✎</span>}
            onClick={e => { e.stopPropagation(); onStartRename() }}
          />
          <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />
          <ContextMenuItem
            label="删除"
            icon={<X size={13} strokeWidth={2} />}
            danger
            onClick={e => { e.stopPropagation(); onDelete() }}
          />
        </div>
      )}
    </div>
  )
}

function ContextMenuItem({ label, icon, onClick, danger = false }: {
  label: string, icon: React.ReactNode, onClick: (e: React.MouseEvent) => void, danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '7px 10px', border: 'none', borderRadius: '6px',
        background: 'transparent', cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '13px', fontWeight: 500,
        color: danger ? '#FF3B30' : '#1D1D1F',
        fontFamily: 'var(--font-sans)', transition: 'background 0.1s'
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(255,59,48,0.06)' : 'rgba(0,0,0,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#AEAEB2', lineHeight: 1.5 }}>
      {children}
    </div>
  )
}

function SectionHeader({ label, collapsed, onToggle }: {
  label: string, collapsed: boolean, onToggle: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 6px', width: '100%', border: 'none', background: 'none',
        cursor: 'pointer', fontFamily: 'var(--font-sans)'
      }}
    >
      <span style={{ fontSize: '12px', fontWeight: 500, color: hovered ? '#8E8E93' : '#AEAEB2', letterSpacing: '0.01em', textTransform: 'none', transition: 'color 0.15s' }}>
        {label}
      </span>
      <ChevronDown
        size={12}
        strokeWidth={2}
        style={{
          color: hovered ? '#8E8E93' : '#C7C7CC',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease, color 0.15s'
        }}
      />
    </button>
  )
}
