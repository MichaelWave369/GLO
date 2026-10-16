// P1-L: separate, versioned recovery for private UNVERIFIED research notes.
// Never extend the legacy v1 private pin backup or silently upload local data.
import { MAX_RESEARCH_NOTES, validateResearchAnnotation } from './agentHandoff.js'

export const RESEARCH_BACKUP_FORMAT='glo-research-private-backup'
export const MAX_RESEARCH_BACKUP_BYTES=6_000_000
export const MAX_RESEARCH_BACKUP_NOTES=4_800
const fail=(ok,msg)=>{if(!ok)throw new Error(msg)}
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype
const exactKeys=(v,keys)=>plain(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k))
const timestamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))
const byteLength=s=>new TextEncoder().encode(s).length

function checkNotes(input, now){
  fail(Array.isArray(input)&&input.length<=MAX_RESEARCH_BACKUP_NOTES,'Research backup exceeds the 4,800-note limit.')
  const seen=new Set(), perPin=new Map()
  return input.map(item=>{
    // The existing validator rejects foreign keys, forged provenance and unsafe links.
    const note=validateResearchAnnotation(item)
    fail(timestamp(note.recordedAt)&&Date.parse(note.recordedAt)<=now.getTime()+300000,'Invalid research note timestamp.')
    fail(!seen.has(note.id),'Duplicate research note IDs in backup.')
    seen.add(note.id)
    const count=(perPin.get(note.pinId)||0)+1
    fail(count<=MAX_RESEARCH_NOTES,'Research backup exceeds 12 notes per pin.')
    perPin.set(note.pinId,count)
    return note
  })
}

export function buildResearchBackup(annotations, now=new Date()){
  fail(now instanceof Date&&Number.isFinite(now.getTime()),'Invalid backup time.')
  const notes=checkNotes(annotations,now)
  const payload={format:RESEARCH_BACKUP_FORMAT,schemaVersion:1,exportedAt:now.toISOString(),annotations:notes}
  fail(byteLength(JSON.stringify(payload))<=MAX_RESEARCH_BACKUP_BYTES,'Research backup exceeds the 6 MB limit.')
  return {name:'GLO-PRIVATE-RESEARCH-SENSITIVE-backup.json',payload}
}

export function parseResearchBackup(text, now=new Date()){
  fail(typeof text==='string'&&byteLength(text)<=MAX_RESEARCH_BACKUP_BYTES,'Research backup exceeds the 6 MB limit.')
  fail(now instanceof Date&&Number.isFinite(now.getTime()),'Invalid restore time.')
  let payload
  try{payload=JSON.parse(text)}catch{throw new Error('Research backup is not valid JSON.')}
  fail(exactKeys(payload,['format','schemaVersion','exportedAt','annotations'])&&
    payload.format===RESEARCH_BACKUP_FORMAT&&payload.schemaVersion===1&&
    timestamp(payload.exportedAt)&&Date.parse(payload.exportedAt)<=now.getTime()+300000,
    'Choose a GLO research-only private backup (not a pin backup, overview or map pack).')
  return {format:payload.format,exportedAt:payload.exportedAt,annotations:checkNotes(payload.annotations,now)}
}

// Advisory preview; IndexedDB re-checks pin/ID/capacity state in the write transaction.
export function previewResearchRestore(incoming, existing, pinIds){
  fail(Array.isArray(incoming)&&Array.isArray(existing)&&Array.isArray(pinIds),'Invalid research restore preview.')
  const pins=new Set(pinIds)
  const ids=new Set(existing.map(n=>n.id))
  const counts=new Map()
  for(const n of existing)counts.set(n.pinId,(counts.get(n.pinId)||0)+1)
  const result={total:incoming.length,addable:0,alreadyHere:0,missingPin:0,full:0}
  for(const note of incoming){
    if(!pins.has(note.pinId)){result.missingPin++;continue}
    if(ids.has(note.id)){result.alreadyHere++;continue}
    if((counts.get(note.pinId)||0)>=MAX_RESEARCH_NOTES){result.full++;continue}
    ids.add(note.id)
    counts.set(note.pinId,(counts.get(note.pinId)||0)+1)
    result.addable++
  }
  return result
}
