import { useState } from 'react'
import { localDateTime } from './pinDraft.js'
import { createRecheck, validatedRechecks, MAX_RECHECKS } from './recheck.js'
import { appendRecheck } from './storage.js'
import './recheck.css'

const COPY={
 en:{action:'Recheck',close:'Close',title:'Private field recheck',
  help:'Only record what you personally observed. Nothing is published or independently verified.',
  time:'When did you check?',status:'What did you observe?',unknown:'Could not determine',
  working:'Appeared working during my visit',broken:'Did not work during my visit',
  note:'Brief observation (optional)',placeholder:'Describe only public resources. No names or private sleeping locations.',
  save:'Save recheck',saving:'Saving…',cancel:'Cancel',history:'Private observation history',
  first:'Original observation',caution:'A working observation from yesterday does not prove service is available now.',
  limit:'This pin has 20 rechecks. Back up your private data before choosing whether to delete this pin.',
  provenance:'Self-reported · not independently verified'},
 es:{action:'Volver a comprobar',close:'Cerrar',title:'Nueva observación privada',
  help:'Anota solo lo que observaste. Nada se publica ni se verifica de forma independiente.',
  time:'¿Cuándo lo comprobaste?',status:'¿Qué observaste?',unknown:'No pude comprobarlo',
  working:'Parecía funcionar durante mi visita',broken:'No funcionó durante mi visita',
  note:'Observación breve (opcional)',placeholder:'Solo recursos públicos. Sin nombres ni lugares privados donde duerman personas.',
  save:'Guardar',saving:'Guardando…',cancel:'Cancelar',history:'Historial privado de observaciones',
  first:'Observación original',caution:'Que funcionara ayer no demuestra que esté disponible ahora.',
  limit:'Este punto tiene 20 revisiones. Haz una copia privada antes de decidir borrarlo.',
  provenance:'Observación personal · no verificada de forma independiente'}
}
const fmt=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'Unknown':d.toLocaleString()}
export function RecheckHistory({report,language='en'}) {
 const t=COPY[language]||COPY.en, history=validatedRechecks(report)
 return <details className="recheck-history">
   <summary>{t.history} ({history.length+1})</summary>
   <ol>
     {history.map(r=><li key={r.id}><strong>{fmt(r.observedAt)} · {r.visitStatus==='working'?t.working:r.visitStatus==='not_working'?t.broken:t.unknown}</strong><small>{t.provenance}</small>{r.note&&<p>{r.note}</p>}</li>)}
     <li><strong>{t.first}: {fmt(report.observedAt)}</strong><small>{t.provenance}</small><span>{report.visitStatus==='working'?t.working:report.visitStatus==='not_working'?t.broken:t.unknown}</span>{report.note&&<p>{report.note}</p>}</li>
   </ol>
 </details>
}
export default function RecheckPanel({report,language='en',onSaved,onClose}) {
 const t=COPY[language]||COPY.en
 const [date,setDate]=useState(()=>localDateTime())
 const [status,setStatus]=useState('unknown')
 const [note,setNote]=useState('')
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const count=validatedRechecks(report).length
 async function submit(event){
   event.preventDefault()
   if(busy||count>=MAX_RECHECKS)return
   setBusy(true);setError('')
   try{
     const receipt=createRecheck(report,{observedAtLocal:date,visitStatus:status,note})
     await appendRecheck(report.id,receipt)
     await onSaved(report.id)
   }catch(e){setError(e.message||'Could not save this recheck.')}
   finally{setBusy(false)}
 }
 return <section className="recheck-panel" aria-label={t.title}>
   <div className="header-row"><strong>{t.title}: {report.title}</strong><button type="button" className="secondary compact" onClick={onClose}>{t.close}</button></div>
   <p>{t.help}</p><p className="recheck-caution">{t.caution}</p>
   {count>=MAX_RECHECKS?<p role="alert">{t.limit}</p>:
   <form className="recheck-form" onSubmit={submit}>
     <label htmlFor="recheck-time">{t.time}</label>
     <input type="datetime-local" id="recheck-time" required value={date} onChange={e=>setDate(e.target.value)}/>
     <label htmlFor="recheck-status">{t.status}</label>
     <select id="recheck-status" value={status} onChange={e=>setStatus(e.target.value)}>
       <option value="unknown">{t.unknown}</option>
       <option value="working">{t.working}</option>
       <option value="not_working">{t.broken}</option>
     </select>
     <label htmlFor="recheck-note">{t.note}</label>
     <textarea id="recheck-note" rows={3} maxLength={240} placeholder={t.placeholder} value={note} onChange={e=>setNote(e.target.value)}/>
     {error&&<p role="alert" className="inline-error">{error}</p>}
     <div className="recheck-actions"><button type="submit" className="primary" disabled={busy}>{busy?t.saving:t.save}</button>
       <button type="button" className="secondary" onClick={onClose}>{t.cancel}</button></div>
   </form>}
   <small>{count}/{MAX_RECHECKS} {t.history.toLowerCase()}</small>
 </section>
}
