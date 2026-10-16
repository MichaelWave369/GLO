import test from 'node:test'
import assert from 'node:assert/strict'
import {privacySurfaceStates,PRIVACY_SURFACE_IDS,PRIVACY_STORE_KEYS,validPrivacyCounts} from './privacyInspectorModel.js'

test('privacy inspector lists the known network and outbound boundary types, not proof of any request',()=>{
 const rows=privacySurfaceStates()
 assert.deepEqual(rows.map(x=>x.id),PRIVACY_SURFACE_IDS)
 assert.equal(rows.find(x=>x.id==='updates').state,'possible-automatic')
 assert.equal(rows.find(x=>x.id==='scout').state,'user-action')
 assert.equal(rows.find(x=>x.id==='gps').state,'permission-on-tap')
 assert.ok(!rows.some(x=>x.state==='safe'||x.state==='verified'||x.state==='no-network'))
})
test('remote tile layer is represented only when it is actually mounted by GLO',()=>{
 for(const args of [
  {},{onlineHint:true,tilesEnabled:false,lowBattery:false},
  {onlineHint:false,tilesEnabled:true,lowBattery:false},
  {onlineHint:true,tilesEnabled:true,lowBattery:true}
 ])assert.equal(privacySurfaceStates(args).find(r=>r.id==='tiles').state,'layer-not-mounted')
 assert.equal(privacySurfaceStates({onlineHint:true,tilesEnabled:true,lowBattery:false}).find(r=>r.id==='tiles').state,'layer-mounted')
})
test('a local-only count snapshot is narrow and never accepts payload records',()=>{
 const c={privatePins:3,privateResearchNotes:4,publicScoutPacks:2,savedStreetSketches:1}
 assert.deepEqual(PRIVACY_STORE_KEYS,Object.keys(c))
 assert.equal(validPrivacyCounts(c),true)
 assert.equal(validPrivacyCounts({...c,latitude:40}),false)
 assert.equal(validPrivacyCounts({...c,privateResearchNotes:'4'}),false)
 assert.equal(validPrivacyCounts({...c,privatePins:-1}),false)
})
