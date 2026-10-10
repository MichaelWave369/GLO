import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, distanceKm, normalizeReport, privateBackup, publicReady, validCoordinates } from './domain.js'

test('community-oriented categories extend the original pilot', () => {
  for (const key of ['water','power','shelter','restroom','food','shower','laundry','warming','cooling','wifi','sharps','pet_support','overnight']) assert.ok(CATEGORIES[key], key)
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
  assert.throws(() => normalizeReport({ category: 'unknown', title: 'X', lat: 40, lon: -75 }), /Select/)
  assert.equal(normalizeReport({category:'food', title:'Pantry', lat:40, lon:-75}).visitStatus, 'unknown')
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

test('reported hours and observed function never create a verified resource', () => {
  const report = normalizeReport({category:'restroom', title:'Public restroom',lat:40,lon:-75,visitStatus:'working',reportedHours:'Mon-Fri 9-5',accessibility:{wheelchair:'yes',idRequired:'no'}},new Date('2026-10-10T21:00:00Z'))
  assert.equal(report.lastSeenWorkingAt,'2026-10-10T21:00:00.000Z')
  assert.equal(report.visitStatus,'working')
  assert.equal(report.condition,'not-verified')
  assert.equal(report.accessibility.wheelchair,'yes')
  assert.equal(report.accessibility.stepFree,'unknown')
  assert.equal(report.reportedHours,'Mon-Fri 9-5')
  assert.throws(()=>normalizeReport({category:'water',title:'Test',lat:40,lon:-75,reportedHours:'x'.repeat(101)}),/100/)
})

test('last-seen working time represents explicitly entered observation time, not save time',()=>{
  const saved=new Date('2026-10-10T22:00:00Z')
  const item=normalizeReport({category:'water',title:'Fountain',lat:40,lon:-75,observedAtLocal:'2026-10-10T18:00:00Z',visitStatus:'working'},saved)
  assert.equal(item.observedAt,'2026-10-10T18:00:00.000Z')
  assert.equal(item.lastSeenWorkingAt,'2026-10-10T18:00:00.000Z')
  assert.equal(item.savedAt,'2026-10-10T22:00:00.000Z')
  assert.throws(()=>normalizeReport({category:'water',title:'Fountain',lat:40,lon:-75,observedAtLocal:'2026-10-11T22:00:00Z'},saved),/future/)
})

test('never convert missing coordinates into an accidental (0,0) pin', () => {
  for (const coords of [{lat:'',lon:''},{lat:null,lon:-75},{lat:undefined,lon:-75},{lat:' ',lon:'-75'}]) {
    assert.throws(()=>normalizeReport({category:'water',title:'Fountain',...coords}), /Coordinates cannot be blank/)
  }
  const real=normalizeReport({category:'water',title:'Real observation',lat:'40.986',lon:'-75.194'})
  assert.equal(real.lat,40.986)
})
