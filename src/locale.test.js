import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, PILOT_CENTER } from './domain.js'
import { categoryLabel, connectionDisplay, UI } from './locale.js'
import { crewCopy, osmEditLabel } from './crewLocale.js'
import { guideReply, detectNeed } from './guide.js'
import { mapPanelText,publicPackAgeLabel } from './mapPanelsLocale.js'

test('all 13 resource categories have nonempty Spanish names',()=>{
 for(const id of Object.keys(CATEGORIES)) {
   assert.ok(categoryLabel(id,'es',CATEGORIES).trim())
   assert.notEqual(categoryLabel(id,'es',CATEGORIES),CATEGORIES[id].label)
   assert.equal(categoryLabel(id,'en',CATEGORIES),CATEGORIES[id].label)
 }
})
test('connectivity wording never equates browser hint with reachable internet',()=>{
 assert.equal(connectionDisplay(true,'en'),'Connection not checked')
 assert.equal(connectionDisplay(true,'es'),'Conexión sin comprobar')
 assert.match(connectionDisplay(false,'en'),/Offline/)
 assert.match(connectionDisplay(false,'es'),/Sin conexión/)
 assert.doesNotMatch(connectionDisplay(true,'en'),/Browser online/)
})
test('Spanish visible interface and source warnings are present',()=>{
 const expected=['explorer','all','map','tiles','distance','welcome','downloadRequested','localFirst']
 for(const key of expected)assert.ok(UI.es[key]&&UI.en[key],key)
 assert.ok(UI.es.downloadRequested.includes('Descargas'))
 const crew=crewCopy('es')
 for(const key of ['intro','scoutTitle','changeWarning','ruleText','guideIntro','aiIntro','aiCaveat','offline'])assert.ok(crew[key]&&crew[key].length>18,key)
 assert.equal(crew.roles.length,4)
 assert.equal(crew.qs.length,4)
 assert.equal(crew.qr.length,4)
 assert.match(mapPanelText('es').sketchCaveat,/inaccesibles/)
 assert.match(mapPanelText('es').packCaveat,/registros/)
})
test('local Spanish guidance recognizes Spanish needs with unverified source caution',()=>{
 const context={center:PILOT_CENTER,online:false,reports:[],sources:[]}
 for(const [phrase,category] of [['Necesito agua potable','water'],['¿Dónde puedo cargar mi teléfono?','power'],['Necesito refugio por lluvia','shelter'],['Necesito comida','food']]){
   assert.ok(detectNeed(phrase).categories.includes(category),phrase)
   const reply=guideReply(phrase,context,'es')
   assert.equal(reply.kind,'local')
   assert.ok(reply.lines.join(' ').includes('Sin')||reply.lines.join(' ').includes('sin')||reply.lines.join(' ').includes('no'))
 }
 const urgent=guideReply('Hay una emergencia',context,'es')
 assert.equal(urgent.kind,'urgent')
 assert.match(urgent.title,/ayuda humana/)
})
test('OSM edit age labels can be displayed in Spanish without verified claims',()=>{
 assert.match(osmEditLabel({},'es'),/desconocida/)
 assert.match(publicPackAgeLabel({scannedAt:'2026-10-01T12:00:00Z'},'es',Date.parse('2026-10-10T12:00:00Z')),/no prueban/)
})
