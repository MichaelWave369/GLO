import test from 'node:test'
import assert from 'node:assert/strict'
import { askOnDeviceAI, inspectOnDeviceAI, publicAiContext } from './onDeviceAi.js'

test('on-device AI absent or unsupported gracefully degrades', async () => {
  assert.equal(await inspectOnDeviceAI(null), 'unsupported')
  assert.equal(await inspectOnDeviceAI({ availability: async () => 'unknown', create() {} }), 'unavailable')
})
test('availability check does not download or create a model', async () => {
  let created = false
  const fake = { availability: async () => 'downloadable', create: () => { created = true } }
  assert.equal(await inspectOnDeviceAI(fake), 'downloadable')
  assert.equal(created, false)
})
test('only bounded, public, coordinate-free context goes into model prompts', async () => {
  const source = { category: 'water', title: 'Mapped fountain', lat: 40.1, lon: -75.2, note: 'secret', distanceKm: 0.25, lastMappedAt: '2025-01-01T00:00:00Z' }
  const context = publicAiContext([source])
  assert.equal(context.length, 1)
  assert.equal(context[0].distanceFromPriorScanKm, 0.3)
  assert.equal('lat' in context[0], false)
  assert.equal(JSON.stringify(context).includes('secret'), false)
})
test('mock model receives bounded text and gets torn down after a prompt', async () => {
  let prompt = '', destroyed = false
  const fake = {
    create: async (options) => {
      assert.equal(options.initialPrompts[0].role, 'system')
      return { prompt: async (text) => { prompt = text; return 'Verify availability before travelling.' }, destroy: () => { destroyed = true } }
    }
  }
  const reply = await askOnDeviceAI('where is water?', [{ category: 'water', title: 'Mapped fountain', distanceKm: 1.2, lat: 1, lon: 2 }], fake)
  assert.match(reply, /Verify availability/)
  assert.match(prompt, /Mapped fountain/)
  assert.equal(prompt.includes('"lat":'), false)
  assert.equal(destroyed, true)
})
test('dangerous emergencies do not trigger a model session', async () => {
  await assert.rejects(() => askOnDeviceAI('someone cannot breathe', [], { create: async () => { throw Error('should not call') } }), /emergency guidance/)
})
