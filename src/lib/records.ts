import type { VerificationRecord } from '../types'

/**
 * Persistence boundary for the traceability log.
 *
 * Components depend ONLY on this interface — never on IndexedDB directly — so the
 * in-browser store can be replaced by a REST client backed by NestJS/PostgreSQL
 * (plus an offline-sync queue) without touching a single component. Swap the
 * exported `recordsService` singleton at the bottom of this file and the UI is
 * none the wiser.
 */
export interface RecordsService {
  /** Record a stage verification (upsert keyed by stepId). */
  add(record: VerificationRecord): Promise<void>
  /** Drop a single stage's verification (e.g. operator un-ticks the part). */
  remove(stepId: string): Promise<void>
  /** All records for the current build, oldest first. */
  list(): Promise<VerificationRecord[]>
  /** Wipe the log (e.g. when a new build starts). */
  clear(): Promise<void>
}

const DB_NAME = 'bridge-traceability'
const DB_VERSION = 1
const STORE = 'records'
const TS_INDEX = 'timestamp'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        // stepId is the natural key → exactly one verification per stage, so a
        // reload reconstructs the build state and the summary count is exact.
        const store = db.createObjectStore(STORE, { keyPath: 'stepId' })
        store.createIndex(TS_INDEX, 'timestamp', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onblocked = () => reject(new Error('IndexedDB open blocked'))
  })
}

class IndexedDbRecordsService implements RecordsService {
  private dbPromise: Promise<IDBDatabase> | null = null

  private db(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDatabase()
    }
    return this.dbPromise
  }

  async add(record: VerificationRecord): Promise<void> {
    const db = await this.db()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'))
    })
  }

  async remove(stepId: string): Promise<void> {
    const db = await this.db()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(stepId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB delete aborted'))
    })
  }

  async list(): Promise<VerificationRecord[]> {
    const db = await this.db()
    return new Promise<VerificationRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      // The timestamp index returns rows already sorted chronologically.
      const request = tx.objectStore(STORE).index(TS_INDEX).getAll()
      request.onsuccess = () => resolve(request.result as VerificationRecord[])
      request.onerror = () => reject(request.error ?? new Error('IndexedDB list failed'))
    })
  }

  async clear(): Promise<void> {
    const db = await this.db()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB clear failed'))
    })
  }
}

/**
 * The single instance the app talks to. To migrate to the production backend,
 * implement `RecordsService` against your API and assign it here:
 *
 *   export const recordsService: RecordsService = new RestRecordsService(baseUrl)
 */
export const recordsService: RecordsService = new IndexedDbRecordsService()
