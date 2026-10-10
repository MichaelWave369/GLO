import test from 'node:test'
import assert from 'node:assert/strict'
import { makeScopedSharedPin, scopedShareUrl, parseScopedSharedPin } from './scopedShare.js'
import { parseSharedPin, shareUrl } from './fieldKit.js'

const privatePin={id:'device-secret-id',category:'water',title:'My private spot next to cabin',lat:40.986123,lon:-75.194567,note:'Person sleeps here',author:'private person'}
test('default handoff shares category and approximate area only',()=>{
  const result=makeScopedSharedPin(privatePin)
  assert.deepEqual({scope:result.scope,lat:result.lat,lon:result.lon,title:result.title,nameShared:result.nameShared},
    {scope:'area',lat:40.99,lon:-75.19,title:'Drinking water',nameShared:false})
  const url=scopedShareUrl(privatePin,'https://example.org/GLO/')
  for(const secret of ['My private spot','device-secret-id','Person sleeps here','40.986123','-75.194567','private person'])assert.ok(!url.includes(secret))
  const parsed=parseSharedPin(new URL(url).hash)
  assert.equal(parsed.scope,'area')
  assert.equal(parsed.lat,40.99)
})
test('exact precision and resource name require separate explicit scope/field options',()=>{
  const exact=makeScopedSharedPin(privatePin,{scope:'exact',includeName:true})
  assert.equal(exact.title,privatePin.title)
  assert.equal(exact.lat,40.986123)
  assert.equal(exact.lon,-75.194567)
  assert.equal(exact.nameShared,true)
  assert.equal(parseSharedPin(new URL(scopedShareUrl(privatePin,'https://example.org/GLO/',{scope:'exact',includeName:true})).hash).scope,'exact')
})
test('reject peer link masquerading as verified or adding private fields',()=>{
  const item=makeScopedSharedPin(privatePin)
  assert.equal(parseScopedSharedPin({...item,notes:'private'}),null)
  assert.equal(parseScopedSharedPin({...item,verified:true}),null)
  assert.equal(parseScopedSharedPin({...item,lat:40.986123}),null)
  assert.equal(parseScopedSharedPin({...item,title:'Home address'}),null)
  assert.equal(parseScopedSharedPin({...item,category:'__proto__'}),null)
  assert.throws(()=>makeScopedSharedPin(privatePin,{scope:'admin'}),/scope/)
})
test('existing v1 links still open as exact peer-shared previews',()=>{
  const old=parseSharedPin(new URL(shareUrl(privatePin,'https://example.org/GLO/')).hash)
  assert.equal(old.version,1)
  assert.equal(old.lat,privatePin.lat)
  assert.equal(old.scope,undefined)
  assert.equal(old.provenance,'peer-shared')
})
