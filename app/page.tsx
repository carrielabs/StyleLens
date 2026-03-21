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
  const [statusText, setStatusText] = useState('')
  const [reportLang, setReportLang] = useState<'zh' | 'en'>('zh')
  const [hoveredHex, setHoveredHex] = useState<string | null>(null)

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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

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
    if (!data.success) throw new Error(data.error || '提取失败，请重试')
    return data.report as StyleReport
  }

  const handleUrlSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!url.trim() || isExtracting) return
    if (!user) { setIsAuthVisible(true); return }

    setIsExtracting(true)
    setStatusText('正在截图...')
    setReport(null)
    setActiveItemId(null)
    setError(null)
    try {
      const ssRes = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const ssData = await ssRes.json()
      if (!ssData.success) throw new Error(ssData.error || '截图失败')
      setStatusText('正在分析设计风格...')
      let label = url.trim()
      try { label = new URL(label).hostname.replace(/^www\./, '') } catch(e){}
      const result = await callExtractAPI({ screenshotUrl: ssData.screenshotUrl, sourceLabel: label })
      result.thumbnailUrl = ssData.screenshotUrl
      setReport(result)
      setUrl('')
      await saveExtraction(result, ssData.screenshotUrl)
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : '未知错误'
      if (msg.includes('Failed to fetch')) msg = '网络连接失败，请检查网络后重试'
      setError(msg)
    } finally {
      setIsExtracting(false)
      setStatusText('')
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return }
    if (file.size > 20 * 1024 * 1024) { setError('图片过大，请上传 20MB 以内的图片'); return }
    if (!user) { setIsAuthVisible(true); return }

    setIsExtracting(true)
    setStatusText('正在分析图像...')
    setReport(null)
    setActiveItemId(null)
    setError(null)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const result = await callExtractAPI({ imageBase64: base64, sourceLabel: file.name })
      result.thumbnailUrl = base64
      setReport(result)
      await saveExtraction(result, base64)
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : '未知错误'
      if (msg.includes('Failed to fetch')) msg = '网络解析失败，请检查连接后重试'
      setError(msg)
    } finally {
      setIsExtracting(false)
      setStatusText('')
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
            icon={<Plus size={16} strokeWidth={1.5} />}
            label="New Extraction"
            onClick={() => {
              setReport(null)
              setActiveItemId(null)
              setError(null)
              setUrl('')
              setTimeout(() => urlInputRef.current?.focus(), 50)
            }}
          />
          <SidebarBtn
            icon={<Search size={16} strokeWidth={1.5} />}
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
              display: 'flex', alignItems: 'center', gap: '12px', padding: '6px',
              borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s',
              backgroundColor: showUserMenu ? 'rgba(0,0,0,0.03)' : 'transparent'
            }}
            onMouseEnter={e => !showUserMenu && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)')}
            onMouseLeave={e => !showUserMenu && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {user ? (
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#8E8E93', fontSize: '10px', fontWeight: 600
              }}>
                <UserIcon size={12} strokeWidth={2} />
              </div>
            ) : (
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={12} style={{ color: '#8E8E93' }} strokeWidth={2} />
              </div>
            )}
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user ? (user.email?.split('@')[0] || 'Ingridyz Davised') : '登录 / 注册'}
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

        {/* ── Home content (shown when no report) ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '48px', gap: '0', position: 'relative'
        }}>

          {/* Error toast */}
          {error && (
            <div style={{
              position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: '500px', padding: '14px 18px', borderRadius: '12px',
              backgroundColor: '#FFF2F1', border: '1px solid rgba(255,59,48,0.12)',
              display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideUp 0.25s ease-out',
              boxShadow: '0 4px 16px rgba(255,59,48,0.08)'
            }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#FF3B30', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>!</div>
              <span style={{ flex: 1, fontSize: '13px', color: '#C0392B', fontWeight: 500 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', opacity: 0.5, display: 'flex', padding: 0 }}><X size={14} /></button>
            </div>
          )}

          <div style={{ width: '100%', maxWidth: '500px' }}>

            {/* Heading */}
            <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D1D1F' }}>
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
                    backgroundColor: '#1D1D1F', color: '#FFFFFF', 
                    fontSize: '14px', fontWeight: 600, cursor: (isExtracting || !url.trim()) ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: (isExtracting || !url.trim()) ? 0.3 : 1,
                    transition: 'all 0.2s', flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={e => { if(!isExtracting && !!url.trim()) e.currentTarget.style.backgroundColor = '#333333' }}
                  onMouseLeave={e => { if(!isExtracting && !!url.trim()) e.currentTarget.style.backgroundColor = '#1D1D1F' }}
                >
                  {isExtracting ? (
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                  ) : '立即解析'}
                </button>
              </div>

              {/* Status Text outside the button to prevent width shifting */}
              <div style={{
                position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0,
                textAlign: 'center', fontSize: '13px', color: '#8E8E93', fontWeight: 500,
                opacity: isExtracting ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none',
                transform: isExtracting ? 'translateY(0)' : 'translateY(-4px)'
              }}>
                {statusText || '正在解析中...'}
              </div>

              {/* Shimmer progress bar — absolute positioned, DOES NOT shift layout */}
              {isExtracting && (
                <div style={{
                  position: 'absolute', bottom: '-1px', left: '14px', right: '14px',
                  height: '2px', borderRadius: '0 0 4px 4px', overflow: 'hidden', zIndex: 1
                }}>
                  <div style={{
                    height: '100%', width: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, #1D1D1F 40%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.8s infinite linear'
                  }} />
                </div>
              )}
            </form>

            {/* OR divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '6px 0 24px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.03)' }} />
              <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>OR</span>
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

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }} />
          </div>
        </div>

        {/* ═══════════════════════════════════════
            REPORT OVERLAY — only covers main area
            (sidebar stays visible on the left)
        ════════════════════════════════════════ */}
        {(report || isExtracting) && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.02)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
            backdropFilter: 'blur(8px)', animation: 'overlayFade 0.2s ease-out'
          }} onClick={() => { if (!isExtracting) { setReport(null); setActiveItemId(null) } }}>
            
            <div style={{
              width: '100%', maxWidth: '1400px', height: '100%', maxHeight: '90vh',
              backgroundColor: '#FFFFFF', borderRadius: '32px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.1)',
              display: 'flex', overflow: 'hidden',
              animation: 'tooltipPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }} onClick={e => e.stopPropagation()}>
              
              {/* Left: Screenshot Card or Skeleton */}
              <div className="no-scrollbar" style={{
                width: '45%', overflowY: 'auto', backgroundColor: '#F8F7F4',
                display: 'block', padding: '48px 40px',
              }}>
                {isExtracting ? (
                  <div style={{
                    width: '100%', height: '100%', minHeight: '600px',
                    borderRadius: '16px', overflow: 'hidden',
                    backgroundColor: '#F0EFEA',
                    backgroundImage: 'linear-gradient(90deg, #F0EFEA 0px, #EBE9E4 50%, #F0EFEA 100%)',
                    backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite linear'
                  }} />
                ) : (
                  <div style={{
                    width: '100%',
                    borderRadius: '16px', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)', 
                    position: 'relative',
                    cursor: 'zoom-in'
                  }} onClick={() => window.open((report as any).screenshotUrl || (report as any).thumbnailUrl, '_blank')}>
                    <img
                      src={(report as any).screenshotUrl || (report as any).thumbnailUrl}
                      alt="Source"
                      style={{ width: '100%', display: 'block' }}
                    />
                    <ColorHighlighter
                      src={(report as any).screenshotUrl || (report as any).thumbnailUrl}
                      targetHex={hoveredHex}
                    />
                  </div>
                )}
              </div>

              {/* Right: Analysis & Header */}
              <div className="no-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: '#FFFFFF', position: 'relative' }}>
                
                {/* Header Row (Close btn & Lang toggle) */}
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '32px 48px 16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SOURCE</span>
                       <div style={{ width: '1px', height: '10px', backgroundColor: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
                       {(['zh', 'en'] as const).map(l => (
                         <button key={l} onClick={() => setReportLang(l)} style={{
                           fontSize: '11px', fontWeight: reportLang === l ? 700 : 500,
                           border: 'none', background: 'none', cursor: 'pointer',
                           color: reportLang === l ? '#1D1D1F' : '#A1A1A6',
                           padding: 0, transition: 'color 0.15s'
                         }}>
                           {l === 'zh' ? '中文' : 'EN'}
                         </button>
                       ))}
                    </div>
                  </div>

                  <button
                    onClick={() => { if (!isExtracting) { setReport(null); setActiveItemId(null) } }}
                    style={{
                      width: '32px', height: '32px', borderRadius: '100px', border: 'none', background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#8E8E93', cursor: (isExtracting ? 'not-allowed' : 'pointer'), transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isExtracting) { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#1D1D1F' } }}
                    onMouseLeave={e => { if (!isExtracting) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8E8E93' } }}
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>

                {/* Main Title (Website Name) */}
                <div style={{ padding: '0 48px 24px' }}>
                  {isExtracting ? (
                    <div style={{ width: '240px', height: '48px', borderRadius: '8px', backgroundColor: '#F5F5F7', backgroundImage: 'linear-gradient(90deg, #F5F5F7 0px, #EEEEEE 50%, #F5F5F7 100%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite linear', marginBottom: '8px' }} />
                  ) : (
                    <h1 style={{ 
                      fontSize: '40px', fontWeight: 700, color: '#1D1D1F', margin: 0, lineHeight: 1.2,
                      letterSpacing: '-0.03em', overflowWrap: 'anywhere'
                    }}>
                      {report?.sourceLabel || new URL((report as any)?.thumbnailUrl || 'https://example.com').hostname.replace('www.', '')}
                    </h1>
                  )}
                </div>

                {/* Analysis Content */}
                <div style={{ padding: '0 48px 64px' }}>
                  {isExtracting ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '16px' }}>
                       {[1, 2, 3].map(i => (
                         <div key={i}>
                           <div style={{ width: '120px', height: '14px', borderRadius: '4px', backgroundColor: '#F5F5F7', marginBottom: '16px' }} />
                           <div style={{ width: '100%', height: '80px', borderRadius: '12px', backgroundColor: '#F5F5F7', backgroundImage: 'linear-gradient(90deg, #F5F5F7 0px, #EEEEEE 50%, #F5F5F7 100%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite linear' }} />
                         </div>
                       ))}
                    </div>
                  ) : (
                    <StyleReportView report={report!} lang={reportLang} />
                  )}
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

      {/* Auth overlay */}
      {isAuthVisible && <AuthOverlay onClose={() => setIsAuthVisible(false)} />}
    </div>
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
