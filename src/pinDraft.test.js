import test from 'node:test'
import assert from 'node:assert/strict'
import { initialDraft, localDateTime } from './pinDraft.js'
import { normalizeReport } from './domain.js'

test('a new private pin has no assumed GPS or Stroudsburg coordinates', () => {
  const draft = initialDraft(new Date('2026-10-10T12:05:00Z'))
  assert.equal(draft.lat, '')
  assert.equal(draft.lon, '')
  assert.equal(draft.title, '')
  assert.equal(draft.category, 'water')
  assert.equal(draft.accessibility.wheelchair,'unknown')
  assert.throws(()=>normalizeReport({...draft, title:'Fountain'}), /Coordinates cannot be blank/)
})
test('local-time helper generates a valid browser datetime-local string', () => {
  assert.match(localDateTime(new Date('2026-10-10T12:05:00Z')), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
})
