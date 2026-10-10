import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { CATEGORIES, PILOT_CENTER, distanceKm, normalizeReport, privateBackup } from './domain.js'
import { listReports, saveReport, removeReport } from './storage.js'
import GloAgentDock from './GloAgentDock.jsx'

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
function initialDraft() {
  return { category: 'water', title: '', note: '', lat: String(PILOT_CENTER.lat), lon: String(PILOT_CENTER.lon) }
}
export default function App() {
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialDraft)
  const [online, setOnline] = useState(navigator.onLine)
  const [tiles, setTiles] = useState(false)
  const [reference, setReference] = useState(PILOT_CENTER)
  const [mapCenter, setMapCenter] = useState(PILOT_CENTER)
  const [publicCandidates, setPublicCandidates] = useState([])
  const [target, setTarget] = useState(null)
  const [notice, setNotice] = useState('No account needed. Your observations stay on this device.')
  const [error, setError] = useState('')

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

  const visiblePublic = useMemo(() => publicCandidates.filter((r) => filter === 'all' || r.category === filter), [publicCandidates, filter])

  function jumpTo(r) {
    setSelectedId(r.id)
    setTarget({ lat: r.lat, lon: r.lon, zoom: 16 })
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
  function begin() {
    setDraft({ ...initialDraft(), lat: reference.lat.toFixed(6), lon: reference.lon.toFixed(6) })
    setEditing(true)
    setNotice('Tap the map to choose coordinates or type them below. Save keeps this pin private.')
  }
  async function save(e) {
    e.preventDefault()
    try {
      const report = normalizeReport(draft)
      await saveReport(report)
      await refresh()
      setEditing(false)
      jumpTo(report)
      setNotice('Saved only on this device. Nothing was published.')
    } catch (err) { setNotice(err.message || 'Unable to save') }
  }
  async function erase(r) {
    if (!confirm('Permanently delete this private observation?')) return
    try { await removeReport(r.id); await refresh(); if (selectedId === r.id) setSelectedId(''); setNotice('Local observation deleted.') }
    catch (err) { setNotice(err.message || 'Unable to delete') }
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

  return <div className="shell">
    <header className="masthead">
      <a href="./" className="brand">
        <img src={import.meta.env.BASE_URL + 'glo-pin.svg'} width="44" height="44" alt="" />
        <span><strong>GLO <span>Pin</span></strong><small>GOOD LOOKIN' OUT</small></span>
      </a>
      <div className="status"><span className="status-dot" />{online ? 'Browser online' : 'Browser offline'}<span className="chip">LOCAL FIRST</span></div>
    </header>
    <main>
      <section className="hero">
        <div className="eyebrow">A MAP THAT LOOKS OUT FOR EVERYBODY</div>
        <h1>Find what you need.<br/><em>Share what you know.</em></h1>
        <p>Water. A place to charge your phone. A sheltered table. Map the useful things around you, without creating an account.</p>
        <div className="actions"><button className="primary" onClick={begin}>+ Add a private pin</button><button className="secondary" onClick={locate}>◎ Use my location</button></div>
      </section>
      <div className="notice" role="status" aria-live="polite">{notice}</div>
      {error && <div className="warning" role="alert">Storage error: {error}. Your observations may not be saved.</div>}
      <section className="workspace" aria-label="GLO resource map">
        <aside className="sidebar">
          {editing ? <form onSubmit={save}>
            <div className="eyebrow">PRIVATE · DEVICE ONLY</div>
            <div className="header-row"><h2>Add an observation</h2><button type="button" className="close" onClick={() => setEditing(false)} aria-label="Cancel editing">×</button></div>
            <p className="help">Only record public resources. Do not pin private homes, sleeping areas, encampments, or people. This is a report, not a safety certification.</p>
            <label htmlFor="category">Resource type</label>
            <select id="category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {Object.entries(CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
            </select>
            <label htmlFor="title">What did you observe?</label>
            <input id="title" required maxLength="90" value={draft.title} placeholder="e.g. a public refill fountain" onChange={(e) => setDraft({ ...draft, title: e.target.value })}/>
            <label htmlFor="note">Optional notes (observations only)</label>
            <textarea id="note" rows="4" maxLength="400" value={draft.note} placeholder="Avoid names, identities and sensitive details." onChange={(e) => setDraft({ ...draft, note: e.target.value })}/>
            <div className="coordinates">
              <div><label htmlFor="lat">Latitude</label><input id="lat" type="number" min="-90" max="90" step="any" required value={draft.lat} onChange={(e) => setDraft({ ...draft, lat: e.target.value })}/></div>
              <div><label htmlFor="lon">Longitude</label><input id="lon" type="number" min="-180" max="180" step="any" required value={draft.lon} onChange={(e) => setDraft({ ...draft, lon: e.target.value })}/></div>
            </div>
            <p className="help">Tap the map to choose a location. You can also enter coordinates or press “Use my location.”</p>
            <div className="actions"><button type="button" className="secondary" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="primary" disabled={!!error}>Save locally</button></div>
          </form> : <>
            <div className="header-row"><div><div className="eyebrow">RESOURCE EXPLORER</div><h2>Your local pins</h2></div><span className="counter">{reports.length}</span></div>
            <p className="help">These are private, unverified notes saved in this browser, not an active public directory.</p>
            <label htmlFor="search">Search saved observations</label>
            <input id="search" type="search" placeholder="Search your pins..." value={query} onChange={(e) => setQuery(e.target.value)}/>
            <div className="filters" role="group" aria-label="Filter by resource type">
              <button className={filter === 'all' ? 'filter active' : 'filter'} onClick={() => setFilter('all')}>All</button>
              {Object.entries(CATEGORIES).map(([key, value]) => <button key={key} className={filter === key ? 'filter active' : 'filter'} onClick={() => setFilter(key)}>{value.icon} {value.label}</button>)}
            </div>
            <div className="results">
              {visible.length ? visible.map((r) => <article className={'pin-card' + (selectedId === r.id ? ' selected' : '')} key={r.id}>
                <button className="pin-card-main" onClick={() => jumpTo(r)}>
                  <span className="category-icon">{CATEGORIES[r.category].icon}</span>
                  <span className="pin-info"><strong>{r.title}</strong><small>{CATEGORIES[r.category].label} · {distanceKm(reference, r).toFixed(1)} km from map search center</small>{r.note && <span className="pin-note">{r.note}</span>}<small>Self-reported · Unverified · {fmtDate(r.observedAt)}</small></span>
                </button>
                <button className="delete" onClick={() => erase(r)} aria-label={'Delete ' + r.title}>Delete local pin</button>
              </article>) : <div className="empty"><b className="empty-symbol">⌖</b><strong>No pins to show</strong><p>Add your first observation. It stays on this device.</p><button className="plain-link" onClick={begin}>Add a pin →</button></div>}
            </div>
            <div className="backup"><strong>Keep your own data</strong><p>Download a private JSON backup. This file contains your coordinates and notes; it does not upload.</p><button className="secondary compact" disabled={!reports.length} onClick={backup}>Download private backup</button></div>
          </>}
        </aside>
        <div className="map-column">
          <div className="map-top"><div><strong>Explore the map</strong><small>Starting view: Stroudsburg, PA (not your detected position)</small></div>
            <div className="map-actions"><button className="secondary compact" onClick={locate}>◎ Center on me</button><label className="switch"><input type="checkbox" checked={online && tiles} disabled={!online} onChange={(e) => setTiles(e.target.checked)} />Online street tiles</label></div>
          </div>
          <div className="map-frame">
            <MapContainer className="leaflet-map" center={[PILOT_CENTER.lat, PILOT_CENTER.lon]} zoom={13} scrollWheelZoom={false}>
              {online && tiles && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'/>}
              <MapNavigator target={target}/>
              <MapCenterTracker onMove={setMapCenter}/>
              <MapPicker enabled={editing} onPick={({ lat, lng }) => setDraft((d) => ({ ...d, lat: lat.toFixed(6), lon: lng.toFixed(6) }))}/>
              {visiblePublic.map((r) => <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={selectedId === r.id ? 12 : 9} pathOptions={{ color: '#457695', fillColor: r.category === 'water' ? '#83d4e4' : r.category === 'power' ? '#eec575' : '#a9cfa1', fillOpacity: 0.85, weight: 2, dashArray: '4 3' }} eventHandlers={{ click: () => setSelectedId(r.id) }}>
                <Popup><strong>{r.title}</strong><br/>{CATEGORIES[r.category].label}<br/>OpenStreetMap record · Not verified<br/><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">View OSM record</a></Popup>
              </CircleMarker>)}
              {visible.map((r) => <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={selectedId === r.id ? 11 : 8} pathOptions={{ color: '#155d4e', fillColor: r.category === 'water' ? '#4aa9c0' : r.category === 'power' ? '#ecb64e' : '#81b77b', fillOpacity: 0.94, weight: 3 }} eventHandlers={{ click: () => setSelectedId(r.id) }}>
                <Popup><strong>{r.title}</strong><br/>{CATEGORIES[r.category].label}<br/>Self-reported · Unverified<br/>Private to this device</Popup>
              </CircleMarker>)}
            </MapContainer>
            {!(online && tiles) && <div className="map-label">NO STREET BASEMAP · LOCAL MARKERS ONLY</div>}
            {editing && <div className="map-tip">Tap map to choose pin location</div>}
          </div>
          <div className="map-footnote"><strong>Map privacy:</strong> Street tiles are off by default. If enabled, OpenStreetMap tile servers may receive your viewed map area and IP address. Offline street navigation and downloadable regional maps are future work. The tileless view is not a navigable map.</div>
        </div>
      </section>
      <GloAgentDock center={mapCenter} localReports={reports} online={online} onSourcesChange={setPublicCandidates} onNavigate={jumpTo}/>
      <div className="principles"><div><b>◇</b><strong>No accounts</strong><p>Use GLO Pin without creating a profile.</p></div><div><b>⌁</b><strong>Local first</strong><p>Saved reports stay on-device; public sharing is not yet available.</p></div><div><b>✓</b><strong>Evidence over guesses</strong><p>Reports are marked self-reported, never certified safe.</p></div></div>
    </main>
    <footer>GLO Pin · Good Lookin' Out · <a href="https://github.com/MichaelWave369/GLO">Open-source repository</a><span>v0.1 prototype · Not an emergency service · No community sync</span></footer>
  </div>
}
