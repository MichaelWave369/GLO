import test from 'node:test'
import assert from 'node:assert/strict'
import { makeSharedPin, parseSharedPin, shareUrl, CRISIS_CONTACTS, TEXT } from './fieldKit.js'

test('crisis contacts remain pure offline reference data', () => {
  assert.deepEqual(CRISIS_CONTACTS.map(c => c.number), ['911','988','211'])
  assert.equal(CRISIS_CONTACTS[1].text,'sms:988')
  assert.ok(TEXT.es.crisisInfo)
})
test('peer links include only approved fields, no ID or private notes', () => {
  const privatePin={id:'my-secret-device-id',category:'water',title:'Test fountain',lat:40.9861234,lon:-75.1945678,note:'My sensitive note',observedAt:'2026-10-10'}
  const url=shareUrl(privatePin,'https://example.org/GLO/')
  assert.ok(url.startsWith('https://example.org/GLO/#pin='))
  assert.ok(!url.includes('my-secret-device-id'))
  assert.ok(!url.includes('My%20sensitive'))
  assert.deepEqual(Object.keys(makeSharedPin(privatePin)), ['version','type','category','title','lat','lon'])
  const parsed=parseSharedPin(new URL(url).hash)
  assert.equal(parsed.title,'Test fountain')
  assert.equal(parsed.lat,40.986123)
  assert.equal(parsed.visibility,undefined)
  assert.equal(parsed.note,undefined)
})
test('reject malformed or forbidden shared categories', () => {
  assert.equal(parseSharedPin('#pin=notjson'), null)
  assert.equal(parseSharedPin('#pin='+encodeURIComponent(JSON.stringify({version:1,type:'glo-shared-location',category:'secret',title:'x',lat:1,lon:1}))),null)
  assert.equal(parseSharedPin('#pin='+encodeURIComponent(JSON.stringify({version:1,type:'glo-shared-location',category:'water',title:'x',lat:91,lon:1}))),null)
})
