import { useEffect, useRef, useState } from 'react'
import { fetchStreetSketch, STREET_RADIUS, sketchAge } from './streetSketch.js'
import { listStreetSketches, saveStreetSketch, deleteStreetSketch } from './storage.js'
import { mapPanelText } from './mapPanelsLocale.js'

export default function StreetSketchPanel({ center, online, selected, onSelect, onDelete, language='en' }) {
  const t=mapPanelText(language)
  const [stored,setStored]=useState([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [status,setStatus]=useState('')
  const controller=useRef(null)
  useEffect(()=>{
    let active=true
    listStreetSketches().then(rows=>{
      if(!active)return
      setStored(rows)
      if(rows.length)onSelect(rows[0],true)
    }).catch(e=>{if(active)setError(e.message)})
    return ()=>{active=false;controller.current?.abort()}
  },[])
  async function refresh(){setStored(await listStreetSketches())}
  async function download() {
    if(!online||loading)return
    if(!window.confirm(
      t.confirmDownload+' '+center.lat.toFixed(3)+', '+center.lon.toFixed(3)+t.confirmDisclosure
    ))return
    const ctl=new AbortController()
    controller.current=ctl
    setLoading(true);setError('');setStatus('')
    try{
      const pack=await fetchStreetSketch(center,ctl.signal)
      await saveStreetSketch(pack)
      await refresh()
      onSelect(pack,false)
      setStatus(t.savedSuccess)
    }catch(e){
      if(!ctl.signal.aborted)setError((language==='es'?t.downloadError:e.message)||t.downloadError)
    }finally{if(!ctl.signal.aborted)setLoading(false)}
  }
  async function erase(pack) {
    if(!window.confirm(t.deleteConfirm))return
    try{
      setError('')
      await deleteStreetSketch(pack.id)
      await refresh()
      if(selected?.id===pack.id)onDelete(pack.id)
      setStatus(t.deleted)
    }catch(e){setError(e.message)}
  }
  const age=selected?sketchAge(selected):null
  return <section className="street-pack" aria-labelledby="street-pack-heading">
    <div className="street-pack-head">
      <div><strong id="street-pack-heading">{t.sketchTitle}</strong>
        <p>{t.sketchIntro}</p>
      </div>
      <span className="street-pack-count">{stored.length}/4 {t.areas}</span>
    </div>
    <p className="street-pack-current">{t.selectedCenter}: {center.lat.toFixed(3)}, {center.lon.toFixed(3)} · {t.approx} {STREET_RADIUS/1000} {t.radius}. {t.starting}</p>
    <div className="street-pack-actions">
      <button type="button" className="secondary" onClick={download} disabled={!online||loading}>
        {loading?t.saving:t.download}
      </button>
      {selected&&<button type="button" className="secondary" onClick={()=>onDelete(selected.id)}>{t.hide}</button>}
    </div>
    {!online&&<p className="street-pack-message">{t.offline}</p>}
    {error&&<p className="street-pack-error" role="alert">{error}</p>}
    {status&&<p className="street-pack-message" role="status">{status}</p>}
    {selected&&<p className="street-pack-message">{t.showing} {selected.records.length} {t.ways} · {t.saved} {new Date(selected.savedAt).toLocaleString(language==='es'?'es-US':'en-US')} · {age===null?t.ageUnknown:age+' '+t.daysOld}. {t.noRoutes}</p>}
    {stored.length>0&&<div className="street-pack-areas" aria-label={t.sketchList}>
      {stored.map(pack=><div className="street-pack-area" key={pack.id}>
        <span>{pack.center.lat.toFixed(3)}, {pack.center.lon.toFixed(3)} · {pack.records.length} {t.ways}</span>
        <button type="button" className="secondary compact" onClick={()=>onSelect(pack,false)}>{t.view}</button>
        <button type="button" className="street-pack-remove" onClick={()=>erase(pack)}>{t.delete}</button>
      </div>)}
    </div>}
    <p className="street-pack-caveat">
      <strong>{t.sketchHeader}</strong> {t.sketchCaveat} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors (ODbL)</a>. {t.sketchPermission}
    </p>
  </section>
}
