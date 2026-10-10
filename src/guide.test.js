import test from 'node:test'
import assert from 'node:assert/strict'
import { CREW, detectNeed, guideReply, freshnessAudit } from './guide.js'
import { buildScoutQuery, mappedAge, normalizeScoutResults, SCOUT_RADIUS_M } from './scout.js'

test('guide crew clearly describes capabilities', () => {
  assert.equal(CREW.length, 4)
  assert.match(CREW.find((a) => a.id === 'bro').detail, /on-device AI/)
})
test('queries are geographically bounded and based on explicit category tags', () => {
  const query = buildScoutQuery({ lat: 40.986, lon: -75.194 })
  assert.match(query, /drinking_water/)
  assert.match(query, /socket:usb/)
  assert.match(query, /covered/)
  assert.match(query, /amenity\"=\"toilets/)
  assert.match(query, /food_bank/)
  assert.match(query, /soup_kitchen/)
  assert.match(query, /amenity\"=\"shower/)
  assert.match(query, /out center meta/)
  assert.ok(query.includes('around:' + SCOUT_RADIUS_M))
  assert.ok(query.includes('40.986,-75.194'))
  assert.ok(!buildScoutQuery({ lat: 40.986432, lon: -75.194876 }).includes('40.986432'))
  assert.ok(buildScoutQuery({ lat: 40.986432, lon: -75.194876 }).includes('40.986,-75.195'))
  assert.throws(() => buildScoutQuery({ lat: 200, lon: 1 }), /valid/)
})
test('scout results have provenance, age, and uncertain condition', () => {
  const center = { lat: 40.986, lon: -75.194 }
  const items = normalizeScoutResults([
    { type: 'node', id: 10, lat: 40.986, lon: -75.194, timestamp: '2025-01-01T00:00:00Z', tags: { amenity: 'drinking_water', name: 'Fountain' } },
    { type: 'node', id: 11, lat: 40.987, lon: -75.194, tags: { amenity: 'charging_station' } },
    { type: 'node', id: 12, lat: 40.987, lon: -75.194, tags: { amenity: 'shelter', access: 'private' } },
    { type: 'node', id: 10, lat: 40.986, lon: -75.194, tags: { amenity: 'drinking_water' } }
  ], center, new Date('2026-10-10T00:00:00Z'))
  assert.equal(items.length, 1)
  assert.equal(items[0].sourceUrl, 'https://www.openstreetmap.org/node/10')
  assert.equal(items[0].condition, 'not-verified')
  assert.equal(items[0].availability, 'unknown')
  assert.equal(mappedAge(items[0], Date.parse('2026-10-10T00:00:00Z')).level, 'older')
})
test('guide remains private and avoids making availability claims', () => {
  const privateNote = { title: 'My drinking fountain', lat: 40.986, lon: -75.194, category: 'water', note: 'private' }
  const answer = guideReply('need drinking water', { reports: [privateNote], center: { lat: 40.986, lon: -75.194 }, online: false })
  assert.equal(detectNeed('phone battery running low').categories[0], 'power')
  assert.equal(answer.matches[0].origin, 'private-note')
  assert.match(answer.lines.join(' '), /NOT confirmed/)
  assert.match(answer.lines.join(' '), /offline/)
})
test('guide handles unsupported food and urgent help without fictitious resources', () => {
  assert.match(guideReply('where can I get food').lines.join(' '), /mapped food banks/)
  assert.equal(guideReply('someone cannot breathe').kind, 'urgent')
})

test('freshness is a recheck reminder, not physical-availability verification', () => {
  const now = Date.parse('2026-10-10T00:00:00Z')
  const audit = freshnessAudit(
    [{ observedAt: '2026-09-01T00:00:00Z' }, { observedAt: '2026-10-09T00:00:00Z' }],
    [{ lastMappedAt: '2024-01-01T00:00:00Z' }, { lastMappedAt: null }],
    now
  )
  assert.deepEqual(audit, { privateRecheck: 1, sourceOlderYear: 1, sourceAgeUnknown: 1 })
})

test('extended categories are locally searchable without fabricated online listings', () => {
  const note={id:'local-food',title:'Pantry',category:'food',lat:40,lon:-75,observedAt:'2026-10-10T00:00:00Z'}
  const answer=guideReply('I need food',{reports:[note],sources:[],center:{lat:40,lon:-75},online:false})
  assert.equal(answer.matches[0].id,'local-food')
  assert.equal(detectNeed('looking for a restroom').categories[0],'restroom')
})

test('public Scout adds only specifically tagged restrooms, social meal programs and showers', () => {
  const center={lat:40.986,lon:-75.194}
  const candidate=(id,tags)=>({type:'node',id,lat:40.986,lon:-75.194,timestamp:'2026-08-01T00:00:00Z',tags})
  const results=normalizeScoutResults([
    candidate(91,{amenity:'toilets',fee:'yes'}),
    candidate(92,{amenity:'social_facility',social_facility:'food_bank',opening_hours:'Mo-Fr 09:00-16:00'}),
    candidate(93,{amenity:'social_facility',social_facility:'soup_kitchen'}),
    candidate(94,{amenity:'shower',access:'yes'}),
    candidate(95,{amenity:'social_facility',social_facility:'nursing_home'}),
    candidate(96,{amenity:'toilets',access:'private'})
  ],center,new Date('2026-10-10T00:00:00Z'))
  assert.deepEqual(results.map(r=>r.category),['restroom','food','food','shower'])
  assert.equal(results[1].reportedHours,'Mo-Fr 09:00-16:00')
  for(const r of results) assert.equal(r.availability,'unknown')
  assert.match(results[0].accessNote,/fees/)
})
