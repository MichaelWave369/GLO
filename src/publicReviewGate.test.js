import test from 'node:test'
import assert from 'node:assert/strict'
import {
 makeReviewDraft,parseReviewDraft,validateReviewDraft,digestPublicCheckReceipt,
 REVIEW_DECISIONS
} from './publicReviewGate.js'

const at=new Date('2026-10-16T23:55:00.000Z')
const source={
 schema:'glo.public-website-check.v1',kind:'public-website-reachability-only',
 sourceId:'united-way-211',sourceUrl:'https://www.211.org/',method:'HEAD',
 checkedAt:'2026-10-16T23:40:00.000Z',result:'responded',httpStatus:200,
 serviceStatus:'unknown',authority:'observation-not-authorization',
 publication:'not-approved'
}
test('explicit in-memory review draft contains public-only fields and remains blocked',async()=>{
 const draft=await makeReviewDraft(source,{decision:'retain-observation-only',acknowledged:true,now:at})
 assert.equal(draft.publication,'blocked')
 assert.equal(draft.authority,'none')
 assert.equal(draft.serviceStatus,'unknown')
 assert.match(draft.checkSha256,/^[0-9a-f]{64}$/)
 assert.equal(draft.checkSha256,await digestPublicCheckReceipt(source,at.getTime()))
 assert.deepEqual(await parseReviewDraft(JSON.stringify(draft),source,at.getTime()),draft)
 assert.ok(!JSON.stringify(draft).includes('user'))
})
test('refuses to generate review draft without explicit gate and accepted decision',async()=>{
 await assert.rejects(makeReviewDraft(source,{decision:'retain-observation-only',now:at}),/acknowledgment/)
 await assert.rejects(makeReviewDraft(source,{acknowledged:true,decision:'approve-live',now:at}),/decision/)
 assert.deepEqual(REVIEW_DECISIONS,['retain-observation-only','request-new-check','discard-observation'])
 for(const choice of REVIEW_DECISIONS){
  const draft=await makeReviewDraft(source,{decision:choice,acknowledged:true,now:at})
  assert.equal(draft.publication,'blocked')
 }
})
test('rejects forged publication, identity/private data and changing the original evidence',async()=>{
 const draft=await makeReviewDraft(source,{decision:'request-new-check',acknowledged:true,now:at})
 const forged=[
  {publication:'approved'},{serviceStatus:'open'},{authority:'operator'},
  {reviewer:'Michael'},{lat:40,lon:-75},{note:'private camping place'},
  {kind:'signed-provider-verified'},{sourceId:'hud-find-shelter'},
  {checkSha256:'a'.repeat(64)},{decision:'approve-publication'},
  {reviewedAt:'2030-01-01T00:00:00.000Z'},
  {reviewedAt:'2026-10-15T00:00:00.000Z'}
 ]
 for(const change of forged){
  await assert.rejects(validateReviewDraft({...draft,...change},source,at.getTime()))
 }
 await assert.rejects(validateReviewDraft(draft,{...source,result:'http_error',httpStatus:403},at.getTime()),/do not match/)
 await assert.rejects(validateReviewDraft(draft,{...source,note:'secret'},at.getTime()))
 await assert.rejects(parseReviewDraft(JSON.stringify({...draft,evil:'x'.repeat(1500)}),source,at.getTime()))
 await assert.rejects(parseReviewDraft('{not-json',source,at.getTime()))
})
test('canonical projection hashes equivalent receipts independent of key ordering',async()=>{
 const shuffled=Object.fromEntries(Object.entries(source).reverse())
 assert.equal(await digestPublicCheckReceipt(shuffled,at.getTime()),await digestPublicCheckReceipt(source,at.getTime()))
})
test('review-draft creation and validation never fetch or request geolocation',async()=>{
 const oldFetch=globalThis.fetch
 globalThis.fetch=()=>{throw Error('Unexpected network request')}
 try{
  const draft=await makeReviewDraft(source,{decision:'discard-observation',acknowledged:true,now:at})
  assert.equal((await validateReviewDraft(draft,source,at.getTime())).decision,'discard-observation')
 }finally{globalThis.fetch=oldFetch}
})
