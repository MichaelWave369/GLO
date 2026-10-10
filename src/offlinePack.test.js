import test from 'node:test'
import assert from 'node:assert/strict'
import { createPublicPack, parsePublicPack, sourcesFromPack, packAge, validatePublicPack, MAX_PACK_BYTES } from './offlinePack.js'

const now = new Date('2026-10-10T18:00:00Z')
const record = {
  id:'osm:node/123', title:'Public fountain', category:'water', lat:40.98611, lon:-75.19455,
  source:'OpenStreetMap via Overpass', sourceUrl:'https://www.openstreetmap.org/node/123',
  lastMappedAt:'2025-10-10T17:00:00Z', checkedAt:'2026-10-09T18:00:00Z',
  provenance:'mapped-record', condition:'not-verified', availability:'unknown',
  accessNote:'Potability and access not independently confirmed.'
}
const scan = {center:{lat:40.986112,lon:-75.194501}, checkedAt:'2026-10-09T18:00:00Z', sources:[record],mayBeIncomplete:false}
test('explicit public pack is bounded, portable, and contains no private author or notes',()=>{
  const pack=createPublicPack({...scan,sources:[{...record,note:'private secret',deviceId:'device-secret',author:'Jane',extra:{unsafe:'x'}}]},now)
  const json=JSON.stringify(pack)
  assert.equal(pack.center.lat,40.986)
  assert.equal(pack.center.lon,-75.195)
  assert.equal(pack.records.length,1)
  assert.ok(!json.includes('private secret'))
  assert.ok(!json.includes('device-secret'))
  assert.ok(!json.includes('Jane'))
  assert.ok(!json.includes('"distanceKm"'))
  assert.equal(pack.license,'ODbL-1.0')
  assert.equal(pack.id,'osm:40.986:-75.195')
  assert.ok(json.length < MAX_PACK_BYTES)
  assert.equal(parsePublicPack(json).records[0].category,'water')
  assert.ok(sourcesFromPack(pack)[0].distanceKm > 0)
})
test('reject malicious, private, forged, oversized and duplicate packs',()=>{
  const pack=createPublicPack(scan,now)
  assert.throws(()=>validatePublicPack({...pack,privateReports:[]},now),/Invalid pack fields/)
  assert.throws(()=>validatePublicPack({...pack,records:[{...pack.records[0],note:'secret'}]},now),/unexpected or private/)
  assert.throws(()=>validatePublicPack({...pack,records:[{...pack.records[0],condition:'verified'}]},now),/cannot claim/)
  assert.throws(()=>validatePublicPack({...pack,records:[{...pack.records[0],sourceUrl:'https://evil.test/steal'}]},now),/Unexpected source/)
  assert.throws(()=>validatePublicPack({...pack,records:[pack.records[0],pack.records[0]]},now),/Duplicate/)
  assert.throws(()=>parsePublicPack('x'.repeat(MAX_PACK_BYTES+1)),/small public/)
  assert.throws(()=>validatePublicPack({...pack,scannedAt:'2030-01-01T00:00:00Z'},now),/Future scan/)
})
test('do not equate snapshot recency with working status',()=>{
  const pack=createPublicPack(scan,now)
  assert.match(packAge(pack, now.getTime()).label,/NOT verified operational/)
  assert.equal(packAge({...pack,scannedAt:'2025-01-01T00:00:00Z'},now.getTime()).level,'old')
})
