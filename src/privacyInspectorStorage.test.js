import test from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import {saveReport,listReports,saveResearchAnnotation,listResearchAnnotations,
  savePublicPack,saveStreetSketch,readLocalPrivacyCounts,clearAllLocalData} from './storage.js'
import {createResearchAnnotation} from './agentHandoff.js'
import {createPublicPack} from './offlinePack.js'
import {createStreetSketch} from './streetSketch.js'

test('local privacy counts inspect only four app-owned stores without network or private details',async()=>{
 await clearAllLocalData()
 const before=await readLocalPrivacyCounts()
 assert.deepEqual(before,{privatePins:0,publicScoutPacks:0,savedStreetSketches:0,privateResearchNotes:0})
 const at=new Date()
 const observedAt=new Date(at.getTime()-3600000).toISOString()
 const pin={id:'privacy_pin_1',title:'Personal water note',category:'water',lat:40.986,lon:-75.194,
  observedAt,note:'Do not expose this'}
 await saveReport(pin)
 const annotation=createResearchAnnotation({pinId:pin.id,title:'Research',details:'This is private field context'},at,()=> 'privacy_note_1')
 await saveResearchAnnotation(annotation)
 const publicRecord={
  id:'osm:node/989',title:'Mapped fountain',category:'water',lat:40.986,lon:-75.194,
  source:'OpenStreetMap via Overpass',sourceUrl:'https://www.openstreetmap.org/node/989',
  lastMappedAt:observedAt,checkedAt:observedAt,provenance:'mapped-record',
  condition:'not-verified',availability:'unknown',accessNote:'Unknown operational status'
 }
 await savePublicPack(createPublicPack({center:{lat:40.986,lon:-75.194},
  checkedAt:observedAt,sources:[publicRecord],mayBeIncomplete:false},at))
 const geometry=[{type:'way',id:18,tags:{highway:'footway'},geometry:[
  {lat:40.986,lon:-75.194},{lat:40.987,lon:-75.195}]}]
 await saveStreetSketch(createStreetSketch(geometry,{lat:40.986,lon:-75.194},at))
 const oldFetch=globalThis.fetch
 globalThis.fetch=()=>{throw new Error('Privacy inspector must not fetch')}
 try{
  const inventory=await readLocalPrivacyCounts()
  assert.deepEqual(inventory,{privatePins:1,publicScoutPacks:1,savedStreetSketches:1,privateResearchNotes:1})
  const serialized=JSON.stringify(inventory)
  assert.ok(!serialized.includes('Do not expose this'))
  assert.ok(!serialized.includes('privacy_pin_1'))
  assert.ok(!serialized.includes('40.986'))
  assert.deepEqual(await readLocalPrivacyCounts(),inventory)
  assert.equal((await listReports())[0].note,'Do not expose this')
  assert.equal((await listResearchAnnotations(pin.id))[0].details,'This is private field context')
 }finally{globalThis.fetch=oldFetch}
 await clearAllLocalData()
 assert.deepEqual(await readLocalPrivacyCounts(),before)
})
