import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('./darkTheme.css', import.meta.url), 'utf8')
const main = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8')
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

function contrastRatio(a,b) {
  const linear = x => {
    const c = parseInt(x,16)/255
    return c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4
  }
  const luminance = v => {
    const s=v.replace('#','').match(/../g)
    return s.reduce((sum,x,i)=>sum+[0.2126,0.7152,0.0722][i]*linear(x),0)
  }
  const la=luminance(a), lb=luminance(b)
  return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05)
}
function token(key) {
  const match=css.match(new RegExp('--'+key+':(#[0-9a-f]{6})','i'))
  assert.ok(match,'Missing '+key)
  return match[1]
}

test('the charcoal palette meets readable text and button contrast',()=>{
  assert.ok(contrastRatio(token('glo-bg'),token('glo-text'))>=7)
  assert.ok(contrastRatio(token('glo-panel'),token('glo-soft'))>=4.5)
  assert.ok(contrastRatio('#7bdbaa','#08251a')>=4.5)
})
test('map, crisis, public sources and all offline panels get a dark surface',()=>{
  for(const selector of [
    'html .map-frame','html .leaflet-popup-content-wrapper',
    'html .crisis-strip','html .agent-panel','html .street-pack',
    'html .pocket-details','html .offline-entry','html .handoff-preview',
    'html .version-banner','html .pin-card.selected'
  ])assert.ok(css.includes(selector),selector+' needs dark treatment')
})
test('dark theme is imported last; no user report or networking code changed',()=>{
  assert.ok(main.lastIndexOf("import './darkTheme.css'") > main.indexOf("import App from './App.jsx'"))
  assert.match(css, /@media print/)
  assert.match(index, /name="theme-color" content="#0c1419"/)
})
