import test from 'node:test'
import assert from 'node:assert/strict'
import {createPublicPack} from './offlinePack.js'
import {mergeSavedAreaSources} from './savedAreaSearch.js'
import {findNearbyLoaded} from './nearbyFinder.js'

const a=new Date('2026-10-10T13:00:00Z')
const b=new Date('2026-10-12T13:00:00Z')
const item=(id,title,checkedAt)=>({
 id:'osm:node/'+id,title,category:'water',lat:40,lon:-75,
 source:'OpenStreetMap via Overpass',sourceUrl:'https://www.openstreetmap.org/node/'+id,
 lastMappedAt:'2026-09-01T10:00:00Z',checkedAt:checkedAt.toISOString(),
 provenance:'mapped-record',condition:'not-verified',availability:'unknown',
 accessNote:'Never verified',reportedHours:''
})
const pack=(center,records,at,incomplete=false)=>createPublicPack({
 center,checkedAt:at.toISOString(),sources:records,mayBeIncomplete:incomplete
},at)

test('search merges overlapping saved regions by OSM ID and newest scan; results stay unverified',()=>{
 const old=pack({lat:40,lon:-75},[item(1,'Old name',a),item(2,'Nearby',a)],a,true)
 const newer=pack({lat:40.004,lon:-75},[item(1,'Newer mapped name',b),item(3,'Different candidate',b)],b)
 const merged=mergeSavedAreaSources([item(3,'Live older',a)],[old,newer])
 assert.equal(merged.stats.savedAreas,2)
 assert.equal(merged.stats.duplicateRecords,2)
 assert.equal(merged.stats.incompleteAreas,1)
 assert.equal(merged.sources.length,3)
 assert.equal(merged.sources.find(r=>r.id==='osm:node/1').title,'Newer mapped name')
 assert.equal(merged.sources.find(r=>r.id==='osm:node/3').nearbySource,'saved-pack')
 const found=findNearbyLoaded({point:{lat:40,lon:-75},publicSources:merged.sources,now:b.getTime()})
 assert.equal(found.total,3)
 assert.ok(found.shown.every(r=>r.condition==='not-verified'))
 assert.ok(found.shown.every(r=>!JSON.stringify(r).includes('Never verified')))
})
test('equal query time prefers current loaded candidate, not a backed-up copy',()=>{
 const saved=pack({lat:40,lon:-75},[item(4,'Saved',a)],a)
 const out=mergeSavedAreaSources([item(4,'Loaded',a)],[saved])
 assert.equal(out.sources[0].title,'Loaded')
 assert.equal(out.sources[0].nearbySource,'loaded')
})
test('unexpected private pack fields and fabricated verification fail closed',()=>{
 const saved=pack({lat:40,lon:-75},[item(5,'Real OSM',a)],a)
 const tampered={...saved,records:[{...saved.records[0],personalNote:'private person'}]}
 const forged={...saved,records:[{...saved.records[0],condition:'verified'}]}
 const merged=mergeSavedAreaSources([],[tampered,forged,saved])
 assert.equal(merged.stats.skippedAreas,2)
 assert.equal(merged.stats.savedAreas,1)
 assert.equal(merged.sources.length,1)
 assert.ok(!JSON.stringify(merged).includes('private person'))
})
test('loaded non-OSM/fake-operational data never enter public pack matches',()=>{
 const out=mergeSavedAreaSources([item(1,'Valid',a),
  {...item(2,'Forged',a),condition:'verified'},
  {...item(3,'Not a source',a),id:'private_pin'},
  {...item(4,'Unauthorized',a),category:'overnight'}
 ],[])
 assert.deepEqual(out.sources.map(r=>r.id),['osm:node/1'])
})
test('no network, geolocation or automatic persistence required',()=>{
 const saved=pack({lat:40,lon:-75},[item(1,'Recorded',a)],a)
 const fetchBefore=globalThis.fetch
 globalThis.fetch=()=>{throw new Error('Unexpected network request')}
 try{
  assert.equal(mergeSavedAreaSources([], [saved]).sources.length,1)
 }finally{globalThis.fetch=fetchBefore}
 assert.throws(()=>mergeSavedAreaSources([],new Array(11).fill(saved)),/Invalid/)
})
