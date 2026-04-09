import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHistory } from '@/hooks/useHistory'
import type { DisplayStyleReport } from '@/lib/types'
import type { GuestHistoryRecord } from '@/lib/storage/guestStore'

const renameInLibraryMock = vi.fn()
const deleteFromLibraryMock = vi.fn()
const getGuestHistoryMock = vi.fn()
const saveGuestHistoryMock = vi.fn()
const clearGuestHistoryMock = vi.fn()
const getGuestMigrationSnapshotMock = vi.fn()
const clearGuestMigrationSnapshotMock = vi.fn()

vi.mock('@/lib/storage/libraryStore', () => ({
  renameInLibrary: (...args: unknown[]) => renameInLibraryMock(...args),
  deleteFromLibrary: (...args: unknown[]) => deleteFromLibraryMock(...args),
}))

vi.mock('@/lib/storage/guestStore', () => ({
  getGuestHistory: (...args: unknown[]) => getGuestHistoryMock(...args),
  saveGuestHistory: (...args: unknown[]) => saveGuestHistoryMock(...args),
  clearGuestHistory: (...args: unknown[]) => clearGuestHistoryMock(...args),
  getGuestMigrationSnapshot: (...args: unknown[]) => getGuestMigrationSnapshotMock(...args),
  clearGuestMigrationSnapshot: (...args: unknown[]) => clearGuestMigrationSnapshotMock(...args),
}))

function createReport(overrides: Partial<DisplayStyleReport> = {}): DisplayStyleReport {
  return {
    sourceType: 'image',
    sourceLabel: 'Sample',
    thumbnailUrl: 'thumb.jpg',
    summary: 'summary',
    tags: ['tag'],
    colors: [],
    gradients: [],
    typography: {
      fontFamily: 'Inter',
      confidence: 'inferred',
      headingWeight: 700,
      bodyWeight: 400,
      fontSizeScale: 'base',
      lineHeight: '1.5',
      letterSpacing: 'normal',
      alignment: 'left',
      textTreatment: 'solid',
    },
    designDetails: {
      overallStyle: 'Minimal',
      colorMode: 'light',
      borderRadius: '8px',
      shadowStyle: 'soft',
      spacingSystem: 'comfortable',
      borderStyle: 'subtle',
      animationTendency: 'minimal',
      imageHandling: 'cover',
      layoutStructure: 'stack',
    },
    createdAt: '2026-03-22T00:00:00.000Z',
    ...overrides,
  }
}

function createGuestRecord(overrides: Partial<GuestHistoryRecord> = {}): GuestHistoryRecord {
  return {
    id: 'guest_1',
    user_id: null,
    source_label: 'Guest record',
    style_data: createReport(),
    thumbnail_url: 'thumb.jpg',
    created_at: '2026-03-22T00:00:00.000Z',
    ...overrides,
  }
}

function createSupabaseMock() {
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn(() => ({ eq: updateEq }))

  const insert = vi.fn().mockResolvedValue({ error: null })

  const limit = vi.fn().mockResolvedValue({ data: [], error: null })
  const order = vi.fn(() => ({ limit }))
  const eqUser = vi.fn(() => ({ order }))

  const select = vi.fn(() => ({ eq: eqUser }))

  const deleteEq = vi.fn().mockResolvedValue({ error: null })
  const deleteFn = vi.fn(() => ({ eq: deleteEq }))

  return {
    from: vi.fn(() => ({
      select,
      insert,
      update,
      delete: deleteFn,
    })),
    __mocks: {
      select,
      eqUser,
      order,
      limit,
      insert,
      update,
      updateEq,
      deleteFn,
      deleteEq,
    },
  }
}

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGuestHistoryMock.mockResolvedValue(null)
    saveGuestHistoryMock.mockResolvedValue(undefined)
    clearGuestHistoryMock.mockResolvedValue(undefined)
    getGuestMigrationSnapshotMock.mockReturnValue(null)
    clearGuestMigrationSnapshotMock.mockImplementation(() => undefined)
    renameInLibraryMock.mockResolvedValue({ success: true })
    deleteFromLibraryMock.mockResolvedValue({ success: true })
  })

  it('toggles pin state locally and persists for logged-in users', async () => {
    const supabase = createSupabaseMock()
    const report = createReport()
    const user = { id: 'user-1' } as const

    const { result } = renderHook(() =>
      useHistory({
        user: user as never,
        supabase: supabase as never,
        report,
        setReport: vi.fn(),
        setError: vi.fn(),
        setGuestTrialUsed: vi.fn(),
        setIsAuthVisible: vi.fn(),
      })
    )

    act(() => {
      result.current.setExtractions([
        {
          id: 'rec-1',
          user_id: 'user-1',
          source_label: 'Pinned target',
          style_data: createReport({ __pinned: false } as never),
          thumbnail_url: 'thumb.jpg',
          created_at: '2026-03-22T00:00:00.000Z',
        },
      ])
    })

    await act(async () => {
      await result.current.togglePin('rec-1')
    })

    expect(result.current.extractions[0].style_data.__pinned).toBe(true)
    expect(supabase.__mocks.update).toHaveBeenCalledTimes(1)
  })

  it('deletes and restores an item through undo', async () => {
    const supabase = createSupabaseMock()
    const report = createReport()

    const { result } = renderHook(() =>
      useHistory({
        user: null,
        supabase: supabase as never,
        report,
        setReport: vi.fn(),
        setError: vi.fn(),
        setGuestTrialUsed: vi.fn(),
        setIsAuthVisible: vi.fn(),
      })
    )

    const record = {
      id: 'rec-1',
      user_id: null,
      source_label: 'Delete me',
      style_data: createReport(),
      thumbnail_url: 'thumb.jpg',
      created_at: '2026-03-22T00:00:00.000Z',
    }

    act(() => {
      result.current.setExtractions([record])
    })

    act(() => {
      result.current.deleteItem('rec-1')
    })

    expect(result.current.extractions).toHaveLength(0)
    expect(result.current.undoItem?.id).toBe('rec-1')

    await act(async () => {
      await result.current.undoDelete()
    })

    expect(result.current.extractions).toHaveLength(1)
    expect(result.current.extractions[0].source_label).toBe('Delete me')
    expect(result.current.undoItem).toBeNull()
  })

  it('renames a guest record locally and persists it to guest storage', async () => {
    const supabase = createSupabaseMock()
    const setReport = vi.fn()
    const setError = vi.fn()
    const guestRecord = createGuestRecord()

    const { result } = renderHook(() =>
      useHistory({
        user: null,
        supabase: supabase as never,
        report: guestRecord.style_data,
        setReport,
        setError,
        setGuestTrialUsed: vi.fn(),
        setIsAuthVisible: vi.fn(),
      })
    )

    act(() => {
      result.current.setExtractions([guestRecord])
      result.current.setActiveItemId('guest_1')
      result.current.startRename('guest_1', guestRecord.source_label)
      result.current.setRenameValue('Renamed guest record')
    })

    await act(async () => {
      await result.current.submitRename('guest_1')
    })

    expect(result.current.extractions[0].source_label).toBe('Renamed guest record')
    expect(saveGuestHistoryMock).toHaveBeenCalledTimes(1)
    expect(setReport).toHaveBeenCalledWith(expect.objectContaining({ sourceLabel: 'Renamed guest record' }))
    expect(setError).not.toHaveBeenCalledWith('游客历史重命名失败')
  })
})
