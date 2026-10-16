import {useEffect,useState} from 'react'
import {CATEGORIES, validCoordinates} from './domain.js'
import {categoryLabel} from './locale.js'
import {makeResearchPacket,researchMessage,createResearchAnnotation} from './agentHandoff.js'
import {listResearchAnnotations,saveResearchAnnotation,removeResearchAnnotation} from './storage.js'
import './researchSpot.css'

const COPY={
 en:{
  heading:'Research this spot',intro:'Prepare one question for an AI you choose. GLO works without AI. No account, background location feed, automatic transfer or app access key is created.',
  chosen:'Selected resource location (not necessarily your position)',manual:'Enter coordinates or request your device location. Stroudsburg is never silently used.',
  gps:'Use my location once',gpsRequest:'Requesting location permission…',gpsSuccess:'Location filled for this review only. Not saved or transmitted by GLO.',gpsFailed:'Location denied or unavailable; enter coordinates yourself.',
  category:'Resource type (optional)',none:'No category',question:'Question for the research assistant',questionHint:'Example: Which official resources are available near this area? Include sources and dates.',
  precision:'Location precision',area:'Approximate area, 2 decimals (default)',exact:'Exact point, 6 decimals (sensitive)',
  areaInfo:'Rounded coordinates identify a broad area, NOT a trail entrance, legal campsite, or the exact resource.',
  exactInfo:'Exact coordinates may expose a personal location. Do not share campsites, where people sleep or other private places.',
  review:'What leaves your device',safe:'The packet contains only your question, approved coordinates, and optionally a resource category. It omits private pin IDs, titles, notes, recheck histories, and location history.',
  ack:'I reviewed the location, precision and question. I understand copying can expose this information to other apps or services.',
  copy:'Copy for an AI',copied:'Research request copied. Choose where to paste it. GLO did not upload anything.',
  copyFail:'Clipboard unavailable. You can select and copy the text below manually.',
  preview:'Copyable text',close:'Close and discard question',invalid:'Enter valid coordinates and a question before sharing.',
  researchTitle:'Add research findings to this private pin',researchIntro:'Paste or summarize findings yourself. They stay on this device, are marked UNVERIFIED and never alter observations or recheck history. No AI receives write access.',
  noteTitle:'Short finding title',noteDetails:'What did the source or assistant say?',source:'Source link (optional, HTTPS only)',
  noteAck:'Save my reviewed note locally',noteSaved:'Unverified research note saved only on this device.',
  noteError:'Could not save research note.',noteEmpty:'No research notes attached yet.',
  noPin:'To save findings, open Research from a private pin. You can still copy a question without creating a pin.',
  researchWarning:'Important: Research annotations are stored separately and are NOT included in GLO’s existing v1 private backup. Copy anything important separately until research backup support is added.',
  human:'Manually saved research · UNVERIFIED · NOT a field recheck',delete:'Remove note',deleteConfirm:'Delete this research annotation from this device?',
  notVerified:'An AI answer or public property listing does not prove a service is working, a route is safe, or access is permitted.',
  busy:'Saving…',link:'Open source ↗'
 },
 es:{
  heading:'Investigar este lugar',intro:'Prepara una pregunta para la IA que elijas. GLO funciona sin IA. No se crea cuenta, seguimiento de ubicación, transferencia automática ni clave de acceso.',
  chosen:'Ubicación del recurso elegido (no necesariamente tu posición)',manual:'Escribe las coordenadas o solicita tu ubicación. Stroudsburg nunca se usa automáticamente.',
  gps:'Usar mi ubicación una vez',gpsRequest:'Solicitando permiso de ubicación…',gpsSuccess:'Ubicación agregada solo para revisión. GLO no la guarda ni la transmite.',gpsFailed:'Ubicación denegada o no disponible; escribe las coordenadas.',
  category:'Tipo de recurso (opcional)',none:'Sin categoría',question:'Pregunta para el asistente de investigación',questionHint:'Ej.: ¿Qué recursos oficiales hay cerca? Incluye fuentes y fechas.',
  precision:'Precisión de la ubicación',area:'Zona aproximada, 2 decimales (predeterminado)',exact:'Punto exacto, 6 decimales (sensible)',
  areaInfo:'Las coordenadas redondeadas identifican una zona amplia; NO señalan una entrada, lugar legal para acampar ni el recurso exacto.',
  exactInfo:'Las coordenadas exactas pueden revelar una ubicación personal. No compartas campamentos, lugares donde duerme gente u otros espacios privados.',
  review:'Qué sale de tu dispositivo',safe:'El paquete contiene solo la pregunta, coordenadas aprobadas y, opcionalmente, categoría. No incluye IDs, títulos, notas, revisiones ni historial de ubicaciones.',
  ack:'Revisé la ubicación, precisión y pregunta. Entiendo que copiar podría revelar estos datos a otras aplicaciones.',
  copy:'Copiar para una IA',copied:'Pregunta copiada. Tú decides dónde pegarla. GLO no subió nada.',
  copyFail:'Portapapeles no disponible. Puedes seleccionar y copiar el texto de abajo.',
  preview:'Texto para copiar',close:'Cerrar y descartar pregunta',invalid:'Escribe coordenadas válidas y una pregunta antes de compartir.',
  researchTitle:'Agregar hallazgos a este punto privado',researchIntro:'Pega o resume los hallazgos tú mismo. Se guardan aquí, SIN VERIFICAR, sin alterar las observaciones ni revisiones. Ninguna IA puede escribir directamente.',
  noteTitle:'Título breve del hallazgo',noteDetails:'¿Qué dijo la fuente o el asistente?',source:'Enlace de la fuente (opcional; solo HTTPS)',
  noteAck:'Guardar nota revisada aquí',noteSaved:'Nota de investigación sin verificar guardada en este dispositivo.',
  noteError:'No se pudo guardar la nota.',noteEmpty:'Todavía no hay notas de investigación.',
  noPin:'Para guardar hallazgos, abre Investigar desde un punto privado. Puedes copiar una pregunta sin crear un punto.',
  researchWarning:'Importante: las notas de investigación se guardan aparte y NO están incluidas en la copia privada v1 de GLO. Guarda una copia de lo importante hasta que exista un respaldo de investigación.',
  human:'Investigación guardada manualmente · SIN VERIFICAR · NO es revisión de campo',delete:'Borrar nota',deleteConfirm:'¿Borrar esta nota de investigación del dispositivo?',
  notVerified:'Una respuesta de IA o lista de propietarios no demuestra que un servicio funcione, una ruta sea segura ni que haya permiso para entrar.',
  busy:'Guardando…',link:'Abrir fuente ↗'
 }
}
export default function ResearchSpot({target=null,localPinId=null,language='en',onClose}){
 const t=COPY[language]||COPY.en
 const [lat,setLat]=useState(target?String(target.lat):'')
 const [lon,setLon]=useState(target?String(target.lon):'')
 const [category,setCategory]=useState(target?.category||'')
 const [question,setQuestion]=useState('')
 const [scope,setScope]=useState('area')
 const [approved,setApproved]=useState(false)
 const [copyStatus,setCopyStatus]=useState('')
 const [geoStatus,setGeoStatus]=useState('')
 const [noteTitle,setNoteTitle]=useState('')
 const [noteDetails,setNoteDetails]=useState('')
 const [sourceUrl,setSourceUrl]=useState('')
 const [notes,setNotes]=useState([])
 const [noteError,setNoteError]=useState('')
 const [noteStatus,setNoteStatus]=useState('')
 const [saving,setSaving]=useState(false)
 useEffect(()=>{
  let active=true
  setNotes([])
  if(localPinId)listResearchAnnotations(localPinId).then(rows=>{if(active)setNotes(rows)})
    .catch(e=>{if(active)setNoteError(e.message)})
  return()=>{active=false}
 },[localPinId])
 function change(set,value){set(value);setApproved(false);setCopyStatus('')}
 function chooseDeviceLocation(){
  if(!navigator.geolocation){setGeoStatus(t.gpsFailed);return}
  setGeoStatus(t.gpsRequest)
  navigator.geolocation.getCurrentPosition(({coords})=>{
    setLat(coords.latitude.toFixed(6));setLon(coords.longitude.toFixed(6))
    setApproved(false);setCopyStatus('');setGeoStatus(t.gpsSuccess)
  },()=>setGeoStatus(t.gpsFailed),{enableHighAccuracy:false,maximumAge:60000,timeout:12000})
 }
 let packet=null
 try{packet=makeResearchPacket({point:{lat:Number(lat),lon:Number(lon)},scope,category,question})}
 catch{packet=null}
 // Empty coordinate fields must NEVER be interpreted as 0,0 by Number('').
 if(!lat.trim()||!lon.trim())packet=null
 const preview=packet&&approved?researchMessage(packet):''
 async function copy(){
   if(!approved||!packet)return
   try{
     if(!navigator.clipboard?.writeText)throw new Error('Unavailable')
     await navigator.clipboard.writeText(researchMessage(packet))
     setCopyStatus(t.copied)
   }catch{setCopyStatus(t.copyFail)}
 }
 async function saveNote(event){
   event.preventDefault()
   if(!localPinId||saving)return
   setSaving(true);setNoteError('');setNoteStatus('')
   try{
     const note=createResearchAnnotation({pinId:localPinId,title:noteTitle,details:noteDetails,sourceUrl})
     await saveResearchAnnotation(note)
     setNotes(await listResearchAnnotations(localPinId))
     setNoteTitle('');setNoteDetails('');setSourceUrl('')
     setNoteStatus(t.noteSaved)
   }catch(e){setNoteError(e.message||t.noteError)}
   finally{setSaving(false)}
 }
 async function deleteNote(note){
   if(!window.confirm(t.deleteConfirm))return
   try{await removeResearchAnnotation(localPinId,note.id);setNotes(await listResearchAnnotations(localPinId))}
   catch(e){setNoteError(e.message)}
 }
 return <section className="research-spot" aria-label={t.heading}>
  <div className="research-head"><h3>{t.heading}</h3><button className="secondary compact" type="button" onClick={onClose}>{t.close}</button></div>
  <p>{t.intro}</p>
  <div className="research-fields">
    <p className="research-caution">{target?t.chosen:t.manual}</p>
    <div className="research-coordinates">
      <label>Latitude<input type="number" step="any" min="-90" max="90" value={lat} onChange={e=>change(setLat,e.target.value)}/></label>
      <label>Longitude<input type="number" step="any" min="-180" max="180" value={lon} onChange={e=>change(setLon,e.target.value)}/></label>
    </div>
    <button className="secondary compact" type="button" onClick={chooseDeviceLocation}>{t.gps}</button>
    {geoStatus&&<p className="research-message" role="status">{geoStatus}</p>}
    <label>{t.category}<select value={category} onChange={e=>change(setCategory,e.target.value)}>
      <option value="">{t.none}</option>{Object.keys(CATEGORIES).map(k=><option value={k} key={k}>{categoryLabel(k,language,CATEGORIES)}</option>)}
    </select></label>
    <label>{t.question}<textarea rows={3} maxLength={300} value={question} placeholder={t.questionHint} onChange={e=>change(setQuestion,e.target.value)}/></label>
    <label>{t.precision}<select value={scope} onChange={e=>change(setScope,e.target.value)}>
      <option value="area">{t.area}</option><option value="exact">{t.exact}</option>
    </select></label>
    <p className="research-caution">{scope==='exact'?t.exactInfo:t.areaInfo}</p>
    <h4>{t.review}</h4>
    <p>{t.safe}</p>
    <p className="research-caution">{t.notVerified}</p>
    {packet&&<pre className="research-packet">{JSON.stringify(packet,null,2)}</pre>}
    {!packet&&<p className="research-message">{t.invalid}</p>}
    <label className="research-ack"><input type="checkbox" checked={approved} disabled={!packet} onChange={e=>setApproved(e.target.checked)}/><span>{t.ack}</span></label>
    <button className="primary" type="button" disabled={!packet||!approved} onClick={copy}>{t.copy}</button>
    {copyStatus&&<p className="research-message" role="status">{copyStatus}</p>}
    {preview&&<details><summary>{t.preview}</summary><textarea className="research-preview" readOnly value={preview} rows={11} onFocus={e=>e.target.select()}/></details>}
  </div>
  <div className="research-notes">
   <h4>{t.researchTitle}</h4>
   {localPinId?<>
     <p>{t.researchIntro}</p>
     <p className="research-caution">{t.researchWarning}</p>
     <form onSubmit={saveNote} className="research-fields">
       <label>{t.noteTitle}<input required maxLength={80} value={noteTitle} onChange={e=>setNoteTitle(e.target.value)}/></label>
       <label>{t.noteDetails}<textarea required rows={4} maxLength={900} value={noteDetails} onChange={e=>setNoteDetails(e.target.value)}/></label>
       <label>{t.source}<input type="url" maxLength={300} placeholder="https://" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)}/></label>
       <button className="primary" disabled={saving||notes.length>=12} type="submit">{saving?t.busy:t.noteAck}</button>
       {noteError&&<p role="alert" className="research-error">{noteError}</p>}
       {noteStatus&&<p role="status" className="research-message">{noteStatus}</p>}
     </form>
     {notes.length?<ul className="research-note-list">{notes.map(n=><li key={n.id}>
       <strong>{n.title}</strong><small>{t.human} · {new Date(n.recordedAt).toLocaleString()}</small>
       <p>{n.details}</p>{n.sourceUrl&&<a href={n.sourceUrl} rel="noopener noreferrer" target="_blank">{t.link}</a>}
       <button type="button" className="secondary compact" onClick={()=>deleteNote(n)}>{t.delete}</button>
     </li>)}</ul>:<p className="research-message">{t.noteEmpty}</p>}
   </>:<p>{t.noPin}</p>}
  </div>
 </section>
}
