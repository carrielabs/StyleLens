import type { StyleReport } from '@/lib/types'

const DB_NAME = 'stylelens_guest_db'
const STORE_NAME = 'guest_records'
const RECORD_KEY = 'latest'
const MIGRATION_SNAPSHOT_KEY = 'stylelens_guest_migration_snapshot'

export interface GuestHistoryRecord {
  id: string
  user_id: string | null
  source_label: string
  style_data: StyleReport
  thumbnail_url: string | null
  created_at: string
}

function openGuestDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function getGuestHistory(): Promise<GuestHistoryRecord | null> {
  const db = await openGuestDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(RECORD_KEY)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve((request.result as GuestHistoryRecord | undefined) ?? null)
  })
}

export async function saveGuestHistory(record: GuestHistoryRecord): Promise<void> {
  const db = await openGuestDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(record, RECORD_KEY)

    request.onerror = () => reject(request.error)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearGuestHistory(): Promise<void> {
  const db = await openGuestDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(RECORD_KEY)

    request.onerror = () => reject(request.error)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function getGuestMigrationSnapshot(): GuestHistoryRecord | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(MIGRATION_SNAPSHOT_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as GuestHistoryRecord
  } catch {
    return null
  }
}

export function saveGuestMigrationSnapshot(record: GuestHistoryRecord): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(MIGRATION_SNAPSHOT_KEY, JSON.stringify(record))
}

export function clearGuestMigrationSnapshot(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(MIGRATION_SNAPSHOT_KEY)
}

export async function snapshotGuestHistoryForLogin(): Promise<void> {
  const guestRecord = await getGuestHistory().catch(() => null)
  if (!guestRecord) return
  saveGuestMigrationSnapshot(guestRecord)
}
