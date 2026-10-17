import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const ui=readFileSync(new URL('./PublicSourceReview.jsx',import.meta.url),'utf8')
const worker=readFileSync(new URL('../ops/publicSourceCheck.mjs',import.meta.url),'utf8')
test('first real observation is available through explicit navigation, not auto dispatch',()=>{
 assert.match(ui,/href="https:\/\/github\.com\/MichaelWave369\/GLO\/actions\/workflows\/glo-public-source-check\.yml"/)
 assert.match(ui,/target="_blank" rel="noopener noreferrer"/)
 assert.match(ui,/first recorded real test returned HTTP 301/)
 assert.match(worker,/redirect:'manual'/)
 assert.doesNotMatch(ui,/fetch\(|axios\(|navigator\.geolocation|workflow_dispatch:/)
})
