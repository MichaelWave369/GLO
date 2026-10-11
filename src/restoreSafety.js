// Validate an UNTRUSTED, user-selected GLO private JSON backup before any restore.
// The counts-only overview and public OSM pack are explicitly NOT restore formats.
import { CATEGORIES, validCoordinates } from './domain.js'
import { validatedRechecks, MAX_RECHECKS } from './recheck.js'

export const MAX_RESTORE_BYTES=1_500_000
export const MAX_RESTORE_PINS=200
export const MAX_RESTORE_TITLE=90
const keys=['id','schemaVersion','category','title','note','lat','lon','observedAt','savedAt',
  'lastSeenWorkingAt','visitStatus','reportedHours','accessibility','provenance','condition','visibility','rechecks']
const accessKeys=['wheelchair','stepFree','idRequired','petsAllowed']
const receiptKeys=['id','observedAt','savedAt','visitStatus','note','provenance','condition','visibility']
const fieldStatus=['working','not_working','unknown']
const cleanText=(v,limit)=>typeof v==='string'&&v.length<=limit&&!/[\u0000-\u001f\u007f]/.test(v)
const iso=v=>typeof v==='string'&&v.length<=35&&Number.isFinite(Date.parse(v))
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype
const allowed=(v,arr)=>plain(v)&&Object.keys(v).every(k=>arr.includes(k))
const idOk=v=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v)
const recent=(value,now)=>Date.parse(value)<=now.getTime()+300000
const length=text=>new TextEncoder().encode(text).length
const ensure=(yes,message)=>{if(!yes)throw new Error(message)}

function normalizeIncomingReport(r,now){
  ensure(allowed(r,keys),'Unrecognized or unsafe private report fields.')
  ensure(idOk(r.id),'Invalid private pin identifier.')
  ensure(r.schemaVersion===undefined||r.schemaVersion===1,'Unsupported private pin schema version.')
  ensure(Object.hasOwn(CATEGORIES,r.category),'Unknown private resource category.')
  ensure(cleanText(r.title,MAX_RESTORE_TITLE)&&r.title.trim().length>0,'Invalid private pin title.')
  ensure(cleanText(r.note??'',400),'Invalid private pin note.')
  ensure(typeof r.lat==='number'&&typeof r.lon==='number'&&validCoordinates(r.lat,r.lon),'Invalid private coordinates.')
  ensure(iso(r.observedAt)&&recent(r.observedAt,now),'Invalid or future observation timestamp.')
  const savedAt=r.savedAt??r.observedAt
  ensure(iso(savedAt)&&recent(savedAt,now) &&
    Date.parse(r.observedAt)<=Date.parse(savedAt)+300000,'Invalid private save timestamp.')
  ensure(fieldStatus.includes(r.visitStatus??'unknown'),'Invalid personal visit status.')
  ensure(cleanText(r.reportedHours??'',100),'Invalid reported hours.')
  ensure(r.provenance===undefined||r.provenance==='self-reported','Imported notes cannot claim official provenance.')
  ensure(r.condition===undefined||r.condition==='not-verified','Imported notes cannot claim independent verification.')
  ensure(r.visibility===undefined||r.visibility==='device-only','Imported notes must remain device-only.')
  const access=r.accessibility??{}
  ensure(allowed(access,accessKeys)&&
    Object.values(access).every(v=>['yes','no','unknown'].includes(v)),'Invalid accessibility observations.')
  const lastWorking=r.lastSeenWorkingAt??null
  ensure(lastWorking===null||(iso(lastWorking)&&recent(lastWorking,now)&&
    Date.parse(lastWorking)<=Date.parse(savedAt)+300000),'Invalid working-observation timestamp.')
  const checks=r.rechecks??[]
  ensure(Array.isArray(checks)&&checks.length<=MAX_RECHECKS,'Private recheck history exceeds 20 entries.')
  const record={
    id:r.id,schemaVersion:1,category:r.category,title:r.title,note:r.note??'',
    lat:r.lat,lon:r.lon,observedAt:r.observedAt,savedAt,
    lastSeenWorkingAt:lastWorking,visitStatus:r.visitStatus??'unknown',
    reportedHours:r.reportedHours??'',
    accessibility:Object.fromEntries(accessKeys.map(k=>[k,access[k]??'unknown'])),
    provenance:'self-reported',condition:'not-verified',visibility:'device-only'
  }
  if(checks.length){
    // Fail the entire file if ANY entry is malformed. No silent history truncation.
    ensure(checks.every(c=>allowed(c,receiptKeys)&&Object.keys(c).length===receiptKeys.length&&idOk(c.id)&&
      iso(c.observedAt)&&iso(c.savedAt)&&recent(c.savedAt,now)&&recent(c.observedAt,now)&&
      Date.parse(c.observedAt)<=Date.parse(c.savedAt)+300000 &&
      cleanText(c.note,240)&&!/[<>]/.test(c.note)),'Invalid private recheck fields.')
    const seen=new Set()
    for(const item of checks){
      ensure(!seen.has(item.id),'Duplicate private recheck IDs.')
      seen.add(item.id)
    }
    const accepted=validatedRechecks({...record,rechecks:checks})
    ensure(accepted.length===checks.length,'Private rechecks have invalid dates or provenance.')
    record.rechecks=checks.map(c=>Object.fromEntries(receiptKeys.map(k=>[k,c[k]])))
  }
  return record
}

export function parsePrivateRestore(text,now=new Date()){
  ensure(typeof text==='string'&&length(text)<=MAX_RESTORE_BYTES,'Backup file exceeds the 1.5 MB limit.')
  ensure(Number.isFinite(now.getTime()),'Invalid clock.')
  let payload
  try{payload=JSON.parse(text)}catch{throw new Error('Selected file is not valid JSON.')}
  ensure(allowed(payload,['format','schemaVersion','exportedAt','reports']) &&
    payload.format==='glo-pin-private-backup' && payload.schemaVersion===1 &&
    iso(payload.exportedAt)&&recent(payload.exportedAt,now),
    'Only a genuine-format GLO full private backup can be previewed. Counts-only and public files cannot be restored.')
  ensure(Array.isArray(payload.reports)&&payload.reports.length<=MAX_RESTORE_PINS,
    'Backup includes too many private pins (limit 200).')
  const ids=new Set()
  const reports=payload.reports.map(r=>{
    const cleaned=normalizeIncomingReport(r,now)
    ensure(!ids.has(cleaned.id),'Duplicate private pin IDs in backup.')
    ids.add(cleaned.id)
    return cleaned
  })
  return {format:payload.format,exportedAt:payload.exportedAt,reports}
}

export function restorePreview(incoming,existing=[]){
  ensure(Array.isArray(incoming)&&Array.isArray(existing),'Invalid restore preview.')
  const current=new Set(existing.map(r=>r.id))
  const fresh=incoming.filter(r=>!current.has(r.id))
  const conflicts=incoming.length-fresh.length
  const rechecks=incoming.reduce((total,r)=>total+(r.rechecks?.length||0),0)
  return {total:incoming.length,addable:fresh.length,alreadyHere:conflicts,rechecks}
}
