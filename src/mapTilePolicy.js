// Render online street tiles only after explicit user consent.
// OSMF tile policy: https://operations.osmfoundation.org/policies/tiles/
// Do not bulk prefetch/cache tiles for offline map packs.
export const OSM_TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTRIBUTION='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'

export function shouldMountOnlineTiles({consented=false,lowBattery=false}={}){
 return consented===true && lowBattery!==true
}

export const MAP_TILE_COPY=Object.freeze({
 en:Object.freeze({
  toggle:'Load online street map tiles (uses OpenStreetMap)',
  offline:'No online tiles loaded. The local grid and saved markers still work.',
  loading:'Loading OpenStreetMap street tiles…',
  ready:'Online OpenStreetMap street tiles loaded. Current viewed area may be shared with the tile provider.',
  failed:'Street tiles could not load. The grid and locally saved markers still work. OpenStreetMap may be unavailable, blocked, or your device may be offline.',
  retry:'Retry online street tiles',
  grid:'Switch back to local grid',
  networkHint:'Your browser reports offline. You can still try loading tiles manually, but the request may fail.',
  lowPower:'Interactive map hidden in low-battery mode to save power.',
  showMap:'Show interactive map (leave low-battery mode)'
 }),
 es:Object.freeze({
  toggle:'Cargar calles en línea (usa OpenStreetMap)',
  offline:'No se cargaron calles en línea. La cuadrícula y los puntos locales siguen disponibles.',
  loading:'Cargando las calles de OpenStreetMap…',
  ready:'Se cargaron las calles de OpenStreetMap. El proveedor puede recibir la zona mostrada.',
  failed:'No se pudieron cargar las calles. La cuadrícula y los puntos locales siguen funcionando. OpenStreetMap puede estar bloqueado, no disponible o el dispositivo sin conexión.',
  retry:'Reintentar las calles en línea',
  grid:'Volver a la cuadrícula local',
  networkHint:'El navegador indica que estás sin conexión. Puedes intentar cargar las calles manualmente, pero puede fallar.',
  lowPower:'Mapa interactivo oculto en modo de batería baja para ahorrar energía.',
  showMap:'Mostrar mapa interactivo (salir del modo de batería baja)'
 })
})
