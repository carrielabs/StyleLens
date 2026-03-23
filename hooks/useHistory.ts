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
import type { DisplayStyleReport, HomeHistoryRecord, HomeUndoItem, PinnedStyleReport, StyleReport } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

const GUEST_TRIAL_KEY = 'stylelens_trial_used'

type BrowserSupabaseClient = ReturnType<typeof createClient>
type GuestCacheRecordInput = Omit<GuestHistoryRecord, 'id'> & { style_data: PinnedStyleReport }
type HistoryListRow = {
  id: string
  user_id: string | null
  source_label: string
  thumbnail_url: string | null
  created_at: string
  colors?: unknown
  pinned?: unknown
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const candidate = err as { message?: unknown; error_description?: unknown; details?: unknown; hint?: unknown }
    if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message
    if (typeof candidate.error_description === 'string' && candidate.error_description.trim()) return candidate.error_description
    if (typeof candidate.details === 'string' && candidate.details.trim()) return candidate.details
    if (typeof candidate.hint === 'string' && candidate.hint.trim()) return candidate.hint
  }
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

function buildHistoryListRecord(item: HistoryListRow): HomeHistoryRecord {
  const colors = Array.isArray(item.colors) ? item.colors : []
  const isPinned = item.pinned === true || item.pinned === 'true'

  return {
    id: item.id,
    user_id: item.user_id,
    source_label: item.source_label,
    thumbnail_url: item.thumbnail_url,
    created_at: item.created_at,
    style_data: {
      sourceType: 'url',
      sourceLabel: item.source_label || 'Untitled',
      summary: '',
      tags: [],
      colors: colors as PinnedStyleReport['colors'],
      gradients: [],
      typography: {
        fontFamily: '',
        confidence: 'inferred',
        headingWeight: 0,
        bodyWeight: 0,
        fontSizeScale: '',
        lineHeight: '',
        letterSpacing: '',
        alignment: 'left',
        textTreatment: 'solid',
      },
      designDetails: {
        overallStyle: '',
        colorMode: 'light',
        borderRadius: '',
        shadowStyle: '',
        spacingSystem: '',
        borderStyle: '',
        animationTendency: '',
        imageHandling: '',
        layoutStructure: '',
      },
      createdAt: item.created_at,
      __pinned: isPinned,
    },
  }
}

async function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    return await Promise.race([
      Promise.resolve(promiseLike),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function normalizeText(input?: string | null): string {
  return (input || '').trim().toLowerCase()
}

function buildHistoryFingerprint(input: {
  sourceLabel?: string | null
  thumbnailUrl?: string | null
  colors?: Array<{ hex?: string | null }>
}): string {
  const topColors = (input.colors || [])
    .map(color => (color.hex || '').toUpperCase())
    .filter(Boolean)
    .slice(0, 3)
    .join('|')

  return [
    normalizeText(input.sourceLabel),
    (input.thumbnailUrl || '').slice(0, 160),
    topColors,
  ].join('::')
}

function isSameHistorySignature(
  left: {
    sourceLabel?: string | null
    thumbnailUrl?: string | null
    colors?: Array<{ hex?: string | null }>
  },
  right: {
    sourceLabel?: string | null
    thumbnailUrl?: string | null
    colors?: Array<{ hex?: string | null }>
  }
): boolean {
  return buildHistoryFingerprint(left) === buildHistoryFingerprint(right)
}

function dedupeHistoryRecords(records: HomeHistoryRecord[]): HomeHistoryRecord[] {
  const deduped: HomeHistoryRecord[] = []

  for (const record of records) {
    const createdAt = new Date(record.created_at).getTime()
    const duplicate = deduped.find(existing => {
      const existingAt = new Date(existing.created_at).getTime()
      return (
        Math.abs(existingAt - createdAt) < 2 * 60 * 1000 &&
        isSameHistorySignature(
          {
            sourceLabel: existing.source_label,
            thumbnailUrl: existing.thumbnail_url,
            colors: existing.style_data?.colors,
          },
          {
            sourceLabel: record.source_label,
            thumbnailUrl: record.thumbnail_url,
            colors: record.style_data?.colors,
          }
        )
      )
    })
    if (!duplicate) deduped.push(record)
  }

  return deduped
}

interface UseHistoryParams {
  user: User | null
  supabase: BrowserSupabaseClient
  report: DisplayStyleReport | null
  setReport: (report: DisplayStyleReport | null) => void
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
  openHistoryItem: (item: HomeHistoryRecord) => Promise<void>
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
  const lastSavedFingerprintRef = useRef<{ key: string; at: number } | null>(null)
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

      const { data, error } = await withTimeout(
        supabase
          .from('style_records')
          .select('id,user_id,source_label,thumbnail_url,created_at,colors:style_data->colors,pinned:style_data->__pinned')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        8000,
        'History query'
      )

      if (error) throw error
      const list = (((data as unknown) as HistoryListRow[]) || []).map(buildHistoryListRecord)
      setExtractions(dedupeHistoryRecords(list))
    } catch (err: unknown) {
      console.warn('Failed to load history:', getErrorMessage(err))
      setExtractions([])
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
        const { data: existingRecords, error: existingError } = await withTimeout(
          supabase
            .from('style_records')
            .select('id')
            .eq('user_id', userId)
            .eq('source_label', payload.source_label)
            .eq('created_at', payload.created_at)
            .limit(1),
          8000,
          'History migration lookup'
        )

        if (existingError) throw existingError

        if (!existingRecords || existingRecords.length === 0) {
          const { error } = await withTimeout(
            supabase
              .from('style_records')
              .insert([payload]),
            8000,
            'History migration insert'
          )

          if (error) throw error
        }

        clearGuestMigrationSnapshot()
        lastGuestMigrationKeyRef.current = migrationKey
      } catch (err: unknown) {
        console.warn('Failed to migrate guest history:', getErrorMessage(err))
      } finally {
        guestMigrationInFlightRef.current = null
      }
    })()

    guestMigrationInFlightRef.current = migrationTask
    await migrationTask
  }

  const saveExtraction = async (nextReport: StyleReport, thumb?: string) => {
    const reportForStorage: StyleReport = {
      ...nextReport,
      thumbnailUrl: undefined,
      pageAnalysis: undefined,
    }

    const record = {
      user_id: user?.id || null,
      source_label: nextReport.sourceLabel || 'Untitled',
      style_data: reportForStorage,
      thumbnail_url: thumb || nextReport.thumbnailUrl || null,
      created_at: new Date().toISOString(),
    }

    const fingerprint = buildHistoryFingerprint({
      sourceLabel: record.source_label,
      thumbnailUrl: record.thumbnail_url,
      colors: reportForStorage.colors,
    })
    const now = Date.now()
    if (
      lastSavedFingerprintRef.current &&
      lastSavedFingerprintRef.current.key === fingerprint &&
      now - lastSavedFingerprintRef.current.at < 15000
    ) {
      return
    }

    const localDuplicate = extractions.find(existing =>
      Math.abs(new Date(existing.created_at).getTime() - now) < 2 * 60 * 1000 &&
      isSameHistorySignature(
        {
          sourceLabel: existing.source_label,
          thumbnailUrl: existing.thumbnail_url,
          colors: existing.style_data?.colors,
        },
        {
          sourceLabel: record.source_label,
          thumbnailUrl: record.thumbnail_url,
          colors: reportForStorage.colors,
        }
      )
    )
    if (localDuplicate) {
      lastSavedFingerprintRef.current = { key: fingerprint, at: now }
      return
    }

    lastSavedFingerprintRef.current = { key: fingerprint, at: now }

    if (!user) {
      const guestRecord: HomeHistoryRecord = { ...record, id: 'guest_1' }
      const guestCacheRecord = buildGuestCacheRecord(record)

      setExtractions(dedupeHistoryRecords([guestRecord, ...extractions]))

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
      const { data: existingRows, error: existingError } = await withTimeout(
        supabase
          .from('style_records')
          .select('id,source_label,thumbnail_url,created_at,colors:style_data->colors')
          .eq('user_id', user.id)
          .eq('source_label', record.source_label)
          .order('created_at', { ascending: false })
          .limit(5),
        8000,
        'History duplicate lookup'
      )
      if (existingError) throw existingError

      const serverDuplicate = (((existingRows as unknown) as HistoryListRow[]) || []).find(existing =>
        Math.abs(new Date(existing.created_at).getTime() - now) < 2 * 60 * 1000 &&
        isSameHistorySignature(
          {
            sourceLabel: existing.source_label,
            thumbnailUrl: existing.thumbnail_url,
            colors: Array.isArray(existing.colors) ? existing.colors as Array<{ hex?: string | null }> : [],
          },
          {
            sourceLabel: record.source_label,
            thumbnailUrl: record.thumbnail_url,
            colors: reportForStorage.colors,
          }
        )
      )
      if (serverDuplicate) {
        await loadHistory(user.id)
        return
      }

      const { error } = await withTimeout(
        supabase
          .from('style_records')
          .insert([record]),
        8000,
        'History save'
      )
      if (error) throw error
      await loadHistory(user.id)
    } catch (err: unknown) {
      console.warn('Failed to save extraction:', getErrorMessage(err))
    }
  }

  const openHistoryItem = async (item: HomeHistoryRecord) => {
    setActiveItemId(item.id)
    setError(null)

    const fallbackReport: DisplayStyleReport = {
      ...(item.style_data as DisplayStyleReport),
      id: item.id,
      thumbnailUrl: item.thumbnail_url || item.style_data?.thumbnailUrl,
      sourceLabel: item.source_label || item.style_data?.sourceLabel || 'Untitled',
      createdAt: item.created_at || item.style_data?.createdAt || new Date().toISOString(),
    }

    if (!user) {
      setReport(fallbackReport)
      return
    }

    setReport(fallbackReport)

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('style_records')
          .select('*')
          .eq('id', item.id)
          .single(),
        8000,
        'History item load'
      )

      if (error) throw error
      if (!data?.style_data) return

      const hydratedReport: DisplayStyleReport = {
        ...(data.style_data as DisplayStyleReport),
        id: data.id,
        thumbnailUrl: data.thumbnail_url || data.style_data.thumbnailUrl,
        sourceLabel: data.source_label || data.style_data.sourceLabel || fallbackReport.sourceLabel,
        createdAt: data.created_at || data.style_data.createdAt || fallbackReport.createdAt,
      }

      setReport(hydratedReport)
      setExtractions(prev => prev.map(record => (
        record.id === item.id
          ? {
              ...record,
              source_label: data.source_label,
              thumbnail_url: data.thumbnail_url,
              created_at: data.created_at,
              style_data: {
                ...(data.style_data as PinnedStyleReport),
                __pinned: record.style_data?.__pinned ?? (data.style_data as PinnedStyleReport).__pinned,
              },
            }
          : record
      )))
    } catch (err: unknown) {
      console.warn('Failed to load full history item:', getErrorMessage(err))
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
    openHistoryItem,
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
