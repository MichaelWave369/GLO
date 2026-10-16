import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const app=readFileSync(new URL('./App.jsx',import.meta.url),'utf8')
const shelf=readFileSync(new URL('./OfficialReferralShelf.jsx',import.meta.url),'utf8')
test('official shelf mounts independently of Scout and private location state',()=>{
 assert.match(app,/<OfficialReferralShelf language=\{language\} onlineHint=\{online\}\/>/)
 assert.match(shelf,/findOfficialReferrals\(topic\)/)
 assert.doesNotMatch(shelf,/navigator\.geolocation|fetch\(|localStorage|indexedDB|onScoutRecords|privateReports|window\.location/)
})
test('only explicit outbound links; URLs not composed with stored coordinates or queries',()=>{
 assert.match(shelf,/href=\{s\.url\} target="_blank" rel="noopener noreferrer"/)
 assert.match(shelf,/href="tel:211"/)
 assert.doesNotMatch(shelf,/<iframe|document\.location|window\.open|encodeURIComponent|new URLSearchParams/)
})
