import { useState } from 'react'
import { buildLocalExport, exportInventory } from './exportSafety.js'
import './backupReview.css'

const COPY={
 en:{
  title:'Review what leaves this device',
  intro:'GLO never uploads this file. Choose exactly what to download and keep it somewhere safe.',
  overview:'Counts only (privacy-first)',overviewInfo:'Totals and category counts. No titles, notes, dates of visits, identifiers or coordinates. NOT usable as a backup.',
  full:'Full private backup (sensitive)',fullInfo:'Contains every pin, exact coordinates, titles, personal notes, timestamps, access observations and the complete private recheck history. Plain JSON, NOT encrypted.',
  count:'Private pins',rechecks:'Private rechecks',coordinates:'Pins with exact coordinates',notes:'Pins containing notes',
  ack:'I understand a full backup includes exact locations and personal observations, is NOT encrypted, and will remain outside GLO even after panic clear.',
  warning:'A downloaded file may remain in Downloads, cloud backups, browser history, other apps or shared devices. Panic clear cannot erase it. A counts-only export can still reveal which kinds of resources you track.',
  exportOverview:'Download counts-only overview',exportFull:'Download full sensitive backup',
  close:'Close without downloading',done:'Download requested. Check your browser’s Downloads and protect or delete the file yourself.',
  error:'Could not create the file. Nothing was uploaded.',
  offline:'Works offline · no account · no automatic sharing'
 },
 es:{
  title:'Revisa qué sale de este dispositivo',
  intro:'GLO no sube este archivo. Elige qué descargar y guárdalo de forma segura.',
  overview:'Solo cantidades (más privado)',overviewInfo:'Totales por categoría. Sin nombres, notas, fechas de visitas, identificadores ni coordenadas. NO sirve como copia de seguridad.',
  full:'Copia privada completa (sensible)',fullInfo:'Contiene todos los puntos, coordenadas exactas, nombres, notas, fechas, observaciones y revisiones anteriores. Archivo JSON SIN cifrar.',
  count:'Puntos privados',rechecks:'Revisiones privadas',coordinates:'Puntos con coordenadas exactas',notes:'Puntos con notas',
  ack:'Entiendo que la copia completa incluye ubicaciones y observaciones privadas, NO está cifrada y seguirá fuera de GLO incluso después del borrado de emergencia.',
  warning:'Un archivo descargado puede permanecer en Descargas, copias en la nube, historial u otros dispositivos. El borrado de emergencia no puede eliminarlo. Las cantidades también pueden revelar tus intereses.',
  exportOverview:'Descargar resumen de cantidades',exportFull:'Descargar copia privada sensible',
  close:'Cerrar sin descargar',done:'Se solicitó la descarga. Comprueba Descargas y protege o borra el archivo por tu cuenta.',
  error:'No se pudo crear el archivo. No se subió nada.',
  offline:'Funciona sin conexión · sin cuenta · sin compartir automáticamente'
 }
}

export default function BackupReview({reports=[],language='en',onClose,onDownloaded}){
 const t=COPY[language]||COPY.en
 const [mode,setMode]=useState('overview')
 const [ack,setAck]=useState(false)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const stats=exportInventory(reports)
 const allowed=mode==='overview'||ack
 function setChoice(next){setMode(next);setAck(false);setError('')}
 function download(event){
  event.preventDefault()
  if(!allowed||busy||!reports.length)return
  setBusy(true);setError('')
  let url
  try {
   const {name,payload}=buildLocalExport(reports,mode)
   const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
   url=URL.createObjectURL(blob)
   const link=document.createElement('a')
   link.href=url
   link.download=name
   // Browsers may block downloads; never claim that a file definitely exists.
   document.body.appendChild(link)
   link.click()
   link.remove()
   onDownloaded?.(t.done)
   onClose()
  }catch(e){setError(t.error)}finally{
   if(url)window.setTimeout(()=>URL.revokeObjectURL(url),60000)
   setBusy(false)
  }
 }
 return <section className="backup-review" aria-label={t.title}>
   <div className="header-row"><strong>{t.title}</strong><button type="button" className="secondary compact" onClick={onClose}>{t.close}</button></div>
   <p>{t.intro}</p>
   <div className="backup-counts" aria-label={t.count}>
     <span><strong>{stats.pins}</strong>{t.count}</span>
     <span><strong>{stats.rechecks}</strong>{t.rechecks}</span>
     <span><strong>{stats.withCoordinates}</strong>{t.coordinates}</span>
     <span><strong>{stats.withNotes}</strong>{t.notes}</span>
   </div>
   <form onSubmit={download}>
     <fieldset className="backup-choices">
       <legend>{t.title}</legend>
       <label className={mode==='overview'?'selected':''}>
         <input type="radio" name="local-export-kind" checked={mode==='overview'} onChange={()=>setChoice('overview')}/>
         <span><strong>{t.overview}</strong><small>{t.overviewInfo}</small></span>
       </label>
       <label className={mode==='private-backup'?'selected':''}>
         <input type="radio" name="local-export-kind" checked={mode==='private-backup'} onChange={()=>setChoice('private-backup')}/>
         <span><strong>{t.full}</strong><small>{t.fullInfo}</small></span>
       </label>
     </fieldset>
     {mode==='private-backup'&&<label className="backup-ack">
       <input type="checkbox" checked={ack} onChange={event=>setAck(event.target.checked)}/>
       <span>{t.ack}</span>
     </label>}
     <p className="backup-warning">{t.warning}</p>
     {error&&<p className="backup-error" role="alert">{error}</p>}
     <div className="backup-actions">
       <button type="submit" className="primary" disabled={!allowed||busy||!reports.length}>{mode==='overview'?t.exportOverview:t.exportFull}</button>
       <button type="button" className="secondary" onClick={onClose}>{t.close}</button>
     </div>
   </form>
   <small>{t.offline}</small>
 </section>
}
