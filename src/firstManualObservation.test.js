import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {parsePublicCheckReceipt,receiptIsStale,validatePublicCheckReceipt} from './publicSourceReceipt.js'
import {makeReviewDraft} from './publicReviewGate.js'
import {inspectPublicReviewPair} from './publicReviewPair.js'
import {checkPublicWebsite} from '../ops/publicSourceCheck.mjs'

const observed=readFileSync(new URL('../tests/fixtures/manual-211-observation-2026-10-16.json',import.meta.url),'utf8')
const at=new Date('2026-10-17T00:16:00.000Z')
const parsed=()=>parsePublicCheckReceipt(observed,at.getTime())

test('actual manually dispatched Actions receipt remains a redirect, NOT a resource verification',()=>{
 const source=parsed()
 assert.equal(source.checkedAt,'2026-10-17T00:14:42.832Z')
 assert.equal(source.sourceId,'united-way-211')
 assert.equal(source.sourceUrl,'https://www.211.org/')
 assert.equal(source.method,'HEAD')
 assert.equal(source.result,'redirect_unfollowed')
 assert.equal(source.httpStatus,301)
 assert.equal(source.serviceStatus,'unknown')
 assert.equal(source.publication,'not-approved')
 assert.equal(source.authority,'observation-not-authorization')
 assert.equal(receiptIsStale(source,at.getTime()),false)
 assert.deepEqual(validatePublicCheckReceipt(source,at.getTime()),source)
})

test('first real public-only receipt can be tied to a non-authoritative draft entirely offline',async()=>{
 const source=parsed()
 for(const decision of ['retain-observation-only','request-new-check','discard-observation']){
  const review=await makeReviewDraft(source,{decision,acknowledged:true,now:at})
  const matched=await inspectPublicReviewPair(observed,JSON.stringify(review),at.getTime())
  assert.equal(matched.matched,true)
  assert.equal(matched.comparison,'local-content-match-only')
  assert.equal(matched.sourceAuthenticity,'not-established')
  assert.equal(matched.reviewerIdentity,'not-established')
  assert.equal(matched.serviceStatus,'unknown')
  assert.equal(matched.authority,'none')
  assert.equal(matched.publication,'blocked')
 }
})

test('redirects are not automatically followed and still refuse operational claims',async()=>{
 let observedRequests=0
 const result=await checkPublicWebsite({
  now:new Date('2026-10-17T00:14:42.832Z'),
  fetchImpl:async(url,init)=>{
   observedRequests++
   assert.equal(url,'https://www.211.org/')
   assert.equal(init.method,'HEAD')
   assert.equal(init.redirect,'manual')
   return {status:301,headers:new Map([['location','https://www.211.org/new']]),
    text(){throw Error('Response body should never be read')}}
  }
 })
 assert.equal(observedRequests,1)
 assert.equal(result.result,'redirect_unfollowed')
 assert.equal(result.httpStatus,301)
 assert.equal(result.serviceStatus,'unknown')
 assert.equal(result.publication,'not-approved')
 assert.ok(!JSON.stringify(result).includes('/new'))
})

test('tampered first-run response, added private fields or forged publication are rejected',async()=>{
 const source=parsed()
 await assert.rejects(inspectPublicReviewPair(JSON.stringify({...source,note:'a private location'}),'{}',at.getTime()))
 for(const changed of [
  {...source,result:'responded'},
  {...source,serviceStatus:'open'},
  {...source,publication:'approved'},
  {...source,sourceUrl:'https://arbitrary.example/'},
  {...source,httpStatus:200}
 ])assert.throws(()=>validatePublicCheckReceipt(changed,at.getTime()))
 const draft=await makeReviewDraft(source,{decision:'retain-observation-only',acknowledged:true,now:at})
 const forged={...draft,publication:'approved'}
 await assert.rejects(inspectPublicReviewPair(observed,JSON.stringify(forged),at.getTime()))
})
