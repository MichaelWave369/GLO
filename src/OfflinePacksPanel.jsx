import { useEffect, useState } from 'react'
import { createPublicPack, packAge, parsePublicPack, sourcesFromPack, MAX_PACK_BYTES } from './offlinePack.js'
import { listPublicPacks, removePublicPack, savePublicPack } from './storage.js'
import './offlinePacks.css'
import { mapPanelText, publicPackAgeLabel } from './mapPanelsLocale.js'

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

export default function OfflinePacksPanel({ scan, onUse, onRemove, onNotice, language='en' }) {
  const t=mapPanelText(language)
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
    }).catch(err => { if (active) setError(t.packUnavailable+': '+err.message) })
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
      onNotice(t.packSavedSuccess)
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
    if (!window.confirm(t.packConfirm)) return
    setError('')
    try {
      await removePublicPack(pack.id)
      await refresh()
      if (loadedId === pack.id) { setLoadedId(''); onRemove(pack.id) }
      onNotice(t.packDeleted)
    } catch(e) { setError(e.message) }
  }
  async function importPack(event) {
    const file=event.target.files?.[0]
    event.target.value=''
    if (!file || pending) return
    if (file.size > MAX_PACK_BYTES) { setError(t.packTooLarge); return }
    setPending(true);setError('')
    try {
      const pack = parsePublicPack(await file.text())
      await savePublicPack(pack)
      await refresh()
      usePack(pack)
      onNotice(t.packImported)
    } catch(e) { setError(t.packRejected+': '+e.message) }
    finally { setPending(false) }
  }
  return <section className="offline-panel" aria-labelledby="offline-heading">
    <div className="offline-top">
      <div><span className="eyebrow">{t.packEyebrow}</span><h2 id="offline-heading">{t.packHeading}</h2>
        <p>{t.packIntro}</p>
      </div>
      <span className="offline-counter">{packs.length}/10 {t.packSaved}</span>
    </div>
    <div className="offline-actions">
      <button className="primary" disabled={pending || !scan?.sources?.length} onClick={saveCurrent}>
        {pending ? t.working : t.packSave}</button>
      <label className="secondary offline-import">
        {t.packImport}
        <input type="file" accept=".json,application/json" disabled={pending} onChange={importPack} aria-label={t.packImportAria}/>
      </label>
    </div>
    {error && <p className="offline-error" role="alert">{error}</p>}
    <div className="offline-entries">
      {packs.length ? packs.map(pack => <article className="offline-entry" key={pack.id}>
        <div><strong>{pack.center.lat.toFixed(3)}, {pack.center.lon.toFixed(3)}</strong>
          <small>{pack.records.length} {t.publicRecords} · {t.lastScanned} {new Date(pack.scannedAt).toLocaleString(language==='es'?'es-US':'en-US')}</small>
          <span className={'offline-age '+packAge(pack).level}>{publicPackAgeLabel(pack,language)||packAge(pack).label}</span>
          {pack.incomplete && <span className="offline-warn">{t.packCap}</span>}
          {loadedId===pack.id && <span className="offline-loaded">{t.selected}</span>}
        </div>
        <div className="offline-entry-actions">
          <button className="secondary compact" onClick={()=>usePack(pack)}>{t.packUse}</button>
          <button className="secondary compact" onClick={()=>exportFile(pack)}>{t.packExport}</button>
          <button className="offline-delete" onClick={()=>remove(pack)}>{t.packDelete}</button>
        </div>
      </article>) : <p className="offline-empty">{t.packEmpty}</p>}
    </div>
    <p className="offline-disclaimer"><strong>{t.packCaveatHead}</strong> {t.packCaveat} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors, ODbL</a>. {t.packCaveatEnd}</p>
  </section>
}
