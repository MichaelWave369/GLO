import {useState} from 'react'
import {CATEGORIES} from './domain.js'
import {categoryLabel} from './locale.js'
import {findNearbyLoaded,parseNearbyPoint,NEARBY_RADII,NEARBY_LIMIT} from './nearbyFinder.js'
import './nearbyFinder.css'

const COPY={
 en:{
  label:'Find nearby from loaded data',
  intro:'Search your own private pins and public OSM records already loaded here. Nothing is fetched, uploaded, published or shared.',
  coords:'Choose where to search from',lat:'Latitude',lon:'Longitude',
  manual:'Enter coordinates yourself, or deliberately choose a source below. Neither button asks your device for GPS.',
  map:'Use displayed map center',selected:'Use selected resource',
  mapCaution:'The map can still show the prototype starting location in Stroudsburg, PA. Its center is NOT automatically your current location.',
  type:'Need',all:'All resource types',range:'Straight-line radius',find:'Find from this point',
  locationError:'Enter coordinates or deliberately choose the map center or selected resource.',
  results:'Matching entries already loaded',distance:'km straight-line',
  found:n=>n+' entries in the selected circle',sourceCount:(a,b)=>a+' private observations · '+b+' mapped OSM entries',
  limited:n=>'Showing the nearest '+n+' only. This list is not complete regional coverage.',
  empty:'No matching entries in the currently loaded records. This does NOT prove there are no resources nearby.',
  provenancePrivate:'Private, self-reported',provenanceOSM:'OpenStreetMap, mapped record',
  datePrivate:'Last personal observation',dateOSM:'OSM data queried',
  unknown:'Date unknown',unverified:'NOT independently verified',
  mapAction:'Show on map',
  lowBattery:'Map navigation is hidden in low-battery mode. The list still works offline.',
  warnings:'Distances are as the crow flies, NOT walking/driving distances or accessible routes. A map label or past observation is NOT evidence a resource is open, safe, free, potable or available. Check before depending on it.',
  sourceCaution:'Public results are only from the current Scout scan or opened offline pack. Older records and unsaved scans may be incomplete; absent results never mean a service does not exist.',
  privacy:'Private notes and recheck text are never included in these result cards. Results are visible on this device only.',
  cleared:'Change the search point, type or radius, then search again.'
 },
 es:{
  label:'Buscar recursos cercanos en datos cargados',
  intro:'Busca en tus puntos privados y registros públicos de OSM ya cargados. No se consulta internet, no se suben datos ni se comparte nada.',
  coords:'Elige el punto de partida',lat:'Latitud',lon:'Longitud',
  manual:'Escribe las coordenadas o elige un punto abajo. Los botones NO solicitan el GPS.',
  map:'Usar centro del mapa',selected:'Usar recurso seleccionado',
  mapCaution:'El mapa puede mostrar todavía la ubicación inicial de prueba en Stroudsburg, PA. Su centro NO es tu ubicación detectada.',
  type:'Necesidad',all:'Todos los recursos',range:'Radio en línea recta',find:'Buscar desde este punto',
  locationError:'Escribe las coordenadas o selecciona el centro del mapa o un recurso.',
  results:'Coincidencias en los datos cargados',distance:'km en línea recta',
  found:n=>n+' entradas dentro del círculo',sourceCount:(a,b)=>a+' observaciones privadas · '+b+' registros de OSM',
  limited:n=>'Solo aparecen los '+n+' más cercanos. No es un directorio regional completo.',
  empty:'No hay coincidencias en los datos cargados. Esto NO demuestra que no existan recursos cerca.',
  provenancePrivate:'Privado, declarado por una persona',provenanceOSM:'OpenStreetMap, registro cartografiado',
  datePrivate:'Última observación personal',dateOSM:'Datos de OSM consultados',
  unknown:'Fecha desconocida',unverified:'SIN verificación independiente',
  mapAction:'Mostrar en mapa',
  lowBattery:'La navegación por mapa no aparece en modo de batería baja. La lista funciona sin conexión.',
  warnings:'Las distancias son en línea recta, NO rutas a pie, en coche ni accesibles. Un mapa o una observación anterior NO demuestran que un recurso esté abierto, sea seguro, gratis, potable o disponible. Comprueba antes de depender de él.',
  sourceCaution:'Los resultados públicos solo proceden de la búsqueda actual de Scout o de un paquete local abierto. Los registros pueden ser antiguos o incompletos; la ausencia no demuestra que no exista un servicio.',
  privacy:'Las notas privadas y el texto de revisiones nunca aparecen en estas tarjetas. Solo se muestran en este dispositivo.',
  cleared:'Modifica el punto, tipo o radio y vuelve a buscar.'
 }
}

export default function NearbyFinder({
 privateReports=[],publicSources=[],mapCenter,selectedResource=null,
 lowBattery=false,language='en',onOpenMap
}){
 const t=COPY[language]||COPY.en
 const [lat,setLat]=useState('')
 const [lon,setLon]=useState('')
 const [category,setCategory]=useState('all')
 const [radius,setRadius]=useState(2)
 const [submitted,setSubmitted]=useState(null)
 const [error,setError]=useState('')
 function changePoint(a,b){setLat(a);setLon(b);setSubmitted(null);setError('')}
 function changeCategory(next){setCategory(next);setSubmitted(null);setError('')}
 function changeRadius(next){setRadius(next);setSubmitted(null);setError('')}
 function search(event){
  event.preventDefault()
  setError('')
  try{
   const point=parseNearbyPoint(lat,lon)
   // This commits a local-only query; changes to the draft require another tap.
   setSubmitted({point,category,radiusKm:radius})
  }catch(e){setSubmitted(null);setError(e.message||t.locationError)}
 }
 // Existing records can change without a network request from this component.
 // A submitted query always filters current in-memory data, never a stale copied result.
 let result=null
 let resultError=''
 if(submitted){
  try{result=findNearbyLoaded({...submitted,privateReports,publicSources})}
  catch(e){result=null;resultError=e.message||t.locationError}
 }
 return <details className="nearby-finder">
  <summary>{t.label}</summary>
  <div className="nearby-finder-body">
   <p>{t.intro}</p>
   <p className="nearby-finder-warning">{t.mapCaution}</p>
   <form onSubmit={search}>
    <strong>{t.coords}</strong>
    <p>{t.manual}</p>
    <div className="nearby-coordinate-grid">
     <label>{t.lat}<input type="text" inputMode="decimal" autoComplete="off" maxLength={24} value={lat} onChange={e=>changePoint(e.target.value,lon)} placeholder="40.986"/></label>
     <label>{t.lon}<input type="text" inputMode="decimal" autoComplete="off" maxLength={24} value={lon} onChange={e=>changePoint(lat,e.target.value)} placeholder="-75.194"/></label>
    </div>
    <div className="nearby-choice-row">
     <button type="button" className="secondary compact" disabled={!mapCenter} onClick={()=>changePoint(String(mapCenter.lat),String(mapCenter.lon))}>{t.map}</button>
     {selectedResource&&<button type="button" className="secondary compact" onClick={()=>changePoint(String(selectedResource.lat),String(selectedResource.lon))}>{t.selected}</button>}
    </div>
    <label>{t.type}
     <select value={category} onChange={e=>changeCategory(e.target.value)}>
      <option value="all">{t.all}</option>
      {Object.keys(CATEGORIES).map(key=><option key={key} value={key}>{categoryLabel(key,language,CATEGORIES)}</option>)}
     </select>
    </label>
    <label>{t.range}
     <select value={radius} onChange={e=>changeRadius(Number(e.target.value))}>
      {NEARBY_RADII.map(value=><option key={value} value={value}>{value} km</option>)}
     </select>
    </label>
    <button type="submit" className="primary">{t.find}</button>
   </form>
   {(error||resultError)&&<p role="alert" className="nearby-finder-error">{error||resultError}</p>}
   {result&&<section className="nearby-found" aria-live="polite" aria-label={t.results}>
    <strong>{t.results}</strong>
    <p>{t.found(result.total)} · {t.sourceCount(result.privateCount,result.publicCount)}</p>
    {result.shown.length?<>
     <ol className="nearby-list">{result.shown.map(row=><li key={row.origin+':'+row.id}>
       <strong>{row.title}</strong>
       <small>{categoryLabel(row.category,language,CATEGORIES)} · {row.distanceKm.toFixed(2)} {t.distance}</small>
       <small>{row.origin==='private'?t.provenancePrivate:t.provenanceOSM} · {t.unverified}</small>
       <small>{row.origin==='private'?t.datePrivate:t.dateOSM}: {row.evidenceAt?new Date(row.evidenceAt).toLocaleDateString(language==='es'?'es-US':'en-US'):t.unknown}</small>
       {!lowBattery&&<button type="button" className="secondary compact" onClick={()=>onOpenMap?.(row)}>{t.mapAction}</button>}
      </li>)}</ol>
     {result.total>NEARBY_LIMIT&&<p>{t.limited(NEARBY_LIMIT)}</p>}
    </>:<p>{t.empty}</p>}
   </section>}
   {lowBattery&&<p>{t.lowBattery}</p>}
   <p className="nearby-finder-warning">{t.warnings}</p>
   <p>{t.sourceCaution}</p>
   <p>{t.privacy}</p>
  </div>
 </details>
}
