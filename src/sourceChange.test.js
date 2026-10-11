import test from 'node:test'
import assert from 'node:assert/strict'
import { comparePublicScans } from './sourceChange.js'

const center={lat:40.986,lon:-75.194}
const ago='2026-10-01T13:00:00Z',now='2026-10-10T13:00:00Z'
const pin=(id,patch={})=>({
 id:'osm:node/'+id,category:'water',title:'Mapped water',lat:40.986,lon:-75.194,
 lastMappedAt:'2026-09-01T00:00:00Z',reportedHours:'',condition:'not-verified',
 availability:'unknown',privateNote:'NEVER EXPORTED',...patch
})
const scan=(sources,date=ago,patch={})=>({center,checkedAt:date,sources,...patch})
test('no baseline or different neighborhood is not fabricated as closures',()=>{
 assert.equal(comparePublicScans(null,scan([pin(1)],now)).status,'no-baseline')
 const moved=scan([pin(1)],now,{center:{lat:40.999,lon:-75.194}})
 assert.equal(comparePublicScans(scan([pin(1)]),moved).status,'different-area')
})
test('show meaningful edits, map-metadata-only edits, new and not returned separately',()=>{
 const previous=scan([pin(1),pin(2),pin(3),pin(4)])
 const current=scan([
   pin(1,{title:'Named Fountain',reportedHours:'Mo-Fr 09:00-18:00'}),
   pin(2,{lastMappedAt:'2026-10-09T00:00:00Z'}),
   pin(5)
 ],now)
 const result=comparePublicScans(previous,current)
 assert.equal(result.status,'compared')
 assert.deepEqual(result.detailChanges[0].changes,['mapped name','mapped opening-hours text'])
 assert.equal(result.editOnly[0].id,'osm:node/2')
 assert.equal(result.newlyReturned.length,1)
 assert.equal(result.notReturned.length,2)
 assert.ok(result.warning.includes('not proof'))
 assert.equal(result.detailChanges[0].sourceUrl,'https://www.openstreetmap.org/node/1')
 assert.ok(!JSON.stringify(result).includes('NEVER EXPORTED'))
})
test('an incomplete OSM response remains incomplete, not a definitive missing count',()=>{
 const result=comparePublicScans(scan([pin(1)],ago,{mayBeIncomplete:true}),scan([],now))
 assert.equal(result.queryIncomplete,true)
 assert.equal(result.notReturned.length,1)
 assert.match(result.warning,/query limits/)
})
test('unchanged details with only identical edit stamps are not changed',()=>{
 const result=comparePublicScans(scan([pin(1)]),scan([pin(1)],now))
 assert.equal(result.detailChanges.length,0)
 assert.equal(result.editOnly.length,0)
 assert.equal(result.newlyReturned.length,0)
 assert.equal(result.notReturned.length,0)
})
test('small map-center motion and tiny geometry jitter do not cause spurious changes',()=>{
 const a=scan([pin(1)]),b=scan([pin(1,{lat:40.98601})],now,{center:{lat:40.9862,lon:-75.194}})
 const result=comparePublicScans(a,b)
 assert.equal(result.status,'compared')
 assert.equal(result.detailChanges.length,0)
})
test('public OSM ID validation ignores private records in both arrays',()=>{
 const dirty=scan([{id:'device-private',title:'My home',lat:40.986,lon:-75.194}])
 const result=comparePublicScans(dirty,scan([pin(10)],now))
 assert.equal(result.previousCount,0)
 assert.equal(result.newlyReturned.length,1)
 assert.ok(!JSON.stringify(result).includes('My home'))
})
