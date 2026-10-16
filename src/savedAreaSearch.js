// P1-O: search validated offline public Scout snapshots in-memory.
// No fetch, GPS, uploads, writes, or implications of currently available services.
import {PACK_CATEGORIES,sourcesFromPack} from './offlinePack.js'
import {validCoordinates} from './domain.js'

const safeTime=value=>{
 const n=typeof value==='string'?Date.parse(value):NaN
 return Number.isFinite(n)?n:-Infinity
}
const validSource=r=>r&&typeof r.id==='string'&&
 /^osm:(node|way|relation)\/[1-9]\d*$/.test(r.id)&&
 PACK_CATEGORIES.includes(r.category)&&validCoordinates(r.lat,r.lon)&&
 r.provenance==='mapped-record'&&r.condition==='not-verified'&&
 r.availability==='unknown'

// An OSM ID may occur in several overlapping saved areas, or a loaded scan.
// Preserve ONE item per ID, choosing the newest *query date*, never treating it
// as the newest real-world service status. On a tie, prefer the already loaded copy.
export function mergeSavedAreaSources(loadedSources=[],packs=[]){
 if(!Array.isArray(loadedSources)||!Array.isArray(packs)||packs.length>10)
  throw new Error('Invalid saved-area search inputs.')
 const byId=new Map(), stats={savedAreas:0,skippedAreas:0,incompleteAreas:0,duplicateRecords:0}
 const consider=(record,sourceType,incomplete)=>{
  if(!validSource(record))return
  const item={
   ...record,
   nearbySource:sourceType,
   nearbyIncomplete:Boolean(incomplete)
  }
  const prior=byId.get(item.id)
  if(prior){
   stats.duplicateRecords++
   if(safeTime(item.checkedAt)>safeTime(prior.checkedAt))
    byId.set(item.id,item)
  }else byId.set(item.id,item)
 }
 for(const source of loadedSources)consider(source,'loaded',false)
 for(const raw of packs){
  try{
   // Revalidate even after IndexedDB read. Reject untrusted/private fields.
   const sources=sourcesFromPack(raw)
   stats.savedAreas++
   if(raw.incomplete)stats.incompleteAreas++
   for(const source of sources)consider(source,'saved-pack',raw.incomplete)
  }catch{stats.skippedAreas++}
 }
 return {sources:[...byId.values()],stats}
}
