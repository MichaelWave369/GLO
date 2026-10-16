import test from 'node:test'
import assert from 'node:assert/strict'
import {createResearchAnnotation} from './agentHandoff.js'
import {buildResearchBackup,parseResearchBackup,previewResearchRestore,MAX_RESEARCH_BACKUP_BYTES} from './researchBackup.js'

const at=new Date()
const note=(pinId,id)=>createResearchAnnotation({pinId,title:'Source reviewed',details:'A source makes a claim. Not field verified.',sourceUrl:'https://example.org/page'},at,()=>id)
const a=note('pin_1','note_a'),b=note('pin_2','note_b')
const serialize=notes=>JSON.stringify(buildResearchBackup(notes,at).payload)

test('research backup round-trip is a separate strict format with original unverified receipts',()=>{
 const parsed=parseResearchBackup(serialize([a,b]),at)
 assert.deepEqual(parsed.annotations,[a,b])
 assert.equal(parsed.annotations[0].visibility,'device-only')
 assert.equal(parsed.annotations[0].condition,'not-verified')
 assert.equal(parsed.annotations[0].sourceUrl,'https://example.org/page')
 assert.equal(buildResearchBackup([a],at).name,'GLO-PRIVATE-RESEARCH-SENSITIVE-backup.json')
})
test('reject legacy pin files, count overviews and nested/unknown fields',()=>{
 for(const format of ['glo-pin-private-backup','glo-pin-counts-overview','glo-public-osm-pack'])
  assert.throws(()=>parseResearchBackup(JSON.stringify({format,schemaVersion:1,exportedAt:at.toISOString(),annotations:[a]}),at),/research-only/)
 assert.throws(()=>parseResearchBackup(serialize([{...a,privateCoordinates:[40,-75]}]),at),/untrusted research/)
 assert.throws(()=>parseResearchBackup(serialize([{...a,condition:'verified'}]),at),/untrusted research/)
 assert.throws(()=>parseResearchBackup(serialize([{...a,visibility:'public'}]),at),/untrusted research/)
 assert.throws(()=>parseResearchBackup(JSON.stringify({...buildResearchBackup([a],at).payload,accountId:'hidden'}),at),/research-only/)
})
test('duplicate ID, untrusted HTTPS source, future timestamp and limits are rejected',()=>{
 assert.throws(()=>buildResearchBackup([a,a],at),/Duplicate research/)
 assert.throws(()=>buildResearchBackup([{...a,sourceUrl:'http://example.org'}],at),/HTTPS/)
 assert.throws(()=>buildResearchBackup([{...a,recordedAt:'2099-01-01T00:00:00Z'}],at),/untrusted research|timestamp/)
 assert.throws(()=>parseResearchBackup('x'.repeat(MAX_RESEARCH_BACKUP_BYTES+1),at),/6 MB/)
 assert.throws(()=>buildResearchBackup(Array.from({length:13},(_,i)=>note('pin_1','extra_'+i)),at),/12 notes/)
})
test('restore preview keeps IDs, missing pins and capped note histories distinct',()=>{
 const extra=note('pin_1','note_c')
 assert.deepEqual(previewResearchRestore([a,b,extra],[a,...Array.from({length:11},(_,i)=>note('pin_1','held_'+i))],['pin_1']),
 {total:3,addable:0,alreadyHere:1,missingPin:1,full:1})
 assert.deepEqual(previewResearchRestore([a,b],[],['pin_1','pin_2']),
 {total:2,addable:2,alreadyHere:0,missingPin:0,full:0})
})
