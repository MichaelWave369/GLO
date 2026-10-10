import { useEffect, useRef, useState } from 'react'
import { fetchStreetSketch, STREET_RADIUS, sketchAge } from './streetSketch.js'
import { listStreetSketches, saveStreetSketch, deleteStreetSketch } from './storage.js'

export default function StreetSketchPanel({ center, online, selected, onSelect, onDelete }) {
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
      'Download a small public OpenStreetMap roads-and-paths sketch around '+center.lat.toFixed(3)+', '+center.lon.toFixed(3)+
      '? This sends the rounded map center and your IP address to an external Overpass server. No private pins or observations are included.'
    ))return
    const ctl=new AbortController()
    controller.current=ctl
    setLoading(true);setError('');setStatus('')
    try{
      const pack=await fetchStreetSketch(center,ctl.signal)
      await saveStreetSketch(pack)
      await refresh()
      onSelect(pack,false)
      setStatus('Saved '+pack.records.length+' streets, paths and waterways to this device. They are now visible with street tiles OFF.')
    }catch(e){
      if(!ctl.signal.aborted)setError(e.message||'Could not download neighborhood streets.')
    }finally{if(!ctl.signal.aborted)setLoading(false)}
  }
  async function erase(pack) {
    if(!window.confirm('Delete these saved streets from this device? Your resource pins are unchanged.'))return
    try{
      setError('')
      await deleteStreetSketch(pack.id)
      await refresh()
      if(selected?.id===pack.id)onDelete(pack.id)
      setStatus('Offline street sketch deleted.')
    }catch(e){setError(e.message)}
  }
  const age=selected?sketchAge(selected):null
  return <section className="street-pack" aria-labelledby="street-pack-heading">
    <div className="street-pack-head">
      <div><strong id="street-pack-heading">Offline neighborhood streets</strong>
        <p>Save a small, real OSM street-and-path sketch for offline viewing with your pins. No street-tile download, account, or location history.</p>
      </div>
      <span className="street-pack-count">{stored.length}/4 areas</span>
    </div>
    <p className="street-pack-current">Selected map center: {center.lat.toFixed(3)}, {center.lon.toFixed(3)} · about {STREET_RADIUS/1000} km radius. The default map starts in Stroudsburg, not at your location.</p>
    <div className="street-pack-actions">
      <button type="button" className="secondary" onClick={download} disabled={!online||loading}>
        {loading?'Saving neighborhood…':'Download roads & paths here'}
      </button>
      {selected&&<button type="button" className="secondary" onClick={()=>onDelete(selected.id)}>Hide saved streets</button>}
    </div>
    {!online&&<p className="street-pack-message">Offline: use one of your saved street sketches. Download requires connectivity.</p>}
    {error&&<p className="street-pack-error" role="alert">{error}</p>}
    {status&&<p className="street-pack-message" role="status">{status}</p>}
    {selected&&<p className="street-pack-message">Showing {selected.records.length} public ways · saved {new Date(selected.savedAt).toLocaleString()} · {age===null?'age unknown':age+' days old'}. No travel-route or access guarantee.</p>}
    {stored.length>0&&<div className="street-pack-areas" aria-label="Saved neighborhood street sketches">
      {stored.map(pack=><div className="street-pack-area" key={pack.id}>
        <span>{pack.center.lat.toFixed(3)}, {pack.center.lon.toFixed(3)} · {pack.records.length} ways</span>
        <button type="button" className="secondary compact" onClick={()=>onSelect(pack,false)}>View streets</button>
        <button type="button" className="street-pack-remove" onClick={()=>erase(pack)}>Delete</button>
      </div>)}
    </div>}
    <p className="street-pack-caveat">
      <strong>Neighborhood sketch, not turn-by-turn navigation.</strong> Roads and footpaths may be missing or inaccessible; no directions, offline addresses, elevation or complete street labels. Query may be truncated. Source: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors (ODbL)</a>. Only an explicit download contacts Overpass. The public map-tile switch remains separate and off by default.
    </p>
  </section>
}
