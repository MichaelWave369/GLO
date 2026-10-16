import test from 'node:test'
import assert from 'node:assert/strict'
import {OFFICIAL_REFERRAL_SOURCES,REFERRAL_TOPICS,validatedOfficialReferrals,
 findOfficialReferrals} from './officialReferrals.js'

test('referrals are hardcoded reviewed external links only, not live provider claims',()=>{
 const sources=validatedOfficialReferrals()
 assert.equal(sources.length,2)
 assert.ok(sources.every(s=>s.dataImport==='none'&&s.kind==='external-referral-only'&&s.verifiedProviderStatus==='unknown'))
 assert.ok(sources.every(s=>s.url.startsWith('https://')))
 assert.equal(findOfficialReferrals('housing').length,2)
 assert.equal(findOfficialReferrals('utilities').length,1)
 assert.equal(findOfficialReferrals('all').length,2)
 assert.throws(()=>findOfficialReferrals('eviction-exact-address'))
})
test('fail closed on injected URLs, locations, operational status and duplicated source IDs',()=>{
 const base=OFFICIAL_REFERRAL_SOURCES.map(s=>({...s,topics:[...s.topics]}))
 const evil=[
  {...base[0],url:'https://fake-211.example.net/track'},
  {...base[0],dataImport:'automatic'},
  {...base[0],verifiedProviderStatus:'open-now'},
  {...base[0],kind:'trusted-live-shelter'},
  {...base[0],lat:40.1234,lon:-75.3429},
  {...base[0],privateNote:'confidential'},
  {...base[0],topics:['all']}
 ]
 for(const bad of evil)assert.throws(()=>validatedOfficialReferrals([bad,base[1]]))
 assert.throws(()=>validatedOfficialReferrals([base[0],{...base[0]}]))
 assert.deepEqual(REFERRAL_TOPICS,['all','housing','food','utilities','health','other'])
})
test('referral list/filter functions do not call fetch or device geolocation',()=>{
 const prior=globalThis.fetch
 globalThis.fetch=()=>{throw Error('Unexpected network request')}
 try{assert.equal(findOfficialReferrals('food').length,2)}
 finally{globalThis.fetch=prior}
})
