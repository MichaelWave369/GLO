import {useEffect,useRef,useState} from 'react'
import {
 parsePublicCheckReceipt,PUBLIC_CHECK_SOURCE,PUBLIC_CHECK_MAX_BYTES,receiptIsStale
} from './publicSourceReceipt.js'
import './publicSourceReview.css'

const WORDS={
 en:{
 heading:'Public source check desk',intro:'Review one small public-only website check receipt. Importing a file stays entirely in this browser. Nothing is uploaded or written to your pins, Scout results or local resource directory.',
 select:'Choose a source check receipt (.json)',remove:'Clear reviewed file',
 noFile:'No receipt selected. A maintainer can manually run the separate GitHub Actions public-source observation, then download and inspect its artifact.',
 source:'Fixed public reference',checked:'Website request time',method:'Request method',
 responded:'The publisher website responded to a HEAD request. This does NOT confirm any local service.',
 redirect_unfollowed:'The publisher responded with a redirect that was NOT followed. No service claim.',
 http_error:'The publisher returned an HTTP error or access restriction. No service claim.',
 request_error:'No usable HTTP response was observed. The reason cannot be determined from this receipt.',
 status:'Observation result',response:'HTTP response',unknown:'No HTTP response',
 old:'This observation is over 24 hours old. Even a newer response is only a website check.',
 ack:'I understand: this is only a website check, NOT a verified provider or open service.',
 acknowledged:'Scope acknowledged on this screen only. Nothing was approved, published or saved.',
 manual:'Review only. This is not a live web check; importing does not call the publisher or FieldCloudWorker.',
 limits:'No locations, private notes, IDs of people, service opening claims, directory imports, automatic updates, scheduled workers or trusted verification are permitted in this receipt.',
 sourceLink:'Visit the public 211 website (external)',
 failure:'Rejected unsafe or invalid receipt',
 notSaved:'Closing the page or clearing this panel discards the review.'
 },
 es:{
 heading:'Mesa de revisión de fuentes públicas',intro:'Revisa un pequeño recibo de consulta a un sitio público. El archivo se lee solo en este navegador. No se envía ni se agrega a tus puntos, resultados de Scout o directorios.',
 select:'Seleccionar recibo de fuente pública (.json)',remove:'Borrar revisión',
 noFile:'No hay archivo seleccionado. Un responsable puede ejecutar manualmente la observación desde GitHub Actions y revisar su archivo.',
 source:'Referencia pública fija',checked:'Hora de consulta del sitio',method:'Método de consulta',
 responded:'El sitio respondió a HEAD. Esto NO confirma ningún servicio local.',
 redirect_unfollowed:'El sitio devolvió una redirección que NO se siguió. No confirma servicios.',
 http_error:'El sitio devolvió un error HTTP o una restricción. No confirma servicios.',
 request_error:'No hubo una respuesta HTTP utilizable. Este recibo no determina la causa.',
 status:'Resultado observado',response:'Respuesta HTTP',unknown:'Sin respuesta HTTP',
 old:'La observación tiene más de 24 horas. Incluso una más reciente solo comprueba el sitio.',
 ack:'Entiendo: es una consulta al sitio, NO una verificación de servicios.',
 acknowledged:'Aceptaste el alcance en esta pantalla. No se aprobó, publicó ni guardó nada.',
 manual:'Solo revisión. Importar NO consulta internet ni ejecuta FieldCloudWorker.',
 limits:'Los recibos no permiten ubicaciones, notas privadas, identificadores personales, horarios verificados, importaciones de directorio ni actualizaciones automáticas.',
 sourceLink:'Visitar el sitio público de 211 (externo)',
 failure:'Recibo rechazado por ser inválido o inseguro',
 notSaved:'Al cerrar o borrar el panel se descarta la revisión.'
 }
}
export default function PublicSourceReview({language='en'}){
 const t=WORDS[language]||WORDS.en
 const [receipt,setReceipt]=useState(null)
 const [error,setError]=useState('')
 const [ack,setAck]=useState(false)
 const epoch=useRef(0)
 useEffect(()=>()=>{epoch.current++},[])
 function clear(){
  epoch.current++
  setReceipt(null);setAck(false);setError('')
 }
 async function readFile(event){
  const file=event.target.files?.[0]
  event.target.value=''
  clear()
  const id=epoch.current
  if(!file)return
  if(file.size>PUBLIC_CHECK_MAX_BYTES){
   setError(t.failure+': File exceeds 2 KB.')
   return
  }
  try{
   const parsed=parsePublicCheckReceipt(await file.text())
   if(epoch.current!==id)return
   setReceipt(parsed)
  }catch(e){
   if(epoch.current===id)setError(t.failure+': '+(e?.message||'Unknown format'))
  }
 }
 return <details className="source-review">
   <summary>{t.heading}</summary>
   <div className="source-review-content">
    <p>{t.intro}</p>
    <p>{t.manual}</p>
    <label className="source-review-input">{t.select}<input type="file" accept=".json,application/json"
      aria-label={t.select} onChange={readFile}/></label>
    {error&&<p className="source-review-error" role="alert">{error}</p>}
    {receipt?<section className="source-review-result" aria-live="polite">
      <strong>{t.source}: {PUBLIC_CHECK_SOURCE.label}</strong>
      <small>{t.checked}: {new Date(receipt.checkedAt).toLocaleString(language==='es'?'es-US':'en-US')}</small>
      <small>{t.method}: {receipt.method} · {t.response}: {receipt.httpStatus??t.unknown}</small>
      <p><strong>{t.status}:</strong> {t[receipt.result]}</p>
      {receiptIsStale(receipt)&&<p className="source-review-warning">{t.old}</p>}
      <label className="source-review-ack"><input type="checkbox" checked={ack}
        onChange={e=>setAck(e.target.checked)}/>{t.ack}</label>
      {ack&&<p role="status">{t.acknowledged}</p>}
      <a href={PUBLIC_CHECK_SOURCE.url} target="_blank" rel="noreferrer noopener">{t.sourceLink}</a>
      <button className="secondary compact" type="button" onClick={clear}>{t.remove}</button>
    </section>:!error&&<p>{t.noFile}</p>}
    <p className="source-review-warning">{t.limits}</p>
    <p>{t.notSaved}</p>
   </div>
 </details>
}
