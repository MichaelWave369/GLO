import { useEffect, useState } from 'react'
import { createPublicPack, packAge, parsePublicPack, sourcesFromPack, MAX_PACK_BYTES } from './offlinePack.js'
import { listPublicPacks, removePublicPack, savePublicPack } from './storage.js'
import './offlinePacks.css'

function niceTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString()
}
function exportFile(pack) {
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type:'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'GLO-public-OSM-' + pack.center.lat.toFixed(3) + '_' + pack.center.lon.toFixed(3) + '.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export default function OfflinePacksPanel({ scan, onUse, onRemove, onNotice }) {
  const [packs, setPacks] = useState([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [loadedId, setLoadedId] = useState('')
  useEffect(() => {
    let active = true
    listPublicPacks().then(items => {
      if (!active) return
      setPacks(items)
      // Restore last saved region locally, no request or geolocation permission.
      if (items.length) {
        setLoadedId(items[0].id)
        onUse(items[0], { restored:true })
      }
    }).catch(err => { if (active) setError('Offline public storage unavailable: ' + err.message) })
    return () => { active = false }
  }, []) // Intentionally runs on mount: no automatic network refresh.

  async function refresh() { setPacks(await listPublicPacks()) }
  async function saveCurrent() {
    if (!scan || !scan.sources?.length || pending) return
    setError(''); setPending(true)
    try {
      const pack = createPublicPack(scan)
      await savePublicPack(pack)
      await refresh()
      setLoadedId(pack.id)
      onNotice('A public OSM snapshot was saved to this device. It contains NO private notes. No offline street map was downloaded.')
    } catch (e) { setError(e.message) }
    finally { setPending(false) }
  }
  function usePack(pack) {
    try {
      setError('')
      onUse(pack, { restored:false })
      setLoadedId(pack.id)
    } catch (e) { setError(e.message) }
  }
  async function remove(pack) {
    if (!window.confirm('Delete this saved public snapshot from this device? Your private observations will not be touched.')) return
    setError('')
    try {
      await removePublicPack(pack.id)
      await refresh()
      if (loadedId === pack.id) { setLoadedId(''); onRemove(pack.id) }
      onNotice('Saved public resource snapshot deleted.')
    } catch(e) { setError(e.message) }
  }
  async function importPack(event) {
    const file=event.target.files?.[0]
    event.target.value=''
    if (!file || pending) return
    if (file.size > MAX_PACK_BYTES) { setError('File too large for an offline public pack.'); return }
    setPending(true);setError('')
    try {
      const pack = parsePublicPack(await file.text())
      await savePublicPack(pack)
      await refresh()
      usePack(pack)
      onNotice('A public OSM snapshot was imported locally. It is not a verified or current resource directory.')
    } catch(e) { setError('Import rejected: ' + e.message) }
    finally { setPending(false) }
  }
  return <section className="offline-panel" aria-labelledby="offline-heading">
    <div className="offline-top">
      <div><span className="eyebrow">TAKE THE RESOURCE LIST WITH YOU</span><h2 id="offline-heading">Offline Scout packs</h2>
        <p>Save a bounded snapshot of public OpenStreetMap resource records after a deliberate Scout search. Reopen it without internet, or exchange the file with another person. No private observations are included.</p>
      </div>
      <span className="offline-counter">{packs.length}/10 saved</span>
    </div>
    <div className="offline-actions">
      <button className="primary" disabled={pending || !scan?.sources?.length} onClick={saveCurrent}>
        {pending ? 'Working…' : 'Save this Scout search offline'}</button>
      <label className="secondary offline-import">
        Import public pack
        <input type="file" accept=".json,application/json" disabled={pending} onChange={importPack} aria-label="Import a GLO public resource pack"/>
      </label>
    </div>
    {error && <p className="offline-error" role="alert">{error}</p>}
    <div className="offline-entries">
      {packs.length ? packs.map(pack => <article className="offline-entry" key={pack.id}>
        <div><strong>{pack.center.lat.toFixed(3)}, {pack.center.lon.toFixed(3)}</strong>
          <small>{pack.records.length} public records · Last scanned {niceTime(pack.scannedAt)}</small>
          <span className={'offline-age '+packAge(pack).level}>{packAge(pack).label}</span>
          {pack.incomplete && <span className="offline-warn">The original query hit its result cap. Coverage may be incomplete.</span>}
          {loadedId===pack.id && <span className="offline-loaded">Selected on this device</span>}
        </div>
        <div className="offline-entry-actions">
          <button className="secondary compact" onClick={()=>usePack(pack)}>Use offline</button>
          <button className="secondary compact" onClick={()=>exportFile(pack)}>Export file</button>
          <button className="offline-delete" onClick={()=>remove(pack)}>Delete</button>
        </div>
      </article>) : <p className="offline-empty">No public region saved yet. Search the public map, then save its results. Importing a trusted public pack also works while offline.</p>}
    </div>
    <p className="offline-disclaimer"><strong>Not an offline street map.</strong> These are last-seen <em>map records</em>, not confirmed opening hours or working services. No background refresh occurs. Always check dates and accessibility. Source: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors, ODbL</a>. Do not present peer-shared packs as verified.</p>
  </section>
}
