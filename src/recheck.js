// Bounded private, append-only visit observations. Never certifies service or uploads notes.
export const MAX_RECHECKS=20
export const MAX_RECHECK_NOTE=240
export const RECHECK_STATUSES=Object.freeze(['working','not_working','unknown'])
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))
export function createRecheck(report,draft,now=new Date(),uuid=()=>crypto.randomUUID()){
  if(typeof report?.id!=='string'||!validDate(report.observedAt))throw new Error('A saved private pin is required.')
  if(!Number.isFinite(now.getTime()))throw new Error('Invalid clock.')
  const observed=new Date(draft?.observedAtLocal||now)
  if(!Number.isFinite(observed.getTime())||observed.getTime()>now.getTime()+300000||
    observed.getTime()<Date.parse(report.observedAt))
    throw new Error('Recheck time must follow the original observation and cannot be in the future.')
  if(!RECHECK_STATUSES.includes(draft?.visitStatus))throw new Error('Choose what you observed.')
  const note=String(draft?.note||'').trim()
  if(note.length>MAX_RECHECK_NOTE)throw new Error('Recheck notes must be 240 characters or fewer.')
  if(/[<>\u0000-\u001f\u007f]/.test(note))throw new Error('Remove markup or control characters from notes.')
  const id=uuid()
  if(typeof id!=='string'||!id.trim()||id.length>80)throw new Error('Invalid recheck identifier.')
  return {id,observedAt:observed.toISOString(),savedAt:now.toISOString(),
    visitStatus:draft.visitStatus,note,
    provenance:'self-reported',condition:'not-verified',visibility:'device-only'}
}
export function validatedRechecks(report){
  if(!Array.isArray(report?.rechecks))return []
  const original=Date.parse(report.observedAt),seen=new Set()
  return report.rechecks.filter(r=>{
    if(!r||typeof r.id!=='string'||seen.has(r.id)||!RECHECK_STATUSES.includes(r.visitStatus)||
      r.provenance!=='self-reported'||r.condition!=='not-verified'||r.visibility!=='device-only'||
      !validDate(r.observedAt)||!validDate(r.savedAt)||Date.parse(r.observedAt)<original||
      Date.parse(r.observedAt)>Date.parse(r.savedAt)+300000||
      typeof r.note!=='string'||r.note.length>MAX_RECHECK_NOTE)return false
    seen.add(r.id);return true
  }).sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt)||Date.parse(b.savedAt)-Date.parse(a.savedAt))
}
export function latestRecheck(report){return validatedRechecks(report)[0]||null}
export function latestObservedAt(report){
  const values=[report?.observedAt,...validatedRechecks(report).map(r=>r.observedAt)]
    .map(v=>Date.parse(v)).filter(Number.isFinite)
  return values.length?new Date(Math.max(...values)).toISOString():null
}
