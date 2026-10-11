import {useRef,useState} from 'react'
import {MAX_RESTORE_BYTES,parsePrivateRestore,restorePreview} from './restoreSafety.js'
import {restorePrivateReports} from './storage.js'
import './backupRestore.css'

const COPY={
 en:{
  title:'Recover a private GLO backup',help:'Select a full GLO private backup JSON file. Nothing is uploaded. You can inspect counts before you decide to restore.',
  file:'Choose private backup (.json)',preview:'Review before adding anything',none:'Select a file to see a local-only preview.',
  pins:'Pins inside file',rechecks:'Historical rechecks',add:'Not on this device',duplicates:'Already on this device',
  exported:'Original export time',local:'Existing saved pins are never replaced, merged or deleted. Duplicate IDs are skipped, even when a backup contains older or different notes.',
  privacy:'Sensitive file: may contain exact locations, personal notes and visit history. Reading it into this tab does not upload it, but the original file remains in Downloads or wherever you selected it.',
  notBackup:'Counts-only overviews and public map packs cannot be restored.',
  approve:'I reviewed the counts and understand only missing private pins will be added to this device.',
  restore:'Restore missing pins',restoring:'Restoring…',cancel:'Close without restoring',
  success:(added,skipped)=>'Recovery finished: '+added+' private pin(s) added, '+skipped+' existing ID(s) skipped. No existing pins overwritten.',
  failed:'File could not be opened. No local data was changed.',
  confirm:(count)=>'Add up to '+count+' missing PRIVATE pins to this device? Existing IDs will be skipped. This can reveal sensitive notes on this device. No public upload will occur.',
  empty:'No missing pins to restore. Nothing will be overwritten.'
 },
 es:{
  title:'Recuperar copia privada de GLO',help:'Selecciona una copia privada completa de GLO en JSON. No se sube nada. Revisa las cantidades antes de decidir.',
  file:'Elegir copia privada (.json)',preview:'Revisar antes de agregar',none:'Elige un archivo para ver las cantidades en este dispositivo.',
  pins:'Puntos del archivo',rechecks:'Revisiones históricas',add:'No están en este dispositivo',duplicates:'Ya existen en este dispositivo',
  exported:'Fecha de exportación',local:'Los puntos guardados nunca se reemplazan, fusionan ni borran. Se omiten los IDs existentes, aunque el archivo tenga notas anteriores.',
  privacy:'Archivo sensible: puede contener ubicaciones exactas, notas privadas e historial. Abrirlo aquí no lo sube, pero el archivo original permanece donde lo guardaste.',
  notBackup:'Los resúmenes de cantidades y los paquetes de mapas públicos no se pueden restaurar.',
  approve:'Revisé las cantidades y entiendo que solo se agregarán puntos privados faltantes a este dispositivo.',
  restore:'Restaurar puntos faltantes',restoring:'Restaurando…',cancel:'Cerrar sin restaurar',
  success:(added,skipped)=>'Recuperación terminada: '+added+' puntos agregados, '+skipped+' IDs existentes omitidos. No se reemplazó ningún punto.',
  failed:'No se pudo leer el archivo. No se modificaron los datos locales.',
  confirm:(count)=>'¿Agregar hasta '+count+' puntos privados faltantes? No se reemplazarán los puntos existentes ni se publicará nada.',
  empty:'No faltan puntos. No se reemplazará ningún dato.'
 }
}
export default function BackupRestore({existing=[],language='en',onClose,onRestored}){
  const t=COPY[language]||COPY.en
  const input=useRef(null)
  const [loaded,setLoaded]=useState(null)
  const [approved,setApproved]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const counts=loaded?restorePreview(loaded.reports,existing):null

  async function choose(event){
    const file=event.target.files?.[0]
    setLoaded(null);setApproved(false);setError('')
    if(!file)return
    setBusy(true)
    try{
      if(file.size>MAX_RESTORE_BYTES)throw new Error('File is larger than 1.5 MB.')
      const parsed=parsePrivateRestore(await file.text())
      setLoaded(parsed)
    }catch(e){setError(e.message||t.failed)}
    finally{
      setBusy(false)
      if(input.current)input.current.value=''
    }
  }
  async function restore(event){
    event.preventDefault()
    if(busy||!approved||!loaded||!counts?.addable)return
    if(!window.confirm(t.confirm(counts.addable)))return
    setBusy(true);setError('')
    try{
      const result=await restorePrivateReports(loaded.reports)
      await onRestored(t.success(result.imported,result.skipped))
      // Parent removes the sensitive parsed backup from memory by unmounting us.
      onClose()
    }catch(e){setError(e.message||t.failed)}
    finally{setBusy(false)}
  }
  return <section className="backup-restore" aria-label={t.title}>
    <div className="header-row"><strong>{t.title}</strong>
      <button type="button" className="secondary compact" disabled={busy} onClick={onClose}>{t.cancel}</button>
    </div>
    <p>{t.help}</p>
    <label htmlFor="glo-private-backup-file">{t.file}</label>
    <input ref={input} id="glo-private-backup-file" type="file" accept=".json,application/json" disabled={busy} onChange={choose}/>
    <p className="restore-caution">{t.privacy}</p>
    <p className="restore-note">{t.notBackup}</p>
    {error&&<p className="restore-error" role="alert">{error}</p>}
    {loaded&&<form onSubmit={restore}>
      <div className="restore-summary"><strong>{t.preview}</strong>
        <p>{t.exported}: {new Date(loaded.exportedAt).toLocaleString()}</p>
        <dl>
          <div><dt>{t.pins}</dt><dd>{counts.total}</dd></div>
          <div><dt>{t.rechecks}</dt><dd>{counts.rechecks}</dd></div>
          <div><dt>{t.add}</dt><dd>{counts.addable}</dd></div>
          <div><dt>{t.duplicates}</dt><dd>{counts.alreadyHere}</dd></div>
        </dl>
      </div>
      <p className="restore-note">{t.local}</p>
      {counts.addable===0?<p>{t.empty}</p>:
        <label className="restore-ack"><input type="checkbox" checked={approved} onChange={event=>setApproved(event.target.checked)}/>
          <span>{t.approve}</span>
        </label>}
      <div className="restore-actions">
        <button type="submit" className="primary" disabled={busy||!approved||counts.addable===0}>{busy?t.restoring:t.restore}</button>
        <button type="button" className="secondary" disabled={busy} onClick={onClose}>{t.cancel}</button>
      </div>
    </form>}
    {!loaded&&!error&&<p className="restore-note">{t.none}</p>}
  </section>
}
