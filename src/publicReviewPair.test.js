import test from 'node:test'
import assert from 'node:assert/strict'
import {inspectPublicReviewPair,inspectReviewDraftAgainstReceipt} from './publicReviewPair.js'
import {makeReviewDraft} from './publicReviewGate.js'
import {checkPublicWebsite} from '../ops/publicSourceCheck.mjs'
const now=new Date('2026-10-17T00:20:00.000Z')
async function fakeObservation(status=200){
 return checkPublicWebsite({now:new Date('2026-10-17T00:00:00.000Z'),
  fetchImpl:async(url,options)=>{
   assert.equal(url,'https://www.211.org/')
   assert.equal(options.method,'HEAD')
   assert.equal(options.redirect,'manual')
   return {status,text(){throw Error('Body must not be downloaded')}}
  }})
}
test('end-to-end offline simulated HEAD receipt, review and independent paired check',async()=>{
 const source=await fakeObservation()
 for(const decision of ['retain-observation-only','request-new-check','discard-observation']){
  const draft=await makeReviewDraft(source,{decision,acknowledged:true,now})
  const result=await inspectPublicReviewPair(JSON.stringify(source),JSON.stringify(draft),now.getTime())
  assert.equal(result.matched,true)
  assert.equal(result.decision,decision)
  assert.equal(result.serviceStatus,'unknown')
  assert.equal(result.authority,'none')
  assert.equal(result.publication,'blocked')
  assert.equal(result.sourceAuthenticity,'not-established')
  assert.equal(result.reviewerIdentity,'not-established')
  assert.ok(!Object.hasOwn(result,'sourceUrl'))
  assert.ok(!Object.hasOwn(result,'note'))
  assert.deepEqual(await inspectReviewDraftAgainstReceipt(source,JSON.stringify(draft),now.getTime()),result)
 }
})
test('rejects mismatched observations, forged status and wrong source',async()=>{
 const source=await fakeObservation()
 const other=await fakeObservation(403)
 const draft=await makeReviewDraft(source,{decision:'retain-observation-only',acknowledged:true,now})
 await assert.rejects(inspectReviewDraftAgainstReceipt(other,JSON.stringify(draft),now.getTime()),/do not match/)
 const base=JSON.stringify(draft)
 for(const change of [
  {publication:'approved'},{serviceStatus:'open'},
  {authority:'signed'},{reviewer:'Private Name'},
  {lat:40.1234,lon:-75.4123},
  {checkSha256:'a'.repeat(64)}, {decision:'approve-publication'}
 ]){
  await assert.rejects(inspectReviewDraftAgainstReceipt(source,JSON.stringify({...draft,...change}),now.getTime()))
 }
 await assert.rejects(inspectReviewDraftAgainstReceipt(source,base+' '.repeat(2000),now.getTime()),/1.5KB/)
 await assert.rejects(inspectPublicReviewPair(JSON.stringify({...source,privateNotes:'SECRET'}),base,now.getTime()))
 await assert.rejects(inspectReviewDraftAgainstReceipt(source,'{invalid',now.getTime()))
})
test('even cryptographically consistent files remain untrusted, and no network needed in comparison',async()=>{
 const source=await fakeObservation()
 const draft=await makeReviewDraft(source,{decision:'discard-observation',acknowledged:true,now})
 const originalFetch=globalThis.fetch
 globalThis.fetch=()=>{throw Error('network forbidden')}
 try{
  const result=await inspectPublicReviewPair(JSON.stringify(source),JSON.stringify(draft),now.getTime())
  assert.equal(result.comparison,'local-content-match-only')
  assert.equal(result.sourceAuthenticity,'not-established')
  assert.equal(result.publication,'blocked')
 }finally{globalThis.fetch=originalFetch}
})
