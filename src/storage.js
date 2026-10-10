const NAME = 'glo-pin-local-v1'
const TABLE = 'reports'

function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('This browser does not support local IndexedDB storage.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(TABLE)) db.createObjectStore(TABLE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Local storage unavailable.'))
    request.onblocked = () => reject(new Error('Local database update blocked by another tab.'))
  })
}

async function transact(mode, operation) {
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(TABLE, mode)
      const request = operation(tx.objectStore(TABLE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Local database operation failed.'))
      tx.onerror = () => reject(tx.error || new Error('Local database transaction failed.'))
      tx.onabort = () => reject(tx.error || new Error('Local database transaction aborted.'))
    })
  } finally {
    db.close()
  }
}

export async function listReports() {
  return (await transact('readonly', (table) => table.getAll()))
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
}

export function saveReport(report) {
  return transact('readwrite', (table) => table.put(report))
}

export function removeReport(id) {
  return transact('readwrite', (table) => table.delete(id))
}


// Clear only GLO Pin's report table, not unrelated apps on the shared Pages origin.
export function clearAllReports() {
  return transact('readwrite', (table) => table.clear())
}
