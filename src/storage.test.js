import test from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { listReports, saveReport, removeReport, appendRecheck, savePublicPack, listPublicPacks, listStreetSketches, saveStreetSketch, clearAllLocalData } from './storage.js'
import { createPublicPack } from './offlinePack.js'
import { createStreetSketch } from './streetSketch.js'
import { createRecheck } from './recheck.js'
import { privateBackup } from './domain.js'

// Mimics an existing P0.3 device with v1 IndexedDB notes before the new store exists.
const oldDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('glo-pin-local-v1', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('reports', { keyPath:'id' })
  request.onsuccess = () => { request.result.close(); resolve() }
  request.onerror = () => reject(request.error)
})

const now = new Date()
const scannedAt = new Date(now.getTime() - 86_400_000).toISOString()
const record = {
  id:'osm:node/989',title:'Mapped water fountain',category:'water',lat:40.986,lon:-75.194,
  source:'OpenStreetMap via Overpass',sourceUrl:'https://www.openstreetmap.org/node/989',
  lastMappedAt:scannedAt,checkedAt:scannedAt,provenance:'mapped-record',
  condition:'not-verified',availability:'unknown',accessNote:'Not independently checked.'
}
const packet = center => createPublicPack({center,checkedAt:scannedAt,sources:[record],mayBeIncomplete:false},now)

test('upgrade keeps local observations; public packs remain separate; panic clear erases both', async () => {
  await oldDb()
  await saveReport({id:'private-a',title:'My note',category:'water',observedAt:scannedAt,note:'Private secret',lat:40.986,lon:-75.194})
  const pack = packet({lat:40.986,lon:-75.194})
  await savePublicPack(pack)
  await saveStreetSketch(createStreetSketch([{type:'way',id:18,tags:{highway:'footway'},geometry:[{lat:40.986,lon:-75.194},{lat:40.987,lon:-75.195}]}],{lat:40.986,lon:-75.194},now))
  const notes = await listReports()
  assert.equal(notes.length,1)
  assert.equal(notes[0].note,'Private secret')
  const packs = await listPublicPacks()
  assert.equal(packs.length,1)
  assert.ok(!JSON.stringify(packs).includes('Private secret'))
  assert.equal(packs[0].records[0].condition,'not-verified')
  assert.equal((await listStreetSketches()).length,1)
  await clearAllLocalData()
  assert.deepEqual(await listReports(),[])
  assert.deepEqual(await listPublicPacks(),[])
  assert.deepEqual(await listStreetSketches(),[])
})
test('local pack cap prevents unlimited device storage and counts upserts as one area',async()=>{
  for (let i=0;i<10;i++) await savePublicPack(packet({lat:40+i*0.01,lon:-75}))
  assert.equal((await listPublicPacks()).length,10)
  await savePublicPack(packet({lat:40,lon:-75}))
  await assert.rejects(savePublicPack(packet({lat:41,lon:-75})),/10-area/)
  await clearAllLocalData()
})

test('street sketch local storage is limited to four areas',async()=>{
  const way={type:'way',id:88,tags:{highway:'residential'},geometry:[{lat:40,lon:-75},{lat:40.001,lon:-75.001}]}
  for(let i=0;i<4;i++){
    const c={lat:40+i*0.01,lon:-75}
    const w={...way,geometry:[{lat:c.lat,lon:c.lon},{lat:c.lat+0.001,lon:c.lon+0.001}]}
    await saveStreetSketch(createStreetSketch([w],c,now))
  }
  assert.equal((await listStreetSketches()).length,4)
  const c={lat:42,lon:-75}
  await assert.rejects(saveStreetSketch(createStreetSketch([{...way,geometry:[{lat:42,lon:-75},{lat:42.001,lon:-75.001}]}],c,now)),/4 neighborhoods/)
  await clearAllLocalData()
})


test('append-only recheck preserves prior history, private backup and panic clear',async()=>{
  const original={id:'recheck-test',title:'Public fountain',category:'water',
    lat:40.986,lon:-75.194,note:'Original secret note',observedAt:'2026-09-30T08:00:00Z',
    visitStatus:'working',condition:'not-verified',visibility:'device-only'}
  await saveReport(original)
  const when=new Date('2026-10-10T22:00:00Z')
  const recheck=createRecheck(original,{visitStatus:'not_working',observedAtLocal:'2026-10-10T21:00:00Z',note:'Stopped today'},when,()=>'check-1')
  await appendRecheck(original.id,recheck)
  const [saved]=(await listReports()).filter(r=>r.id===original.id)
  assert.equal(saved.visitStatus,'working')
  assert.equal(saved.note,'Original secret note')
  assert.equal(saved.rechecks.length,1)
  assert.equal(saved.rechecks[0].visitStatus,'not_working')
  assert.equal(privateBackup([saved],when).reports[0].rechecks[0].id,'check-1')
  assert.ok(!(await listPublicPacks()).some(pack=>JSON.stringify(pack).includes('Stopped today')))
  await assert.rejects(appendRecheck('missing-pin',recheck),/Pin missing/)
  await assert.rejects(appendRecheck(original.id,{...recheck,condition:'verified',id:'fake'}),/receipt invalid/)
  await assert.rejects(appendRecheck(original.id,recheck),/receipt invalid/)
  await clearAllLocalData()
  assert.deepEqual(await listReports(),[])
})

test('recheck history bounded to 20, and deleting a pin removes history',async()=>{
  const original={id:'full-pin',observedAt:'2026-09-01T09:00:00Z',title:'Public tap'}
  await saveReport(original)
  const at=new Date('2026-10-10T22:00:00Z')
  for(let i=0;i<20;i++){
    const check=createRecheck(original,{visitStatus:'unknown',note:'Seen',observedAtLocal:'2026-10-02T11:00:00Z'},at,()=>String(i))
    await appendRecheck(original.id,check)
  }
  assert.equal((await listReports()).find(r=>r.id==='full-pin').rechecks.length,20)
  const tooMany=createRecheck(original,{visitStatus:'unknown'},at,()=>'extra')
  await assert.rejects(appendRecheck(original.id,tooMany),/history full/)
  await removeReport(original.id)
  assert.equal((await listReports()).some(r=>r.id==='full-pin'),false)
})
