// IndexedDB is per-origin; GLO deliberately touches only its own named database.
import { validatePublicPack } from './offlinePack.js'

const NAME = 'glo-pin-local-v1'
const TABLE = 'reports'
const PACKS = 'publicPacks'
const MAX_SAVED_PACKS = 10

function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('This browser does not support local IndexedDB storage.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 2)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(TABLE)) db.createObjectStore(TABLE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(PACKS)) db.createObjectStore(PACKS, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Local storage unavailable.'))
    request.onblocked = () => reject(new Error('Local database update blocked by another GLO tab. Close other tabs and retry.'))
  })
}

async function transact(mode, operation, storeName = TABLE) {
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode)
      const request = operation(tx.objectStore(storeName))
      let result
      request.onsuccess = () => { result = request.result }
      request.onerror = () => reject(request.error || new Error('Local database operation failed.'))
      tx.oncomplete = () => resolve(result)
      tx.onerror = () => reject(tx.error || new Error('Local database transaction failed.'))
      tx.onabort = () => reject(tx.error || new Error('Local database transaction aborted.'))
    })
  } finally { db.close() }
}

export async function listReports() {
  return (await transact('readonly', table => table.getAll()))
    .sort((a, b) => String(b.observedAt).localeCompare(String(a.observedAt)))
}
export function saveReport(report) { return transact('readwrite', table => table.put(report)) }
export function removeReport(id) { return transact('readwrite', table => table.delete(id)) }

export async function listPublicPacks() {
  const packs = await transact('readonly', table => table.getAll(), PACKS)
  return packs.map(pack => {
    try { return validatePublicPack(pack) } catch { return null }
  }).filter(Boolean).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export async function savePublicPack(pack) {
  const vetted = validatePublicPack(pack)
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(PACKS, 'readwrite')
      const store = tx.objectStore(PACKS)
      const keys = store.getAllKeys()
      keys.onsuccess = () => {
        if (!keys.result.includes(vetted.id) && keys.result.length >= MAX_SAVED_PACKS) {
          tx.abort()
          return
        }
        store.put(vetted)
      }
      keys.onerror = () => reject(keys.error || new Error('Could not inspect local pack count.'))
      tx.oncomplete = () => resolve(vetted)
      tx.onabort = () => reject(new Error('Could not save pack. You may have reached the 10-area limit or device storage is full.'))
      tx.onerror = () => reject(tx.error || new Error('Could not save local pack.'))
    })
  } finally { db.close() }
}
export function removePublicPack(id) { return transact('readwrite', table => table.delete(id), PACKS) }

// A privacy-clear operation must erase both local reports and public packs in one transaction.
// It does NOT affect other apps on the same origin, exported files, links, or browser history.
export async function clearAllLocalData() {
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([TABLE, PACKS], 'readwrite')
      tx.objectStore(TABLE).clear()
      tx.objectStore(PACKS).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('Could not clear GLO local data.'))
      tx.onabort = () => reject(tx.error || new Error('GLO clear operation was aborted.'))
    })
  } finally { db.close() }
}
export const clearAllReports = clearAllLocalData
