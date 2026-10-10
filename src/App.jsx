import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet'
import { CATEGORIES, PILOT_CENTER, distanceKm, normalizeReport, privateBackup } from './domain.js'
import { listReports, saveReport, removeReport, clearAllReports } from './storage.js'
import GloAgentDock from './GloAgentDock.jsx'
import UpdateNotice from './UpdateNotice.jsx'
import PocketPlan from './PocketPlan.jsx'
import OfflinePacksPanel from './OfflinePacksPanel.jsx'
import StreetSketchPanel from './StreetSketchPanel.jsx'
import { sourcesFromPack } from './offlinePack.js'
import { initialDraft, localDateTime } from './pinDraft.js'
import { listRowsForMode, visibleSaveReceipt, activeShareTarget } from './resourceView.js'
import MapPinIcon from './MapPinIcon.jsx'
import { TEXT, accessText, parseSharedPin } from './fieldKit.js'
import { CrisisCard, SharePanel, SharedPreview } from './FieldTools.jsx'

function MapNavigator({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], target.zoom || 14, { duration: 0.25 })
  }, [target, map])
  return null
}
function MapPicker({ enabled, onPick }) {
  useMapEvents({ click: (e) => { if (enabled) onPick(e.latlng) } })
  return null
}
function MapCenterTracker({ onMove }) {
  useMapEvents({ moveend: (e) => { const point = e.target.getCenter(); onMove({ lat: point.lat, lon: point.lng }) } })
  return null
}
function fmtDate(value) {
  const time = new Date(value)
  return Number.isNaN(time.getTime()) ? 'Unknown time' : time.toLocaleString()
}
export default function App() {
  const [reports, setReports] = useState([])
  const [language, setLanguage] = useState('en')
  const [lowBattery, setLowBattery] = useState(false)
  const [sharingPin, setSharingPin] = useState(null)
  const [sharedPreview, setSharedPreview] = useState(() => parseSharedPin(window.location.hash))
  const [panicCovered, setPanicCovered] = useState(false)
  const [panicCleared, setPanicCleared] = useState(false)
  const t = TEXT[language]
  const [selectedId, setSelectedId] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialDraft)
  const [online, setOnline] = useState(navigator.onLine)
  const [tiles, setTiles] = useState(false)
  const [streetSketch, setStreetSketch] = useState(null)
  const [reference, setReference] = useState(PILOT_CENTER)
  const [mapCenter, setMapCenter] = useState(PILOT_CENTER)
  const [publicCandidates, setPublicCandidates] = useState([])
  const [sourceScan, setSourceScan] = useState(null)
  const [activePackId, setActivePackId] = useState('')
  const [packRevision, setPackRevision] = useState(0)
  const [target, setTarget] = useState(null)
  const [notice, setNotice] = useState('No account needed. Your observations stay on this device.')
  const [error, setError] = useState('')
  const [locationHint, setLocationHint] = useState('')
  const [formError, setFormError] = useState('')
  const [savedFeedback, setSavedFeedback] = useState(null)
  const editorRef = useRef(null)
  const savedFeedbackRef = useRef(null)
  const mapFrameRef = useRef(null)
  const packsDetailsRef = useRef(null)
  const locationRequest = useRef(0)

  async function refresh() {
    try { setReports(await listReports()); setError('') }
    catch (e) { setError(e.message || 'Local storage unavailable') }
  }
  useEffect(() => {
    refresh()
    const yes = () => setOnline(true)
    const no = () => setOnline(false)
    window.addEventListener('online', yes)
    window.addEventListener('offline', no)
    return () => { window.removeEventListener('online', yes); window.removeEventListener('offline', no) }
  }, [])

  const visible = useMemo(() => reports.filter((r) =>
    (filter === 'all' || r.category === filter) &&
    (r.title + ' ' + r.note).toLowerCase().includes(query.trim().toLowerCase())
  ).sort((a, b) => distanceKm(reference, a) - distanceKm(reference, b)), [reports, filter, query, reference])

  const visiblePublic = useMemo(() => publicCandidates.filter((r) =>
    (filter === 'all' || r.category === filter) &&
    (r.title + ' ' + (r.accessNote || '')).toLowerCase().includes(query.trim().toLowerCase())
  ).sort((a,b)=>distanceKm(reference,a)-distanceKm(reference,b)), [publicCandidates, filter, query, reference])
  const displayedRows = useMemo(() => listRowsForMode(visible, visiblePublic, lowBattery)
    .sort((a,b) => distanceKm(reference,a) - distanceKm(reference,b)), [visible,visiblePublic,lowBattery,reference])
  const displayedReceipt = visibleSaveReceipt(savedFeedback, reports)
  const chosenRecord = reports.find(r=>r.id===selectedId) || publicCandidates.find(r=>r.id===selectedId)
  const selectedResource = chosenRecord ? { title: chosenRecord.title, from: reports.some(r=>r.id===selectedId)?'private':'osm' } : null
  // The share panel is tied to a live report, not to a stale copied React object.
  const activeSharingPin = activeShareTarget(sharingPin, reports, publicCandidates)

  function onScoutRecords(records, metadata = null) {
    setPublicCandidates(records)
    setSourceScan(metadata ? { ...metadata, sources: records } : null)
    setActivePackId('')
  }
  function useOfflinePack(pack, { restored = false } = {}) {
    const sources = sourcesFromPack(pack)
    setPublicCandidates(sources)
    setSourceScan(null)
    setActivePackId(pack.id)
    setPackRevision(v => v + 1)
    setReference(pack.center)
    setTarget({ ...pack.center, zoom:14 })
    setNotice((restored ? 'Restored' : 'Loaded') + ' offline public Scout pack (' + sources.length +
      ' records). Last queried: ' + new Date(pack.scannedAt).toLocaleString() +
      '. Records are unverified, and no street map was downloaded.')
  }
  function removeOfflinePack(id) {
    if (id !== activePackId) return
    setPublicCandidates([])
    setSourceScan(null)
    setActivePackId('')
    setPackRevision(v => v + 1)
  }

  function jumpTo(r) {
    setSelectedId(r.id)
    setTarget({ lat: r.lat, lon: r.lon, zoom: r.scope === 'area' ? 12 : 16 })
  }
  function locate() {
    if (!navigator.geolocation) { setNotice('Location API unavailable. Pick a location by tapping the map.'); return }
    setNotice('Requesting device location permission. GLO Pin does not upload your coordinates.')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const center = { lat: coords.latitude, lon: coords.longitude }
      setReference(center)
      setTarget({ ...center, zoom: 15 })
      if (editing) setDraft((d) => ({ ...d, lat: center.lat.toFixed(6), lon: center.lon.toFixed(6) }))
      setNotice('Map centered. GLO Pin does not save a location history.')
    }, () => setNotice('Location permission declined or unavailable. You can still use the map.'), {
      enableHighAccuracy: false, maximumAge: 60000, timeout: 12000
    })
  }
  function startPinLocation() {
    // This runs ONLY when the user explicitly taps Use my location.
    const token = ++locationRequest.current
    setLocationHint(language === 'es'
      ? 'Buscando tu ubicación con permiso. Si no está disponible, elige un punto en el mapa o escribe las coordenadas.'
      : 'Requesting your location. If unavailable, tap the map or enter coordinates. Nothing is prefilled from Stroudsburg.')
    if (!navigator.geolocation) {
      setLocationHint(language === 'es' ? 'Ubicación no disponible. Elige el lugar manualmente.' : 'Location unavailable. Choose the location manually.')
      return
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (locationRequest.current !== token) return
      const point = { lat: coords.latitude, lon: coords.longitude }
      setDraft(d => ({ ...d, lat: point.lat.toFixed(6), lon: point.lon.toFixed(6) }))
      setReference(point)
      setTarget({ ...point, zoom: 16 })
      setLocationHint(language === 'es' ? 'Ubicación del dispositivo seleccionada. Confirma el lugar antes de guardar.' : 'Device location selected. Check the coordinates before saving.')
    }, () => {
      if (locationRequest.current !== token) return
      setLocationHint(language === 'es'
        ? 'No se obtuvo la ubicación. Toca el mapa o escribe la latitud y longitud antes de guardar.'
        : 'Location denied or unavailable. Tap the map or enter latitude and longitude before saving.')
    }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 })
  }
  function begin() {
    setDraft(initialDraft()) // Never silently use Stroudsburg or the last map view for a new report.
    locationRequest.current += 1
    setSavedFeedback(null)
    setFormError('')
    setLocationHint(t.locationChoice)
    setEditing(true)
    window.requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  function cancelEdit() {
    locationRequest.current += 1
    setEditing(false)
    setFormError('')
    setLocationHint('')
  }
  function chooseOnMap() {
    if (lowBattery) setLowBattery(false)
    window.requestAnimationFrame(() => mapFrameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  function pickCoordinates({ lat, lng }) {
    locationRequest.current += 1 // A manual map tap must win over a delayed geolocation callback.
    setDraft(d => ({ ...d, lat: lat.toFixed(6), lon: lng.toFixed(6) }))
    setLocationHint(language === 'es' ? 'Lugar seleccionado en el mapa. Comprueba las coordenadas.' : 'Location selected from map. Review coordinates before saving.')
    window.requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  function openPacks() {
    if (packsDetailsRef.current) packsDetailsRef.current.open = true
    window.requestAnimationFrame(() => packsDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  async function save(e) {
    e.preventDefault()
    setFormError('')
    try {
      const report = normalizeReport(draft)
      await saveReport(report)
      locationRequest.current += 1
      await refresh()
      setEditing(false)
      setSavedFeedback({ id:report.id, title:report.title })
      jumpTo(report)
      setNotice('') // The accessible, contextual receipt below is the only save confirmation.
      window.requestAnimationFrame(() => savedFeedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    } catch (err) {
      setFormError(err.message || 'Unable to save this observation.')
    }
  }
  async function erase(r) {
    if (!confirm('Permanently delete this private observation?')) return
    try {
      // Revoke any still-visible approval UI before performing deletion.
      // Previously copied links/QRs remain beyond GLO's control.
      setSharingPin(current => current?.id === r.id ? null : current)
      await removeReport(r.id)
      setSavedFeedback(current => current?.id === r.id ? null : current)
      await refresh()
      if (selectedId === r.id) setSelectedId('')
      setNotice('Local observation deleted.')
    }
    catch (err) { setNotice(err.message || 'Unable to delete') }
  }
  function panicClear() {
    // Cover first. Defer confirmation so the shield gets an opportunity to paint.
    setPanicCleared(false)
    setPanicCovered(true)
    window.setTimeout(async () => {
      const approved = window.confirm(t.panicConfirm)
      if (!approved) { setPanicCovered(false); return }
      try {
      locationRequest.current += 1
      await clearAllReports()
      setReports([])
      setSavedFeedback(null)
      setPublicCandidates([])
      setStreetSketch(null)
      setSourceScan(null)
      setActivePackId('')
      setSharingPin(null)
      setSharedPreview(null)
      setSelectedId('')
      setDraft(initialDraft())
      setQuestionCleared()
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      setPanicCleared(true)
      } catch (err) {
        setPanicCovered(false)
        setNotice((err?.message || 'Unable to erase data.') + ' Check browser storage settings.')
      }
    }, 45)
  }
  function setQuestionCleared() { setEditing(false); setTiles(false) }
  function changeLowBattery() {
    if (!lowBattery) setTiles(false)
    setLowBattery(v => !v)
  }
  function closeShared() {
    setSharedPreview(null)
    window.history.replaceState(null,'',window.location.pathname + window.location.search)
  }
  function backup() {
    if (!reports.length) return
    const blob = new Blob([JSON.stringify(privateBackup(reports), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'GLO-Pin-PRIVATE-backup.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('A private backup was downloaded. It contains exact coordinates and notes. Keep it secure.')
  }

  if (panicCovered) return <main style={{ minHeight:'100vh', padding:'32px', background:'#080c08', color:'#f2f4f1', fontFamily:'system-ui', display:'grid', placeContent:'center', textAlign:'center', gap:'18px' }}>
    <h1 style={{color:'#f2f4f1',fontSize:'36px'}}>GLO</h1>
    <p>{panicCleared ? t.cleared : language === 'es' ? 'GLO oculto. Confirma para borrar los datos privados.' : 'GLO hidden. Confirm to erase your local records.'}</p>
    <p>{language === 'es' ? 'Cierra esta pestaña. Los archivos exportados y el historial del navegador siguen en tu dispositivo.' : 'Close this tab. Previously exported files and browser history may remain on your device.'}</p>
  </main>
  return <div className={'shell' + (lowBattery ? ' low-battery' : '')}>
    <header className="masthead">
      <a href="./" className="brand">
        <img src={import.meta.env.BASE_URL + 'glo-pin.svg'} width="44" height="44" alt="" />
        <span><strong>GLO <span>Pin</span></strong><small>GOOD LOOKIN' OUT</small></span>
      </a>
      <div className="status"><span className="status-dot" />{online ? 'Browser online' : 'Browser offline'}<span className="chip">LOCAL FIRST</span></div>
    </header>
    <main>
      <div className="field-controls">
        <button type="button" className="secondary" onClick={() => setLanguage(v => v === 'en' ? 'es' : 'en')}>{t.language}</button>
        <button type="button" className="secondary" onClick={changeLowBattery}>{lowBattery ? t.batteryOff : t.battery}</button>
        <button type="button" className="panic-btn" onClick={panicClear}>{t.panic}</button>
      </div>
      <UpdateNotice language={language}/>
      <CrisisCard language={language}/>
      <section className="hero">
        <div className="eyebrow">{t.heroEyebrow}</div>
        <h1>{t.heroFirst}<br/><em>{t.heroSecond}</em></h1>
        <p>{t.description}</p>
        <div className="actions"><button className="primary" onClick={begin}>+ {t.add}</button><button className="secondary" onClick={locate}>◎ {t.locate}</button></div>
      </section>
      <PocketPlan language={language} resource={selectedResource}/>
      <SharedPreview pin={sharedPreview} language={language} onView={() => { if (lowBattery) changeLowBattery(); jumpTo(sharedPreview) }} onDismiss={closeShared}/>
      {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
      {error && <div className="warning" role="alert">Storage error: {error}. Your observations may not be saved.</div>}
      <section className="workspace" aria-label="GLO resource map">
        <aside className="sidebar">
          {editing ? <form ref={editorRef} className="pin-editor" onSubmit={save}>
            <div className="eyebrow">PRIVATE · DEVICE ONLY</div>
            <div className="header-row"><h2>{t.pinFormTitle}</h2><button type="button" className="close" onClick={cancelEdit} aria-label="Cancel editing">×</button></div>
            <div className="location-hint" role="status" aria-live="polite">{locationHint}</div>
            <div className="actions location-actions">
              <button className="secondary" type="button" onClick={startPinLocation}>{t.locate}</button>
              <button className="secondary" type="button" onClick={chooseOnMap}>{t.pickMap}</button>
            </div>
            <p className="help">{language === 'es' ? 'Solo registra recursos públicos. Nunca señales dónde duerme una persona, domicilios privados o personas. Son observaciones, no garantía de seguridad.' : 'Record only public resources or official shelter programs. Never pin personal sleeping places, camps, private homes or people. A report is not a safety certification.'}</p>
            <label htmlFor="category">{t.type}</label>
            <select id="category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {Object.entries(CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
            </select>
            <label htmlFor="title">{t.observed}</label>
            <input id="title" required maxLength="90" value={draft.title} placeholder="e.g. a public refill fountain" onChange={(e) => setDraft({ ...draft, title: e.target.value })}/>
            <label htmlFor="note">{t.note}</label>
            <textarea id="note" rows="4" maxLength="400" value={draft.note} placeholder="Avoid names, identities and sensitive details." onChange={(e) => setDraft({ ...draft, note: e.target.value })}/>
            <label htmlFor="hours">{t.hours}</label>
            <input id="hours" maxLength="100" value={draft.reportedHours} placeholder={language === 'es' ? 'Ej.: lun–vie 9–17' : 'e.g. Mon–Fri 9–5'} onChange={e => setDraft({...draft,reportedHours:e.target.value})}/>
            <label htmlFor="observed-at">{language === 'es' ? 'Fecha y hora de la observación' : 'When did you actually observe this?'}</label>
            <input id="observed-at" type="datetime-local" required value={draft.observedAtLocal} max={localDateTime()} onChange={e => setDraft({...draft, observedAtLocal:e.target.value})}/>
            <label htmlFor="visit-status">{t.status}</label>
            <select id="visit-status" value={draft.visitStatus} onChange={e => setDraft({...draft,visitStatus:e.target.value})}>
              <option value="unknown">{t.unknown}</option>
              <option value="working">{t.worked}</option>
              <option value="not_working">{t.broken}</option>
            </select>
            <p className="help">{language === 'es' ? 'Indica cuándo lo viste en realidad. “Funcionaba” solo se refiere a esa fecha. La fecha de guardado se registra aparte.' : 'Enter when you actually saw the resource. “Worked” only means it worked at that reported time. Saved time is recorded separately.'}</p>
            <strong className="input-label">{t.access}</strong>
            <div className="access-fields">{[
              ['wheelchair', t.wheelchair],['stepFree',t.stepFree],['idRequired',t.id],['petsAllowed',t.pets]
            ].map(([key,label])=><div key={key}><label htmlFor={'access-'+key}>{label}</label>
              <select id={'access-'+key} value={draft.accessibility[key]} onChange={e=>setDraft(d=>({...d,accessibility:{...d.accessibility,[key]:e.target.value}}))}>
                <option value="unknown">{t.dontKnow}</option><option value="yes">{t.yes}</option><option value="no">{t.no}</option>
              </select></div>)}</div>
            <div className="coordinates">
              <div><label htmlFor="lat">{language === 'es' ? 'Latitud' : 'Latitude'}</label><input id="lat" type="number" min="-90" max="90" step="any" required placeholder="40.986" value={draft.lat} onChange={(e) => setDraft({ ...draft, lat: e.target.value })}/></div>
              <div><label htmlFor="lon">{language === 'es' ? 'Longitud' : 'Longitude'}</label><input id="lon" type="number" min="-180" max="180" step="any" required placeholder="-75.194" value={draft.lon} onChange={(e) => setDraft({ ...draft, lon: e.target.value })}/></div>
            </div>
            <p className="help">{t.locationRequired}</p>
            {formError && <p className="warning inline-error" role="alert">{formError}</p>}
            <div className="actions"><button type="button" className="secondary" onClick={cancelEdit}>{t.cancel}</button><button type="submit" className="primary" disabled={!!error}>{t.save}</button></div>
          </form> : <>
            {displayedReceipt && <div ref={savedFeedbackRef} className="saved-feedback" role="status" aria-live="polite">{language === 'es' ? 'Guardado solo en este dispositivo: ' : 'Saved on this device only: '}{displayedReceipt.title}{language === 'es' ? '. No se publicó.' : '. Nothing was published.'}</div>}
            <div className="header-row"><div><div className="eyebrow">RESOURCE EXPLORER</div><h2>{t.resources}</h2></div><span className="counter">{reports.length} {language === 'es' ? 'privados' : 'private'}{lowBattery ? ` + ${publicCandidates.length} ${language === 'es' ? 'públicos' : 'mapped'}` : ''}</span></div>
            <p className="help">{t.private} {publicCandidates.length && !lowBattery ? (language === 'es' ? 'Los resultados públicos están abajo, en Scout, y aparecen como puntos separados en el mapa.' : 'Public map results are listed once in Scout below and shown as separate map markers.') : ''}</p>
            <label htmlFor="search">{t.search}</label>
            <input id="search" type="search" placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)}/>
            <div className="filters" role="group" aria-label="Filter by resource type">
              <button className={filter === 'all' ? 'filter active' : 'filter'} onClick={() => setFilter('all')}>All</button>
              {Object.entries(CATEGORIES).map(([key, value]) => <button key={key} className={filter === key ? 'filter active' : 'filter'} onClick={() => setFilter(key)}>{value.icon} {value.label}</button>)}
            </div>
            <div className="results">
              {displayedRows.length ? displayedRows.map((r) => <article className={'pin-card' + (selectedId === r.id ? ' selected' : '')} key={r.id}>
                <button className="pin-card-main" onClick={() => jumpTo(r)}>
                  <span className="category-icon">{CATEGORIES[r.category].icon}</span>
                  <span className="pin-info"><strong>{r.title}</strong><small>{CATEGORIES[r.category].label} · {distanceKm(reference, r).toFixed(1)} km from map search center</small>{r.note && <span className="pin-note">{r.note}</span>}<small>{r.from === 'osm' ? 'OpenStreetMap · ' + (r.checkedAt || '') : t.seen + ': ' + fmtDate(r.lastSeenWorkingAt || r.observedAt)} · {t.noteStatus}</small>
                    {r.reportedHours && <span className="local-observation">{t.reported}: {r.reportedHours}</span>}
                    {r.visitStatus === 'not_working' && <span className="local-observation">{t.broken}</span>}
                    {r.visitStatus === 'working' && <span className="local-observation">{t.worked}: {fmtDate(r.lastSeenWorkingAt || r.observedAt)}</span>}
                    {r.accessibility && Object.entries(r.accessibility).filter(([,v])=>v!=='unknown').map(([key,value])=><span className="local-observation" key={key}>{({wheelchair:t.wheelchair,stepFree:t.stepFree,idRequired:t.id,petsAllowed:t.pets})[key]}: {accessText(key,value,language)}</span>)}</span>
                </button>
                <div className="pin-actions">
                  <button onClick={() => setSharingPin(r)}>{t.share}</button>
                  {r.from === 'osm' ? <a href={r.sourceUrl} rel="noopener noreferrer" target="_blank">OSM ↗</a> : <button className="delete" onClick={() => erase(r)} aria-label={'Delete ' + r.title}>{language === 'es' ? 'Borrar punto' : 'Delete local pin'}</button>}
                </div>
              </article>) : <div className="empty"><span className="empty-symbol"><MapPinIcon size={42}/></span><strong>{language === 'es' ? 'No hay puntos que mostrar' : lowBattery ? 'No resources to show' : 'No private pins yet'}</strong><p>{t.noPins}</p><button className="plain-link" onClick={begin}>Add a pin →</button></div>}
            </div>
            <SharePanel key={activeSharingPin?.id || "none"} pin={activeSharingPin} language={language} onClose={() => setSharingPin(null)}/>
            <div className="backup"><strong>Keep your own data</strong><p>Download a private JSON backup. This file contains your coordinates and notes; it does not upload.</p><button className="secondary compact" disabled={!reports.length} onClick={backup}>{t.backup}</button></div>
          </>}
        </aside>
        {!lowBattery && <div className="map-column">
          <div className="map-top"><div><strong>Explore the map</strong><small>Starting view: Stroudsburg, PA (not your detected position)</small></div>
            <div className="map-actions"><button className="secondary compact" onClick={locate}>◎ Center on me</button><label className="switch"><input type="checkbox" checked={online && tiles} disabled={!online} onChange={(e) => setTiles(e.target.checked)} />Online street tiles</label></div>
          </div>
          <div className="map-frame" ref={mapFrameRef}>
            <MapContainer className="leaflet-map" center={[PILOT_CENTER.lat, PILOT_CENTER.lon]} zoom={13} scrollWheelZoom={false}>
              {online && tiles && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'/>}
              <MapNavigator target={target}/>
              {streetSketch && !(online && tiles) && streetSketch.records.map(way => <Polyline key={way.id} positions={way.coordinates} pathOptions={{color:way.kind==='water'?'#3587b1':way.tag==='footway'||way.tag==='path'||way.tag==='steps'?'#947342':'#627b68',weight:way.kind==='water'?3:way.tag==='footway'?2:4,opacity:.85,dashArray:way.tag==='footway'||way.tag==='path'?'5 6':undefined}}><Popup><strong>{way.name||'Unnamed mapped way'}</strong><p>OpenStreetMap {way.kind==='water'?'waterway':'road/path'} ({way.tag}). Not verified safe or currently accessible.</p></Popup></Polyline>)}
              <MapCenterTracker onMove={setMapCenter}/>
              <MapPicker enabled={editing} onPick={pickCoordinates}/>
              {visiblePublic.map((r) => <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={selectedId === r.id ? 12 : 9} pathOptions={{ color: '#457695', fillColor: r.category === 'water' ? '#83d4e4' : r.category === 'power' ? '#eec575' : '#a9cfa1', fillOpacity: 0.85, weight: 2, dashArray: '4 3' }} eventHandlers={{ click: () => setSelectedId(r.id) }}>
                <Popup><strong>{r.title}</strong><br/>{CATEGORIES[r.category].label}<br/>OpenStreetMap record · Not verified<br/><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">View OSM record</a></Popup>
              </CircleMarker>)}
              {sharedPreview && (sharedPreview.scope === 'area' ? <Circle center={[sharedPreview.lat, sharedPreview.lon]} radius={900} pathOptions={{color:'#6636ac',fillColor:'#b68be0',fillOpacity:.12,dashArray:'7 7',weight:2}}><Popup><strong>{sharedPreview.title}</strong><br/>Approximate area only · NOT an entrance · Unverified</Popup></Circle> : <CircleMarker center={[sharedPreview.lat, sharedPreview.lon]} radius={12} pathOptions={{color:'#6636ac',fillColor:'#b68be0',fillOpacity:.9}}><Popup><strong>{sharedPreview.title}</strong><br/>Exact peer-shared location · Unverified</Popup></CircleMarker>)}}
              {visible.map((r) => <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={selectedId === r.id ? 11 : 8} pathOptions={{ color: '#155d4e', fillColor: r.category === 'water' ? '#4aa9c0' : r.category === 'power' ? '#ecb64e' : '#81b77b', fillOpacity: 0.94, weight: 3 }} eventHandlers={{ click: () => setSelectedId(r.id) }}>
                <Popup><strong>{r.title}</strong><br/>{CATEGORIES[r.category].label}<br/>Self-reported · Unverified<br/>Private to this device</Popup>
              </CircleMarker>)}
            </MapContainer>
            {!(online && tiles) && <div className="map-label">NO STREET BASEMAP · LOCAL MARKERS ONLY</div>}
            {editing && <div className="map-tip">Tap map to choose pin location</div>}
          </div>
          <div className="map-footnote"><strong>Map privacy:</strong> Online street tiles remain OFF by default. You can separately save an offline OSM neighborhood sketch below. It shows real mapped streets and paths but does NOT provide complete offline navigation or current accessibility.</div>
          <StreetSketchPanel center={mapCenter} online={online} selected={streetSketch}
            onSelect={(pack,restored)=>{setStreetSketch(pack);setTarget({...pack.center,zoom:15});setNotice((restored?'Restored':'Selected')+' '+pack.records.length+' offline streets, paths and waterways. No directions or live conditions.')}}
            onDelete={()=>setStreetSketch(null)}/>
        </div>}
      </section>
      {!lowBattery && <GloAgentDock center={mapCenter} localReports={reports} online={online}
        onSourcesChange={onScoutRecords} sourceRecords={publicCandidates} packRevision={packRevision} onNavigate={jumpTo} onOpenPacks={openPacks}/>}
      <details className="packs-fold" ref={packsDetailsRef}>
        <summary>{language === 'es' ? 'Guardar o abrir recursos sin conexión' : 'Save or open offline resource packs'}</summary>
        <OfflinePacksPanel scan={sourceScan} onUse={useOfflinePack} onRemove={removeOfflinePack} onNotice={setNotice}/>
      </details>
      <div className="principles"><div><b>◇</b><strong>No accounts</strong><p>Use GLO Pin without creating a profile.</p></div><div><b>⌁</b><strong>Local first</strong><p>Saved reports stay on-device; optional peer links only expose approved fields.</p></div><div><b>✓</b><strong>Evidence over guesses</strong><p>Reports are marked self-reported, never certified safe.</p></div></div>
    </main>
    <footer>GLO Pin · Good Lookin' Out · <a href="https://github.com/MichaelWave369/GLO">Open-source repository</a><span>v0.1 prototype · Not an emergency service · No community sync</span></footer>
  </div>
}
