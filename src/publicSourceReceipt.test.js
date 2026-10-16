import test from 'node:test'
import assert from 'node:assert/strict'
import {parsePublicCheckReceipt,validatePublicCheckReceipt,receiptIsStale,
 PUBLIC_CHECK_SOURCE} from './publicSourceReceipt.js'
import {checkPublicWebsite} from '../ops/publicSourceCheck.mjs'
const time=new Date('2026-10-16T20:00:00.000Z')
const now=time.getTime()
const receipt=(changes={})=>({
 schema:'glo.public-website-check.v1',kind:'public-website-reachability-only',
 sourceId:'united-way-211',sourceUrl:'https://www.211.org/',
 method:'HEAD',checkedAt:time.toISOString(),
 result:'responded',httpStatus:200,serviceStatus:'unknown',
 authority:'observation-not-authorization',publication:'not-approved',...changes
})
test('accepts tightly scoped fixed public receipt and projects exact allowlisted fields',()=>{
 const output=validatePublicCheckReceipt(receipt(),now)
 assert.deepEqual(Object.keys(output),Object.keys(receipt()))
 assert.deepEqual(parsePublicCheckReceipt(JSON.stringify(receipt()),now),output)
 assert.equal(receiptIsStale(output,now+25*3600000),true)
 assert.equal(receiptIsStale(output,now+3600000),false)
})
test('rejects PII, coordinates, private notes, rogue hosts and false service verification',()=>{
 const additions=[
  {coords:{lat:40,lon:-75}},{note:'private shelter camp'},
  {deviceId:'phone'},{author:'person'},
  {sourceUrl:'https://evil.example/collect'},
  {sourceId:'other-org'},{serviceStatus:'open'},
  {authority:'verified-provider'},{publication:'approved'},
  {method:'POST'},{kind:'resource-open-now'}
 ]
 for(const change of additions)assert.throws(()=>validatePublicCheckReceipt(receipt(change),now))
 assert.throws(()=>parsePublicCheckReceipt(JSON.stringify(receipt({debug:'x'.repeat(3000)})),now))
 assert.throws(()=>parsePublicCheckReceipt('{bad JSON',now))
 assert.throws(()=>validatePublicCheckReceipt(receipt({checkedAt:'2028-01-01T00:00:00.000Z'}),now))
})
test('HTTP status binding and network failure cannot masquerade as successful service checks',()=>{
 for(const [code,state] of [[200,'responded'],[204,'responded'],[301,'redirect_unfollowed'],[403,'http_error'],[500,'http_error']])
  assert.equal(validatePublicCheckReceipt(receipt({httpStatus:code,result:state}),now).result,state)
 assert.throws(()=>validatePublicCheckReceipt(receipt({result:'responded',httpStatus:404}),now))
 assert.throws(()=>validatePublicCheckReceipt(receipt({result:'request_error',httpStatus:200}),now))
 assert.equal(validatePublicCheckReceipt(receipt({result:'request_error',httpStatus:null}),now).result,'request_error')
})
test('worker requests exactly fixed URL with HEAD, no redirects and no body read',async()=>{
 let calls=0
 const out=await checkPublicWebsite({now:time,fetchImpl:async(url,init)=>{
  calls++
  assert.equal(url,PUBLIC_CHECK_SOURCE.url)
  assert.equal(init.method,'HEAD')
  assert.equal(init.redirect,'manual')
  assert.ok(init.signal)
  assert.equal(init.headers['User-Agent'].includes('GLO'),true)
  return {status:200,json(){throw Error('Response body must not be read')}}
 }})
 assert.equal(calls,1)
 assert.equal(out.result,'responded')
 assert.equal(out.serviceStatus,'unknown')
 assert.equal(out.publication,'not-approved')
})
test('worker does not serialize network errors or accept unreviewed timeouts',async()=>{
 const out=await checkPublicWebsite({now:time,fetchImpl:async()=>{throw Error('USER: private coordinate 40,-75 SECRET')}})
 assert.equal(out.result,'request_error')
 assert.equal(out.httpStatus,null)
 assert.ok(!JSON.stringify(out).includes('SECRET'))
 await assert.rejects(checkPublicWebsite({timeoutMs:60000}),/Timeout/)
})
