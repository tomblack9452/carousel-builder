/**
 * Minimal IndexedDB wrapper. Two stores: image blobs by asset id, and a
 * key-value store for the project and settings. Every call can reject
 * (private windows, blocked storage), so callers must handle failure.
 */
const DB_NAME = 'carousel-builder'
const DB_VERSION = 1
const ASSETS = 'assets'
const KV = 'kv'

let opening: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(ASSETS)) db.createObjectStore(ASSETS)
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  // Let a later call retry if opening failed.
  opening.catch(() => { opening = null })
  return opening
}

async function run<T>(store: string, mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = op(db.transaction(store, mode).objectStore(store))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const db = {
  getAsset: (id: string) => run<Blob | undefined>(ASSETS, 'readonly', (s) => s.get(id)),
  putAsset: (id: string, blob: Blob) => run(ASSETS, 'readwrite', (s) => s.put(blob, id)),
  deleteAsset: (id: string) => run(ASSETS, 'readwrite', (s) => s.delete(id)),
  assetIds: () => run(ASSETS, 'readonly', (s) => s.getAllKeys()).then((keys) => keys.map(String)),
  get: <T>(key: string) => run<T | undefined>(KV, 'readonly', (s) => s.get(key)),
  set: (key: string, value: unknown) => run(KV, 'readwrite', (s) => s.put(value, key)),
}
