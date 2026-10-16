import test from 'node:test'
import assert from 'node:assert/strict'
import {makeResearchPacket,researchMessage,createResearchAnnotation,validateResearchAnnotation,MAX_RESEARCH_NOTES} from './agentHandoff.js'

const point={lat:40.985987,lon:-75.194473}
test('default handoff rounds coordinates and excludes personal notes, identifiers and timestamps',()=>{
 const packet=makeResearchPacket({
   point,category:'water',question:'Are any official public water sources listed near this area?',
   id:'private-secret',title:'Personal campsite',note:'DO NOT SHARE',rechecks:[{note:'no'}]
 })
 assert.deepEqual(packet,{
   format:'glo-manual-research-handoff',schemaVersion:1,
   location:{scope:'approximate-area',lat:40.99,lon:-75.19},
   category:'water',question:'Are any official public water sources listed near this area?'
 })
 const text=researchMessage(packet)
 for(const secret of ['private-secret','Personal campsite','DO NOT SHARE','rechecks','location history'])
   if(secret!=='location history')assert.ok(!text.includes(secret),secret)
 assert.match(text,/UNVERIFIED/)
})
test('exact coordinates require explicit exact scope but never gain remote access',()=>{
 const data=makeResearchPacket({point,scope:'exact',question:'Check the source of this point'})
 assert.deepEqual(data.location,{scope:'exact-point',lat:40.985987,lon:-75.194473})
 assert.ok(!Object.hasOwn(data,'category'))
 assert.doesNotMatch(researchMessage(data),/Bearer |token_id|revocation_endpoint/)
})
test('reject malformed location, invalid category and unsafe input',()=>{
 for(const bad of [null,undefined,{lat:200,lon:0},{lat:0,lon:Infinity}])
   assert.throws(()=>makeResearchPacket({point:bad,question:'Hi'}))
 assert.throws(()=>makeResearchPacket({point,scope:'broadcast',question:'Hello'}))
 assert.throws(()=>makeResearchPacket({point,category:'private_camp',question:'Hello'}))
 assert.throws(()=>makeResearchPacket({point,question:'\u0000new'}))
 assert.throws(()=>makeResearchPacket({point,question:' '}))
 assert.throws(()=>makeResearchPacket({point,question:'x'.repeat(301)}))
})
test('research annotation is strictly unverified, local and without coordinates',()=>{
 const now=new Date('2026-10-10T13:00:00Z')
 const note=createResearchAnnotation({pinId:'sample-private',title:'Source says hours vary',
   details:'Official website lists an uncertain schedule.',sourceUrl:'https://example.org/locations'},
   now,()=> 'note_123')
 assert.deepEqual(note,{
   id:'note_123',pinId:'sample-private',title:'Source says hours vary',
   details:'Official website lists an uncertain schedule.',sourceUrl:'https://example.org/locations',
   recordedAt:now.toISOString(),provenance:'manually-copied-research',
   condition:'not-verified',visibility:'device-only'
 })
 assert.equal(MAX_RESEARCH_NOTES,12)
 for(const invalid of [
   {...note,condition:'verified'},
   {...note,provenance:'officially-verified'},
   {...note,visibility:'public'},
   {...note,lat:40.98},
   {...note,sourceUrl:'javascript:alert(1)'},
   {...note,sourceUrl:'http://example.org'},
   {...note,sourceUrl:'https://user:pass@example.org'},
   {...note,details:''},
   {...note,pinId:'other id'},
   {...note,recordedAt:'2999-01-01'}
 ])assert.throws(()=>validateResearchAnnotation(invalid))
})
