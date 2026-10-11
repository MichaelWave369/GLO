import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLocalExport, countOnlyOverview, exportInventory, EXPORT_MODES } from './exportSafety.js'

const reports=[
  {id:'my-secret-record',title:'Secret place',category:'water',lat:40.986123,lon:-75.194987,
   note:'Sensitive private note',observedAt:'2026-10-09T12:00:00Z',
   visitStatus:'working',rechecks:[{id:'visit-1',observedAt:'2026-10-10T11:00:00Z',savedAt:'2026-10-10T12:00:00Z',
     note:'Secret follow-up',visitStatus:'not_working',provenance:'self-reported',condition:'not-verified',visibility:'device-only'}]},
  {id:'another-secret',title:'My family situation',category:'food',lat:40.99999,lon:-75.22222,
   note:'',observedAt:'2026-10-09T12:00:00Z'}
]
const now=new Date('2026-10-10T22:00:00Z')
test('overview is strictly count-only and never copies private report fields',()=>{
 const summary=countOnlyOverview(reports,now)
 const output=JSON.stringify(summary)
 assert.equal(summary.totals.privatePins,2)
 assert.equal(summary.totals.privateRechecks,1)
 assert.equal(summary.categories.water,1)
 assert.equal(summary.categories.food,1)
 for(const secret of ['my-secret-record','visit-1','Sensitive private note','Secret follow-up',
   'Secret place','40.986123','-75.194987','2026-10-09T12:00:00Z','not_working','Secret','family']) {
   assert.ok(!output.includes(secret),'overview leaked '+secret)
 }
 assert.match(summary.warning,/NOT a restorable/)
 assert.ok(!('reports' in summary))
})
test('full backup keeps exact coordinates and recheck history, with sensitive filename',()=>{
 const backup=buildLocalExport(reports,'private-backup',now)
 assert.match(backup.name,/PRIVATE-SENSITIVE/)
 assert.equal(backup.payload.format,'glo-pin-private-backup')
 assert.equal(backup.payload.reports[0].lat,40.986123)
 assert.equal(backup.payload.reports[0].rechecks[0].note,'Secret follow-up')
 assert.equal(backup.payload.schemaVersion,1)
 assert.equal(backup.payload.exportedAt,now.toISOString())
})
test('count-only overview has a distinct non-backup name and stable types',()=>{
 const overview=buildLocalExport(reports,'overview',now)
 assert.match(overview.name,/NOT-A-BACKUP/)
 assert.equal(overview.payload.format,'glo-pin-counts-overview')
 assert.equal(Object.values(overview.payload.categories).reduce((a,b)=>a+b,0),2)
 assert.deepEqual(EXPORT_MODES,['overview','private-backup'])
 assert.equal(exportInventory(reports).withNotes,1)
 assert.equal(exportInventory(reports).withCoordinates,2)
})
test('invalid modes or inputs fail closed',()=>{
 assert.throws(()=>buildLocalExport(reports,'public-upload',now),/valid export/)
 assert.throws(()=>buildLocalExport('private','overview',now),/valid export/)
 assert.throws(()=>countOnlyOverview(reports,new Date(NaN)),/Invalid overview/)
})
