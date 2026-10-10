import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, distanceKm, normalizeReport, privateBackup, publicReady, validCoordinates } from './domain.js'

test('the first pilot ships exactly the three promised categories', () => {
  assert.deepEqual(Object.keys(CATEGORIES), ['water', 'power', 'shelter'])
})
test('validate geographic bounds and calculate distances', () => {
  assert.equal(validCoordinates(40.986, -75.194), true)
  assert.equal(validCoordinates(91, 10), false)
  assert.equal(validCoordinates(0, Number.NaN), false)
  assert.equal(distanceKm({ lat: 40, lon: -75 }, { lat: 40, lon: -75 }), 0)
  assert.ok(distanceKm({ lat: 40, lon: -75 }, { lat: 41, lon: -75 }) > 100)
})
test('new observations are private and never certified as safe', () => {
  const saved = globalThis.crypto
  if (!globalThis.crypto?.randomUUID) throw new Error('Use Node.js 22+ to run the tests.')
  const report = normalizeReport({ category: 'water', title: ' Example ', note: '', lat: 40.986, lon: -75.194 }, new Date('2026-10-10T12:00:00Z'))
  assert.equal(report.visibility, 'device-only')
  assert.equal(report.condition, 'not-verified')
  assert.equal(report.title, 'Example')
  assert.equal(report.observedAt, '2026-10-10T12:00:00.000Z')
  assert.equal(report.schemaVersion, 1)
  assert.ok(report.id)
  assert.equal(saved, globalThis.crypto)
})
test('reject invalid reports and text limits', () => {
  assert.throws(() => normalizeReport({ category: 'food', title: 'Pizza', lat: 40, lon: -75 }), /Select/)
  assert.throws(() => normalizeReport({ category: 'water', title: '', lat: 40, lon: -75 }), /title/)
  assert.throws(() => normalizeReport({ category: 'water', title: 'X', lat: 100, lon: -75 }), /location/)
  assert.throws(() => normalizeReport({ category: 'power', title: 'X', note: 'a'.repeat(401), lat: 40, lon: -75 }), /400/)
})
test('backup stays user-directed and contains no imposed device identifier', () => {
  const backup = privateBackup([], new Date('2026-10-10T12:00:00Z'))
  assert.equal(backup.format, 'glo-pin-private-backup')
  assert.equal(backup.reports.length, 0)
  assert.equal(Object.hasOwn(backup, 'deviceId'), false)
  assert.equal(publicReady(), false)
})
