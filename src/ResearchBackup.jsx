import {useEffect,useRef,useState} from 'react'
import {listReports,listAllResearchAnnotations,restoreResearchAnnotations} from './storage.js'
import {buildResearchBackup,parseResearchBackup,previewResearchRestore,MAX_RESEARCH_BACKUP_BYTES} from './researchBackup.js'
import './researchBackup.css'

// Research notes have a deliberately separate file format from v1 pin backups.
const COPY={
 en:{
  title:'Private research backup & recovery',
  intro:'Research notes are NOT in the original private pin backup. Export this separate file if you want to keep your manually reviewed research.',
  count:'Research notes available to back up',export:'Download private research backup',
  consent:'I understand this plain JSON file contains sensitive research text, source links and private pin IDs. It is NOT encrypted, and panic clear cannot delete downloaded copies.',
  caution:'Works offline. Nothing is uploaded. A backup may expose places, people or situations you typed into research notes. Protect the file yourself.',
  imported:'Recover research notes (.json)',choose:'Choose research-only backup',nothing:'Choose a research backup to preview it before restoring.',
  summary:'Review notes in selected file',total:'Notes in file',addable:'Can be added',existing:'IDs already here',missing:'Pin missing here',full:'Pin already at 12 notes',
  missingInfo:'Restore the matching private pins first using Recover private backup. Notes for pins absent from this device are skipped; they are never turned into public pins.',
  restoreInfo:'Recovery adds only missing note IDs to existing private pins. It never overwrites existing research, observations or field rechecks.',
  ackRestore:'I reviewed the counts and want to add only eligible private research notes on this device.',
  restore:'Restore missing research notes',close:'Close research backup',busy:'Working…',
  saved:'Research backup download requested. Check and protect your Downloads file.',
  success:r=>'Research recovery: '+r.imported+' notes added, '+r.alreadyHere+' existing, '+r.missingPin+' missing-pin, '+r.full+' full-history skipped.',
  confirm:n=>'Add up to '+n+' private, UNVERIFIED research notes on this device? No existing data will be overwritten.',
  noNotes:'No attached research notes here yet. You can still restore a research backup.',
  noAdd:'No eligible notes can be added. Restore missing pins first, or keep the file safe.',
  err:'Research operation failed. Nothing was uploaded.'
 },
 es:{
  title:'Copia y recuperación de investigación privada',
  intro:'Las notas de investigación NO están en la copia original de puntos. Descarga este archivo separado para conservar la investigación revisada por ti.',
  count:'Notas de investigación para respaldar',export:'Descargar copia de investigación privada',
  consent:'Entiendo que este archivo JSON incluye textos privados, enlaces e IDs de puntos. NO está cifrado, y el borrado de emergencia no puede eliminar las copias descargadas.',
  caution:'Funciona sin conexión. No se sube nada. El archivo puede exponer lugares o personas mencionados en tus notas. Protégelo.',
  imported:'Recuperar notas de investigación (.json)',choose:'Elegir copia solo de investigación',nothing:'Elige un archivo para revisar las cantidades antes de restaurar.',
  summary:'Revisar notas del archivo',total:'Notas del archivo',addable:'Se pueden agregar',existing:'IDs ya guardados',missing:'Falta el punto',full:'Punto con 12 notas',
  missingInfo:'Primero restaura los puntos privados con Recuperar copia privada. Se omiten las notas sin punto; nunca se hacen públicas.',
  restoreInfo:'Solo agrega IDs de notas faltantes a puntos privados existentes. No reemplaza investigaciones, observaciones ni revisiones.',
  ackRestore:'Revisé las cantidades y quiero agregar solo las notas privadas elegibles a este dispositivo.',
  restore:'Restaurar notas faltantes',close:'Cerrar copia de investigación',busy:'Procesando…',
  saved:'Se solicitó la descarga. Protege el archivo descargado.',
  success:r=>'Recuperación: '+r.imported+' notas agregadas, '+r.alreadyHere+' existentes, '+r.missingPin+' sin punto y '+r.full+' con historial completo omitidas.',
  confirm:n=>'¿Agregar hasta '+n+' notas privadas SIN VERIFICAR? No se reemplazará ningún dato.',
  noNotes:'Aún no hay notas asociadas. Puedes restaurar una copia de investigación.',
  noAdd:'No hay notas elegibles. Restaura primero los puntos faltantes o conserva el archivo.',
  err:'Error en la operación. No se subió nada.'
 }
}
export default function ResearchBackup({language='en',onClose,onNotice}){
 const t=COPY[language]||COPY.en
 const input=useRef(null)
 const [notes,setNotes]=useState([])
 const [loaded,setLoaded]=useState(null)
 const [preview,setPreview]=useState(null)
 const [exportOk,setExportOk]=useState(false)
 const [restoreOk,setRestoreOk]=useState(false)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [status,setStatus]=useState('')
 const [livePinIds,setLivePinIds]=useState([])
 useEffect(()=>{
  let active=true
  Promise.all([listAllResearchAnnotations(),listReports()]).then(([all,pins])=>{
   if(!active)return
   const ids=new Set(pins.map(p=>p.id))
   setLivePinIds([...ids])
   setNotes(all.filter(n=>ids.has(n.pinId)))
  }).catch(e=>{if(active)setError(e.message||t.err)})
  return()=>{active=false}
 },[])
 async function download(){
  if(!exportOk||busy)return
  setBusy(true);setError('');setStatus('')
  let url
  try{
   // Refresh locally so a removed pin cannot leave its notes in a new export.
   const [all,pins]=await Promise.all([listAllResearchAnnotations(),listReports()])
   const ids=new Set(pins.map(p=>p.id))
   const filtered=all.filter(n=>ids.has(n.pinId))
   if(!filtered.length)throw new Error(t.noNotes)
   const {name,payload}=buildResearchBackup(filtered)
   const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
   url=URL.createObjectURL(blob)
   const a=document.createElement('a')
   a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove()
   setStatus(t.saved)
   onNotice?.(t.saved)
  }catch(e){setError(e.message||t.err)}
  finally{if(url)window.setTimeout(()=>URL.revokeObjectURL(url),60000);setBusy(false)}
 }
 async function choose(event){
  const file=event.target.files?.[0]
  setLoaded(null);setPreview(null);setRestoreOk(false);setError('');setStatus('')
  if(!file)return
  setBusy(true)
  try{
   if(file.size>MAX_RESEARCH_BACKUP_BYTES)throw new Error('Research backup exceeds 6 MB.')
   const parsed=parseResearchBackup(await file.text())
   const [all,pins]=await Promise.all([listAllResearchAnnotations(),listReports()])
   setLoaded(parsed)
   setPreview(previewResearchRestore(parsed.annotations,all,pins.map(p=>p.id)))
   setLivePinIds(pins.map(p=>p.id))
  }catch(e){setError(e.message||t.err)}
  finally{setBusy(false);if(input.current)input.current.value=''}
 }
 async function restore(event){
  event.preventDefault()
  if(busy||!restoreOk||!loaded||!preview?.addable)return
  if(!window.confirm(t.confirm(preview.addable)))return
  setBusy(true);setError('');setStatus('')
  try{
   const result=await restoreResearchAnnotations(loaded.annotations)
   const message=t.success(result)
   setStatus(message);onNotice?.(message)
   const [all,pins]=await Promise.all([listAllResearchAnnotations(),listReports()])
   const ids=new Set(pins.map(p=>p.id))
   setNotes(all.filter(n=>ids.has(n.pinId)))
   setPreview(previewResearchRestore(loaded.annotations,all,pins.map(p=>p.id)))
   setRestoreOk(false)
  }catch(e){setError(e.message||t.err)}
  finally{setBusy(false)}
 }
 return <section className="research-backup" aria-label={t.title}>
   <div className="research-backup-head"><strong>{t.title}</strong><button type="button" className="secondary compact" onClick={onClose} disabled={busy}>{t.close}</button></div>
   <p>{t.intro}</p>
   <p className="research-backup-caution">{t.caution}</p>
   <div className="research-backup-stat"><strong>{notes.length}</strong><span>{t.count}</span></div>
   <label className="research-backup-ack"><input type="checkbox" checked={exportOk} onChange={e=>setExportOk(e.target.checked)}/><span>{t.consent}</span></label>
   <button className="primary" type="button" disabled={busy||!exportOk||notes.length===0} onClick={download}>{busy?t.busy:t.export}</button>
   {!notes.length&&<p>{t.noNotes}</p>}
   <div className="research-backup-divider" />
   <strong>{t.imported}</strong>
   <label htmlFor="glo-research-backup-file">{t.choose}</label>
   <input ref={input} id="glo-research-backup-file" type="file" accept=".json,application/json" disabled={busy} onChange={choose}/>
   {loaded&&preview?<form onSubmit={restore}>
     <strong>{t.summary}</strong>
     <p>{new Date(loaded.exportedAt).toLocaleString()}</p>
     <dl className="research-backup-grid">
       {[[t.total,preview.total],[t.addable,preview.addable],[t.existing,preview.alreadyHere],[t.missing,preview.missingPin],[t.full,preview.full]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
     </dl>
     <p>{t.restoreInfo}</p><p>{t.missingInfo}</p>
     {preview.addable>0?<label className="research-backup-ack"><input type="checkbox" checked={restoreOk} onChange={e=>setRestoreOk(e.target.checked)}/><span>{t.ackRestore}</span></label>:<p>{t.noAdd}</p>}
     <button type="submit" className="primary" disabled={busy||!restoreOk||!preview.addable}>{busy?t.busy:t.restore}</button>
   </form>:<p>{t.nothing}</p>}
   {error&&<p role="alert" className="research-backup-error">{error}</p>}
   {status&&<p role="status" className="research-backup-status">{status}</p>}
 </section>
}
