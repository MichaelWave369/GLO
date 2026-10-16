// P1-N: deterministic, offline-only distance filtering of information already loaded.
// No network call, GPS prompt, storage write, routing, opening-hour or safety claim.
import {CATEGORIES,distanceKm,validCoordinates} from './domain.js'
import {latestObservedAt} from './recheck.js'
import {PACK_CATEGORIES} from './offlinePack.js'

export const NEARBY_RADII=Object.freeze([0.5,1,2,5,10])
export const NEARBY_LIMIT=12
const cleanTime=(value,now)=>{
 const time=typeof value==='string'?Date.parse(value):NaN
 if(!Number.isFinite(time)||time>now+300000)return null
 return new Date(time).toISOString()
}
export function parseNearbyPoint(latText,lonText){
 if(typeof latText!=='string'||typeof lonText!=='string'||
   !latText.trim()||!lonText.trim()||latText.length>24||lonText.length>24)
   throw new Error('Enter both latitude and longitude. A blank is not 0.')
 const lat=Number(latText),lon=Number(lonText)
 if(!validCoordinates(lat,lon))throw new Error('Enter valid geographic coordinates.')
 return {lat,lon}
}

export function findNearbyLoaded({
 point,category='all',radiusKm=2,privateReports=[],publicSources=[],now=Date.now()
}={}){
 if(!validCoordinates(point?.lat,point?.lon))throw new Error('Choose a valid search point.')
 if(category!=='all'&&!Object.hasOwn(CATEGORIES,category))
   throw new Error('Choose a valid resource category.')
 if(!NEARBY_RADII.includes(radiusKm))throw new Error('Choose a supported radius.')
 if(!Array.isArray(privateReports)||!Array.isArray(publicSources)||!Number.isFinite(now))
   throw new Error('Invalid locally loaded resource data.')
 const seen=new Set(),rows=[]
 const collect=(records,origin)=>{
  // Ignore invalid records, fabricated verification and duplicate IDs. Never
  // pass private notes, access details, history or source URLs to result cards.
  for(const r of records){
   if(!r||typeof r.id!=='string'||!r.id.length||
      typeof r.title!=='string'||!r.title.trim()||
      !Object.hasOwn(CATEGORIES,r.category)||!validCoordinates(r.lat,r.lon)||
      (category!=='all'&&r.category!==category))continue
   if(origin==='osm' && (!PACK_CATEGORIES.includes(r.category)||r.provenance!=='mapped-record'||
      r.condition!=='not-verified'||r.availability!=='unknown'||!/^osm:(node|way|relation)\/[1-9]\d*$/.test(r.id)))
      continue
   const key=origin+':'+r.id
   if(seen.has(key))continue
   seen.add(key)
   const km=distanceKm(point,r)
   if(km>radiusKm+1e-9)continue
   const timestamp=origin==='private' ? latestObservedAt(r) : r.checkedAt
   rows.push({
    id:r.id,origin,title:r.title,category:r.category,
    lat:r.lat,lon:r.lon,distanceKm:km,
    evidenceAt:cleanTime(timestamp,now),
    condition:'not-verified',
    ...(origin==='osm'?{sourceScope:r.nearbySource==='saved-pack'?'saved-pack':'loaded',
      incompleteSnapshot:r.nearbyIncomplete===true}:{})
   })
  }
 }
 collect(privateReports,'private')
 collect(publicSources,'osm')
 // Distances are straight-line only; order is NOT a safety, quality or availability ranking.
 rows.sort((a,b)=>a.distanceKm-b.distanceKm ||
   (a.origin==='private'?-1:1)-(b.origin==='private'?-1:1) ||
   a.id.localeCompare(b.id))
 return {total:rows.length,shown:rows.slice(0,NEARBY_LIMIT),
  privateCount:rows.filter(r=>r.origin==='private').length,
  publicCount:rows.filter(r=>r.origin==='osm').length}
}
