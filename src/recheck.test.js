import test from 'node:test'
import assert from 'node:assert/strict'
import {createRecheck,validatedRechecks,latestObservedAt,latestRecheck,MAX_RECHECKS} from './recheck.js'
const original={id:'private-pin',observedAt:'2026-10-01T11:00:00Z',note:'Original private note',lat:40.987654,lon:-75.193456,visitStatus:'working'}
const now=new Date('2026-10-10T22:00:00Z')
const draft={observedAtLocal:'2026-10-10T20:00:00Z',visitStatus:'not_working',note:'No water flowed on my visit'}
test('new recheck is a private, not-verified receipt without coordinates or copied notes',()=>{
 const r=createRecheck(original,draft,now,()=>'receipt-1')
 assert.deepEqual(Object.keys(r),['id','observedAt','savedAt','visitStatus','note','provenance','condition','visibility'])
 assert.equal(r.provenance,'self-reported')
 assert.equal(r.condition,'not-verified')
 assert.ok(!JSON.stringify(r).includes('40.987654'))
 assert.ok(!JSON.stringify(r).includes('Original private note'))
 assert.equal(original.visitStatus,'working')
})
test('reject future, pre-original, oversized or injected rechecks',()=>{
 assert.throws(()=>createRecheck(original,{...draft,observedAtLocal:'2027-02-01'},now),/time/)
 assert.throws(()=>createRecheck(original,{...draft,observedAtLocal:'2026-09-30'},now),/time/)
 assert.throws(()=>createRecheck(original,{...draft,visitStatus:'verified'},now),/Choose/)
 assert.throws(()=>createRecheck(original,{...draft,note:'x'.repeat(241)},now),/240/)
 assert.throws(()=>createRecheck(original,{...draft,note:'<script>'},now),/markup/)
})
test('sort by actual observation time; original never overwritten',()=>{
 const early=createRecheck(original,{...draft,observedAtLocal:'2026-10-04'},now,()=>'early')
 const late=createRecheck(original,draft,now,()=>'late')
 const pin={...original,rechecks:[early,late]}
 assert.deepEqual(validatedRechecks(pin).map(r=>r.id),['late','early'])
 assert.equal(latestRecheck(pin).visitStatus,'not_working')
 assert.equal(latestObservedAt(pin),'2026-10-10T20:00:00.000Z')
 assert.equal(latestObservedAt(original),'2026-10-01T11:00:00.000Z')
 assert.equal(MAX_RECHECKS,20)
})
test('reject forged verification while leaving good entries visible',()=>{
 const r=createRecheck(original,draft,now,()=>'one')
 const pin={...original,rechecks:[{...r,condition:'verified'},r,r]}
 assert.equal(validatedRechecks(pin).length,1)
})
