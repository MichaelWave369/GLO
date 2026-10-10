import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, distanceKm } from './domain.js'
import { CREW, guideReply } from './guide.js'
import { mappedAge, scoutPublicMap, SOURCE_ENDPOINT } from './scout.js'

const QUESTIONS = [
  { label: 'I need drinking water', text: 'Where can I find drinking water?' },
  { label: 'I need to charge a phone', text: 'Where can I charge my phone battery?' },
  { label: 'I need shelter from rain', text: 'Is there a covered place where I can sit out of the rain?' },
  { label: 'I need food', text: 'Where can I get food?' }
]

function dateText(value) {
  if (!value) return 'Never'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

function CrewCard({ agent, scan }) {
  let status = 'Ready for local use'
  if (agent.id === 'scout') status = scan ? 'Last requested: ' + dateText(scan.checkedAt) : 'Not run yet'
  if (agent.id === 'freshness') status = scan ? scan.sources.length + ' mapped entries reviewed' : 'Awaiting mapped sources'
  if (agent.id === 'guard') status = 'No private reports uploaded'
  if (agent.id === 'bro') status = 'Local rules · works offline'
  return <div className="agent-person">
    <span className={'agent-avatar avatar-' + agent.id} aria-hidden="true">{agent.id === 'scout' ? '⌖' : agent.id === 'freshness' ? '↻' : agent.id === 'guard' ? '◇' : '✦'}</span>
    <div className="agent-desc"><strong>{agent.name}</strong><small>{agent.role}</small><span>{status}</span></div>
  </div>
}

export default function GloAgentDock({ center, localReports, online, onSourcesChange, onNavigate }) {
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState(null)
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])
  const candidates = scan?.sources || []
  const changedViewport = scan ? distanceKm(center, scan.center) > 0.4 : false
  const counts = useMemo(() => Object.fromEntries(Object.keys(CATEGORIES).map((key) => [
    key, candidates.filter((item) => item.category === key).length
  ])), [candidates])

  async function runScout() {
    if (!online || loading) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true)
    setScanError('')
    try {
      const next = await scoutPublicMap(center, controller.signal)
      if (controller.signal.aborted) return
      setScan(next)
      onSourcesChange(next.sources)
    } catch (error) {
      if (!controller.signal.aborted) setScanError(error.name === 'AbortError'
        ? 'The public map request timed out. Please try later.'
        : error.message || 'Public map search unavailable.')
    } finally { if (!controller.signal.aborted) setLoading(false) }
  }

  function ask(message = question) {
    const trimmed = String(message).trim().slice(0, 300)
    if (!trimmed) return
    setQuestion(trimmed)
    setConversation({ asked: trimmed, answer: guideReply(trimmed, {
      reports: localReports, sources: candidates, center, online
    }) })
  }

  function clearScan() {
    controllerRef.current?.abort()
    setScan(null)
    setLoading(false)
    setScanError('')
    onSourcesChange([])
  }

  return <section className="agent-dock" aria-labelledby="glo-bro-heading">
    <div className="agent-dock-head">
      <div><span className="eyebrow">GOOD LOOKIN' OUT · ASSISTANCE</span><h2 id="glo-bro-heading">Your GLO crew</h2><p>Four clearly defined helpers, one goal: useful information without pretending guesses are facts.</p></div>
      <span className="agent-local-pill">PRIVATE-FIRST</span>
    </div>
    <div className="agent-grid">
      {CREW.map((agent) => <CrewCard key={agent.id} agent={agent} scan={scan}/>)}
    </div>

    <div className="agent-panels">
      <section className="agent-panel" aria-labelledby="public-scout-title">
        <div className="agent-panel-title"><div><span className="eyebrow">SOURCE SCOUT</span><h3 id="public-scout-title">Check the public map</h3></div><span className="agent-mini-count">{candidates.length} found</span></div>
        <p className="agent-paragraph">Search OpenStreetMap for mapped drinking water, shelters, covered benches and explicitly USB-tagged charging candidates within 1.8 km of the selected map center. This is not a live facilities-status check.</p>
        <div className="scan-coordinates">Map center: {center.lat.toFixed(3)}, {center.lon.toFixed(3)} · Search radius: 1.8 km</div>
        <p className="agent-disclosure">Only when you press Search, a query with this approximate center is sent to the public <a href={SOURCE_ENDPOINT} target="_blank" rel="noreferrer noopener">Overpass service</a>. Its servers may receive your IP address. Your private observations, device location history, and GLO Bro questions are NOT included.</p>
        <div className="agent-buttons">
          <button className="primary" disabled={!online || loading} onClick={runScout}>{loading ? 'Checking public map…' : '⌖ Search public map'}</button>
          {scan && <button className="secondary" onClick={clearScan}>Clear source results</button>}
        </div>
        {!online && <p className="agent-offline">Offline: public searches are unavailable. Your own saved pins and GLO Bro local guidance remain usable.</p>}
        {scanError && <p className="agent-error" role="alert">{scanError}</p>}
        {scan && <div className="scan-summary" role="status">
          <strong>Public map queried {dateText(scan.checkedAt)}</strong>
          <span>{counts.water} water · {counts.power} USB charging · {counts.shelter} shelter/covered seating</span>
          {changedViewport && <span className="scan-stale">Map moved since this search. These results belong to the previous center. Search again for the new area.</span>}
          {scan.mayBeIncomplete && <span className="scan-stale">Source returned its query cap. Results may be incomplete.</span>}
          {!candidates.length && <span>Nothing mapped in this limited query. That does NOT mean no resources exist here.</span>}
        </div>}
        {candidates.length > 0 && <div className="candidate-list" aria-label="Public map resource candidates">
          {candidates.slice(0, 30).map((r) => <article key={r.id} className="candidate">
            <span className="candidate-icon" aria-hidden="true">{CATEGORIES[r.category].icon}</span>
            <div className="candidate-body"><strong>{r.title}</strong><small>{CATEGORIES[r.category].label} · {r.distanceKm.toFixed(1)} km from last scan center</small><small>{mappedAge(r).label} · Last queried {dateText(r.checkedAt)}</small><span>{r.accessNote}</span><div className="candidate-links">
              <button onClick={() => onNavigate(r)}>View on map</button>
              <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">OSM source ↗</a>
            </div></div>
          </article>)}
          {candidates.length > 30 && <p className="agent-paragraph">Showing the 30 nearest results of {candidates.length}. This is a display limit, not a source count.</p>}
        </div>}
      </section>

      <section className="agent-panel guide-panel" aria-labelledby="guide-title">
        <div className="agent-panel-title"><div><span className="eyebrow">YOUR LOCAL GUIDE</span><h3 id="guide-title">Ask GLO Bro</h3></div><span className="agent-mini-count">OFFLINE READY</span></div>
        <p className="agent-paragraph">Tell me what you need, brother. I'll use the information this device actually has and help you decide what to check next.</p>
        <p className="agent-ai-note">Currently a <strong>local decision-tree guide, not a connected AI model</strong>. It never sends your question to a server. Optional consent-based AI assistance can be added later.</p>
        <div className="quick-questions">
          {QUESTIONS.map((q) => <button type="button" key={q.label} onClick={() => ask(q.text)}>{q.label}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask() }} className="guide-form">
          <label htmlFor="bro-question">What do you need?</label>
          <textarea id="bro-question" maxLength="300" rows="3" placeholder="I need water and somewhere to charge my phone..." value={question} onChange={(e) => setQuestion(e.target.value)}/>
          <button type="submit" className="primary" disabled={!question.trim()}>Ask GLO Bro →</button>
        </form>
        {conversation && <div className="guide-response" role="status" aria-live="polite">
          <div className="guide-response-ask"><span>YOU ASKED</span><p>{conversation.asked}</p></div>
          <strong className="guide-response-title">{conversation.answer.title}</strong>
          {conversation.answer.lines.map((line, i) => <p key={i}>{line}</p>)}
          {conversation.answer.matches.length > 0 && <div className="guide-matches">
            {conversation.answer.matches.map((r, i) => <div key={r.id || i} className="guide-match">
              <div><strong>{r.title}</strong><small>{r.origin === 'private-note' ? 'Your private observation' : 'OpenStreetMap entry'} · Unverified</small></div>
              <button type="button" onClick={() => onNavigate(r)}>Map ↗</button>
            </div>)}
          </div>}
        </div>}
      </section>
    </div>
    <div className="agent-dock-footer"><strong>The crew's rule:</strong> A map record is evidence that someone mapped a place, not evidence the resource is open, safe, accessible, or operational. Agent actions run on demand, not as an autonomous background network.</div>
  </section>
}
