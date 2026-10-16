// Describes known interfaces, NOT a live traffic monitor or a security audit.
// This pure function makes no network calls, location requests or storage writes.
export const PRIVACY_SURFACE_IDS=Object.freeze([
  'site','updates','tiles','scout','streets','gps','ai','links','sharing'
])

export function privacySurfaceStates({onlineHint=false,tilesEnabled=false,lowBattery=false}={}){
  // GLO mounts Leaflet's remote TileLayer only under these UI conditions.
  const tileLayerMounted=onlineHint===true&&tilesEnabled===true&&lowBattery!==true
  return [
    {id:'site',state:'hosting'},
    {id:'updates',state:'possible-automatic'},
    {id:'tiles',state:tileLayerMounted?'layer-mounted':'layer-not-mounted'},
    {id:'scout',state:'user-action'},
    {id:'streets',state:'user-action'},
    {id:'gps',state:'permission-on-tap'},
    {id:'ai',state:'optional-model-download'},
    {id:'links',state:'external-navigation'},
    {id:'sharing',state:'user-controlled-handoff'}
  ]
}

export const PRIVACY_STORE_KEYS=Object.freeze([
  'privatePins','privateResearchNotes','publicScoutPacks','savedStreetSketches'
])
export function validPrivacyCounts(counts){
  return counts!==null&&typeof counts==='object'&&!Array.isArray(counts)&&
    Object.keys(counts).length===PRIVACY_STORE_KEYS.length&&
    PRIVACY_STORE_KEYS.every(key=>Object.hasOwn(counts,key)&&
      Number.isSafeInteger(counts[key])&&counts[key]>=0)
}
