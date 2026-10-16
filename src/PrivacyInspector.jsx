import {useEffect,useState} from 'react'
import {readLocalPrivacyCounts} from './storage.js'
import {privacySurfaceStates,PRIVACY_STORE_KEYS,validPrivacyCounts} from './privacyInspectorModel.js'
import './privacyInspector.css'

const COPY={
 en:{
  title:'Your GLO privacy inspector',close:'Close inspector',intro:'A read-only snapshot of this browser’s GLO data and a map of known external connections. No location prompt, internet test, upload or deletion happens here.',
  caution:'This is NOT a security audit or a log of everything that contacted the network. It cannot prove anonymity or no outside records.',
  local:'Saved in this browser',localHelp:'Counts only. No titles, coordinates, notes or private IDs are shown. Recheck histories live inside each private pin, not in a fifth store.',
  stores:{privatePins:['Private pins','Exact coordinates and self-reported observations/rechecks'],
   privateResearchNotes:['Private research notes','Manually reviewed, always unverified'],
   publicScoutPacks:['Saved Scout resource packs','Public OSM records and geographic areas'],
   savedStreetSketches:['Saved neighborhood sketches','OSM roads, paths and waterways']},
  inspect:'Read local counts again',loading:'Reading GLO’s own database locally…',
  noRead:'Could not read local GLO counts. This does not imply the device contains no saved data.',
  refreshed:'Counts refreshed on this device. No network request was made by this inspection.',
  actions:'Known network and outbound interfaces',
  actionsHelp:'These are documented possibilities and current UI conditions, not evidence that a request happened. Browser connection status is only a hint.',
  surfaces:{
   site:['Website hosting','Opening GLO online can contact GitHub Pages; hosting/network providers may keep logs.'],
   updates:['PWA update checks','When online and visible, GLO’s service worker may check its own origin for updates, without pin contents.'],
   tiles:['Online map tiles','Optional OSM raster tiles reveal map regions to the tile provider when this layer is displayed.'],
   scout:['Search public map','Explicit search uses Overpass with a rounded region center. No private pin records are included.'],
   streets:['Download roads & paths','Explicit download uses Overpass for bounded neighborhood geometry with a rounded center.'],
   gps:['Device location','Only requested on a location button tap. OS/browser location providers may be involved.'],
   ai:['Optional on-device AI','GLO Bro’s rules work offline. Starting optional browser AI may download a model after consent.'],
   links:['External source links','Opening OSM/citation/source links contacts external sites under their own policies.'],
   sharing:['Shares and exported files','Copying, sharing, printing and downloads are user-controlled; recipients, OS and other apps may keep copies.']
  },
  states:{
   hosting:'On initial online load',
   'possible-automatic':'May happen automatically when online',
   'layer-mounted':'Map tile layer mounted in this view',
   'layer-not-mounted':'Map tile layer not mounted',
   'user-action':'Only after an explicit action',
   'permission-on-tap':'Requests location only on tap',
   'optional-model-download':'Optional, after consent',
   'external-navigation':'Only when opening a link',
   'user-controlled-handoff':'Only when you choose to share'
  },
  limits:'Outside GLO’s view',
  limitsInfo:'This panel cannot inspect provider/server logs, other apps, browser/OS location activity, downloaded backups, previous QR/clipboard copies, browser caches, or all network requests. Panic clear erases the four GLO-owned IndexedDB stores, not external copies or histories.',
  offline:'Works offline, including low-battery mode. Refresh does not contact outside servers.'
 },
 es:{
  title:'Inspector de privacidad de GLO',close:'Cerrar inspector',intro:'Consulta de solo lectura de los datos de GLO en este navegador y las conexiones externas conocidas. Aquí no se solicita ubicación, no se prueba internet, no se sube ni se borra nada.',
  caution:'NO es una auditoría de seguridad ni un historial de todas las conexiones. No demuestra anonimato ni ausencia de registros externos.',
  local:'Guardado en este navegador',localHelp:'Solo cantidades. No muestra nombres, coordenadas, notas ni IDs. El historial de revisiones está dentro de cada punto privado, no en un quinto almacén.',
  stores:{privatePins:['Puntos privados','Coordenadas exactas y observaciones/revisiones personales'],
   privateResearchNotes:['Notas privadas de investigación','Revisadas por una persona, siempre sin verificar'],
   publicScoutPacks:['Paquetes guardados de Scout','Registros públicos de OSM y zonas geográficas'],
   savedStreetSketches:['Croquis guardados del barrio','Calles, senderos y vías de agua de OSM']},
  inspect:'Volver a leer las cantidades',loading:'Leyendo la base local de GLO…',
  noRead:'No se pudieron leer las cantidades. Esto NO significa que no haya datos guardados.',
  refreshed:'Cantidades actualizadas en este dispositivo. La inspección no hizo solicitudes de red.',
  actions:'Conexiones y salidas conocidas',
  actionsHelp:'Son posibilidades documentadas y condiciones actuales de la interfaz, NO evidencia de que hubo una conexión. El estado del navegador solo da una pista.',
  surfaces:{
   site:['Alojamiento del sitio','Abrir GLO en línea puede conectar con GitHub Pages; proveedores pueden guardar registros.'],
   updates:['Actualizaciones PWA','En línea y visible, el servicio puede buscar actualizaciones en su propio sitio sin enviar el contenido de los puntos.'],
   tiles:['Mapas en línea','Las imágenes de OSM opcionales pueden revelar zonas del mapa al proveedor cuando se muestran.'],
   scout:['Buscar recursos públicos','Una búsqueda explícita usa Overpass con el centro redondeado. No envía puntos privados.'],
   streets:['Descargar calles y senderos','Una descarga explícita usa Overpass para geometría local y centro redondeado.'],
   gps:['Ubicación del dispositivo','Solo se solicita al tocar un botón. El sistema o navegador puede consultar proveedores externos.'],
   ai:['IA opcional en el dispositivo','Las reglas de GLO Bro funcionan sin internet. La IA del navegador puede descargar un modelo tras el consentimiento.'],
   links:['Enlaces externos','Abrir enlaces de OSM o fuentes contacta sitios externos con sus propias políticas.'],
   sharing:['Compartir y exportar','Copiar, compartir, imprimir y descargar depende de ti; otros sistemas pueden guardar copias.']
  },
  states:{
   hosting:'Al abrir el sitio en línea',
   'possible-automatic':'Puede suceder automáticamente en línea',
   'layer-mounted':'La capa de mapas está montada',
   'layer-not-mounted':'La capa de mapas no está montada',
   'user-action':'Solo con una acción explícita',
   'permission-on-tap':'Pide ubicación solo al tocar',
   'optional-model-download':'Opcional, con consentimiento',
   'external-navigation':'Solo al abrir un enlace',
   'user-controlled-handoff':'Solo cuando decides compartir'
  },
  limits:'Fuera de la vista de GLO',
  limitsInfo:'No puede inspeccionar registros de proveedores, otras aplicaciones, actividad de ubicación del sistema, archivos descargados, copias anteriores por QR/portapapeles, cachés ni todas las conexiones de red. El borrado de emergencia elimina los cuatro almacenes IndexedDB de GLO, no las copias externas.',
  offline:'Funciona sin conexión y con batería baja. Actualizar las cantidades no contacta servidores externos.'
 }
}

export default function PrivacyInspector({language='en',onlineHint=false,tilesEnabled=false,lowBattery=false,onClose}){
 const t=COPY[language]||COPY.en
 const [counts,setCounts]=useState(null)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [message,setMessage]=useState('')
 const [revision,setRevision]=useState(0)

 useEffect(()=>{
  let active=true
  setLoading(true);setError('');setMessage('')
  readLocalPrivacyCounts().then(data=>{
   if(!active)return
   if(!validPrivacyCounts(data))throw new Error('Invalid local counts.')
   setCounts(data);setLoading(false)
   if(revision>0)setMessage(t.refreshed)
  }).catch(e=>{
   if(active){setError(e.message||t.noRead);setCounts(null);setLoading(false)}
  })
  return()=>{active=false}
 },[revision])
 const surfaces=privacySurfaceStates({onlineHint,tilesEnabled,lowBattery})
 return <section className="privacy-inspector" aria-label={t.title}>
  <div className="privacy-inspector-head"><strong>{t.title}</strong><button type="button" className="secondary compact" onClick={onClose}>{t.close}</button></div>
  <p>{t.intro}</p>
  <p className="privacy-inspector-warning">{t.caution}</p>
  <h4>{t.local}</h4>
  <p>{t.localHelp}</p>
  {counts&&<dl className="privacy-inspector-counts">
   {PRIVACY_STORE_KEYS.map(key=><div key={key}><dt>{t.stores[key][0]}</dt><dd>{counts[key]}</dd><small>{t.stores[key][1]}</small></div>)}
  </dl>}
  {loading&&<p role="status">{t.loading}</p>}
  {error&&<p role="alert" className="privacy-inspector-error">{t.noRead} ({error})</p>}
  <button type="button" className="secondary" disabled={loading} onClick={()=>setRevision(x=>x+1)}>{t.inspect}</button>
  {message&&<p role="status" className="privacy-inspector-message">{message}</p>}
  <h4>{t.actions}</h4>
  <p>{t.actionsHelp}</p>
  <div className="privacy-inspector-surfaces">
   {surfaces.map(row=><div key={row.id} className="privacy-inspector-surface">
     <strong>{t.surfaces[row.id][0]}</strong>
     <small>{t.states[row.state]}</small>
     <p>{t.surfaces[row.id][1]}</p>
   </div>)}
  </div>
  <h4>{t.limits}</h4>
  <p>{t.limitsInfo}</p>
  <p className="privacy-inspector-message">{t.offline}</p>
 </section>
}
