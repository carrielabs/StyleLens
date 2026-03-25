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
import type { DisplayStyleReport, HomeHistoryRecord, HomeUndoItem, PageStyleAnalysis, PinnedStyleReport, StyleReport } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

const GUEST_TRIAL_KEY = 'stylelens_trial_used'
const HISTORY_DELETE_TOMBSTONES_KEY = 'stylelens_history_delete_tombstones'
const HISTORY_DELETE_TOMBSTONE_TTL_MS = 10 * 60 * 1000

type BrowserSupabaseClient = ReturnType<typeof createClient>
type GuestCacheRecordInput = Omit<GuestHistoryRecord, 'id'> & { style_data: PinnedStyleReport }
type HistoryDeleteTombstone = { id: string; scope: string; at: number }
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

function compactPageAnalysisForStorage(pageAnalysis?: PageStyleAnalysis): PageStyleAnalysis | undefined {
  if (!pageAnalysis) return undefined

  return {
    colorCandidates: [],
    semanticColorSystem: pageAnalysis.semanticColorSystem,
    typographyCandidates: pageAnalysis.typographyCandidates || [],
    typographyTokens: pageAnalysis.typographyTokens || [],
    radiusCandidates: [],
    radiusTokens: pageAnalysis.radiusTokens || [],
    shadowCandidates: [],
    shadowTokens: pageAnalysis.shadowTokens || [],
    spacingCandidates: [],
    spacingTokens: pageAnalysis.spacingTokens || [],
    layoutHints: pageAnalysis.layoutHints || [],
    layoutEvidence: pageAnalysis.layoutEvidence || [],
    stateTokens: pageAnalysis.stateTokens,
    borderTokens: pageAnalysis.borderTokens,
    transitionTokens: pageAnalysis.transitionTokens,
    pageMaxWidth: pageAnalysis.pageMaxWidth,
    gridColumns: pageAnalysis.gridColumns,
    buttonSnapshot: pageAnalysis.buttonSnapshot,
    buttonSnapshots: pageAnalysis.buttonSnapshots || [],
    inputSnapshots: pageAnalysis.inputSnapshots || [],
    cardSnapshots: pageAnalysis.cardSnapshots || [],
    tagSnapshots: pageAnalysis.tagSnapshots || [],
    pageSections: pageAnalysis.pageSections,
    viewportSlices: pageAnalysis.viewportSlices || [],
    sourceCount: pageAnalysis.sourceCount || {
      inlineStyleBlocks: 0,
      linkedStylesheets: 0,
    },
  }
}

function getHistoryDeleteScope(userId?: string | null): string {
  return userId ? `user:${userId}` : 'guest'
}

function readHistoryDeleteTombstones(): HistoryDeleteTombstone[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(HISTORY_DELETE_TOMBSTONES_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as HistoryDeleteTombstone[] : []
  } catch {
    return []
  }
}

function writeHistoryDeleteTombstones(items: HistoryDeleteTombstone[]): void {
  if (typeof window === 'undefined') return
  if (!items.length) {
    window.localStorage.removeItem(HISTORY_DELETE_TOMBSTONES_KEY)
    return
  }
  window.localStorage.setItem(HISTORY_DELETE_TOMBSTONES_KEY, JSON.stringify(items))
}

function pruneHistoryDeleteTombstones(now = Date.now()): HistoryDeleteTombstone[] {
  const filtered = readHistoryDeleteTombstones().filter(item => now - item.at < HISTORY_DELETE_TOMBSTONE_TTL_MS)
  writeHistoryDeleteTombstones(filtered)
  return filtered
}

function addHistoryDeleteTombstone(id: string, scope: string): void {
  const items = pruneHistoryDeleteTombstones().filter(item => !(item.id === id && item.scope === scope))
  items.push({ id, scope, at: Date.now() })
  writeHistoryDeleteTombstones(items)
}

function clearHistoryDeleteTombstone(id: string, scope: string): void {
  const items = pruneHistoryDeleteTombstones().filter(item => !(item.id === id && item.scope === scope))
  writeHistoryDeleteTombstones(items)
}

function getHistoryDeleteIdsForScope(scope: string): string[] {
  return pruneHistoryDeleteTombstones()
    .filter(item => item.scope === scope)
    .map(item => item.id)
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
  deleteItem: (id: string) => Promise<void>
  undoDelete: () => Promise<void>
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
  const loadHistoryInFlightRef = useRef<Promise<void> | null>(null)
  const loadHistoryKeyRef = useRef<string | null>(null)
  const syncHistoryInFlightRef = useRef<Promise<void> | null>(null)
  const syncHistoryKeyRef = useRef<string | null>(null)
  const pendingHistoryRecordsRef = useRef<HomeHistoryRecord[]>([])

  useEffect(() => {
    hasLoadedExtractionsRef.current = extractions.length > 0
  }, [extractions.length])

  const loadHistory = async (userId: string) => {
    const requestKey = userId || '__guest__'
    if (loadHistoryInFlightRef.current && loadHistoryKeyRef.current === requestKey) {
      await loadHistoryInFlightRef.current
      return
    }

    const task = (async () => {
    if (!hasLoadedExtractionsRef.current && pendingHistoryRecordsRef.current.length === 0) {
      setIsLoadingHistory(true)
    }

    try {
      if (!userId) {
        const guestDeleteIds = new Set(getHistoryDeleteIdsForScope(getHistoryDeleteScope(null)))
        const guestRecord = await getGuestHistory().catch(err => {
          console.warn('Failed to read guest history from IndexedDB:', err)
          return null
        })

        if (guestRecord && !guestDeleteIds.has(guestRecord.id)) {
          setExtractions(dedupeHistoryRecords([
            guestRecord as HomeHistoryRecord,
            ...pendingHistoryRecordsRef.current,
          ]))
        } else {
          setExtractions([...pendingHistoryRecordsRef.current])
        }

        if (guestDeleteIds.size > 0) {
          void clearGuestHistory()
            .then(() => {
              guestDeleteIds.forEach(id => clearHistoryDeleteTombstone(id, getHistoryDeleteScope(null)))
            })
            .catch(err => {
              console.warn('Failed to reconcile guest deletions:', getErrorMessage(err))
            })
        }
        return
      }

      const deleteScope = getHistoryDeleteScope(userId)
      const pendingDeletedIds = new Set(getHistoryDeleteIdsForScope(deleteScope))

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
      const list = (((data as unknown) as HistoryListRow[]) || [])
        .map(buildHistoryListRecord)
        .filter(item => !pendingDeletedIds.has(item.id))
      setExtractions(dedupeHistoryRecords([
        ...pendingHistoryRecordsRef.current,
        ...list,
      ]))

      if (pendingDeletedIds.size > 0) {
        void Promise.allSettled(
          Array.from(pendingDeletedIds).map(async id => {
            const result = await deleteFromLibrary(id, supabase)
            if (result.success) {
              clearHistoryDeleteTombstone(id, deleteScope)
            }
          })
        )
      }
    } catch (err: unknown) {
      console.warn('Failed to load history:', getErrorMessage(err))
      if (!hasLoadedExtractionsRef.current && pendingHistoryRecordsRef.current.length === 0) {
        setExtractions([])
      }
    } finally {
      setIsLoadingHistory(false)
    }
    })()

    loadHistoryInFlightRef.current = task
    loadHistoryKeyRef.current = requestKey
    try {
      await task
    } finally {
      if (loadHistoryInFlightRef.current === task) {
        loadHistoryInFlightRef.current = null
        loadHistoryKeyRef.current = null
      }
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

        await clearGuestHistory().catch((err) => {
          console.warn('Failed to clear guest history after migration:', getErrorMessage(err))
        })
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
      pageAnalysis: compactPageAnalysisForStorage(nextReport.pageAnalysis),
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
      now - lastSavedFingerprintRef.current.at < 2000
    ) {
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

    const optimisticId = `pending_${now}`
    const optimisticRecord: HomeHistoryRecord = {
      ...record,
      id: optimisticId,
      style_data: {
        ...(record.style_data as PinnedStyleReport),
        __pinned: (record.style_data as PinnedStyleReport).__pinned ?? false,
      },
    }
    pendingHistoryRecordsRef.current = [optimisticRecord, ...pendingHistoryRecordsRef.current]
    setExtractions(prev => dedupeHistoryRecords([optimisticRecord, ...prev]))

    try {
      const { data: insertedRow, error } = await withTimeout(
        supabase
          .from('style_records')
          .insert([record])
          .select('id,user_id,source_label,thumbnail_url,created_at,colors:style_data->colors,pinned:style_data->__pinned')
          .single(),
        8000,
        'History save'
      )
      if (error) throw error
      pendingHistoryRecordsRef.current = pendingHistoryRecordsRef.current.filter(item => item.id !== optimisticId)
      const hydratedListItem = buildHistoryListRecord((insertedRow as unknown) as HistoryListRow)
      setExtractions(prev => dedupeHistoryRecords([
        hydratedListItem,
        ...prev.filter(item => item.id !== optimisticId),
      ]))
      await loadHistory(user.id)
    } catch (err: unknown) {
      pendingHistoryRecordsRef.current = pendingHistoryRecordsRef.current.filter(item => item.id !== optimisticId)
      console.warn('Failed to save extraction:', getErrorMessage(err))
      void loadHistory(user.id)
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
    const requestKey = session?.user?.id || '__guest__'
    if (syncHistoryInFlightRef.current && syncHistoryKeyRef.current === requestKey) {
      await syncHistoryInFlightRef.current
      return
    }

    const task = (async () => {
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
    })()

    syncHistoryInFlightRef.current = task
    syncHistoryKeyRef.current = requestKey
    try {
      await task
    } finally {
      if (syncHistoryInFlightRef.current === task) {
        syncHistoryInFlightRef.current = null
        syncHistoryKeyRef.current = null
      }
    }
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

  const deleteItem = async (id: string) => {
    const record = extractions.find(e => e.id === id)
    if (!record) return
    const label = record.source_label || '未命名分析'
    const deleteScope = getHistoryDeleteScope(user?.id || null)

    setExtractions(prev => prev.filter(e => e.id !== id))
    if (activeItemId === id) {
      setActiveItemId(null)
      setReport(null)
    }
    setContextMenuId(null)
    setUndoItem({ id, label, record })
    addHistoryDeleteTombstone(id, deleteScope)

    try {
      if (user) {
        const result = await deleteFromLibrary(id, supabase)
        if (!result.success) throw new Error(result.error || 'Delete failed')
        clearHistoryDeleteTombstone(id, deleteScope)
      } else {
        await clearGuestHistory()
        localStorage.removeItem(GUEST_TRIAL_KEY)
        clearHistoryDeleteTombstone(id, deleteScope)
      }
    } catch (err) {
      console.error('Delete history item error', err)
      setExtractions(prev => {
        const exists = prev.find(e => e.id === record.id)
        if (exists) return prev
        return [record, ...prev].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })
      if (activeItemId === id) {
        setActiveItemId(record.id)
        setReport(record.style_data as DisplayStyleReport)
      }
      clearHistoryDeleteTombstone(id, deleteScope)
      setUndoItem(null)
      setError('删除历史记录失败')
      return
    }

    deleteTimerRef.current[id] = setTimeout(() => {
      setUndoItem(prev => (prev?.id === id ? null : prev))
    }, 5000)
  }

  const undoDelete = async () => {
    if (!undoItem) return
    const deleteScope = getHistoryDeleteScope(user?.id || null)
    clearTimeout(deleteTimerRef.current[undoItem.id])
    delete deleteTimerRef.current[undoItem.id]

    try {
      if (user) {
        const payload = {
          id: undoItem.record.id,
          user_id: undoItem.record.user_id,
          source_label: undoItem.record.source_label,
          thumbnail_url: undoItem.record.thumbnail_url,
          created_at: undoItem.record.created_at,
          style_data: undoItem.record.style_data,
        }

        const { error } = await supabase
          .from('style_records')
          .upsert(payload)

        if (error) throw error
      } else {
        await saveGuestHistory(buildGuestCacheRecord({
          user_id: null,
          source_label: undoItem.record.source_label,
          style_data: undoItem.record.style_data,
          thumbnail_url: undoItem.record.thumbnail_url,
          created_at: undoItem.record.created_at,
        }))
      }

      clearHistoryDeleteTombstone(undoItem.id, deleteScope)

      setExtractions(prev => {
        const exists = prev.find(e => e.id === undoItem.id)
        if (exists) return prev
        return [undoItem.record, ...prev].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })
      setUndoItem(null)
    } catch (err) {
      console.error('Undo delete error', err)
      setError('恢复历史记录失败')
    }
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
