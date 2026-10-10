import test from 'node:test'
import assert from 'node:assert/strict'
import { listRowsForMode, visibleSaveReceipt, activeShareTarget } from './resourceView.js'

const privateRow={id:'device-1',title:'My checked fountain',category:'water'}
const publicRow={id:'osm:node/456',title:'Mapped fountain',category:'water'}
test('normal mode shows only private notes; Scout owns public result cards',()=>{
  const rows=listRowsForMode([privateRow],[publicRow],false)
  assert.deepEqual(rows.map(r=>r.id),['device-1'])
  assert.equal(rows[0].from,'private')
})
test('low battery shows a single combined list without duplicate source records',()=>{
  const rows=listRowsForMode([privateRow],[publicRow,publicRow],true)
  assert.deepEqual(rows.map(r=>r.id),['device-1','osm:node/456'])
  assert.equal(rows[1].from,'osm')
})
test('save receipt vanishes when its specific pin has been deleted',()=>{
  const receipt={id:'device-1',title:'My checked fountain'}
  assert.deepEqual(visibleSaveReceipt(receipt,[privateRow]),receipt)
  assert.equal(visibleSaveReceipt(receipt,[]),null)
  assert.equal(visibleSaveReceipt(receipt,[publicRow]),null)
  assert.equal(visibleSaveReceipt(null,[privateRow]),null)
})

test('deleted pin closes share access, even if a stale share object remains',()=>{
  const stale={...privateRow,note:'Old private note'}
  assert.equal(activeShareTarget(stale,[],[publicRow]),null)
  assert.deepEqual(activeShareTarget(stale,[privateRow],[]),privateRow)
  assert.deepEqual(activeShareTarget(publicRow,[privateRow],[publicRow]),publicRow)
  assert.equal(activeShareTarget(null,[privateRow],[]),null)
})
