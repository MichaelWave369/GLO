import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const app=readFileSync(new URL('./PublicSourceReview.jsx',import.meta.url),'utf8')
const gate=readFileSync(new URL('./publicReviewGate.js',import.meta.url),'utf8')

test('review control does not import, publish, send messages, or access private stores',()=>{
 assert.match(app,/makeReviewDraft\(receipt,\{decision,acknowledged:ack\}\)/)
 assert.match(app,/disabled=\{!ack\|\|preparing\}/)
 assert.match(app,/onClick=\{saveReviewDraft\}/)
 assert.match(app,/epoch\.current\+\+/)
 assert.doesNotMatch(app,/\bfetch\(|indexedDB|localStorage|geolocation|navigator\.sendBeacon|new WebSocket/)
 assert.doesNotMatch(app,/setPublicCandidates|saveReport|onSourcesChange/)
 assert.doesNotMatch(gate,/\bfetch\(|localStorage|indexedDB|navigator\.geolocation/)
})
test('blocked publication is invariant across local review UI and verifier',()=>{
 assert.match(gate,/publication:'blocked'/)
 assert.match(gate,/authority:'none'/)
 assert.match(gate,/serviceStatus:'unknown'/)
 assert.match(app,/PUBLICATION BLOCKED/)
})


test('independent browser pairing is explicit, bounded, ephemeral and does not confer authority',()=>{
 assert.match(app,/inspectReviewDraftAgainstReceipt\(receipt,text\)/)
 assert.match(app,/file\.size>REVIEW_MAX_BYTES/)
 assert.match(app,/pairEpoch\.current\+\+/)
 assert.match(app,/disabled=\{pairPending\}/)
 assert.match(app,/onClick=\{resetPair\}/)
 assert.match(app,/LOCAL CONTENT MATCH ONLY/)
 assert.match(app,/PUBLICATION BLOCKED/)
 assert.doesNotMatch(app,/navigator\.geolocation|indexedDB|localStorage|fetch\(/)
})
