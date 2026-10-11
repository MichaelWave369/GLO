import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, distanceKm } from './domain.js'
import { CREW, guideReply, freshnessAudit } from './guide.js'
import { scoutPublicMap, SOURCE_ENDPOINT } from './scout.js'
import { categoryLabel, translateScoutChange } from './locale.js'
import { crewCopy, osmEditLabel, formatCrewDate } from './crewLocale.js'
import { comparePublicScans } from './sourceChange.js'
import { inspectOnDeviceAI, askOnDeviceAI } from './onDeviceAi.js'
import MapPinIcon from './MapPinIcon.jsx'

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

function CrewCard({ agent, scan, audit, language }) {
  const c=crewCopy(language)
  let status = c.ready
  if (agent.id === 'scout') status = scan ? c.lastRequested+': '+formatCrewDate(scan.checkedAt,language) : c.neverRun
  if (agent.id === 'freshness') status = audit.privateRecheck + ' ' + c.due
  if (agent.id === 'guard') status = c.guard
  if (agent.id === 'bro') status = c.bro
  return <div className="agent-person">
    <span className={'agent-avatar avatar-' + agent.id} aria-hidden="true">{agent.id === 'scout' ? <MapPinIcon size={25}/> : agent.id === 'freshness' ? '↻' : agent.id === 'guard' ? '◇' : '✦'}</span>
    <div className="agent-desc"><strong>{agent.name}</strong><small>{c.roles[['scout','freshness','guard','bro'].indexOf(agent.id)] || agent.role}</small><span>{status}</span></div>
  </div>
}

export default function GloAgentDock({ center, localReports, online, onSourcesChange, sourceRecords = [], sourceSnapshot = null, packRevision = 0, onNavigate, onOpenPacks, language='en' }) {
  const c=crewCopy(language)
  const [scan, setScan] = useState(null)
  const [sourceChanges, setSourceChanges] = useState(null)
  const [showAllResults, setShowAllResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState(null)
  const [aiStatus, setAiStatus] = useState('unchecked')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiError, setAiError] = useState('')
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])
  useEffect(() => { setScan(null); setSourceChanges(null) }, [packRevision])
  const candidates = sourceRecords
  const audit = useMemo(() => freshnessAudit(localReports, candidates), [localReports, candidates])
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
      setSourceChanges(comparePublicScans(sourceSnapshot, next))
      setScan(next)
      setShowAllResults(false)
      onSourcesChange(next.sources, { center: next.center, checkedAt: next.checkedAt, mayBeIncomplete: next.mayBeIncomplete })
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
    setAiText('')
    setAiError('')
    setConversation({ asked: trimmed, answer: guideReply(trimmed, {
      reports: localReports, sources: candidates, center, online
    },language) })
  }

  async function checkAi() {
    setAiError('')
    setAiText('')
    setAiStatus('checking')
    const available = await inspectOnDeviceAI()
    setAiStatus(available)
  }

  async function askAi() {
    const questionToAsk = question.trim().slice(0, 300)
    if (!questionToAsk || aiBusy) return
    if (aiStatus === 'downloadable' && !window.confirm(c.downloadConfirm)) return
    setAiBusy(true)
    setAiError('')
    setAiText('')
    try {
      const answer = await askOnDeviceAI(questionToAsk, candidates)
      setAiText(answer)
      setAiStatus('available')
    } catch (error) {
      setAiError(error?.message || 'On-device AI could not provide a response. The free local guide still works.')
    } finally {
      setAiBusy(false)
    }
  }

  function clearScan() {
    controllerRef.current?.abort()
    setScan(null)
    setSourceChanges(null)
    setShowAllResults(false)
    setLoading(false)
    setScanError('')
    onSourcesChange([])
  }

  return <section className="agent-dock" aria-labelledby="glo-bro-heading">
    <div className="agent-dock-head">
      <div><span className="eyebrow">{c.eyebrow}</span><h2 id="glo-bro-heading">{c.heading}</h2><p>{c.intro}</p></div>
      <span className="agent-local-pill">{c.privateFirst}</span>
    </div>
    <details className="crew-roster">
      <summary>{c.meet}</summary>
      <div className="agent-grid">
        {CREW.map((agent) => <CrewCard key={agent.id} agent={agent} scan={scan} audit={audit} language={language}/>)}
      </div>
    </details>

    <div className="audit-strip" role="status"><strong>{c.freshness}</strong><span>{audit.privateRecheck} {c.privateDue}</span><span>{audit.sourceOlderYear} {c.sourceOld}</span><span>{audit.sourceAgeUnknown} {c.sourceUnknown}</span></div>
    <div className="agent-panels">
      <section className="agent-panel" aria-labelledby="public-scout-title">
        <div className="agent-panel-title"><div><span className="eyebrow">{c.scout}</span><h3 id="public-scout-title">{c.scoutTitle}</h3></div><span className="agent-mini-count">{candidates.length} {c.found}</span></div>
        <p className="agent-paragraph">{c.scoutIntro}</p>
        <div className="scan-coordinates">{c.mapCenter}: {center.lat.toFixed(3)}, {center.lon.toFixed(3)} · {c.radius}: 1.8 km</div>
        <p className="agent-disclosure">{c.disclosureStart} <a href={SOURCE_ENDPOINT} target="_blank" rel="noreferrer noopener">Overpass service</a>. {c.disclosureEnd}</p>
        <div className="agent-buttons">
          <button className="primary" disabled={!online || loading} onClick={runScout}>{loading ? c.searching : c.search}</button>
          {scan && <button className="secondary" onClick={clearScan}>{c.clear}</button>}
          <button className="secondary" onClick={onOpenPacks}>{c.packs}</button>
        </div>
        {!online && <p className="agent-offline">{c.offline}</p>}
        {scanError && <p className="agent-error" role="alert">{scanError}</p>}
        {scan && <div className="scan-summary" role="status">
          <strong>{c.queried} {formatCrewDate(scan.checkedAt,language)}</strong>
          <span>{counts.water} {c.water} · {counts.power} {c.power} · {counts.shelter} {c.cover} · {counts.restroom} {c.toilets} · {counts.food} {c.food} · {counts.shower} {c.showers}</span>
          {changedViewport && <span className="scan-stale">{c.moved}</span>}
          {scan.mayBeIncomplete && <span className="scan-stale">{c.incomplete}</span>}
          {!candidates.length && <span>{c.none}</span>}
        </div>}
        {sourceChanges && <section className="source-changes" aria-label={c.changeHeading} aria-live="polite">
          <strong>{c.changeHeading}</strong>
          {sourceChanges.status !== 'compared' ? <p>{language==='es'?c.noBaseline:sourceChanges.reason+' '+c.noBaseline}</p> :
            <>
              <p>{c.previous} {formatCrewDate(sourceChanges.previousCheckedAt,language)}. <strong>{c.notProof}</strong></p>
              <div className="source-change-counts">
                <span>{sourceChanges.detailChanges.length} {c.changed}</span>
                <span>{sourceChanges.editOnly.length} {c.edit}</span>
                <span>{sourceChanges.newlyReturned.length} {c.newly}</span>
                <span>{sourceChanges.notReturned.length} {c.missing}</span>
              </div>
              {sourceChanges.queryIncomplete && <p className="source-change-warning">{c.incompleteDifference}</p>}
              <p className="source-change-caveat">{language==='es'?c.changeWarning:sourceChanges.warning}</p>
              {[[c.changeLabels[0],sourceChanges.detailChanges],[c.changeLabels[1],sourceChanges.editOnly],[c.changeLabels[2],sourceChanges.newlyReturned],[c.changeLabels[3],sourceChanges.notReturned]]
                .filter(([,rows])=>rows.length>0)
                .map(([heading,rows])=><details key={heading} className="source-change-group">
                  <summary>{heading} ({rows.length})</summary>
                  <ul>{rows.slice(0,12).map(item=><li key={item.id}>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.title}</a>
                    {item.changes?.length ? <small>{c.mapFields}: {item.changes.map(field=>translateScoutChange(field,language)).join(', ')}</small> : null}
                  </li>)}</ul>
                  {rows.length>12 && <p>{c.displayLimit} {rows.length} {c.records}</p>}
                </details>)}
              {!sourceChanges.detailChanges.length&&!sourceChanges.editOnly.length&&!sourceChanges.newlyReturned.length&&!sourceChanges.notReturned.length &&
                <p>{c.noChanges}</p>}
            </>}
        </section>}
        {candidates.length > 0 && <div className="candidate-list" aria-label={c.candidateAria}>
          {candidates.slice(0, showAllResults ? 30 : 6).map((r) => <article key={r.id} className="candidate">
            <span className="candidate-icon" aria-hidden="true">{CATEGORIES[r.category].icon}</span>
            <div className="candidate-body"><strong>{r.title}</strong><small>{categoryLabel(r.category,language,CATEGORIES)} · {r.distanceKm.toFixed(1)} {c.distance}</small><small>{osmEditLabel(r,language)} · {c.queriedAt} {formatCrewDate(r.checkedAt,language)} · {c.unverified}</small><span>{r.accessNote}</span><div className="candidate-links">
              <button onClick={() => onNavigate(r)}>{c.viewMap}</button>
              <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{c.sourceLink}</a>
            </div></div>
          </article>)}
          {candidates.length > 6 && <button className="agent-show-more" onClick={() => setShowAllResults(value => !value)}>{showAllResults ? c.showFewer : c.showMore}</button>}
          {showAllResults && candidates.length > 30 && <p className="agent-paragraph">{c.display30} {candidates.length}. {c.notSourceCount}</p>}
        </div>}
      </section>

      <section className="agent-panel guide-panel" aria-labelledby="guide-title">
        <div className="agent-panel-title"><div><span className="eyebrow">{c.guide}</span><h3 id="guide-title">{c.askBro}</h3></div><span className="agent-mini-count">{c.offlineReady}</span></div>
        <p className="agent-paragraph">{c.guideIntro}</p>
        <p className="agent-ai-note">{c.aiDisclaimer}</p>
        <div className="quick-questions">
          {c.qs.map((label,i)=><button type="button" key={label} onClick={()=>ask(c.qr[i])}>{label}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask() }} className="guide-form">
          <label htmlFor="bro-question">{c.askNeed}</label>
          <textarea id="bro-question" maxLength="300" rows="3" placeholder={c.askPlaceholder} value={question} onChange={(e) => setQuestion(e.target.value)}/>
          <button type="submit" className="primary" disabled={!question.trim()}>{c.askAction}</button>
        </form>
        <div className="ai-options">
          <div><strong>{c.optionalAi}</strong><p>{c.aiIntro}</p></div>
          {aiStatus === 'unchecked' && <button type="button" className="secondary compact" onClick={checkAi}>{c.aiCheck}</button>}
          {aiStatus === 'checking' && <span className="ai-state">{c.aiChecking}</span>}
          {aiStatus === 'unsupported' && <span className="ai-state">{c.aiUnsupported}</span>}
          {aiStatus === 'unavailable' && <span className="ai-state">{c.aiUnavailable}</span>}
          {aiStatus === 'downloading' && <span className="ai-state">{c.aiDownloading}</span>}
          {['unsupported','unavailable','downloading'].includes(aiStatus) && <button type="button" className="secondary compact" onClick={checkAi}>{c.aiRecheck}</button>}
          {['available','downloadable'].includes(aiStatus) && <div className="ai-actions">
            <span className="ai-state">{aiStatus === 'available' ? c.aiReady : c.aiDownload}</span>
            <button type="button" className="secondary compact" disabled={aiBusy || !question.trim()} onClick={askAi}>
              {aiBusy ? c.aiAsking : aiStatus === 'available' ? c.aiAsk : c.aiGet}
            </button>
          </div>}
          {aiError && <p className="agent-error" role="alert">{aiError}</p>}
          {aiText && <div className="ai-answer" role="status"><strong>{c.aiResult}</strong><p>{aiText}</p><small>{c.aiCaveat}</small></div>}
        </div>
        {conversation && <div className="guide-response" role="status" aria-live="polite">
          <div className="guide-response-ask"><span>{c.youAsked}</span><p>{conversation.asked}</p></div>
          <strong className="guide-response-title">{conversation.answer.title}</strong>
          {conversation.answer.lines.map((line, i) => <p key={i}>{line}</p>)}
          {conversation.answer.matches.length > 0 && <div className="guide-matches">
            {conversation.answer.matches.map((r, i) => <div key={r.id || i} className="guide-match">
              <div><strong>{r.title}</strong><small>{r.origin === 'private-note' ? c.privateObservation : c.osmEntry} · {c.unverified}</small></div>
              <button type="button" onClick={() => onNavigate(r)}>{c.mapAction}</button>
            </div>)}
          </div>}
        </div>}
      </section>
    </div>
    <div className="agent-dock-footer"><strong>{c.rule}</strong> {c.ruleText}</div>
  </section>
}
