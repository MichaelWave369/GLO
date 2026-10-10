import test from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { listReports, saveReport, savePublicPack, listPublicPacks, listStreetSketches, saveStreetSketch, clearAllLocalData } from './storage.js'
import { createPublicPack } from './offlinePack.js'
import { createStreetSketch } from './streetSketch.js'

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
