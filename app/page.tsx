'use client'

import { useState, useEffect, useRef } from 'react'
import type { ClipboardEvent as ReactClipboardEvent, DragEvent, FormEvent } from 'react'
import HomeOverlays from '@/components/home/HomeOverlays'
import HomeSidebar from '@/components/home/HomeSidebar'
import HomeWorkspace from '@/components/home/HomeWorkspace'
import { useHistory } from '@/hooks/useHistory'
import { createClient } from '@/lib/storage/supabaseClient'
import { getGreeting, GreetingData } from '@/lib/utils/greeting'
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

  // ── Auth state ──
  const [isAuthVisible, setIsAuthVisible] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [guestTrialUsed, setGuestTrialUsed] = useState(false)
  const [isAuthResolved, setIsAuthResolved] = useState(false)

  // ── Sidebar state ──
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState('')

  // ── Upload preview state ──
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const [uploadZoneHovered, setUploadZoneHovered] = useState(false)

  // ── Sidebar panel toggle ──
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ── Dynamic Greeting state ──
  const [greeting, setGreeting] = useState<GreetingData | null>(null)

  const extractAbortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const {
    extractions,
    isLoadingHistory,
    searchQuery,
    setSearchQuery,
    modalSearchQuery,
    setModalSearchQuery,
    activeItemId,
    setActiveItemId,
    contextMenuId,
    setContextMenuId,
    renamingId,
    setRenamingId,
    renameValue,
    setRenameValue,
    undoItem,
    pinnedCollapsed,
    setPinnedCollapsed,
    historyCollapsed,
    setHistoryCollapsed,
    modalFiltered,
    pinnedList,
    recentList,
    saveExtraction,
    syncHistoryForSession,
    togglePin,
    deleteItem,
    undoDelete,
    startRename,
    submitRename,
    cancelRename,
  } = useHistory({
    user,
    supabase,
    report,
    setReport,
    setError,
    setGuestTrialUsed,
    setIsAuthVisible,
  })

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
    const syncSession = async (session: { user: User } | null) => {
      try {
        setUser(session?.user ?? null)
        await syncHistoryForSession(session)
      } finally {
        setIsAuthResolved(true)
      }
    }

    void supabase.auth.getSession().then(({ data: { session } }) => syncSession(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return
      void syncSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Global paste handler ──
  useEffect(() => {
    const handleGlobalPaste = (e: globalThis.ClipboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        if (!user && guestTrialUsed) {
          setIsAuthVisible(true);
          return;
        }
        const file = files[0];
        setPendingFile(file);
        setPendingPreviewUrl(URL.createObjectURL(file));
        // If it's the home view, focus it visually
        setActiveItemId(null);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [guestTrialUsed, user]);

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

  const handleUrlSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!url.trim() || isExtracting) return

    // Trial Auth Interception (Allow 1st try)
    if (!user && guestTrialUsed) {
      setIsAuthVisible(true)
      return
    }

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
      try { label = new URL(url.trim()).hostname.replace(/^www\./, '') } catch {}

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

    // Trial Auth Interception (Allow 1st try)
    if (!user && guestTrialUsed) {
      setIsAuthVisible(true)
      return
    }

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

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFilePreview(file)
  }

  const handlePaste = async (e: ReactClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) handleFilePreview(file)
        break
      }
    }
  }

  // ── Upload zone state derivation ──
  const isImageExtraction = Boolean(pendingFile || pendingPreviewUrl)
  const uploadState = isImageExtraction && isExtracting
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 0.8s linear infinite;
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
        <HomeSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isSearchOpen={isSearchOpen}
          pinnedCollapsed={pinnedCollapsed}
          setPinnedCollapsed={setPinnedCollapsed}
          historyCollapsed={historyCollapsed}
          setHistoryCollapsed={setHistoryCollapsed}
          pinnedList={pinnedList}
          recentList={recentList}
          activeItemId={activeItemId}
          contextMenuId={contextMenuId}
          setContextMenuId={setContextMenuId}
          renamingId={renamingId}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          user={user}
          isLoadingHistory={isLoadingHistory}
          isAuthResolved={isAuthResolved}
          searchQuery={searchQuery}
          setIsSearchOpen={setIsSearchOpen}
          setModalSearchQuery={setModalSearchQuery}
          setActiveItemId={setActiveItemId}
          setReport={setReport}
          setError={setError}
          setUrl={setUrl}
          clearPendingFile={clearPendingFile}
          urlInputRef={urlInputRef}
          searchInputRef={searchInputRef}
          togglePin={togglePin}
          deleteItem={deleteItem}
          startRename={startRename}
          submitRename={submitRename}
          cancelRename={cancelRename}
          supabase={supabase}
          setIsAuthVisible={setIsAuthVisible}
        />

        <HomeWorkspace
          activeItemId={activeItemId}
          report={report}
          isExtracting={isExtracting}
          extractions={extractions}
          reportLang={reportLang}
          setReportLang={setReportLang}
          setLightboxUrl={setLightboxUrl}
          setIsLightboxOpen={setIsLightboxOpen}
          error={error}
          setError={setError}
          greeting={greeting}
          handleUrlSubmit={handleUrlSubmit}
          urlInputRef={urlInputRef}
          url={url}
          setUrl={setUrl}
          pendingFile={pendingFile}
          pendingPreviewUrl={pendingPreviewUrl}
          uploadState={uploadState}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          setUploadZoneHovered={setUploadZoneHovered}
          handleDrop={handleDrop}
          user={user}
          guestTrialUsed={guestTrialUsed}
          fileInputRef={fileInputRef}
          setIsAuthVisible={setIsAuthVisible}
          handlePaste={handlePaste}
          handleExtractFile={handleExtractFile}
          clearPendingFile={clearPendingFile}
          cancelExtraction={cancelExtraction}
          handleFilePreview={handleFilePreview}
        />

        <HomeOverlays
          report={report}
          activeItemId={activeItemId}
          isExtracting={isExtracting}
          extractions={extractions}
          setActiveItemId={setActiveItemId}
          setReport={setReport}
          reportLang={reportLang}
          setReportLang={setReportLang}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          modalSearchQuery={modalSearchQuery}
          setModalSearchQuery={setModalSearchQuery}
          modalFiltered={modalFiltered}
          setError={setError}
          searchInputRef={searchInputRef}
          isLightboxOpen={isLightboxOpen}
          setIsLightboxOpen={setIsLightboxOpen}
          setLightboxUrl={setLightboxUrl}
          lightboxUrl={lightboxUrl}
          undoItem={undoItem}
          undoDelete={undoDelete}
          isAuthVisible={isAuthVisible}
          setIsAuthVisible={setIsAuthVisible}
        />
      </div>
    </>
  )
}
