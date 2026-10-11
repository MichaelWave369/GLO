// GLO crew UI copy only. Provider names, OSM data and AI-generated text are never auto-translated.
export const CREW_UI={
 en:{
  eyebrow:"GOOD LOOKIN' OUT · ASSISTANCE",heading:'Your GLO crew',intro:'Four clearly defined helpers, one goal: useful information without pretending guesses are facts.',
  privateFirst:'PRIVATE-FIRST',meet:'Meet the four GLO helpers',
  roles:['Search public mapped resources','Check evidence age','Protect people and private notes','Explain the next useful step'],
  ready:'Ready for local use',lastRequested:'Last requested',neverRun:'Not run yet',due:'local pins due to recheck',
  guard:'No private reports uploaded',bro:'Local rules · works offline',
  freshness:'Freshness audit',privateDue:'local observations older than 7 days or undated, needing a human recheck',
  sourceOld:'public map records last edited over a year ago',sourceUnknown:'public map records with unknown edit age',
  scout:'SOURCE SCOUT',scoutTitle:'Check the public map',found:'found',
  scoutIntro:'Search mapped water, covered seating, charging, restrooms, food services and showers within 1.8 km. Fees, eligibility, safety, hours and live availability are not verified.',
  mapCenter:'Map center',radius:'Search radius',
  disclosureStart:'Only when you press Search, an approximate map center is sent to the public',
  disclosureEnd:'Its server may receive your IP. Private notes, device location history and GLO Bro questions are NOT included.',
  searching:'Checking public map…',search:'Search public map',clear:'Clear source results',packs:'Open offline packs',
  offline:'Offline: no live source requests. Saved public packs, private notes and GLO Bro work without internet.',
  queried:'Public map queried',water:'water',power:'USB charging',cover:'covered seating',toilets:'bathrooms',food:'food services',showers:'showers',
  moved:'The map moved after this search. Results belong to the previous center; search again for the new area.',
  incomplete:'Source reached its query limit. Results may be incomplete.',
  none:'This search returned no mapped resources. That does NOT prove none exist.',
  changeHeading:'What changed in the public map?',noBaseline:'Save a public Scout pack or search the same area again to compare.',
  previous:'Compared with public records queried',notProof:'Only OSM map details are compared, NOT whether any resource is open or working.',
  changed:'mapped details changed',edit:'OSM edit timestamps changed only',newly:'newly returned',missing:'not returned this time',
  incompleteDifference:'One of the searches reached its result limit. Counts may be incomplete.',
  changeWarning:'OSM query results are not proof of opening, closure, safety, accessibility or working service. Records may be missing because of query limits, tags or boundaries.',
  changeLabels:['Mapped details changed','Map edit dates changed only','Newly returned by search','Not returned by this search'],
  mapFields:'Map fields',displayLimit:'Showing the first 12 of',records:'records. This is a display limit.',
  noChanges:'No differences in the compared map fields. This does not confirm any real-world condition.',
  candidateAria:'Public mapped resource candidates',distance:'km from last scan center',
  queriedAt:'Last queried',unverified:'Unverified now',viewMap:'View on map',sourceLink:'OSM source ↗',
  showFewer:'Show fewer results',showMore:'Show more mapped results',display30:'Showing the 30 nearest results of',notSourceCount:'This is a display limit, not the source count.',
  guide:'YOUR LOCAL GUIDE',askBro:'Ask GLO Bro',offlineReady:'OFFLINE READY',
  guideIntro:'Tell me what you need. I will use the information already available on this device to suggest what to check next.',
  aiDisclaimer:'Always available: local, rule-based help with no server. Compatible desktop browsers may offer optional on-device AI. Most phones do not support this model.',
  askNeed:'What do you need?',askPlaceholder:'I need water and somewhere to charge my phone…',
  askAction:'Ask GLO Bro →',optionalAi:'Optional on-device AI',
  aiIntro:'Checks for a browser-built-in model. No cloud AI, account or API key. Checking availability does not download a model; enabling one may require large downloads and significant battery or storage.',
  aiCheck:'Check my browser for AI',aiChecking:'Checking availability…',aiUnsupported:'Not supported here; the offline rule-based guide still works.',
  aiUnavailable:'Model unavailable here; the offline guide still works.',aiDownloading:'Browser reports a model download in progress. Check later.',
  aiRecheck:'Recheck AI',aiReady:'On-device model ready',aiDownload:'Model download required',
  aiAsking:'Asking local AI…',aiAsk:'Ask on-device AI',aiGet:'Download model and ask',
  aiResult:'ON-DEVICE AI SUGGESTION · NOT VERIFIED',
  aiCaveat:'The language model can make mistakes. Only linked source records show what is mapped.',
  youAsked:'YOU ASKED',privateObservation:'Your private observation',osmEntry:'OpenStreetMap entry',
  mapAction:'Map ↗',rule:'The crew’s rule:',ruleText:'A mapped place is not proof that a resource is open, safe, accessible or operational. Agent actions are on demand, not autonomous background network activity.',
  qs:['I need drinking water','I need to charge a phone','I need shelter from rain','I need food'],
  qr:["Where can I find drinking water?","Where can I charge my phone battery?","Is there a covered place where I can sit out of the rain?","Where can I get food?"],
  statusUnknown:'OSM edit age unknown',statusToday:'OSM edited today',statusDays:'OSM last edited',
  day:'day',days:'days',ago:'ago',never:'Never',unknown:'Unknown',
  downloadConfirm:'The browser may download a large on-device AI model and use considerable storage and battery. Continue?'
 },
 es:{
  eyebrow:'GOOD LOOKIN’ OUT · AYUDA',heading:'Tu equipo GLO',intro:'Cuatro asistentes con tareas claras: información útil, sin presentar suposiciones como hechos.',
  privateFirst:'PRIVACIDAD PRIMERO',meet:'Conoce a los cuatro asistentes de GLO',
  roles:['Buscar recursos en mapas públicos','Comprobar antigüedad de datos','Proteger personas y notas privadas','Explicar el siguiente paso útil'],
  ready:'Listo para uso local',lastRequested:'Última consulta',neverRun:'Todavía no se ha usado',due:'puntos locales por revisar',
  guard:'No se han subido observaciones privadas',bro:'Reglas locales · funciona sin conexión',
  freshness:'Revisión de vigencia',privateDue:'observaciones locales de más de 7 días o sin fecha; requieren una nueva comprobación',
  sourceOld:'registros públicos modificados hace más de un año',sourceUnknown:'registros públicos sin fecha de edición conocida',
  scout:'SCOUT DE FUENTES',scoutTitle:'Consultar el mapa público',found:'encontrados',
  scoutIntro:'Busca agua, asientos cubiertos, carga de teléfonos, baños, comida y duchas en un radio de 1,8 km. No se verifican costos, requisitos, seguridad, horarios ni disponibilidad actual.',
  mapCenter:'Centro del mapa',radius:'Radio de búsqueda',
  disclosureStart:'Solo al pulsar Buscar se envía una ubicación aproximada del centro al servicio público',
  disclosureEnd:'Sus servidores pueden recibir tu IP. No se incluyen notas privadas, historial de ubicación ni preguntas a GLO Bro.',
  searching:'Consultando mapa público…',search:'Buscar en mapa público',clear:'Borrar resultados',packs:'Abrir paquetes sin conexión',
  offline:'Sin conexión: no hay consultas en vivo. Los paquetes guardados, las notas privadas y GLO Bro siguen funcionando.',
  queried:'Mapa consultado',water:'agua',power:'carga USB',cover:'asientos cubiertos',toilets:'baños',food:'comidas',showers:'duchas',
  moved:'El mapa se movió después de esta búsqueda. Los resultados son del centro anterior; busca de nuevo.',
  incomplete:'La consulta alcanzó el límite de resultados. Puede haber datos incompletos.',
  none:'Esta búsqueda no encontró recursos cartografiados. Eso NO demuestra que no existan.',
  changeHeading:'¿Qué cambió en el mapa público?',noBaseline:'Guarda un paquete de Scout o busca otra vez en la misma zona para comparar.',
  previous:'Comparación con registros consultados',notProof:'Solo se comparan datos de OSM; NO se verifica si funcionan o están abiertos.',
  changed:'detalles del mapa cambiados',edit:'fechas de edición cambiadas',newly:'recién devueltos',missing:'no devueltos esta vez',
  incompleteDifference:'Una consulta alcanzó el límite de resultados. Los recuentos pueden estar incompletos.',
  changeWarning:'Las consultas de OSM no prueban apertura, cierre, seguridad, accesibilidad ni funcionamiento. Un registro puede faltar por límites, etiquetas o cambios del área.',
  changeLabels:['Detalles del mapa cambiados','Solo cambió la fecha de edición','Aparecieron en esta búsqueda','No aparecieron en esta búsqueda'],
  mapFields:'Campos del mapa',displayLimit:'Se muestran los primeros 12 de',records:'registros. Es un límite de visualización.',
  noChanges:'No hay diferencias en estos campos de OSM. Esto no confirma las condiciones reales.',
  candidateAria:'Recursos cartografiados de fuentes públicas',distance:'km del centro de la última consulta',
  queriedAt:'Última consulta',unverified:'Sin verificar ahora',viewMap:'Ver en mapa',sourceLink:'Fuente OSM ↗',
  showFewer:'Mostrar menos resultados',showMore:'Mostrar más resultados',display30:'Se muestran los 30 resultados más cercanos de',notSourceCount:'Es un límite visual, no el total de la fuente.',
  guide:'GUÍA LOCAL',askBro:'Preguntar a GLO Bro',offlineReady:'LISTO SIN CONEXIÓN',
  guideIntro:'Cuéntame qué necesitas. Usaré solo los datos disponibles en este dispositivo para sugerir qué comprobar.',
  aiDisclaimer:'Siempre disponible: ayuda local basada en reglas, sin servidor. Algunos navegadores de escritorio admiten IA opcional en el dispositivo; la mayoría de los teléfonos todavía no.',
  askNeed:'¿Qué necesitas?',askPlaceholder:'Necesito agua y un lugar para cargar el teléfono…',
  askAction:'Preguntar a GLO Bro →',optionalAi:'IA opcional en el dispositivo',
  aiIntro:'Comprueba si el navegador incluye un modelo. Sin IA en la nube, cuenta ni clave API. Comprobar disponibilidad no descarga nada; habilitarlo podría consumir batería, almacenamiento y datos.',
  aiCheck:'Comprobar IA en mi navegador',aiChecking:'Comprobando disponibilidad…',aiUnsupported:'No compatible aquí; la guía local sigue funcionando.',
  aiUnavailable:'Modelo no disponible; la guía local sigue funcionando.',aiDownloading:'El navegador informa que descarga un modelo. Revisa después.',
  aiRecheck:'Volver a comprobar IA',aiReady:'Modelo local listo',aiDownload:'Se requiere descargar el modelo',
  aiAsking:'Preguntando a la IA local…',aiAsk:'Preguntar a la IA local',aiGet:'Descargar modelo y preguntar',
  aiResult:'SUGERENCIA DE IA LOCAL · SIN VERIFICAR',
  aiCaveat:'Los modelos pueden equivocarse. Solo los registros de las fuentes enlazadas muestran qué aparece en el mapa.',
  youAsked:'PREGUNTASTE',privateObservation:'Tu observación privada',osmEntry:'Registro de OpenStreetMap',
  mapAction:'Mapa ↗',rule:'Regla del equipo:',ruleText:'Un punto cartografiado no demuestra que esté abierto, sea seguro, accesible o funcione. Los agentes actúan a pedido, no hacen consultas autónomas.',
  qs:['Necesito agua potable','Necesito cargar el teléfono','Necesito refugiarme de la lluvia','Necesito comida'],
  qr:['¿Dónde puedo encontrar agua potable?','¿Dónde puedo cargar mi teléfono?','¿Hay un lugar cubierto donde pueda refugiarme de la lluvia?','¿Dónde puedo conseguir comida?'],
  statusUnknown:'Fecha de edición de OSM desconocida',statusToday:'OSM editado hoy',statusDays:'Última edición de OSM hace',
  day:'día',days:'días',ago:'',never:'Nunca',unknown:'Desconocido',
  downloadConfirm:'El navegador podría descargar un modelo de IA grande, con mucho consumo de batería y espacio. ¿Continuar?'
 }
}
export const crewCopy=(language='en')=>CREW_UI[language]||CREW_UI.en
export function osmEditLabel(item,language='en',now=Date.now()){
 const c=crewCopy(language)
 const date=Date.parse(item?.lastMappedAt)
 if(!Number.isFinite(date)||date>now+86400000)return c.statusUnknown
 const days=Math.max(0,Math.floor((now-date)/86400000))
 if(days===0)return c.statusToday
 return language==='es' ? c.statusDays+' '+days+' '+(days===1?c.day:c.days)
   : c.statusDays+' '+days+' '+(days===1?c.day:c.days)+' '+c.ago
}
export const formatCrewDate=(value,language='en')=>{
 if(!value)return crewCopy(language).never
 const dt=new Date(value)
 return Number.isFinite(dt.getTime())?dt.toLocaleString(language==='es'?'es-US':'en-US'):crewCopy(language).unknown
}
