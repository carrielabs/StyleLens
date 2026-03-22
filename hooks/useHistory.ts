'use client'

import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { deleteFromLibrary, renameInLibrary } from '@/lib/storage/libraryStore'
import { createClient } from '@/lib/storage/supabaseClient'
import {
  clearGuestHistory,
  clearGuestMigrationSnapshot,
  type GuestHistoryRecord,
  getGuestHistory,
  getGuestMigrationSnapshot,
  saveGuestHistory,
} from '@/lib/storage/guestStore'
import type { HomeHistoryRecord, HomeUndoItem, PinnedStyleReport, StyleReport } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

const GUEST_TRIAL_KEY = 'stylelens_trial_used'

type BrowserSupabaseClient = ReturnType<typeof createClient>
type GuestCacheRecordInput = Omit<GuestHistoryRecord, 'id'> & { style_data: PinnedStyleReport }

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

function buildGuestCacheRecord(record: GuestCacheRecordInput): GuestHistoryRecord {
  return {
    ...record,
    id: 'guest_1',
    thumbnail_url: record.thumbnail_url,
    style_data: record.style_data,
  }
}

interface UseHistoryParams {
  user: User | null
  supabase: BrowserSupabaseClient
  report: StyleReport | null
  setReport: (report: StyleReport | null) => void
  setError: (error: string | null) => void
  setGuestTrialUsed: (used: boolean) => void
  setIsAuthVisible: (visible: boolean) => void
}

interface UseHistoryResult {
  extractions: HomeHistoryRecord[]
  setExtractions: Dispatch<SetStateAction<HomeHistoryRecord[]>>
  isLoadingHistory: boolean
  setIsLoadingHistory: Dispatch<SetStateAction<boolean>>
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  modalSearchQuery: string
  setModalSearchQuery: Dispatch<SetStateAction<string>>
  activeItemId: string | null
  setActiveItemId: Dispatch<SetStateAction<string | null>>
  contextMenuId: string | null
  setContextMenuId: Dispatch<SetStateAction<string | null>>
  renamingId: string | null
  setRenamingId: Dispatch<SetStateAction<string | null>>
  renameValue: string
  setRenameValue: Dispatch<SetStateAction<string>>
  undoItem: HomeUndoItem | null
  pinnedCollapsed: boolean
  setPinnedCollapsed: Dispatch<SetStateAction<boolean>>
  historyCollapsed: boolean
  setHistoryCollapsed: Dispatch<SetStateAction<boolean>>
  modalFiltered: HomeHistoryRecord[]
  pinnedList: HomeHistoryRecord[]
  recentList: HomeHistoryRecord[]
  loadHistory: (userId: string) => Promise<void>
  saveExtraction: (nextReport: StyleReport, thumb?: string) => Promise<void>
  migrateGuestHistoryToAccount: (userId: string) => Promise<void>
  syncHistoryForSession: (session: { user: User } | null) => Promise<void>
  togglePin: (itemId: string) => Promise<void>
  deleteItem: (id: string) => void
  undoDelete: () => void
  startRename: (id: string, currentLabel: string) => void
  submitRename: (id: string) => Promise<void>
  cancelRename: () => void
}

export function useHistory({
  user,
  supabase,
  report,
  setReport,
  setError,
  setGuestTrialUsed,
  setIsAuthVisible,
}: UseHistoryParams): UseHistoryResult {
  const [extractions, setExtractions] = useState<HomeHistoryRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalSearchQuery, setModalSearchQuery] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [undoItem, setUndoItem] = useState<HomeUndoItem | null>(null)
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false)
  const [historyCollapsed, setHistoryCollapsed] = useState(false)

  const historyLoadedRef = useRef(false)
  const currentHistoryUserIdRef = useRef<string | null>(null)
  const hasLoadedExtractionsRef = useRef(false)
  const guestMigrationInFlightRef = useRef<Promise<void> | null>(null)
  const lastGuestMigrationKeyRef = useRef<string | null>(null)
  const deleteTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    hasLoadedExtractionsRef.current = extractions.length > 0
  }, [extractions.length])

  const loadHistory = async (userId: string) => {
    if (!hasLoadedExtractionsRef.current) {
      setIsLoadingHistory(true)
    }

    try {
      if (!userId) {
        const guestRecord = await getGuestHistory().catch(err => {
          console.warn('Failed to read guest history from IndexedDB:', err)
          return null
        })

        if (guestRecord) {
          setExtractions([guestRecord as HomeHistoryRecord])
        } else {
          setExtractions([])
        }
        return
      }

      const { data, error } = await supabase
        .from('style_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setExtractions((data as HomeHistoryRecord[]) || [])
    } catch (err: unknown) {
      console.error('Failed to load history:', getErrorMessage(err))
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const migrateGuestHistoryToAccount = async (userId: string) => {
    const snapshotRecord = getGuestMigrationSnapshot()
    const guestHistory = snapshotRecord ?? await getGuestHistory().catch(() => null)
    if (!guestHistory) {
      return
    }

    const migrationKey = [userId, guestHistory.source_label, guestHistory.created_at].join('::')

    if (lastGuestMigrationKeyRef.current === migrationKey) {
      return
    }

    if (guestMigrationInFlightRef.current) {
      await guestMigrationInFlightRef.current
      return
    }

    const payload = {
      user_id: userId,
      source_label: guestHistory.source_label,
      style_data: guestHistory.style_data,
      thumbnail_url: guestHistory.thumbnail_url,
      created_at: guestHistory.created_at,
    }

    const migrationTask = (async () => {
      try {
        const { data: existingRecords, error: existingError } = await supabase
          .from('style_records')
          .select('id')
          .eq('user_id', userId)
          .eq('source_label', payload.source_label)
          .eq('created_at', payload.created_at)
          .limit(1)

        if (existingError) throw existingError

        if (!existingRecords || existingRecords.length === 0) {
          const { error } = await supabase
            .from('style_records')
            .insert([payload])

          if (error) throw error
        }

        clearGuestMigrationSnapshot()
        lastGuestMigrationKeyRef.current = migrationKey
      } catch (err: unknown) {
        console.error('Failed to migrate guest history:', getErrorMessage(err))
      } finally {
        guestMigrationInFlightRef.current = null
      }
    })()

    guestMigrationInFlightRef.current = migrationTask
    await migrationTask
  }

  const saveExtraction = async (nextReport: StyleReport, thumb?: string) => {
    const record = {
      user_id: user?.id || null,
      source_label: nextReport.sourceLabel || 'Untitled',
      style_data: nextReport,
      thumbnail_url: thumb || nextReport.thumbnailUrl || null,
      created_at: new Date().toISOString(),
    }

    if (!user) {
      const guestRecord: HomeHistoryRecord = { ...record, id: 'guest_1' }
      const guestCacheRecord = buildGuestCacheRecord(record)

      setExtractions([guestRecord])

      try {
        await saveGuestHistory(guestCacheRecord)
        localStorage.setItem(GUEST_TRIAL_KEY, 'true')
        setGuestTrialUsed(true)
      } catch (err) {
        console.warn('Failed to persist guest history to IndexedDB:', err)
        await clearGuestHistory().catch(() => undefined)
        localStorage.removeItem(GUEST_TRIAL_KEY)
        setGuestTrialUsed(false)
      }

      return
    }

    try {
      const { error } = await supabase
        .from('style_records')
        .insert([record])
      if (error) throw error
      await loadHistory(user.id)
    } catch (err: unknown) {
      console.error('Failed to save extraction:', getErrorMessage(err))
    }
  }

  const syncHistoryForSession = async (session: { user: User } | null) => {
    if (session) {
      const sameUser = currentHistoryUserIdRef.current === session.user.id
      const shouldSkipRefresh = sameUser && historyLoadedRef.current && hasLoadedExtractionsRef.current
      if (shouldSkipRefresh) return

      setIsAuthVisible(false)
      currentHistoryUserIdRef.current = session.user.id

      await migrateGuestHistoryToAccount(session.user.id)
      await loadHistory(session.user.id)
      historyLoadedRef.current = true
      return
    }

    const trialValue = localStorage.getItem(GUEST_TRIAL_KEY) === 'true'
    setGuestTrialUsed(trialValue)
    historyLoadedRef.current = false
    currentHistoryUserIdRef.current = null
    await loadHistory('')
  }

  const togglePin = async (itemId: string) => {
    setContextMenuId(null)
    setExtractions(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const isPinned = item.style_data?.__pinned === true
      return { ...item, style_data: { ...item.style_data, __pinned: !isPinned } }
    }))

    const item = extractions.find(e => e.id === itemId)
    if (item && user) {
      const isPinned = item.style_data?.__pinned === true
      await supabase
        .from('style_records')
        .update({ style_data: { ...item.style_data, __pinned: !isPinned } })
        .eq('id', itemId)
    }
  }

  const deleteItem = (id: string) => {
    const record = extractions.find(e => e.id === id)
    if (!record) return
    const label = record.source_label || '未命名分析'

    setExtractions(prev => prev.filter(e => e.id !== id))
    if (activeItemId === id) {
      setActiveItemId(null)
      setReport(null)
    }
    setContextMenuId(null)
    setUndoItem({ id, label, record })

    deleteTimerRef.current[id] = setTimeout(async () => {
      if (user) {
        await deleteFromLibrary(id, supabase)
      }
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

  const startRename = (id: string, currentLabel: string) => {
    setRenamingId(id)
    setRenameValue(currentLabel)
    setContextMenuId(null)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const submitRename = async (id: string) => {
    const trimmed = renameValue.trim()
    if (!trimmed) {
      cancelRename()
      return
    }

    setExtractions(prev => prev.map(e => e.id === id ? { ...e, source_label: trimmed } : e))

    if (id === activeItemId && report) {
      setReport({ ...report, sourceLabel: trimmed })
    }

    setRenamingId(null)
    setRenameValue('')

    if (!user) {
      const renamedRecord = extractions.find(e => e.id === id)
      if (renamedRecord) {
        await saveGuestHistory({
          ...renamedRecord,
          id,
          source_label: trimmed,
        }).catch((err) => {
          console.error('Guest rename error', err)
          setError('游客历史重命名失败')
        })
      }
      return
    }

    const result = await renameInLibrary(id, trimmed, supabase)
    if (!result.success) {
      setError(result.error || '重命名失败')
    }
  }

  const allFiltered = extractions.filter(item =>
    !searchQuery || (item.source_label || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  const modalFiltered = extractions.filter(item =>
    !modalSearchQuery || (item.source_label || '').toLowerCase().includes(modalSearchQuery.toLowerCase())
  )
  const pinnedList = allFiltered.filter(item => item.style_data?.__pinned === true)
  const recentList = allFiltered.filter(item => !item.style_data?.__pinned)

  return {
    extractions,
    setExtractions,
    isLoadingHistory,
    setIsLoadingHistory,
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
    loadHistory,
    saveExtraction,
    migrateGuestHistoryToAccount,
    syncHistoryForSession,
    togglePin,
    deleteItem,
    undoDelete,
    startRename,
    submitRename,
    cancelRename,
  }
}
