'use client'

import { useState, useEffect, useRef } from 'react'
import HomeOverlays from '@/components/home/HomeOverlays'
import HomeSidebar from '@/components/home/HomeSidebar'
import HomeWorkspace from '@/components/home/HomeWorkspace'
import { useExtraction } from '@/hooks/useExtraction'
import { useHistory } from '@/hooks/useHistory'
import { createClient } from '@/lib/storage/supabaseClient'
import { getGreeting, GreetingData } from '@/lib/utils/greeting'
import type { DisplayStyleReport } from '@/lib/types'
import type { Session, User } from '@supabase/supabase-js'

export default function Home() {
  // ── Core state ──
  const [report, setReport] = useState<DisplayStyleReport | null>(null)
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
  const [featuredCollapsed, setFeaturedCollapsed] = useState(false)

  // ── Sidebar panel toggle ──
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ── Dynamic Greeting state ──
  const [greeting, setGreeting] = useState<GreetingData | null>(null)

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [supabase] = useState(() => createClient())
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
    openHistoryItem,
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
  const {
    url,
    setUrl,
    isDragging,
    setIsDragging,
    isExtracting,
    isUrlExtracting,
    isImageExtracting,
    pendingFile,
    pendingPreviewUrl,
    setUploadZoneHovered,
    uploadState,
    fileInputRef,
    urlInputRef,
    handleUrlSubmit,
    handleFilePreview,
    handleExtractFile,
    clearPendingFile,
    handleDrop,
    handlePaste,
    cancelExtraction,
  } = useExtraction({
    user,
    guestTrialUsed,
    setIsAuthVisible,
    setReport,
    setError,
    setActiveItemId,
    setIsSearchOpen,
    saveExtraction,
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
    const syncSession = async (session: Session | null) => {
      try {
        setUser(session?.user ?? null)
        await syncHistoryForSession(session)
      } finally {
        setIsAuthResolved(true)
      }
    }

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => syncSession(session))
      .catch(async (err) => {
        console.warn('Failed to initialize Supabase session:', err)
        await syncSession(null)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return
      void syncSession(session)
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
        fontFamily: 'var(--font-sans)', WebkitFontSmoothing: 'antialiased',
        userSelect: 'none', overflow: 'hidden', backgroundColor: '#FFFFFF'
      }}>
        <HomeSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isSearchOpen={isSearchOpen}
          featuredCollapsed={featuredCollapsed}
          setFeaturedCollapsed={setFeaturedCollapsed}
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
          openHistoryItem={openHistoryItem}
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
          isUrlExtracting={isUrlExtracting}
          isImageExtracting={isImageExtracting}
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
          openHistoryItem={openHistoryItem}
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
