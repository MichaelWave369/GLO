// UI-only translations. Never translate user-entered notes or claim OSM services are verified.
export const CATEGORY_ES=Object.freeze({
 water:'Agua',power:'Carga',shelter:'Asientos cubiertos',restroom:'Baños',
 food:'Comidas gratis / bancos de alimentos',shower:'Duchas',laundry:'Lavandería',
 warming:'Centros para el frío',cooling:'Centros para el calor',
 wifi:'Wi-Fi gratis',sharps:'Contenedores de agujas',pet_support:'Ayuda para mascotas',
 overnight:'Refugio nocturno oficial'
})
export const categoryLabel=(category,language,categories)=>{
 const english=categories[category]?.label||category
 return language==='es'?(CATEGORY_ES[category]||english):english
}
export function connectionDisplay(isOnline,language='en'){
 // navigator.onLine is a browser hint, NOT proof that the internet works.
 if(!isOnline)return language==='es'?'Sin conexión (según el navegador)':'Offline (browser reports)'
 return language==='es'?'Conexión sin comprobar':'Connection not checked'
}
export const UI=Object.freeze({
 en:{
  welcome:'No account needed. Your observations stay on this device.',
  downloadRequested:'Download requested. Check Downloads and protect or delete the file yourself.',
  localFirst:'LOCAL FIRST', explorer:'RESOURCE EXPLORER',all:'All',
  distance:'km from map search center',map:'Explore the map',
  start:'Starting view: Stroudsburg, PA (not your detected position)',
  center:'Center on me',tiles:'Online street tiles',mapPrivacy:'Map privacy:',
  mapPrivacyText:'Online street tiles remain OFF by default. You can save an offline OSM neighborhood sketch below. Mapped streets and paths do not provide complete offline navigation or current accessibility.',
  mapNoBase:'NO STREET BASEMAP · LOCAL MARKERS ONLY',mapTap:'Tap map to choose pin location',
  mappedWay:'Unnamed mapped way',path:'road/path',waterway:'waterway',
  wayCaution:'Not verified safe or currently accessible.',osmRecord:'OpenStreetMap record · Not verified',
  osmView:'View OSM record',selfReported:'Self-reported · Unverified',privateDevice:'Private to this device',
  sharedArea:'Approximate area only · NOT an entrance · Unverified',sharedPoint:'Exact peer-shared location · Unverified',
  mapPrivacyArea:'GLO resource map',filterAria:'Filter by resource type',
  formDevice:'PRIVATE · DEVICE ONLY',cancelEditing:'Cancel editing',
  titleExample:'e.g. a public refill fountain',notesExample:'Avoid names, identities and sensitive details.',
  addLink:'Add a pin →',deleted:'Delete ',
  savedMap:'Offline streets, paths and waterways selected. No directions or live conditions.',
  restoredMap:'Restored',selectedMap:'Selected',
  principlesNo:'No accounts',principlesNoInfo:'Use GLO Pin without creating a profile.',
  principlesLocal:'Local first',principlesLocalInfo:'Saved reports stay on-device; optional peer links only expose approved fields.',
  principlesEvidence:'Evidence over guesses',principlesEvidenceInfo:'Reports are self-reported, never certified safe.',
  repo:'Open-source repository',footer:'Prototype · Not an emergency service · No community sync',
  storageError:'Storage error',storageCaution:'Your observations may not be saved.',
  offlinePackRestore:'Restored',offlinePackLoad:'Loaded',offlinePackLabel:'offline public Scout pack',offlinePackRecords:'records',
  offlinePackQueried:'Last queried',offlinePackRemoved:'Removed offline public resource pack.'
 },
 es:{
  welcome:'No necesitas cuenta. Tus observaciones permanecen en este dispositivo.',
  downloadRequested:'Se solicitó la descarga. Revisa Descargas y protege o borra el archivo por tu cuenta.',
  localFirst:'PRIMERO LO LOCAL',explorer:'EXPLORADOR DE RECURSOS',all:'Todos',
  distance:'km del centro de búsqueda del mapa',map:'Explorar el mapa',
  start:'Vista inicial: Stroudsburg, PA (no es tu ubicación detectada)',
  center:'Centrar en mí',tiles:'Calles en línea',mapPrivacy:'Privacidad del mapa:',
  mapPrivacyText:'Las calles en línea están DESACTIVADAS por defecto. Puedes guardar un croquis de OpenStreetMap sin conexión. Los caminos mostrados no permiten navegación completa ni confirman accesibilidad actual.',
  mapNoBase:'SIN MAPA BASE · SOLO PUNTOS LOCALES',mapTap:'Toca el mapa para elegir la ubicación del punto',
  mappedWay:'Vía sin nombre',path:'calle/sendero',waterway:'curso de agua',
  wayCaution:'No se ha verificado si es seguro o accesible ahora.',osmRecord:'Registro de OpenStreetMap · Sin verificar',
  osmView:'Ver registro de OSM',selfReported:'Observación personal · Sin verificar',privateDevice:'Privado en este dispositivo',
  sharedArea:'Zona aproximada · NO es una entrada · Sin verificar',sharedPoint:'Ubicación exacta compartida · Sin verificar',
  mapPrivacyArea:'Mapa de recursos de GLO',filterAria:'Filtrar por tipo de recurso',
  formDevice:'PRIVADO · SOLO EN ESTE DISPOSITIVO',cancelEditing:'Cancelar edición',
  titleExample:'Ej.: fuente pública de agua',notesExample:'Evita nombres, identidades y detalles sensibles.',
  addLink:'Agregar un punto →',deleted:'Eliminar ',
  savedMap:'Calles, senderos y cursos de agua sin conexión seleccionados. Sin indicaciones ni condiciones actuales.',
  restoredMap:'Restaurados',selectedMap:'Seleccionados',
  principlesNo:'Sin cuentas',principlesNoInfo:'Usa GLO Pin sin crear un perfil.',
  principlesLocal:'Primero lo local',principlesLocalInfo:'Las observaciones se guardan aquí; los enlaces solo muestran datos aprobados.',
  principlesEvidence:'Pruebas antes que suposiciones',principlesEvidenceInfo:'Las observaciones son personales; nadie certifica que el lugar sea seguro.',
  repo:'Repositorio de código abierto',footer:'Prototipo · No es un servicio de emergencias · Sin sincronización comunitaria',
  storageError:'Error de almacenamiento',storageCaution:'Puede que tus observaciones no se hayan guardado.',
  offlinePackRestore:'Restaurado',offlinePackLoad:'Cargado',offlinePackLabel:'paquete público de Scout sin conexión',offlinePackRecords:'registros',
  offlinePackQueried:'Última consulta',offlinePackRemoved:'Se eliminó el paquete público sin conexión.'
 }
})
export const helper=(key,lang='en')=>UI[lang]?.[key]??UI.en[key]??key

// Translate only app-authored status phrases, never user content.
export const translateScoutChange=(field,lang)=>lang==='es'?({
 'mapped name':'nombre cartografiado','resource category':'categoría del recurso',
 'mapped opening-hours text':'horario indicado en el mapa',
 'mapped position':'posición cartografiada'
}[field]||field):field
