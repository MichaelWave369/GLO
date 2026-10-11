// GLO's deliberately conservative on-demand OSM source comparison.
// Inspiration: Peekaboo's evidence-change provenance patterns, not imported code.
// A change to a map record is not evidence of real-world availability, safety or closure.
import { distanceKm, validCoordinates } from './domain.js'

const ID=/^osm:(node|way|relation)\/[1-9]\d*$/
const MAX_ROWS=160
const MAX_CENTER_SHIFT_KM=0.25
const trim=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):''
const safe=record=>Boolean(record&&ID.test(record.id)&&validCoordinates(record.lat,record.lon))
const isValidTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))
function index(rows) {
  const data=new Map()
  for (const r of rows.slice(0,MAX_ROWS)) if(safe(r)&&!data.has(r.id)) data.set(r.id,r)
  return data
}
function diffFields(before,after) {
  const fields=[]
  if(trim(before.title)!==trim(after.title)) fields.push('mapped name')
  if(before.category!==after.category) fields.push('resource category')
  if(trim(before.reportedHours)!==trim(after.reportedHours)) fields.push('mapped opening-hours text')
  if(distanceKm(before,after)>0.015) fields.push('mapped position')
  return fields
}

export function comparePublicScans(previous,current) {
  const canCompare=Array.isArray(previous?.sources)&&Array.isArray(current?.sources)&&
    validCoordinates(previous?.center?.lat,previous?.center?.lon)&&
    validCoordinates(current?.center?.lat,current?.center?.lon)&&
    isValidTime(previous?.checkedAt)&&isValidTime(current?.checkedAt)
  if(!canCompare) return {status:'no-baseline',reason:'No previous same-area public Scout snapshot loaded.'}
  const shift=distanceKm(previous.center,current.center)
  if(!Number.isFinite(shift)||shift>MAX_CENTER_SHIFT_KM) return {
    status:'different-area',
    reason:'Map center moved too far for a reliable before/after comparison. This is a new neighborhood search.'
  }
  const oldRows=index(previous.sources),newRows=index(current.sources)
  const detailChanges=[],editOnly=[],newlyReturned=[],notReturned=[]
  for(const [id,latest] of newRows) {
    const prior=oldRows.get(id)
    const sourceUrl='https://www.openstreetmap.org/'+id.slice(4)
    if(!prior){
      newlyReturned.push({id,title:trim(latest.title)||'Unnamed OSM record',sourceUrl})
      continue
    }
    const changes=diffFields(prior,latest)
    if(changes.length)detailChanges.push({id,title:trim(latest.title)||'Unnamed OSM record',sourceUrl,changes})
    else if(prior.lastMappedAt!==latest.lastMappedAt)editOnly.push({id,title:trim(latest.title)||'Unnamed OSM record',sourceUrl})
  }
  for(const [id,prior] of oldRows) if(!newRows.has(id)) {
    notReturned.push({id,title:trim(prior.title)||'Unnamed OSM record',
      sourceUrl:'https://www.openstreetmap.org/'+id.slice(4)})
  }
  const queryIncomplete=Boolean(previous.mayBeIncomplete||current.mayBeIncomplete)
  return {
    status:'compared',
    previousCheckedAt:previous.checkedAt,currentCheckedAt:current.checkedAt,
    shiftKm:Number(shift.toFixed(3)),queryIncomplete,
    previousCount:oldRows.size,currentCount:newRows.size,
    detailChanges,editOnly,newlyReturned,notReturned,
    // A map record not returned is NEVER a real-world closure or disappearance finding.
    warning:'OSM query results and edit metadata are not proof of opening, closure, safety, accessibility or working service. Records may be missing because of search boundaries, tags, source edits or query limits.'
  }
}
