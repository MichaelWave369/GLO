import test from 'node:test'
import assert from 'node:assert/strict'
import { privateBackup } from './domain.js'
import { parsePrivateRestore, restorePreview, MAX_RESTORE_BYTES } from './restoreSafety.js'

const now=new Date('2026-10-10T22:00:00Z')
const entry={
 id:'b1f2c330-0c1e-4da3-858a-b63e6d4c41aa',schemaVersion:1,
 category:'water',title:'Resource on Main Street',note:'Notes from visit',
 lat:40.986232,lon:-75.194992,observedAt:'2026-10-01T12:00:00Z',
 savedAt:'2026-10-01T12:15:00Z',lastSeenWorkingAt:'2026-10-01T12:00:00Z',
 visitStatus:'working',reportedHours:'',accessibility:{wheelchair:'unknown'},
 provenance:'self-reported',condition:'not-verified',visibility:'device-only',
 rechecks:[{id:'2da2c2bf-7a4e-48ca-93b7-a2f65dd67c92',observedAt:'2026-10-09T13:00:00Z',
 savedAt:'2026-10-09T13:30:00Z',visitStatus:'not_working',note:'Water not flowing',
 provenance:'self-reported',condition:'not-verified',visibility:'device-only'}]
}
const backup=arr=>JSON.stringify(privateBackup(arr,now))
test('legacy-format full export round-trips observation and full recheck history',()=>{
 const parsed=parsePrivateRestore(backup([entry]),now)
 assert.equal(parsed.reports.length,1)
 assert.equal(parsed.reports[0].lat,entry.lat)
 assert.equal(parsed.reports[0].note,entry.note)
 assert.equal(parsed.reports[0].rechecks[0].note,'Water not flowing')
 assert.equal(parsed.reports[0].condition,'not-verified')
 assert.equal(parsed.reports[0].visibility,'device-only')
 const preview=restorePreview(parsed.reports,[])
 assert.deepEqual(preview,{total:1,addable:1,alreadyHere:0,rechecks:1})
 assert.deepEqual(restorePreview(parsed.reports,[entry]),{total:1,addable:0,alreadyHere:1,rechecks:1})
})
test('old minimal v1 reports normalize only optional, non-verified metadata',()=>{
 const legacy={id:'pin-original',category:'food',title:'Public pantry',lat:40,lon:-75,
   observedAt:'2026-10-01T12:00:00Z',note:''}
 const [restored]=parsePrivateRestore(backup([legacy]),now).reports
 assert.equal(restored.visibility,'device-only')
 assert.equal(restored.condition,'not-verified')
 assert.equal(restored.visitStatus,'unknown')
 assert.equal(restored.accessibility.petsAllowed,'unknown')
 assert.equal(restored.savedAt,legacy.observedAt)
})
test('do not accept counts-only or public map packs as private restore',()=>{
 const overview={format:'glo-pin-counts-overview',schemaVersion:1,exportedAt:now.toISOString(),totals:{privatePins:1}}
 const osm={format:'glo-public-osm-pack',schemaVersion:1,exportedAt:now.toISOString(),reports:[entry]}
 assert.throws(()=>parsePrivateRestore(JSON.stringify(overview),now),/Only a genuine-format/)
 assert.throws(()=>parsePrivateRestore(JSON.stringify(osm),now),/Only a genuine-format/)
})
test('reject injected claims, unknown fields, duplicates and malformed history without importing anything',()=>{
 assert.throws(()=>parsePrivateRestore(backup([{...entry,verified:true}]),now),/unsafe private report/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,condition:'verified'}]),now),/cannot claim/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,visibility:'public'}]),now),/device-only/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,lat:95}]),now),/coordinates/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,category:'__proto__'}]),now),/category/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,rechecks:[{...entry.rechecks[0],condition:'verified'}]}]),now),/invalid dates or provenance/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,rechecks:[{...entry.rechecks[0],published:true}]}]),now),/fields/)
 assert.throws(()=>parsePrivateRestore(backup([entry,entry]),now),/Duplicate private pin IDs/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,rechecks:[entry.rechecks[0],entry.rechecks[0]]}]),now),/Duplicate private recheck IDs/)
})
test('reject oversize files, unsupported versions and future-dated observations',()=>{
 assert.throws(()=>parsePrivateRestore('a'.repeat(MAX_RESTORE_BYTES+1),now),/1.5 MB/)
 assert.throws(()=>parsePrivateRestore('{bad json}',now),/valid JSON/)
 assert.throws(()=>parsePrivateRestore(JSON.stringify({...privateBackup([entry],now),schemaVersion:2}),now),/Only a genuine-format/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,observedAt:'2029-01-01T00:00:00Z'}]),now),/timestamp/)
 assert.throws(()=>parsePrivateRestore(backup([{...entry,tag:'extra'}]),now),/unsafe/)
})
