// IndexedDB is per-origin; GLO deliberately touches only its own named database.
import { validatePublicPack } from './offlinePack.js'
import { validateStreetSketch } from './streetSketch.js'
import { MAX_RECHECKS, validatedRechecks } from './recheck.js'
import { parsePrivateRestore } from './restoreSafety.js'
import { validateResearchAnnotation, MAX_RESEARCH_NOTES } from './agentHandoff.js'
import { parseResearchBackup } from './researchBackup.js'

const NAME = 'glo-pin-local-v1'
const TABLE = 'reports'
const PACKS = 'publicPacks'
const STREETS = 'streetSketches'
const RESEARCH = 'researchAnnotations'
const MAX_SAVED_PACKS = 10
// In this tab, an in-flight recovery must never repopulate data after panic clear.
let privacyEpoch = 0

function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('This browser does not support local IndexedDB storage.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 4)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(TABLE)) db.createObjectStore(TABLE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(PACKS)) db.createObjectStore(PACKS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STREETS)) db.createObjectStore(STREETS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(RESEARCH)) {
        const notes=db.createObjectStore(RESEARCH,{keyPath:'id'})
        notes.createIndex('pinId','pinId',{unique:false})
      }
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
// Deleting a private pin also removes its research notes atomically.
export async function removeReport(id) {
  const db=await openDatabase()
  try {
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction([TABLE,RESEARCH],'readwrite')
      const notes=tx.objectStore(RESEARCH)
      const cursor=notes.index('pinId').openKeyCursor(IDBKeyRange.only(id))
      cursor.onsuccess=()=>{
        if(!cursor.result)return
        notes.delete(cursor.result.primaryKey)
        cursor.result.continue()
      }
      tx.objectStore(TABLE).delete(id)
      tx.oncomplete=()=>resolve()
      tx.onerror=()=>reject(tx.error||new Error('Could not delete private pin and research.'))
      tx.onabort=()=>reject(tx.error||new Error('Could not delete private pin and research.'))
    })
  } finally {db.close()}
}

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
  privacyEpoch++
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([TABLE, PACKS, STREETS, RESEARCH], 'readwrite')
      tx.objectStore(TABLE).clear()
      tx.objectStore(PACKS).clear()
      tx.objectStore(STREETS).clear()
      tx.objectStore(RESEARCH).clear()
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


// This is ADD ONLY. The live IndexedDB keys, not a stale React preview, are
// re-checked inside ONE write transaction. Existing IDs are never overwritten.
// A failed write aborts the batch; no partial-success import is reported.
export async function restorePrivateReports(incoming) {
  const startedInEpoch=privacyEpoch
  if(!Array.isArray(incoming))throw new Error('No reviewed private backup selected.')
  const inspected=parsePrivateRestore(JSON.stringify({
    format:'glo-pin-private-backup',schemaVersion:1,exportedAt:new Date().toISOString(),
    reports:incoming
  })).reports
  const db=await openDatabase()
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(TABLE,'readwrite')
      const store=tx.objectStore(TABLE)
      const keys=store.getAllKeys()
      let outcome=null
      keys.onsuccess=()=>{
        if(privacyEpoch!==startedInEpoch){tx.abort();return}
        const existing=new Set(keys.result)
        const fresh=inspected.filter(r=>!existing.has(r.id))
        if(existing.size+fresh.length>400){tx.abort();return}
        outcome={imported:fresh.length,skipped:inspected.length-fresh.length}
        for(const report of fresh)store.add(report)
      }
      tx.oncomplete=()=>resolve(outcome)
      tx.onabort=()=>reject(new Error('Restore cancelled: invalid state, storage limit (400 pins) or failed write. No existing pins were overwritten.'))
      tx.onerror=()=>reject(tx.error||new Error('Restore failed. No existing pins were overwritten.'))
    })
  }finally{db.close()}
}


// Read only GLO-owned research notes. The caller decides whether to include
// only notes attached to living pins in a reviewed offline backup.
export async function listAllResearchAnnotations(){
  const rows=await transact('readonly',store=>store.getAll(),RESEARCH)
  return rows.map(n=>{try{return validateResearchAnnotation(n)}catch{return null}})
    .filter(Boolean).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt))
}

// ADD ONLY, atomic across pin lookups and research notes. Existing IDs never
// change. Missing pins, duplicates and full histories are counted, not imported.
export async function restoreResearchAnnotations(incoming){
  const started=privacyEpoch
  const {annotations}=parseResearchBackup(JSON.stringify({
    format:'glo-research-private-backup',schemaVersion:1,
    exportedAt:new Date().toISOString(),annotations:incoming
  }))
  const db=await openDatabase()
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction([TABLE,RESEARCH],'readwrite')
    const store=tx.objectStore(RESEARCH)
    const pinsRequest=tx.objectStore(TABLE).getAllKeys()
    const notesRequest=store.getAll()
    let pinIds=null,existing=null,outcome=null
    function writeOnce(){
      if(pinIds===null||existing===null)return
      if(privacyEpoch!==started){tx.abort();return}
      const pins=new Set(pinIds), ids=new Set(existing.map(n=>n.id))
      const counts=new Map()
      for(const n of existing)counts.set(n.pinId,(counts.get(n.pinId)||0)+1)
      outcome={imported:0,alreadyHere:0,missingPin:0,full:0}
      for(const n of annotations){
        if(!pins.has(n.pinId)){outcome.missingPin++;continue}
        if(ids.has(n.id)){outcome.alreadyHere++;continue}
        if((counts.get(n.pinId)||0)>=MAX_RESEARCH_NOTES){outcome.full++;continue}
        ids.add(n.id)
        counts.set(n.pinId,(counts.get(n.pinId)||0)+1)
        store.add(n)
        outcome.imported++
      }
    }
    pinsRequest.onsuccess=()=>{pinIds=pinsRequest.result;writeOnce()}
    notesRequest.onsuccess=()=>{existing=notesRequest.result;writeOnce()}
    tx.oncomplete=()=>resolve(outcome)
    tx.onerror=()=>reject(tx.error||new Error('Research restore failed. No notes were overwritten.'))
    tx.onabort=()=>reject(new Error('Research restore cancelled; no notes were imported. Check storage and privacy state.'))
  })}finally{db.close()}
}

// Research notes remain a completely separate, private, unverified ledger.
// No outside assistant writes directly. Explicit user review is required in the UI.
// Research notes are NOT included in the legacy v1 backup; the UI warns accordingly.
export async function listResearchAnnotations(pinId) {
  if(typeof pinId!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(pinId))return []
  const db=await openDatabase()
  try {
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(RESEARCH,'readonly')
      const request=tx.objectStore(RESEARCH).index('pinId').getAll(IDBKeyRange.only(pinId))
      request.onsuccess=()=>resolve(request.result.map(x=>{
        try{return validateResearchAnnotation(x)}catch{return null}
      }).filter(Boolean).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt)))
      request.onerror=()=>reject(request.error||new Error('Could not read local research notes.'))
    })
  } finally {db.close()}
}
export async function saveResearchAnnotation(value) {
  const note=validateResearchAnnotation(value)
  const started=privacyEpoch
  const db=await openDatabase()
  try {
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction([TABLE,RESEARCH],'readwrite')
      const notes=tx.objectStore(RESEARCH)
      const check=tx.objectStore(TABLE).get(note.pinId)
      check.onsuccess=()=>{
        if(privacyEpoch!==started || !check.result) {tx.abort();return}
        const count=notes.index('pinId').count(IDBKeyRange.only(note.pinId))
        count.onsuccess=()=>{
          if(privacyEpoch!==started||count.result>=MAX_RESEARCH_NOTES){tx.abort();return}
          notes.add(note)
        }
      }
      tx.oncomplete=()=>resolve(note)
      tx.onerror=()=>reject(tx.error||new Error('Could not save research note.'))
      tx.onabort=()=>reject(new Error('Research not saved. Pin missing, privacy clear requested, or 12-note limit reached.'))
    })
  } finally {db.close()}
}
export async function removeResearchAnnotation(pinId,noteId) {
  const db=await openDatabase()
  try {
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(RESEARCH,'readwrite')
      const store=tx.objectStore(RESEARCH)
      const request=store.get(noteId)
      request.onsuccess=()=>{
        if(!request.result||request.result.pinId!==pinId){tx.abort();return}
        store.delete(noteId)
      }
      tx.oncomplete=()=>resolve()
      tx.onerror=()=>reject(tx.error||new Error('Could not remove research note.'))
      tx.onabort=()=>reject(new Error('Research note missing or belongs to another pin.'))
    })
  } finally {db.close()}
}
