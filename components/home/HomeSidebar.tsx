'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, MouseEvent, ReactNode, RefObject, SetStateAction } from 'react'
import {
  ChevronDown,
  MoreHorizontal,
  PencilLine,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  UserIcon,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/storage/supabaseClient'
import type { ColorToken, DisplayStyleReport, HomeHistoryRecord, StyleReport } from '@/lib/types'
import { getTopColors } from './viewUtils'

type SidebarRecord = HomeHistoryRecord
type BrowserSupabaseClient = ReturnType<typeof createClient>

interface HomeSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
  isSearchOpen: boolean
  pinnedCollapsed: boolean
  setPinnedCollapsed: Dispatch<SetStateAction<boolean>>
  historyCollapsed: boolean
  setHistoryCollapsed: Dispatch<SetStateAction<boolean>>
  pinnedList: SidebarRecord[]
  recentList: SidebarRecord[]
  activeItemId: string | null
  contextMenuId: string | null
  setContextMenuId: Dispatch<SetStateAction<string | null>>
  renamingId: string | null
  renameValue: string
  setRenameValue: Dispatch<SetStateAction<string>>
  showUserMenu: boolean
  setShowUserMenu: Dispatch<SetStateAction<boolean>>
  user: User | null
  isLoadingHistory: boolean
  isAuthResolved: boolean
  searchQuery: string
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>
  setModalSearchQuery: Dispatch<SetStateAction<string>>
  setActiveItemId: Dispatch<SetStateAction<string | null>>
  setReport: Dispatch<SetStateAction<DisplayStyleReport | null>>
  setError: Dispatch<SetStateAction<string | null>>
  openHistoryItem: (item: HomeHistoryRecord) => Promise<void>
  setUrl: Dispatch<SetStateAction<string>>
  clearPendingFile: () => void
  urlInputRef: RefObject<HTMLInputElement | null>
  searchInputRef: RefObject<HTMLInputElement | null>
  togglePin: (itemId: string) => Promise<void>
  deleteItem: (id: string) => void
  startRename: (id: string, currentLabel: string) => void
  submitRename: (id: string) => Promise<void>
  cancelRename: () => void
  supabase: BrowserSupabaseClient
  setIsAuthVisible: Dispatch<SetStateAction<boolean>>
}

export default function HomeSidebar({
  sidebarOpen,
  setSidebarOpen,
  isSearchOpen,
  pinnedCollapsed,
  setPinnedCollapsed,
  historyCollapsed,
  setHistoryCollapsed,
  pinnedList,
  recentList,
  activeItemId,
  contextMenuId,
  setContextMenuId,
  renamingId,
  renameValue,
  setRenameValue,
  showUserMenu,
  setShowUserMenu,
  user,
  isLoadingHistory,
  isAuthResolved,
  searchQuery,
  setIsSearchOpen,
  setModalSearchQuery,
  setActiveItemId,
  setReport,
  setError,
  openHistoryItem,
  setUrl,
  clearPendingFile,
  urlInputRef,
  searchInputRef,
  togglePin,
  deleteItem,
  startRename,
  submitRename,
  cancelRename,
  supabase,
  setIsAuthVisible,
}: HomeSidebarProps) {
  const identityAvatarSources = (user?.identities ?? [])
    .flatMap(identity => [
      identity.identity_data?.avatar_url,
      identity.identity_data?.picture,
    ])
    .filter(Boolean) as string[]

  const avatarSources = [
    user?.user_metadata?.avatar_url,
    user?.user_metadata?.picture,
    ...identityAvatarSources,
  ].filter(Boolean) as string[]

  return (
    <aside style={{
      width: sidebarOpen ? '270px' : '48px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      backgroundColor: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.06)',
      overflow: 'hidden', transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        padding: sidebarOpen ? '22px 16px 14px' : '18px 10px 14px',
        display: 'flex', alignItems: 'center',
        justifyContent: sidebarOpen ? 'space-between' : 'center',
        flexShrink: 0, minWidth: sidebarOpen ? '270px' : '48px'
      }}>
        {sidebarOpen && (
          <span
            onClick={() => {
              setActiveItemId(null)
              setIsSearchOpen(false)
              setReport(null)
              setError(null)
              setUrl('')
              clearPendingFile()
              setShowUserMenu(false)
              setContextMenuId(null)
              setTimeout(() => urlInputRef.current?.focus(), 50)
            }}
            style={{ fontSize: '18px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.025em', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            StyleLens
          </span>
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
          {sidebarOpen ? (
            <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'none', transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <rect x="0.5" y="0.5" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5.5 1V13" stroke="currentColor" strokeWidth="1.2" />
              <rect x="1.5" y="1.5" width="3.5" height="11" rx="1.5" fill="currentColor" fillOpacity="0.25" />
            </svg>
          ) : (
            <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'none', transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <rect x="0.5" y="0.5" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5.5 1V13" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>
      </div>

      <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '48px' }}>
        <SidebarBtn
          icon={<Plus size={15} strokeWidth={2} />}
          label="New Extraction"
          collapsed={!sidebarOpen}
          active={false}
          onClick={() => {
            setIsSearchOpen(false)
            setReport(null)
            setActiveItemId(null)
            setError(null)
            setUrl('')
            clearPendingFile()
            setShowUserMenu(false)
            setContextMenuId(null)
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
            setModalSearchQuery('')
            setTimeout(() => searchInputRef.current?.focus(), 100)
          }}
        />
      </div>


      <div className="no-scrollbar" style={{ flex: 1, overflowY: sidebarOpen ? 'auto' : 'hidden' }}>
        {sidebarOpen && pinnedList.length > 0 && (
          <>
            <SectionHeader label="Pinned" collapsed={pinnedCollapsed} onToggle={() => setPinnedCollapsed(v => !v)} />
            {!pinnedCollapsed && (
              <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {pinnedList.map(item => (
                  <HistoryItem
                    key={item.id}
                    id={item.id}
                    label={item.source_label || 'Untitled'}
                    thumbnailUrl={item.thumbnail_url}
                    colors={item.style_data?.colors || []}
                    sourceType={item.style_data?.sourceType}
                    isActive={activeItemId === item.id}
                    isPinned={true}
                    contextMenuOpen={contextMenuId === item.id}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onClick={() => { setShowUserMenu(false); void openHistoryItem(item) }}
                    onContextMenu={(e) => { e.stopPropagation(); setShowUserMenu(false); setContextMenuId(contextMenuId === item.id ? null : item.id) }}
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

        {sidebarOpen && <SectionHeader label="History" collapsed={historyCollapsed} onToggle={() => setHistoryCollapsed(v => !v)} />}

        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {!sidebarOpen ? null : historyCollapsed ? null : isLoadingHistory ? (
          <div style={{ padding: '8px 4px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                height: '50px', borderRadius: '8px', marginBottom: '2px',
                backgroundColor: 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s infinite'
              }} />
            ))}
          </div>
        ) : !isAuthResolved && recentList.length === 0 ? (
          <EmptyState>正在加载历史记录...</EmptyState>
        ) : !user && recentList.length === 0 ? (
          <EmptyState>登录后查看历史记录</EmptyState>
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
              sourceType={item.style_data?.sourceType}
              isActive={activeItemId === item.id}
              isPinned={false}
              contextMenuOpen={contextMenuId === item.id}
              renamingId={renamingId}
              renameValue={renameValue}
              onRenameChange={setRenameValue}
              onClick={() => { setShowUserMenu(false); void openHistoryItem(item) }}
              onContextMenu={(e) => { e.stopPropagation(); setShowUserMenu(false); setContextMenuId(contextMenuId === item.id ? null : item.id) }}
              onPin={() => togglePin(item.id)}
              onDelete={() => deleteItem(item.id)}
              onStartRename={() => startRename(item.id, item.source_label || '未命名分析')}
              onRenameSubmit={() => submitRename(item.id)}
              onRenameCancel={cancelRename}
            />
          ))
        )}
        </div>
      </div>

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
                backgroundColor: 'transparent', color: '#1D1D1F', fontSize: '13px', fontWeight: 400,
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
            setContextMenuId(null)
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
          {user ? (
            <UserAvatar email={user.email} sources={avatarSources} />
          ) : (
            <UserIcon size={16} style={{ color: '#8E8E93', flexShrink: 0 }} strokeWidth={2} />
          )}
          {sidebarOpen && (
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)', marginLeft: '4px' }}>
              {user ? (user.email?.split('@')[0] || 'User') : 'Log in'}
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}

function UserAvatar({ email, sources }: { email?: string; sources: string[] }) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const sourceSignature = sources.join('|')
  const currentSource = sources[sourceIndex]

  useEffect(() => {
    setSourceIndex(0)
  }, [sourceSignature])

  if (!currentSource) {
    return <AvatarFallback email={email} />
  }

  return (
    <img
      src={currentSource}
      style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(0,0,0,0.05)' }}
      alt="avatar"
      referrerPolicy="no-referrer"
      onError={() => setSourceIndex(prev => prev + 1)}
    />
  )
}

function AvatarFallback({ email }: { email?: string }) {
  const initials = (email || 'U').slice(0, 2).toUpperCase()

  return (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
      border: '1px solid rgba(0,0,0,0.05)', background: '#F4F4F5',
      color: '#1D1D1F', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 600
    }}>
      {initials}
    </div>
  )
}

function SidebarBtn({ icon, label, onClick, active = false, collapsed = false }: {
  icon: ReactNode, label: string, onClick: () => void, active?: boolean, collapsed?: boolean
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
  id, label, thumbnailUrl, colors, sourceType, isActive, isPinned,
  contextMenuOpen, renamingId, renameValue, onRenameChange,
  onClick, onContextMenu, onPin, onDelete, onStartRename,
  onRenameSubmit, onRenameCancel
}: {
  id: string
  label: string
  thumbnailUrl?: string | null
  colors: ColorToken[]
  sourceType?: 'image' | 'url'
  isActive: boolean
  isPinned: boolean
  contextMenuOpen: boolean
  renamingId: string | null
  renameValue: string
  onRenameChange: (v: string) => void
  onClick: () => void
  onContextMenu: (e: MouseEvent) => void
  onPin: () => void
  onDelete: () => void
  onStartRename: () => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  // URL extractions are always full-page → show top (hero section)
  // Image uploads: detect on load — long screenshots (h/w > 2.5) also show top
  const [imgPosition, setImgPosition] = useState<'top center' | 'center'>(
    sourceType === 'url' ? 'top center' : 'center'
  )
  const isRenaming = renamingId === id
  const topColors = getTopColors(colors)

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (sourceType === 'image') {
      const img = e.currentTarget
      const ratio = img.naturalHeight / img.naturalWidth
      setImgPosition(ratio > 2.5 ? 'top center' : 'center')
    }
  }

  const thumbnailContent = thumbnailUrl && !imageFailed ? (
    <img
      src={thumbnailUrl}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: imgPosition }}
      onLoad={handleImgLoad}
      onError={() => setImageFailed(true)}
    />
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
        <div style={{
          width: '40px', height: '42px', borderRadius: '5px', overflow: 'hidden',
          flexShrink: 0, backgroundColor: '#F0F0F0', border: '1px solid rgba(0,0,0,0.06)'
        }}>
          {thumbnailContent}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
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

      {contextMenuOpen && (
        <div style={{
          position: 'absolute', right: '6px', top: 'calc(100% + 4px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '14px', zIndex: 100,
          boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
          padding: '6px', minWidth: '185px',
          animation: 'slideDown 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'auto'
        }}>
          <ContextMenuItem
            label={isPinned ? 'Unpin' : 'Pin'}
            icon={isPinned ? <PinOff size={14} strokeWidth={1.8} /> : <Pin size={14} strokeWidth={1.8} />}
            onClick={e => { e.stopPropagation(); onPin() }}
          />
          <ContextMenuItem
            label="Rename"
            icon={<PencilLine size={14} strokeWidth={1.8} />}
            onClick={e => { e.stopPropagation(); onStartRename() }}
          />
          <div style={{ height: '0.5px', backgroundColor: 'rgba(0,0,0,0.06)', margin: '4px 8px' }} />
          <ContextMenuItem
            label="Delete"
            icon={<Trash2 size={14} strokeWidth={1.8} />}
            danger
            onClick={e => { e.stopPropagation(); onDelete() }}
          />
        </div>
      )}
    </div>
  )
}

function ContextMenuItem({ label, icon, onClick, danger = false }: {
  label: string, icon: ReactNode, onClick: (e: MouseEvent) => void, danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px',
        background: 'transparent', cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: '12px',
        fontSize: '14px', fontWeight: 500,
        color: danger ? '#FF453A' : '#1D1D1F',
        fontFamily: 'var(--font-sans)', transition: 'all 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(255,69,58,0.1)' : 'rgba(0,0,0,0.05)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
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
