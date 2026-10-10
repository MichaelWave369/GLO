// A small offline checklist inspired by KindBridge369's Pocket Plan.
// No network, saved account, precise location, or report notes are needed.
export const POCKET_TOPICS = Object.freeze(['food','water','power','restroom','shelter','pet_support','other'])

export const POCKET_COPY = Object.freeze({
  en: {
    title:'GLO Pocket Plan',help:'One next step, something to ask, and what to check. This is a private draft, not a confirmed appointment.',
    topic:'What do you need?',contact:'Place or organization to contact (optional)',step:'Your next step (optional)',
    include:'Include the selected resource name in my plan',nothing:'Select a pin from the list or map to include its name. We never include exact coordinates or private notes.',
    copy:'Copy my plan',print:'Print my plan',clear:'Clear my draft',copied:'Plan copied. Anything copied or printed may remain outside GLO.',
    blocked:'Clipboard unavailable. Select and copy the plan text below.',
    private:'This draft stays in this page only. It is not auto-saved, uploaded, or shared. Close or clear it to discard. Clipboard and printed copies are outside panic clear.',
    date:'Made',purpose:'Need',first:'First step',gather:'Before leaving',ask:'Plain words to ask',verify:'Check before travel',
    chosen:'Resource to ask about (not verified)',category:'Source',userStep:'My next step',sourceLocal:'Personal device note; not independently checked',sourceOsm:'OpenStreetMap map record; not confirmed open',
    defaultCaution:'Confirm current hours, fees, eligibility, accessibility and availability directly. An old map record or note is not proof that a place is open.',
    topics:{
      food:{label:'Food or a meal',first:'Contact a local food pantry or meal program. In the U.S., 211 may offer referrals.',gather:'Ask whether ID, an appointment, a bag or proof of address is needed. Do not assume these are required.',ask:'Hi, do you offer food help today? Are you open, is there a cost, and what should I bring?'},
      water:{label:'Drinking water',first:'Check a mapped drinking-water source or ask an open public facility about drinking-water access.',gather:'Bring a clean bottle if you have one.',ask:'Is drinking water available for free today, and is it safe to drink?'},
      power:{label:'Phone charging',first:'Ask a public facility whether you can charge a phone.',gather:'Take your charger and cable if you have them.',ask:'Is there a working outlet or USB charger I may use without a purchase?'},
      restroom:{label:'Bathroom',first:'Find a mapped public restroom or ask a public facility about access.',gather:'Check access requirements and opening hours before traveling.',ask:'Is a restroom open to the public right now? Is it free and step-free?'},
      shelter:{label:'Shelter or weather protection',first:'For overnight needs, contact an official shelter program or U.S. 211. For immediate weather protection, ask an open public facility.',gather:'Ask about hours, ID rules, accessibility, family and pet policies. Do not publish anyone’s personal sleeping location.',ask:'Are you accepting people today? Are there requirements, and is there a safe alternative if full?'},
      pet_support:{label:'Help with a pet',first:'Contact a local humane society or community assistance program for pet-related resources.',gather:'Ask whether animals are allowed, vaccination records are needed, and any fees apply.',ask:'Do you offer support for people with pets? Are there places we can go together?'},
      other:{label:'Another essential need',first:'Contact a local support organization. In the U.S., 211 may help identify an appropriate service.',gather:'Write down what you need and ask what documents are actually required.',ask:'I need help finding a local service. Are you the right place to call? If not, whom should I contact?'}
    }
  },
  es: {
    title:'Plan de bolsillo GLO',help:'Un próximo paso, qué preguntar y qué comprobar. Es un borrador privado, no una cita confirmada.',
    topic:'¿Qué necesitas?',contact:'Lugar u organización que contactarás (opcional)',step:'Tu próximo paso (opcional)',
    include:'Incluir el nombre del recurso seleccionado',nothing:'Selecciona un punto en la lista o en el mapa. Nunca incluimos coordenadas exactas ni notas privadas.',
    copy:'Copiar mi plan',print:'Imprimir mi plan',clear:'Borrar mi borrador',copied:'Plan copiado. El portapapeles o las copias impresas pueden quedar fuera de GLO.',
    blocked:'Portapapeles no disponible. Selecciona y copia el texto de abajo.',
    private:'Este borrador permanece solo en esta página. No se guarda ni se comparte automáticamente. Ciérralo o bórralo para descartarlo. Las copias quedan fuera del borrado de emergencia.',
    date:'Creado',purpose:'Necesidad',first:'Primer paso',gather:'Antes de salir',ask:'Qué preguntar',verify:'Confirma antes de viajar',
    chosen:'Recurso para consultar (sin verificar)',category:'Fuente',userStep:'Mi próximo paso',sourceLocal:'Nota personal en este dispositivo; sin comprobar',sourceOsm:'Registro de OpenStreetMap; no se confirma que esté abierto',
    defaultCaution:'Confirma horario, costo, requisitos, accesibilidad y disponibilidad directamente. Una nota o un registro antiguo no demuestra que esté abierto.',
    topics:{
      food:{label:'Comida',first:'Contacta a un banco de alimentos o comedor. En EE. UU., 211 puede dar referencias.',gather:'Pregunta si piden identificación, cita, bolsa o comprobante. No des por hecho que se necesitan.',ask:'Hola, ¿ofrecen ayuda con comida hoy? ¿Están abiertos, tiene costo y qué debo llevar?'},
      water:{label:'Agua potable',first:'Consulta una fuente de agua potable o pregunta en un lugar público abierto.',gather:'Lleva una botella limpia si tienes.',ask:'¿Hay agua potable gratuita hoy? ¿Es segura para beber?'},
      power:{label:'Cargar el teléfono',first:'Pregunta en un lugar público si puedes cargar tu teléfono.',gather:'Lleva cargador y cable si tienes.',ask:'¿Hay un enchufe o cargador USB que funcione sin comprar algo?'},
      restroom:{label:'Baño',first:'Busca un baño público o consulta en un lugar abierto.',gather:'Confirma horario y requisitos antes de ir.',ask:'¿Hay un baño público abierto ahora? ¿Es gratuito y sin escalones?'},
      shelter:{label:'Refugio o protección del clima',first:'Para pasar la noche, contacta un refugio oficial o llama al 211 en EE. UU.',gather:'Pregunta por horario, identificación, accesibilidad, familias y mascotas. No publiques sitios donde duerme alguien.',ask:'¿Aceptan personas hoy? ¿Qué requisitos hay y a dónde puedo ir si está lleno?'},
      pet_support:{label:'Ayuda para mascotas',first:'Contacta a un refugio de animales o programa comunitario.',gather:'Pregunta por normas para mascotas, vacunas y costos.',ask:'¿Ofrecen ayuda para personas con mascotas? ¿Hay lugares donde podamos ir juntos?'},
      other:{label:'Otra necesidad',first:'Consulta una organización local. En EE. UU., 211 puede orientar.',gather:'Anota lo que necesitas y pregunta qué documentos realmente hacen falta.',ask:'Necesito encontrar un servicio local. ¿Pueden ayudarme o recomendar otra organización?'}
    }
  }
})

function text(value,max=110) {
  return String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/[<>]/g,'').trim().slice(0,max)
}

export function buildPocketPlan({topic='food',contact='',step='',includeResource=false,resource=null}={},lang='en',now=new Date()) {
  const ui=POCKET_COPY[lang]
  if(!ui||!POCKET_TOPICS.includes(topic))throw new Error('Unsupported Pocket Plan topic or language.')
  if(!Number.isFinite(now.getTime()))throw new Error('Invalid date.')
  const tpl=ui.topics[topic]
  const lines=[
    ui.title, ui.date+': '+now.toLocaleDateString(lang==='es'?'es-US':'en-US',{timeZone:'UTC'}),
    ui.purpose+': '+tpl.label,
    ui.first+': '+tpl.first,
    ui.gather+': '+tpl.gather,
    ui.ask+': "'+tpl.ask+'"'
  ]
  const contactName=text(contact)
  if(contactName)lines.push(ui.contact+': '+contactName)
  const chosenName=includeResource?text(resource?.title,90):''
  if(chosenName&&['private','osm'].includes(resource?.from)){
    lines.push(ui.chosen+': '+chosenName)
    lines.push(ui.category+': '+(resource.from==='private'?ui.sourceLocal:ui.sourceOsm))
  }
  const action=text(step,180)
  if(action)lines.push(ui.userStep+': '+action)
  lines.push(ui.verify+': '+ui.defaultCaution)
  return lines.join('\n\n')
}
