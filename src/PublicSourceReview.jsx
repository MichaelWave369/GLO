import {useEffect,useRef,useState} from 'react'
import {
 parsePublicCheckReceipt,PUBLIC_CHECK_SOURCE,PUBLIC_CHECK_MAX_BYTES,receiptIsStale
} from './publicSourceReceipt.js'
import {makeReviewDraft,REVIEW_DECISIONS,REVIEW_MAX_BYTES} from './publicReviewGate.js'
import {inspectReviewDraftAgainstReceipt} from './publicReviewPair.js'
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
 workflowLink:'Open manual observation workflow on GitHub (external)',
 workflowHint:'The first recorded real test returned HTTP 301, an unfollowed redirect. Every run needs its own receipt; older results cannot certify current services.',
 limits:'No locations, private notes, IDs of people, service opening claims, directory imports, automatic updates, scheduled workers or trusted verification are permitted in this receipt.',
 sourceLink:'Visit the public 211 website (external)',
 failure:'Rejected unsafe or invalid receipt',
 notSaved:'Closing the page or clearing this panel discards the review.',
  reviewTitle:'Human review draft (not an approval)',
  reviewIntro:'After examining the receipt and source context, you can prepare an offline review decision. It is bound to this exact observation by SHA-256, not signed or independently authenticated.',
  reviewChoice:'Choose review disposition',
  choices:{
   'retain-observation-only':'Retain this website observation as unverified evidence',
   'request-new-check':'Request another manual source check',
   'discard-observation':'Discard this observation from consideration'
  },
  prepare:'Prepare local review draft',
  preparing:'Preparing local draft…',
  download:'Download blocked review draft JSON',
  drafted:'Draft ready. Keep it with the original source JSON to verify its SHA-256 binding. Downloading does not publish anything.',
  blocked:'PUBLICATION BLOCKED · SERVICE STATUS UNKNOWN',
  noAuthority:'The acknowledgement and the downloaded draft do not identify a reviewer, authenticate a source or authorize a public listing.',
  draftError:'Could not prepare review draft',
  pairTitle:'Check a previously downloaded review draft',
  pairIntro:'Select a review draft JSON while the matching source receipt is loaded above. The comparison happens here only, without uploading either file.',
  pairChoose:'Choose review draft to compare (.json)',
  pairPending:'Comparing both files on this device…',
  pairMatched:'LOCAL CONTENT MATCH ONLY',
  pairDecision:'Draft disposition',
  pairDates:'Review creation time',
  pairSha:'Source fingerprint (SHA-256)',
  pairLimits:'A matching pair does NOT prove a real website request, publisher identity, reviewer identity, open service, legal access or permission to publish. Two fabricated files can also match.',
  pairFailed:'No match or rejected review draft',
  pairTooLarge:'Review draft is too large (limit 1.5 KB).',
  pairReset:'Clear comparison',
  sourceLoaded:'✓ Source receipt loaded for this session. The file chooser resets after import so you can select the same file again; no data was saved.',
  pairLoaded:'✓ Review draft loaded and compared locally. The file chooser resets after the check; the result remains visible until cleared.'
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
 workflowLink:'Abrir consulta manual en GitHub (sitio externo)',
 workflowHint:'La primera prueba real devolvió HTTP 301, una redirección no seguida. Cada consulta necesita su propio recibo; no verifica servicios actuales.',
 limits:'Los recibos no permiten ubicaciones, notas privadas, identificadores personales, horarios verificados, importaciones de directorio ni actualizaciones automáticas.',
 sourceLink:'Visitar el sitio público de 211 (externo)',
 failure:'Recibo rechazado por ser inválido o inseguro',
 notSaved:'Al cerrar o borrar el panel se descarta la revisión.',
  reviewTitle:'Borrador de revisión humana (no es una aprobación)',
  reviewIntro:'Tras examinar el recibo y su contexto, puedes preparar una decisión local. El SHA-256 vincula el borrador a esta observación, pero no es firma ni autenticación independiente.',
  reviewChoice:'Elegir el resultado de la revisión',
  choices:{
   'retain-observation-only':'Conservar esta observación web como dato no verificado',
   'request-new-check':'Solicitar otra consulta manual a la fuente',
   'discard-observation':'Descartar esta observación'
  },
  prepare:'Preparar borrador local',
  preparing:'Preparando borrador…',
  download:'Descargar borrador JSON de revisión bloqueada',
  drafted:'Borrador preparado. Guárdalo con el JSON de origen para verificar SHA-256. Descargarlo NO publica nada.',
  blocked:'PUBLICACIÓN BLOQUEADA · SERVICIO SIN VERIFICAR',
  noAuthority:'Ni la casilla ni el borrador identifican a quien revisó, autentican la fuente o autorizan una ficha pública.',
  draftError:'No se pudo preparar el borrador',
  pairTitle:'Comparar un borrador guardado previamente',
  pairIntro:'Selecciona el JSON del borrador con el recibo de origen cargado arriba. La comparación ocurre en este dispositivo; no se envían archivos.',
  pairChoose:'Seleccionar borrador para comparar (.json)',
  pairPending:'Comparando los dos archivos en este dispositivo…',
  pairMatched:'COINCIDENCIA LOCAL DE CONTENIDO ÚNICAMENTE',
  pairDecision:'Decisión del borrador',
  pairDates:'Fecha de preparación',
  pairSha:'Huella de la fuente (SHA-256)',
  pairLimits:'Una coincidencia NO demuestra una consulta auténtica, identidad de la fuente o del revisor, servicios abiertos, permiso de entrada ni autorización para publicar. Dos archivos falsos también pueden coincidir.',
  pairFailed:'Borrador rechazado o que no coincide',
  pairTooLarge:'El borrador supera 1.5 KB.',
  pairReset:'Borrar comparación',
  sourceLoaded:'✓ Recibo de origen cargado en esta sesión. El selector se reinicia para que puedas elegir el mismo archivo otra vez; no se guardaron datos.',
  pairLoaded:'✓ Borrador cargado y comparado localmente. El selector se reinicia después; el resultado sigue visible hasta que lo borres.'
 }
}
export default function PublicSourceReview({language='en'}){
 const t=WORDS[language]||WORDS.en
 const [receipt,setReceipt]=useState(null)
 const [error,setError]=useState('')
 const [ack,setAck]=useState(false)
 const [decision,setDecision]=useState('retain-observation-only')
 const [reviewDraft,setReviewDraft]=useState(null)
 const [preparing,setPreparing]=useState(false)
 const [pairResult,setPairResult]=useState(null)
 const [pairError,setPairError]=useState('')
 const [pairPending,setPairPending]=useState(false)
 const epoch=useRef(0)
 const pairEpoch=useRef(0)
 useEffect(()=>()=>{
  epoch.current++
  pairEpoch.current++
 },[])
 function clear(){
  epoch.current++
  pairEpoch.current++
  setPairResult(null);setPairError('');setPairPending(false)
  setReceipt(null);setAck(false);setDecision('retain-observation-only')
  setReviewDraft(null);setPreparing(false);setError('')
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
 async function prepareReview(){
  if(!receipt||!ack||preparing)return
  const id=++epoch.current
  setReviewDraft(null);setError('');setPreparing(true)
  try{
   const draft=await makeReviewDraft(receipt,{decision,acknowledged:ack})
   if(epoch.current!==id)return
   setReviewDraft(draft)
  }catch(e){
   if(epoch.current===id)setError(t.draftError+': '+(e?.message||''))
  }finally{if(epoch.current===id)setPreparing(false)}
 }
 async function compareSavedReview(event){
  const file=event.target.files?.[0]
  event.target.value=''
  const id=++pairEpoch.current
  setPairResult(null);setPairError('');setPairPending(false)
  if(!file||!receipt)return
  if(file.size>REVIEW_MAX_BYTES){setPairError(t.pairTooLarge);return}
  setPairPending(true)
  try{
   const text=await file.text()
   if(pairEpoch.current!==id)return
   const checked=await inspectReviewDraftAgainstReceipt(receipt,text)
   if(pairEpoch.current!==id)return
   setPairResult(checked)
  }catch(e){
   if(pairEpoch.current===id)setPairError(t.pairFailed+': '+(e?.message||'Invalid data'))
  }finally{if(pairEpoch.current===id)setPairPending(false)}
 }
 function resetPair(){
  pairEpoch.current++
  setPairResult(null);setPairError('');setPairPending(false)
 }
 function saveReviewDraft(){
  if(!reviewDraft)return
  const blob=new Blob([JSON.stringify(reviewDraft,null,2)+'\n'],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const anchor=document.createElement('a')
  anchor.href=url
  anchor.download='GLO-public-review-DRAFT-'+reviewDraft.reviewedAt.slice(0,10)+'.json'
  anchor.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1500)
 }
 return <details className="source-review">
   <summary>{t.heading}</summary>
   <div className="source-review-content">
    <p>{t.intro}</p>
    <p>{t.manual}</p>
    <a className="source-review-workflow" href="https://github.com/MichaelWave369/GLO/actions/workflows/glo-public-source-check.yml"
      target="_blank" rel="noopener noreferrer">{t.workflowLink}</a>
    <p>{t.workflowHint}</p>
    <label className="source-review-input">{t.select}<input type="file" accept=".json,application/json"
      aria-label={t.select} onChange={readFile}/></label>
     {receipt&&<p className="source-review-file-state" role="status">{t.sourceLoaded}</p>}
    {error&&<p className="source-review-error" role="alert">{error}</p>}
    {receipt?<section className="source-review-result" aria-live="polite">
      <strong>{t.source}: {PUBLIC_CHECK_SOURCE.label}</strong>
      <small>{t.checked}: {new Date(receipt.checkedAt).toLocaleString(language==='es'?'es-US':'en-US')}</small>
      <small>{t.method}: {receipt.method} · {t.response}: {receipt.httpStatus??t.unknown}</small>
      <p><strong>{t.status}:</strong> {t[receipt.result]}</p>
      {receiptIsStale(receipt)&&<p className="source-review-warning">{t.old}</p>}
      <label className="source-review-ack"><input type="checkbox" checked={ack}
        onChange={e=>{
          epoch.current++
          setAck(e.target.checked);setReviewDraft(null);setPreparing(false)
        }}/>{t.ack}</label>
      {ack&&<p role="status">{t.acknowledged}</p>}
      <div className="source-review-gate">
        <strong>{t.reviewTitle}</strong>
        <p>{t.reviewIntro}</p>
        <label className="source-review-select">{t.reviewChoice}
          <select value={decision} onChange={e=>{
           epoch.current++
           setDecision(e.target.value);setReviewDraft(null);setPreparing(false)
          }}>
            {REVIEW_DECISIONS.map(choice=><option key={choice} value={choice}>{t.choices[choice]}</option>)}
          </select>
        </label>
        <button className="primary" type="button"
          disabled={!ack||preparing} onClick={prepareReview}>
          {preparing?t.preparing:t.prepare}
        </button>
        {reviewDraft&&<>
          <p role="status">{t.drafted}</p>
          <p className="source-review-blocked">{t.blocked}</p>
          <small>SHA-256: {reviewDraft.checkSha256.slice(0,16)}…</small>
          <button className="secondary" type="button" onClick={saveReviewDraft}>{t.download}</button>
        </>}
        <p>{t.noAuthority}</p>
      </div>
      <div className="source-review-pair">
        <strong>{t.pairTitle}</strong>
        <p>{t.pairIntro}</p>
        <label className="source-review-input">{t.pairChoose}
          <input type="file" accept=".json,application/json"
            disabled={pairPending} onChange={compareSavedReview}
            aria-label={t.pairChoose}/>
        </label>
        {pairResult&&<p className="source-review-file-state" role="status">{t.pairLoaded}</p>}
        {pairPending&&<p role="status">{t.pairPending}</p>}
        {pairError&&<p role="alert" className="source-review-error">{pairError}</p>}
        {pairResult&&<section className="source-review-pair-matched" role="status">
          <strong>{t.pairMatched}</strong>
          <small>{t.pairDecision}: {t.choices[pairResult.decision]}</small>
          <small>{t.pairDates}: {new Date(pairResult.reviewedAt).toLocaleString(language==='es'?'es-US':'en-US')}</small>
          <small>{t.pairSha}: {pairResult.receiptSha256.slice(0,16)}…</small>
          <p className="source-review-blocked">{t.blocked}</p>
        </section>}
        {(pairResult||pairError)&&<button type="button" className="secondary compact"
          onClick={resetPair}>{t.pairReset}</button>}
        <p className="source-review-warning">{t.pairLimits}</p>
      </div>
      <a href={PUBLIC_CHECK_SOURCE.url} target="_blank" rel="noreferrer noopener">{t.sourceLink}</a>
      <button className="secondary compact" type="button" onClick={clear}>{t.remove}</button>
    </section>:!error&&<p>{t.noFile}</p>}
    <p className="source-review-warning">{t.limits}</p>
    <p>{t.notSaved}</p>
   </div>
 </details>
}
