import test from 'node:test'
import assert from 'node:assert/strict'
import {OSM_TILE_URL,OSM_ATTRIBUTION,shouldMountOnlineTiles,MAP_TILE_COPY} from './mapTilePolicy.js'

test('OSM raster address follows OSMF canonical tile policy, not subdomains',()=>{
 assert.equal(OSM_TILE_URL,'https://tile.openstreetmap.org/{z}/{x}/{y}.png')
 assert.ok(!OSM_TILE_URL.includes('{s}'))
 assert.match(OSM_ATTRIBUTION,/OpenStreetMap contributors/)
})
test('map remains private by default and only explicit opt-in activates tile requests',()=>{
 assert.equal(shouldMountOnlineTiles(),false)
 assert.equal(shouldMountOnlineTiles({consented:false}),false)
 assert.equal(shouldMountOnlineTiles({consented:true}),true)
 assert.equal(shouldMountOnlineTiles({consented:true,lowBattery:true}),false)
 assert.equal(shouldMountOnlineTiles({consented:'yes'}),false)
 // navigator.onLine must never be confused with proved internet reachability;
 // a user can deliberately retry even when the browser hint claims offline.
 assert.equal(shouldMountOnlineTiles({consented:true,onlineHint:false}),true)
})
test('bilingual offline, loading, failure, retry and battery recovery states',()=>{
 for(const language of ['en','es'])
  for(const key of ['toggle','offline','loading','ready','failed','retry','grid','lowPower','showMap'])
   assert.ok(MAP_TILE_COPY[language][key].length>10)
})
