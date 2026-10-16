import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet'
import { CATEGORIES, PILOT_CENTER, distanceKm, normalizeReport } from './domain.js'
import { listReports, saveReport, removeReport, clearAllReports } from './storage.js'
import GloAgentDock from './GloAgentDock.jsx'
import UpdateNotice from './UpdateNotice.jsx'
import PocketPlan from './PocketPlan.jsx'
import BackupReview from './BackupReview.jsx'
import BackupRestore from './BackupRestore.jsx'
import ResearchSpot from './ResearchSpot.jsx'
import ResearchBackup from './ResearchBackup.jsx'
import PrivacyInspector from './PrivacyInspector.jsx'
import NearbyFinder from './NearbyFinder.jsx'
import OfflinePacksPanel from './OfflinePacksPanel.jsx'
import StreetSketchPanel from './StreetSketchPanel.jsx'
import { sourcesFromPack } from './offlinePack.js'
import { initialDraft, localDateTime } from './pinDraft.js'
import { listRowsForMode, visibleSaveReceipt, activeShareTarget } from './resourceView.js'
import MapPinIcon from './MapPinIcon.jsx'
import RecheckPanel, { RecheckHistory } from './RecheckPanel.jsx'
import { latestRecheck } from './recheck.js'
import { TEXT, accessText, parseSharedPin } from './fieldKit.js'
import { categoryLabel, connectionDisplay, UI } from './locale.js'
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
  const [recheckTargetId, setRecheckTargetId] = useState('')
  const [backupReviewOpen, setBackupReviewOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [researchBackupOpen, setResearchBackupOpen] = useState(false)
  const [privacyInspectorOpen, setPrivacyInspectorOpen] = useState(false)
  const [researchOpen, setResearchOpen] = useState(false)
  const [researchTargetId, setResearchTargetId] = useState('')
  const [sharedPreview, setSharedPreview] = useState(() => parseSharedPin(window.location.hash))
  const [panicCovered, setPanicCovered] = useState(false)
  const [panicCleared, setPanicCleared] = useState(false)
  const t = TEXT[language]
  const ui = UI[language]
  const [selectedId, setSelectedId] = useState('')
  const [finderFocus, setFinderFocus] = useState(null)
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
  const [notice, setNotice] = useState({key:'welcome'})
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
    const syncConnection = () => setOnline(navigator.onLine)
    window.addEventListener('online', syncConnection)
    window.addEventListener('offline', syncConnection)
    window.addEventListener('focus', syncConnection)
    window.addEventListener('pageshow', syncConnection)
    const whenVisible = () => { if(document.visibilityState==='visible')syncConnection() }
    document.addEventListener('visibilitychange', whenVisible)
    syncConnection()
    return () => {
      window.removeEventListener('online', syncConnection)
      window.removeEventListener('offline', syncConnection)
      window.removeEventListener('focus', syncConnection)
      window.removeEventListener('pageshow', syncConnection)
      document.removeEventListener('visibilitychange', whenVisible)
    }
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
  // Pocket Plan remains intentionally scoped to name + provenance only.
  const selectedResource = chosenRecord ? { title: chosenRecord.title, from: reports.some(r=>r.id===selectedId)?'private':'osm' } : null
  // A private pin deleted in this session cannot leave an orphan map focus.
  const activeFinderFocus = finderFocus?.origin==='private' &&
    !reports.some(r=>r.id===finderFocus.id) ? null : finderFocus
  const finderSelectedPoint = chosenRecord || activeFinderFocus
  // The share panel is tied to a live report, not to a stale copied React object.
  const activeSharingPin = activeShareTarget(sharingPin, reports, publicCandidates)
  const activeRecheckReport = reports.find(r=>r.id===recheckTargetId) || null
  const researchTarget = reports.find(r=>r.id===researchTargetId) || publicCandidates.find(r=>r.id===researchTargetId) || null
  const researchLocalPinId = reports.some(r=>r.id===researchTarget?.id) ? researchTarget.id : null

  function onScoutRecords(records, metadata = null) {
    setPublicCandidates(records)
    setSourceScan(metadata ? { ...metadata, sources: records } : null)
    setActivePackId('')
  }
  function useOfflinePack(pack, { restored = false } = {}) {
    const sources = sourcesFromPack(pack)
    setPublicCandidates(sources)
    // Retain public scan provenance for optional on-demand same-neighborhood comparisons.
    // This is not a network refresh and never upgrades map records to verified.
    setSourceScan({ center: pack.center, checkedAt:pack.scannedAt, sources, mayBeIncomplete:pack.incomplete })
    setActivePackId(pack.id)
    setPackRevision(v => v + 1)
    setReference(pack.center)
    setTarget({ ...pack.center, zoom:14 })
    setNotice((restored ? ui.offlinePackRestore : ui.offlinePackLoad) + ' ' + ui.offlinePackLabel + ' (' + sources.length +
      ' ' + ui.offlinePackRecords + '). '+ui.offlinePackQueried+': ' + new Date(pack.scannedAt).toLocaleString(language==='es'?'es-US':'en-US') +
      '. Records are unverified, and no street map was downloaded.')
  }
  function removeOfflinePack(id) {
    if (id !== activePackId) return
    setPublicCandidates([])
    setSourceScan(null)
    setActivePackId('')
    setPackRevision(v => v + 1)
  }

  function startResearch(r=null) {
    setSharingPin(null)
    setRecheckTargetId('')
    setResearchTargetId(r?.id||'')
    setResearchOpen(true)
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
    setRecheckTargetId('')
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
      setRecheckTargetId(current => current === r.id ? '' : current)
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
      setRecheckTargetId('')
      setBackupReviewOpen(false)
      setRestoreOpen(false)
      setResearchBackupOpen(false)
      setPrivacyInspectorOpen(false)
      setResearchOpen(false)
      setResearchTargetId('')
      setSharedPreview(null)
      setSelectedId('')
      setFinderFocus(null)
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
      <div className="status"><span className={'status-dot '+(online?'status-dot-unverified':'status-dot-offline')} />{connectionDisplay(online,language)}<span className="chip">{ui.localFirst}</span></div>
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
      {notice && <div className="notice" role="status" aria-live="polite">{typeof notice==='object'?ui[notice.key]||'':notice}</div>}
      {error && <div className="warning" role="alert">{ui.storageError}: {error}. {ui.storageCaution}</div>}
      <section className="workspace" aria-label={ui.mapPrivacyArea}>
        <aside className="sidebar">
          {editing ? <form ref={editorRef} className="pin-editor" onSubmit={save}>
            <div className="eyebrow">{ui.formDevice}</div>
            <div className="header-row"><h2>{t.pinFormTitle}</h2><button type="button" className="close" onClick={cancelEdit} aria-label={ui.cancelEditing}>×</button></div>
            <div className="location-hint" role="status" aria-live="polite">{locationHint}</div>
            <div className="actions location-actions">
              <button className="secondary" type="button" onClick={startPinLocation}>{t.locate}</button>
              <button className="secondary" type="button" onClick={chooseOnMap}>{t.pickMap}</button>
            </div>
            <p className="help">{language === 'es' ? 'Solo registra recursos públicos. Nunca señales dónde duerme una persona, domicilios privados o personas. Son observaciones, no garantía de seguridad.' : 'Record only public resources or official shelter programs. Never pin personal sleeping places, camps, private homes or people. A report is not a safety certification.'}</p>
            <label htmlFor="category">{t.type}</label>
            <select id="category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {Object.entries(CATEGORIES).map(([key, value]) => <option key={key} value={key}>{categoryLabel(key,language,CATEGORIES)}</option>)}
            </select>
            <label htmlFor="title">{t.observed}</label>
            <input id="title" required maxLength="90" value={draft.title} placeholder={ui.titleExample} onChange={(e) => setDraft({ ...draft, title: e.target.value })}/>
            <label htmlFor="note">{t.note}</label>
            <textarea id="note" rows="4" maxLength="400" value={draft.note} placeholder={ui.notesExample} onChange={(e) => setDraft({ ...draft, note: e.target.value })}/>
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
            <div className="header-row"><div><div className="eyebrow">{ui.explorer}</div><h2>{t.resources}</h2></div><span className="counter">{reports.length} {language === 'es' ? 'privados' : 'private'}{lowBattery ? ` + ${publicCandidates.length} ${language === 'es' ? 'públicos' : 'mapped'}` : ''}</span></div>
            <p className="help">{t.private} {publicCandidates.length && !lowBattery ? (language === 'es' ? 'Los resultados públicos están abajo, en Scout, y aparecen como puntos separados en el mapa.' : 'Public map results are listed once in Scout below and shown as separate map markers.') : ''}</p>
            <label htmlFor="search">{t.search}</label>
            <input id="search" type="search" placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)}/>
            <div className="filters" role="group" aria-label={ui.filterAria}>
              <button className={filter === 'all' ? 'filter active' : 'filter'} onClick={() => setFilter('all')}>{ui.all}</button>
              {Object.entries(CATEGORIES).map(([key, value]) => <button key={key} className={filter === key ? 'filter active' : 'filter'} onClick={() => setFilter(key)}>{value.icon} {categoryLabel(key,language,CATEGORIES)}</button>)}
            </div>
            <div className="results">
              {displayedRows.length ? displayedRows.map((r) => <article className={'pin-card' + (selectedId === r.id ? ' selected' : '')} key={r.id}>
                <button className="pin-card-main" onClick={() => jumpTo(r)}>
                  <span className="category-icon">{CATEGORIES[r.category].icon}</span>
                  <span className="pin-info"><strong>{r.title}</strong><small>{categoryLabel(r.category,language,CATEGORIES)} · {distanceKm(reference, r).toFixed(1)} {ui.distance}</small>{r.note && <span className="pin-note">{r.note}</span>}<small>{r.from === 'osm' ? 'OpenStreetMap · ' + (r.checkedAt || '') : t.seen + ': ' + fmtDate(latestRecheck(r)?.observedAt || r.observedAt)} · {t.noteStatus}</small>
                    {r.reportedHours && <span className="local-observation">{t.reported}: {r.reportedHours}</span>}
                    {!latestRecheck(r) && r.visitStatus === 'not_working' && <span className="local-observation">{t.broken}</span>}
                    {latestRecheck(r) && <span className="local-observation">{language === 'es' ? 'Última revisión personal' : 'Latest personal recheck'}: {latestRecheck(r).visitStatus === 'working' ? t.worked : latestRecheck(r).visitStatus === 'not_working' ? t.broken : (language === 'es' ? 'No se pudo comprobar' : 'Could not determine')} · {language === 'es' ? 'Sin verificación independiente' : 'Not independently verified'}</span>}
                    {!latestRecheck(r) && r.visitStatus === 'working' && <span className="local-observation">{t.worked}: {fmtDate(r.lastSeenWorkingAt || r.observedAt)}</span>}
                    {r.accessibility && Object.entries(r.accessibility).filter(([,v])=>v!=='unknown').map(([key,value])=><span className="local-observation" key={key}>{({wheelchair:t.wheelchair,stepFree:t.stepFree,idRequired:t.id,petsAllowed:t.pets})[key]}: {accessText(key,value,language)}</span>)}</span>
                </button>
                {r.from !== 'osm' && <RecheckHistory report={r} language={language}/>}
                <div className="pin-actions">
                  {r.from !== 'osm' && <button type="button" onClick={() => {setSharingPin(null);setRecheckTargetId(r.id)}}>{language === 'es' ? 'Volver a comprobar' : 'Recheck'}</button>}
                  <button type="button" onClick={() => startResearch(r)}>{language==='es'?'Investigar aquí':'Research this spot'}</button>
                  <button onClick={() => {setRecheckTargetId('');setSharingPin(r)}}>{t.share}</button>
                  {r.from === 'osm' ? <a href={r.sourceUrl} rel="noopener noreferrer" target="_blank">OSM ↗</a> : <button className="delete" onClick={() => erase(r)} aria-label={ui.deleted + r.title}>{language === 'es' ? 'Borrar punto' : 'Delete local pin'}</button>}
                </div>
              </article>) : <div className="empty"><span className="empty-symbol"><MapPinIcon size={42}/></span><strong>{language === 'es' ? 'No hay puntos que mostrar' : lowBattery ? 'No resources to show' : 'No private pins yet'}</strong><p>{t.noPins}</p><button className="plain-link" onClick={begin}>{ui.addLink}</button></div>}
            </div>
            <NearbyFinder privateReports={reports} publicSources={publicCandidates}
              mapCenter={mapCenter} selectedResource={finderSelectedPoint} lowBattery={lowBattery}
              language={language} onOpenMap={row=>{
                // A saved pack can be searched without replacing the current Scout map data.
                // Show only this explicitly selected transient marker; do not import/share it.
                setFinderFocus({id:row.id,title:row.title,category:row.category,
                  lat:row.lat,lon:row.lon,origin:row.origin})
                jumpTo(row)
              }}/>
            {activeRecheckReport && <RecheckPanel key={activeRecheckReport.id} report={activeRecheckReport} language={language}
              onSaved={async () => {await refresh();setRecheckTargetId('');setNotice(language==='es'?'Nueva observación privada guardada. Historial conservado.':'Private recheck saved; earlier observations preserved.')}}
              onClose={() => setRecheckTargetId('')}/>}
            <SharePanel key={activeSharingPin?.id || "none"} pin={activeSharingPin} language={language} onClose={() => setSharingPin(null)}/>
            <div className="backup">
              <strong>{language==='es'?'Tus datos, bajo tu control':'Keep your own data'}</strong>
              <p>{language==='es'?'Revisa los datos antes de crear un archivo. Las copias completas contienen ubicaciones y revisiones privadas.':'Review what leaves this device before downloading. Full backups include exact locations, private notes and rechecks.'}</p>
              <div className="backup-actions-row">
                <button type="button" className="secondary compact" onClick={() => startResearch()}>{language==='es'?'Investigar ubicación sin crear punto':'Research a location without a pin'}</button>
                <button type="button" className="secondary compact" disabled={!reports.length}
                  onClick={()=>{setRestoreOpen(false);setResearchBackupOpen(false);setPrivacyInspectorOpen(false);setBackupReviewOpen(open=>!open)}}>{language==='es'?'Revisar opciones de exportación':'Review export options'}</button>
                <button type="button" className="secondary compact"
                  onClick={()=>{setBackupReviewOpen(false);setResearchBackupOpen(false);setPrivacyInspectorOpen(false);setRestoreOpen(open=>!open)}}>{language==='es'?'Recuperar copia privada':'Recover private backup'}</button>
                <button type="button" className="secondary compact"
                  onClick={()=>{setBackupReviewOpen(false);setRestoreOpen(false);setPrivacyInspectorOpen(false);setResearchBackupOpen(open=>!open)}}>{language==='es'?'Copia de notas de investigación':'Research notes backup'}</button>
                <button type="button" className="secondary compact"
                  onClick={()=>{setBackupReviewOpen(false);setRestoreOpen(false);setResearchBackupOpen(false);setPrivacyInspectorOpen(open=>!open)}}>{language==='es'?'Inspeccionar mi privacidad':'Inspect my privacy'}</button>
              </div>
              {backupReviewOpen && reports.length>0 &&
                <BackupReview reports={reports} language={language}
                  onClose={()=>setBackupReviewOpen(false)}
                  onDownloaded={()=>setNotice({key:'downloadRequested'})}/>}
              {restoreOpen && <BackupRestore existing={reports} language={language}
                onClose={()=>setRestoreOpen(false)}
                onRestored={async message=>{await refresh();setSavedFeedback(null);setNotice(message)}}/>}
              {researchBackupOpen && <ResearchBackup language={language}
                onClose={()=>setResearchBackupOpen(false)} onNotice={message=>setNotice(message)}/>}
              {privacyInspectorOpen && <PrivacyInspector language={language} onlineHint={online}
                tilesEnabled={tiles} lowBattery={lowBattery} onClose={()=>setPrivacyInspectorOpen(false)}/>}
            </div>
          </>}
          {researchOpen && <ResearchSpot key={researchTargetId||'manual'} target={researchTarget} localPinId={researchLocalPinId} language={language} onClose={() => {setResearchOpen(false);setResearchTargetId('')}} />}
        </aside>
        {!lowBattery && <div className="map-column">
          <div className="map-top"><div><strong>{ui.map}</strong><small>{ui.start}</small></div>
            <div className="map-actions"><button className="secondary compact" onClick={locate}>◎ {ui.center}</button><label className="switch"><input type="checkbox" checked={online && tiles} disabled={!online} onChange={(e) => setTiles(e.target.checked)} />{ui.tiles}</label></div>
          </div>
          <div className="map-frame" ref={mapFrameRef}>
            <MapContainer className="leaflet-map" center={[PILOT_CENTER.lat, PILOT_CENTER.lon]} zoom={13} scrollWheelZoom={false}>
              {online && tiles && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'/>}
              <MapNavigator target={target}/>
              {streetSketch && !(online && tiles) && streetSketch.records.map(way => <Polyline key={way.id} positions={way.coordinates} pathOptions={{color:way.kind==='water'?'#7fc9ed':way.tag==='footway'||way.tag==='path'||way.tag==='steps'?'#efca81':'#91d5b1',weight:way.kind==='water'?3:way.tag==='footway'?2:4,opacity:.85,dashArray:way.tag==='footway'||way.tag==='path'?'5 6':undefined}}><Popup><strong>{way.name||ui.mappedWay}</strong><p>OpenStreetMap {way.kind==='water'?ui.waterway:ui.path} ({way.tag}). {ui.wayCaution}</p></Popup></Polyline>)}
              <MapCenterTracker onMove={setMapCenter}/>
              <MapPicker enabled={editing} onPick={pickCoordinates}/>
              {visiblePublic.map((r) => <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={selectedId === r.id ? 12 : 9} pathOptions={{ color: '#95c9e0', fillColor: r.category === 'water' ? '#83d4e4' : r.category === 'power' ? '#eec575' : '#a9cfa1', fillOpacity: 0.85, weight: 2, dashArray: '4 3' }} eventHandlers={{ click: () => setSelectedId(r.id) }}>
                <Popup><strong>{r.title}</strong><br/>{categoryLabel(r.category,language,CATEGORIES)}<br/>{ui.osmRecord}<br/><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{ui.osmView}</a></Popup>
              </CircleMarker>)}
              {activeFinderFocus && !visible.some(r=>r.id===activeFinderFocus.id) &&
                !visiblePublic.some(r=>r.id===activeFinderFocus.id &&
                  r.lat===activeFinderFocus.lat && r.lon===activeFinderFocus.lon) &&
                <CircleMarker key={'glo-finder-'+activeFinderFocus.id} center={[activeFinderFocus.lat,activeFinderFocus.lon]}
                  radius={11} pathOptions={{color:'#f2d38c',fillColor:'#8eb89c',weight:3,
                    fillOpacity:0.85,dashArray:'4 3'}}>
                  <Popup><strong>{activeFinderFocus.title}</strong><br/>
                    {categoryLabel(activeFinderFocus.category,language,CATEGORIES)}<br/>
                    {activeFinderFocus.origin==='private'?ui.selfReported:ui.osmRecord}<br/>
                    {language==='es'?'Solo resultado temporal · Sin verificar':'Temporary result marker · Unverified'}
                  </Popup>
                </CircleMarker>}
              {sharedPreview && (sharedPreview.scope === 'area' ? <Circle center={[sharedPreview.lat, sharedPreview.lon]} radius={900} pathOptions={{color:'#c5a3ff',fillColor:'#a27ce2',fillOpacity:.12,dashArray:'7 7',weight:2}}><Popup><strong>{sharedPreview.title}</strong><br/>{ui.sharedArea}</Popup></Circle> : <CircleMarker center={[sharedPreview.lat, sharedPreview.lon]} radius={12} pathOptions={{color:'#6636ac',fillColor:'#b68be0',fillOpacity:.9}}><Popup><strong>{sharedPreview.title}</strong><br/>{ui.sharedPoint}</Popup></CircleMarker>)}}
              {visible.map((r) => <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={selectedId === r.id ? 11 : 8} pathOptions={{ color: '#8bdeaf', fillColor: r.category === 'water' ? '#4aa9c0' : r.category === 'power' ? '#ecb64e' : '#81b77b', fillOpacity: 0.94, weight: 3 }} eventHandlers={{ click: () => setSelectedId(r.id) }}>
                <Popup><strong>{r.title}</strong><br/>{categoryLabel(r.category,language,CATEGORIES)}<br/>{ui.selfReported}<br/>{ui.privateDevice}</Popup>
              </CircleMarker>)}
            </MapContainer>
            {!(online && tiles) && <div className="map-label">{ui.mapNoBase}</div>}
            {editing && <div className="map-tip">{ui.mapTap}</div>}
          </div>
          <div className="map-footnote"><strong>{ui.mapPrivacy}</strong> {ui.mapPrivacyText}</div>
          <StreetSketchPanel center={mapCenter} online={online} selected={streetSketch} language={language}
            onSelect={(pack,restored)=>{setStreetSketch(pack);setTarget({...pack.center,zoom:15});setNotice((restored?ui.restoredMap:ui.selectedMap)+' '+pack.records.length+' '+ui.savedMap)}}
            onDelete={()=>setStreetSketch(null)}/>
        </div>}
      </section>
      {!lowBattery && <GloAgentDock center={mapCenter} localReports={reports} online={online} language={language}
        onSourcesChange={onScoutRecords} sourceRecords={publicCandidates} sourceSnapshot={sourceScan} packRevision={packRevision} onNavigate={jumpTo} onOpenPacks={openPacks}/>}
      <details className="packs-fold" ref={packsDetailsRef}>
        <summary>{language === 'es' ? 'Guardar o abrir recursos sin conexión' : 'Save or open offline resource packs'}</summary>
        <OfflinePacksPanel scan={sourceScan} language={language} onUse={useOfflinePack} onRemove={removeOfflinePack} onNotice={setNotice}/>
      </details>
      <div className="principles"><div><b>◇</b><strong>{ui.principlesNo}</strong><p>{ui.principlesNoInfo}</p></div><div><b>⌁</b><strong>{ui.principlesLocal}</strong><p>{ui.principlesLocalInfo}</p></div><div><b>✓</b><strong>{ui.principlesEvidence}</strong><p>{ui.principlesEvidenceInfo}</p></div></div>
    </main>
    <footer>GLO Pin · Good Lookin' Out · <a href="https://github.com/MichaelWave369/GLO">{ui.repo}</a><span>v0.1 · {ui.footer}</span></footer>
  </div>
}
