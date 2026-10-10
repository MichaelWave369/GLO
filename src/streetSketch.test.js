import test from 'node:test'
import assert from 'node:assert/strict'
import {streetCenter,buildStreetQuery,createStreetSketch,validateStreetSketch} from './streetSketch.js'

const center={lat:40.986234,lon:-75.194776}
const now=new Date('2026-10-10T22:00:00Z')
const roads=[
  {type:'way',id:123,tags:{highway:'residential',name:'Main Street'},geometry:[{lat:40.986,lon:-75.195},{lat:40.987,lon:-75.195}]},
  {type:'way',id:124,tags:{highway:'footway'},geometry:[{lat:40.985,lon:-75.193},{lat:40.984,lon:-75.193}]},
  {type:'way',id:125,tags:{waterway:'stream'},geometry:[{lat:40.986,lon:-75.196},{lat:40.987,lon:-75.196}]}
]
test('query stays small, coarse and does not download OSM standard tiles',()=>{
  assert.deepEqual(streetCenter(center),{lat:40.986,lon:-75.195})
  assert.match(buildStreetQuery(center),/way\(around:1100,40.986,-75.195\)/)
  assert.match(buildStreetQuery(center),/out geom 500/)
  assert.throws(()=>buildStreetQuery({lat:100,lon:0}),/valid/)
})
test('geometry can be saved and rendered after network is disconnected',()=>{
  const pack=createStreetSketch(roads,center,now)
  assert.equal(pack.records.length,3)
  assert.deepEqual(pack.records.map(r=>r.kind),['road','road','water'])
  assert.equal(pack.center.lon,-75.195)
  assert.equal(pack.license,'ODbL-1.0')
  assert.equal(validateStreetSketch(pack,now),pack)
})
test('refuse fake verification, embedded private notes and invalid geometry',()=>{
  const pack=createStreetSketch(roads,center,now)
  assert.throws(()=>validateStreetSketch({...pack,privateNotes:['secret']},now),/manifest/)
  assert.throws(()=>validateStreetSketch({...pack,license:'MIT'},now),/manifest/)
  assert.throws(()=>validateStreetSketch({...pack,records:[{...pack.records[0],owner:'person'}]},now),/geometry/)
  assert.throws(()=>validateStreetSketch({...pack,records:[{...pack.records[0],coordinates:[[91,0],[40,0]]}]},now),/neighborhood/)
  assert.throws(()=>validateStreetSketch({...pack,savedAt:'2040-01-01T00:00:00Z'},now),/manifest/)
  assert.throws(()=>createStreetSketch([],center,now),/No usable/)
})
