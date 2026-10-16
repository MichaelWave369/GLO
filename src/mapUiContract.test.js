import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const app=readFileSync(new URL('./App.jsx',import.meta.url),'utf8')
const viewport=readFileSync(new URL('./MapViewportSync.jsx',import.meta.url),'utf8')

test('map renders independently of raster tiles with a visible local grid',()=>{
 assert.match(app,/<MapContainer\b/)
 assert.match(app,/<MapViewportSync\b/)
 assert.match(app,/!onlineTilesMounted && <div className="map-label"/)
 assert.match(app,/checked=\{tiles\}/)
 assert.ok(app.indexOf('const [tiles, setTiles] = useState(false)') < app.indexOf('const onlineTilesMounted = shouldMountOnlineTiles('), 'consent state must be initialized before used')
 assert.doesNotMatch(app,/https:\/\/\{s\}\.tile\.openstreetmap\.org/)
 assert.doesNotMatch(app,/checked=\{online && tiles\}/)
})
test('tile errors have a user-controlled retry or offline fallback, and never auto-enable tiles',()=>{
 assert.match(app,/tileerror:\s*\(\)\s*=>\s*setTileStatus\('error'\)/)
 assert.match(app,/onClick=\{retryOnlineTiles\}/)
 assert.match(app,/onClick=\{\(\)=>switchOnlineTiles\(false\)\}/)
 assert.match(app,/shouldMountOnlineTiles\(\{consented:tiles,lowBattery\}\)/)
 assert.match(app,/useState\(false\)/)
})
test('hidden or resized Leaflet viewport receives deliberate invalidateSize',()=>{
 assert.match(viewport,/map\.invalidateSize\(/)
 assert.match(viewport,/ResizeObserver/)
 assert.match(viewport,/window\.addEventListener\('resize'/)
 assert.match(viewport,/window\.clearTimeout\(/)
})
