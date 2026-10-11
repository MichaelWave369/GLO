// Bilingual copy for opt-in, public-only map-pack panels.
export const MAP_PANELS={
 en:{
  sketchTitle:'Offline neighborhood streets',sketchIntro:'Save a small real OSM road/path sketch to view with pins offline. No tile download, account or location history.',
  areas:'areas',selectedCenter:'Selected map center',approx:'about',radius:'km radius',starting:'Default map starts in Stroudsburg, not at your location.',
  saving:'Saving neighborhood…',download:'Download roads & paths here',hide:'Hide saved streets',
  offline:'Offline: use saved street sketches. Downloading requires connectivity.',
  showing:'Showing',ways:'public ways',saved:'saved',ageUnknown:'age unknown',daysOld:'days old',
  noRoutes:'No route or accessibility guarantee.',sketchList:'Saved neighborhood street sketches',
  view:'View streets',delete:'Delete',sketchHeader:'Neighborhood sketch, not turn-by-turn navigation.',
  sketchCaveat:'Roads and footpaths can be missing or inaccessible; no directions, offline addresses, elevation or complete labels. Results may be truncated. Source:',
  sketchPermission:'Only an explicit download contacts Overpass. The online tile switch is separate and off by default.',
  confirmDownload:'Download a small OSM road/path sketch near',
  confirmDisclosure:'? The approximate map center and your IP address may reach an external Overpass server. No private notes or pins are sent.',
  savedSuccess:'Saved neighborhood lines on this device. They appear with online tiles off.',
  deleteConfirm:'Delete these offline street lines? Private resource pins will remain.',
  deleted:'Saved street sketch deleted.',downloadError:'Unable to download street sketch.',
  packEyebrow:'TAKE THE RESOURCE LIST WITH YOU',packHeading:'Offline Scout packs',
  packIntro:'Save a bounded snapshot of public OSM resource records after you search. Reopen it without internet or exchange the file. Private observations are never included.',
  packSaved:'saved',working:'Working…',packSave:'Save this Scout search offline',
  packImport:'Import public pack',packImportAria:'Import a GLO public resource pack',
  publicRecords:'public records',lastScanned:'Last scanned',
  selected:'Selected on this device',packUse:'Use offline',packExport:'Export file',packDelete:'Delete',
  packCap:'Original query reached its limit. Some records may be missing.',
  packEmpty:'No public region saved yet. Search and save public results, or import a trusted public pack offline.',
  packCaveatHead:'Not an offline street map.',
  packCaveat:'These are old map records, not confirmed opening hours or working services. No background refresh. Check dates and accessibility. Source:',
  packCaveatEnd:'Do not treat shared packs as verified.',
  packConfirm:'Delete this saved PUBLIC snapshot? Your private observations will remain.',
  packSavedSuccess:'Saved a public OSM snapshot on this device. NO private notes or street tiles were included.',
  packDeleted:'Public source snapshot deleted.',
  packImported:'Public OSM snapshot imported on this device. It is NOT a verified or live resource directory.',
  packTooLarge:'Public resource pack is too large.',packRejected:'Import rejected',
  packUnavailable:'Offline public storage unavailable',
  packAgeUnknown:'Snapshot date unknown',packAgeDays:'days since public map query',
  packAgeWarning:'Recheck availability before travel. Map edits do not verify operating status.'
 },
 es:{
  sketchTitle:'Calles del barrio sin conexión',sketchIntro:'Guarda un pequeño croquis real de calles y senderos de OSM para ver con tus puntos sin internet. Sin descargar mosaicos, crear cuenta ni registrar ubicaciones.',
  areas:'zonas',selectedCenter:'Centro elegido del mapa',approx:'aprox.',radius:'km de radio',starting:'El mapa comienza en Stroudsburg, no en tu ubicación.',
  saving:'Guardando el barrio…',download:'Descargar calles y senderos',hide:'Ocultar calles guardadas',
  offline:'Sin conexión: usa los croquis guardados. Para descargar se necesita conexión.',
  showing:'Mostrando',ways:'vías públicas',saved:'guardado',ageUnknown:'antigüedad desconocida',daysOld:'días de antigüedad',
  noRoutes:'No garantiza rutas ni accesibilidad.',sketchList:'Croquis guardados de barrios',
  view:'Ver calles',delete:'Borrar',sketchHeader:'Croquis del barrio, no navegación paso a paso.',
  sketchCaveat:'Pueden faltar calles y senderos o ser inaccesibles. No incluye indicaciones, direcciones completas, altitud ni todos los nombres. La consulta puede estar incompleta. Fuente:',
  sketchPermission:'Solo una descarga explícita contacta a Overpass. Las calles en línea siguen aparte y desactivadas por defecto.',
  confirmDownload:'¿Descargar un pequeño croquis público de calles cerca de',
  confirmDisclosure:'? El centro aproximado y tu IP pueden llegar al servidor externo Overpass. No se envían puntos ni observaciones privadas.',
  savedSuccess:'Calles y senderos guardados en este dispositivo. Se muestran con las calles en línea apagadas.',
  deleteConfirm:'¿Borrar estas calles guardadas? Tus puntos privados no cambiarán.',
  deleted:'Se borró el croquis de calles.',downloadError:'No se pudo descargar el croquis.',
  packEyebrow:'LLEVA LA LISTA DE RECURSOS CONTIGO',packHeading:'Paquetes de Scout sin conexión',
  packIntro:'Guarda un resumen limitado de recursos públicos de OSM después de buscar. Puedes abrirlo sin internet o compartir el archivo. No contiene observaciones privadas.',
  packSaved:'guardados',working:'Procesando…',packSave:'Guardar esta búsqueda sin conexión',
  packImport:'Importar paquete público',packImportAria:'Importar un paquete público de GLO',
  publicRecords:'registros públicos',lastScanned:'Última consulta',
  selected:'Seleccionado en este dispositivo',packUse:'Usar sin conexión',packExport:'Exportar archivo',packDelete:'Borrar',
  packCap:'La consulta original alcanzó el límite. Pueden faltar registros.',
  packEmpty:'Todavía no hay regiones guardadas. Busca y guarda los resultados o importa un paquete público sin internet.',
  packCaveatHead:'No es un mapa de calles sin conexión.',
  packCaveat:'Son registros del mapa, no horarios ni servicios en funcionamiento confirmados. No hay actualizaciones automáticas. Comprueba fechas y accesibilidad. Fuente:',
  packCaveatEnd:'No consideres verificados los paquetes compartidos.',
  packConfirm:'¿Borrar este paquete público? Tus observaciones privadas no cambiarán.',
  packSavedSuccess:'Se guardó una copia pública de OSM en este dispositivo. NO incluye notas privadas ni mapas de calles.',
  packDeleted:'Se eliminó la copia de recursos públicos.',
  packImported:'Se importó un paquete público de OSM en este dispositivo. NO es un directorio verificado ni actualizado.',
  packTooLarge:'El paquete público es demasiado grande.',packRejected:'Importación rechazada',
  packUnavailable:'Almacenamiento público sin conexión no disponible',
  packAgeUnknown:'Se desconoce la fecha de consulta',packAgeDays:'días desde la consulta pública',
  packAgeWarning:'Confirma la disponibilidad antes de viajar. Las ediciones del mapa no prueban que funcione.'
 }
};
export const mapPanelText=(lang='en')=>MAP_PANELS[lang]||MAP_PANELS.en
export function publicPackAgeLabel(pack,language='en',now=Date.now()){
 if(language!=='es')return null
 const days=Math.floor((now-Date.parse(pack?.scannedAt))/86400000)
 const t=MAP_PANELS.es
 return Number.isFinite(days)&&days>=0
   ? days+' '+t.packAgeDays+'. '+t.packAgeWarning
   : t.packAgeUnknown
}
