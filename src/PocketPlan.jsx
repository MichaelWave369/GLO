import { useState } from 'react'
import { buildPocketPlan, POCKET_COPY, POCKET_TOPICS } from './pocketPlan.js'
import './pocketPlan.css'

export default function PocketPlan({ language = 'en', resource = null }) {
  const ui=POCKET_COPY[language]||POCKET_COPY.en
  const [topic,setTopic]=useState('food')
  const [contact,setContact]=useState('')
  const [step,setStep]=useState('')
  const [includeResource,setIncludeResource]=useState(false)
  const [message,setMessage]=useState('')
  const [open,setOpen]=useState(false)
  const plan=buildPocketPlan({topic,contact,step,includeResource,resource},language)
  function clear() {
    setTopic('food');setContact('');setStep('');setIncludeResource(false);setMessage('')
  }
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(plan)
      setMessage(ui.copied)
    } catch {setMessage(ui.blocked)}
  }
  return <section className="pocket-wrap">
    <details open={open} onToggle={event=>setOpen(event.currentTarget.open)} className="pocket-details">
      <summary><strong>{ui.title}</strong><span>{language==='es'?'Ayuda sin cuenta ni conexión':'Offline · no account needed'}</span></summary>
      <div className="pocket-body">
        <p className="pocket-intro">{ui.help}</p>
        <div className="pocket-fields">
          <label htmlFor="pocket-topic">{ui.topic}</label>
          <select id="pocket-topic" value={topic} onChange={e=>{setTopic(e.target.value);setMessage('')}}>
            {POCKET_TOPICS.map(key=><option key={key} value={key}>{ui.topics[key].label}</option>)}
          </select>
          <label htmlFor="pocket-contact">{ui.contact}</label>
          <input id="pocket-contact" maxLength="110" autoComplete="off" value={contact} onChange={e=>{setContact(e.target.value);setMessage('')}}/>
          <label htmlFor="pocket-step">{ui.step}</label>
          <input id="pocket-step" maxLength="180" autoComplete="off" value={step} onChange={e=>{setStep(e.target.value);setMessage('')}}/>
          {resource && <label className="pocket-option"><input type="checkbox" checked={includeResource} onChange={e=>{setIncludeResource(e.target.checked);setMessage('')}}/>{ui.include}</label>}
        </div>
        {!resource && <p className="pocket-note">{ui.nothing}</p>}
        <div className="pocket-preview">
          <label htmlFor="pocket-preview-text">{ui.title}</label>
          <textarea id="pocket-preview-text" readOnly rows={12} value={plan} onFocus={e=>e.target.select()}/>
        </div>
        <div className="pocket-actions">
          <button type="button" className="primary" onClick={copy}>{ui.copy}</button>
          <button type="button" className="secondary" onClick={()=>window.print()}>{ui.print}</button>
          <button type="button" className="secondary" onClick={clear}>{ui.clear}</button>
        </div>
        {message&&<p role="status" className="pocket-message">{message}</p>}
        <p className="pocket-privacy">{ui.private}</p>
      </div>
    </details>
    <div className="pocket-print" aria-hidden="true"><pre>{plan}</pre></div>
  </section>
}
