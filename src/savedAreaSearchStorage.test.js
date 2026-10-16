import test from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import {savePublicPack,listPublicPacks,clearAllLocalData,saveReport,listReports} from './storage.js'
import {createPublicPack} from './offlinePack.js'
import {mergeSavedAreaSources} from './savedAreaSearch.js'
import {findNearbyLoaded} from './nearbyFinder.js'

const older=new Date('2026-10-10T12:00:00Z'),newer=new Date('2026-10-12T12:00:00Z')
const resource=(id,name,date,lat)=>({
 id:'osm:node/'+id,title:name,category:'restroom',lat,lon:-75,
 source:'OpenStreetMap via Overpass',sourceUrl:'https://www.openstreetmap.org/node/'+id,
 lastMappedAt:older.toISOString(),checkedAt:date.toISOString(),
 provenance:'mapped-record',condition:'not-verified',availability:'unknown',
 accessNote:'Mapped only',reportedHours:''
})
const scan=(center,at,sources)=>createPublicPack({center,checkedAt:at.toISOString(),
 sources,mayBeIncomplete:false},at)

test('offline multi-area search reads only saved public packs, preserves own notes, panic clear removes packs',async()=>{
 await clearAllLocalData()
 const original={id:'offline_own',title:'Local private observation',category:'restroom',
  lat:40,lon:-75,note:'PRIVATE NOT FOR SOURCE PACK',observedAt:older.toISOString()}
 await saveReport(original)
 const area1=scan({lat:40,lon:-75},older,[resource(91,'Mapped restroom A',older,40)])
 const area2=scan({lat:40.01,lon:-75},newer,[resource(92,'Mapped restroom B',newer,40.01)])
 await savePublicPack(area1)
 await savePublicPack(area2)
 const oldFetch=globalThis.fetch
 globalThis.fetch=()=>{throw new Error('Offline test called network')}
 try{
  const packs=await listPublicPacks()
  assert.equal(packs.length,2)
  const merged=mergeSavedAreaSources([],packs)
  const results=findNearbyLoaded({
   point:{lat:40,lon:-75},radiusKm:2,category:'restroom',
   privateReports:await listReports(),publicSources:merged.sources,now:Date.now()
  })
  assert.equal(results.total,3)
  assert.equal(results.publicCount,2)
  assert.equal(results.privateCount,1)
  assert.ok(!JSON.stringify(results).includes('PRIVATE NOT FOR SOURCE PACK'))
  assert.deepEqual(results.shown.filter(x=>x.origin==='osm').map(x=>x.sourceScope),
   ['saved-pack','saved-pack'])
  assert.ok(results.shown.every(x=>x.condition==='not-verified'))
  await clearAllLocalData()
  assert.deepEqual(await listPublicPacks(),[])
  assert.deepEqual(await listReports(),[])
 }finally{globalThis.fetch=oldFetch}
})
