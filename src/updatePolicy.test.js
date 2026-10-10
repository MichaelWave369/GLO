import test from 'node:test'
import assert from 'node:assert/strict'
import { UPDATE_CHECK_INTERVAL_MS, shouldCheckForUpdate } from './updatePolicy.js'

test('do not poll for updates when offline or the tab is hidden',()=>{
  const enough = UPDATE_CHECK_INTERVAL_MS + 1
  assert.equal(shouldCheckForUpdate({online:false,visible:true,now:enough,lastCheckedAt:0}),false)
  assert.equal(shouldCheckForUpdate({online:true,visible:false,now:enough,lastCheckedAt:0}),false)
})
test('throttle checks and permit foreground refresh after the interval',()=>{
  const enough = UPDATE_CHECK_INTERVAL_MS
  assert.equal(shouldCheckForUpdate({online:true,visible:true,now:enough,lastCheckedAt:0}),true)
  assert.equal(shouldCheckForUpdate({online:true,visible:true,now:enough-1,lastCheckedAt:0}),false)
  assert.equal(shouldCheckForUpdate({online:true,visible:true,now:enough,lastCheckedAt:enough-20}),false)
  assert.equal(shouldCheckForUpdate({online:true,visible:true,now:100,lastCheckedAt:200}),false)
})
