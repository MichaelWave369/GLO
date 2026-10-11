// IndexedDB is per-origin; GLO deliberately touches only its own named database.
import { validatePublicPack } from './offlinePack.js'
import { validateStreetSketch } from './streetSketch.js'
import { MAX_RECHECKS, validatedRechecks } from './recheck.js'

const NAME = 'glo-pin-local-v1'
const TABLE = 'reports'
const PACKS = 'publicPacks'
const STREETS = 'streetSketches'
const MAX_SAVED_PACKS = 10

function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('This browser does not support local IndexedDB storage.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 3)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(TABLE)) db.createObjectStore(TABLE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(PACKS)) db.createObjectStore(PACKS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STREETS)) db.createObjectStore(STREETS, { keyPath: 'id' })
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

// The pin and its rechecks live in the SAME IndexedDB row, so deletion, private backup
// and panic clear include the full history without an upgrade or a separate orphan store.
export async function appendRecheck(reportId, receipt) {
  const db=await openDatabase()
  try {
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(TABLE,'readwrite')
      const store=tx.objectStore(TABLE)
      const get=store.get(reportId)
      let updated
      get.onsuccess=()=>{
        const existing=get.result
        if(!existing) {tx.abort();return}
        const current=validatedRechecks(existing)
        const matches=validatedRechecks({...existing,rechecks:[receipt]})
        if(matches.length!==1 || Object.keys(receipt).some(k=>![
          'id','observedAt','savedAt','visitStatus','note','provenance','condition','visibility'
        ].includes(k)) || current.length>=MAX_RECHECKS ||
          current.some(r=>r.id===receipt.id)){tx.abort();return}
        updated={...existing,rechecks:[...(existing.rechecks||[]),receipt]}
        store.put(updated)
      }
      tx.oncomplete=()=>resolve(updated)
      tx.onabort=()=>reject(new Error('Private recheck not saved. Pin missing, history full (20) or receipt invalid.'))
      tx.onerror=()=>reject(tx.error||new Error('Unable to save the private recheck.'))
    })
  } finally {db.close()}
}


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
      const tx = db.transaction([TABLE, PACKS, STREETS], 'readwrite')
      tx.objectStore(TABLE).clear()
      tx.objectStore(PACKS).clear()
      tx.objectStore(STREETS).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('Could not clear GLO local data.'))
      tx.onabort = () => reject(tx.error || new Error('GLO clear operation was aborted.'))
    })
  } finally { db.close() }
}
export const clearAllReports = clearAllLocalData


export async function listStreetSketches() {
  const rows=await transact('readonly',store=>store.getAll(),STREETS)
  return rows.map(row=>{try{return validateStreetSketch(row)}catch{return null}})
    .filter(Boolean).sort((a,b)=>b.savedAt.localeCompare(a.savedAt))
}
export async function saveStreetSketch(sketch) {
  const vetted=validateStreetSketch(sketch)
  const db=await openDatabase()
  try {
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(STREETS,'readwrite')
      const store=tx.objectStore(STREETS)
      const request=store.getAllKeys()
      request.onsuccess=()=>{
        if(!request.result.includes(vetted.id)&&request.result.length>=4){tx.abort();return}
        store.put(vetted)
      }
      request.onerror=()=>reject(request.error||new Error('Unable to count street packs.'))
      tx.oncomplete=()=>resolve(vetted)
      tx.onabort=()=>reject(new Error('Street pack limit reached (4 neighborhoods) or storage unavailable. Delete an old area first.'))
      tx.onerror=()=>reject(tx.error||new Error('Offline street sketch could not be saved.'))
    })
  } finally {db.close()}
}
export function deleteStreetSketch(id) {
  return transact('readwrite',store=>store.delete(id),STREETS)
}
