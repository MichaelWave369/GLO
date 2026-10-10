import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPocketPlan, POCKET_TOPICS, POCKET_COPY } from './pocketPlan.js'

const time=new Date('2026-10-10T20:00:00Z')
test('all topics have English and Spanish offline first steps and contact scripts',()=>{
  for(const lang of ['en','es'])for(const topic of POCKET_TOPICS){
    const tpl=POCKET_COPY[lang].topics[topic]
    assert.ok(tpl.label && tpl.first && tpl.gather && tpl.ask)
    const plan=buildPocketPlan({topic},lang,time)
    assert.ok(plan.includes(tpl.first))
    assert.ok(plan.includes(tpl.ask))
  }
})
test('a private selected pin is opt-in and never exports its coordinates, notes or identifiers',()=>{
  const resource={id:'device-secret-456',title:'Library charger',from:'private',lat:40.123456,lon:-75.123456,note:'Private information',observedAt:'2026-10-10'}
  const standard=buildPocketPlan({topic:'power',resource},'en',time)
  assert.ok(!standard.includes('Library charger'))
  const copy=buildPocketPlan({topic:'power',resource,includeResource:true,contact:'Local library'},'en',time)
  assert.ok(copy.includes('Library charger'))
  assert.ok(copy.includes('Personal device note'))
  for(const secret of ['device-secret','40.123456','-75.123456','Private information'])assert.ok(!copy.includes(secret))
})
test('unknown source and malformed content do not turn into verified source',()=>{
  const copy=buildPocketPlan({topic:'food',resource:{from:'official',title:'Unsafe',note:'X'},includeResource:true,contact:' <script>alert(1)</script> '},'en',time)
  assert.ok(!copy.includes('Resource to ask about'))
  assert.ok(!copy.includes('<script>'))
  assert.ok(copy.includes('not proof'))
  assert.throws(()=>buildPocketPlan({topic:'unapproved'},'en',time),/Unsupported/)
})
