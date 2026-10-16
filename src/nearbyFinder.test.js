import test from 'node:test'
import assert from 'node:assert/strict'
import {findNearbyLoaded,parseNearbyPoint,NEARBY_LIMIT} from './nearbyFinder.js'

const center={lat:40,lon:-75}
const now=Date.parse('2026-10-16T18:00:00Z')
const privatePin=(id,lat=40,lon=-75)=>({
 id,title:'Private fountain '+id,category:'water',lat,lon,
 note:'Sensitive personal note never display',observedAt:'2026-10-12T11:00:00Z'
})
const osm=(id,lat=40,lon=-75)=>({
 id:'osm:node/'+id,title:'Mapped water '+id,category:'water',lat,lon,
 provenance:'mapped-record',condition:'not-verified',availability:'unknown',
 checkedAt:'2026-10-10T12:00:00Z',accessNote:'Unverified hours'
})

test('blank coordinates never silently turn into 0,0 and invalid inputs are rejected',()=>{
 for(const [a,b] of [['',''],[' ','-75'],['91','0'],['0','-181'],['NaN','0'],['0','Infinity']])
  assert.throws(()=>parseNearbyPoint(a,b))
 assert.deepEqual(parseNearbyPoint('0','0'),{lat:0,lon:0})
 assert.deepEqual(parseNearbyPoint('40.123','-75.002'),{lat:40.123,lon:-75.002})
})
test('on-device only: type, distance, radius, source and evidence date remain explicit',()=>{
 const privateReports=[privatePin('a',40,-75),privatePin('b',40.15,-75)]
 const publicSources=[osm(3,40.003,-75),osm(4,40.1,-75)]
 const result=findNearbyLoaded({point:center,radiusKm:2,privateReports,publicSources,now})
 assert.equal(result.total,2)
 assert.equal(result.privateCount,1)
 assert.equal(result.publicCount,1)
 assert.equal(result.shown[0].origin,'private')
 assert.equal(result.shown[1].origin,'osm')
 assert.ok(result.shown[1].distanceKm>0)
 assert.equal(result.shown[0].condition,'not-verified')
 assert.equal(result.shown[1].evidenceAt,'2026-10-10T12:00:00.000Z')
 assert.ok(!JSON.stringify(result).includes('Sensitive personal note'))
 assert.ok(!JSON.stringify(result).includes('Unverified hours'))
})
test('reject forged OSM verification and unknown or unsupported public categories',()=>{
 const result=findNearbyLoaded({point:center,publicSources:[
  osm(1),{...osm(2),condition:'verified'},
  {...osm(3),provenance:'operator-confirmed'},
  {...osm(4),availability:'open'},
  {...osm(5),category:'overnight'},
  {...osm(6),id:'osm:node/0'}
 ],now})
 assert.deepEqual(result.shown.map(r=>r.id),['osm:node/1'])
 assert.throws(()=>findNearbyLoaded({point:center,category:'__proto__'}),/category/)
 assert.throws(()=>findNearbyLoaded({point:center,radiusKm:999}),/radius/)
})
test('uses last recheck timestamp as a personal observation, never a live operational guarantee',()=>{
 const pin={...privatePin('recent'),rechecks:[{
  id:'check_one',observedAt:'2026-10-15T12:00:00Z',savedAt:'2026-10-15T13:00:00Z',
  visitStatus:'not_working',note:'Not working',provenance:'self-reported',
  condition:'not-verified',visibility:'device-only'
 }]}
 const result=findNearbyLoaded({point:center,privateReports:[pin],now})
 assert.equal(result.shown[0].evidenceAt,'2026-10-15T12:00:00.000Z')
 assert.equal(result.shown[0].condition,'not-verified')
 assert.ok(!JSON.stringify(result).includes('Not working'))
})
test('limit displayed matches, preserve total and separate duplicate scopes',()=>{
 const own=Array.from({length:20},(_,i)=>privatePin('pin'+i,40+i*.0001,-75))
 const publicSources=[osm(1)]
 const res=findNearbyLoaded({point:center,privateReports:[...own,own[0]],publicSources,now})
 assert.equal(res.total,21)
 assert.equal(res.shown.length,NEARBY_LIMIT)
 assert.equal(res.privateCount,20)
 assert.equal(res.publicCount,1)
 assert.ok(res.shown.every(x=>x.distanceKm<=2))
})
test('no network access or implicit location request is needed for a deterministic query',()=>{
 const oldFetch=globalThis.fetch
 const oldNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator')
 globalThis.fetch=()=>{throw new Error('NO FETCH')}
 try{
  const res=findNearbyLoaded({point:center,privateReports:[privatePin('ok')],now})
  assert.equal(res.shown.length,1)
 }finally{
  globalThis.fetch=oldFetch
  if(oldNavigator)Object.defineProperty(globalThis,'navigator',oldNavigator)
 }
})
