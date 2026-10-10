import test from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { listReports, saveReport, savePublicPack, listPublicPacks, clearAllLocalData } from './storage.js'
import { createPublicPack } from './offlinePack.js'

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
  const notes = await listReports()
  assert.equal(notes.length,1)
  assert.equal(notes[0].note,'Private secret')
  const packs = await listPublicPacks()
  assert.equal(packs.length,1)
  assert.ok(!JSON.stringify(packs).includes('Private secret'))
  assert.equal(packs[0].records[0].condition,'not-verified')
  await clearAllLocalData()
  assert.deepEqual(await listReports(),[])
  assert.deepEqual(await listPublicPacks(),[])
})
test('local pack cap prevents unlimited device storage and counts upserts as one area',async()=>{
  for (let i=0;i<10;i++) await savePublicPack(packet({lat:40+i*0.01,lon:-75}))
  assert.equal((await listPublicPacks()).length,10)
  await savePublicPack(packet({lat:40,lon:-75}))
  await assert.rejects(savePublicPack(packet({lat:41,lon:-75})),/10-area/)
  await clearAllLocalData()
})
