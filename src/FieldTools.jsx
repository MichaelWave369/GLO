import { useRef, useState } from 'react'
import { CRISIS_CONTACTS, TEXT } from './fieldKit.js'
import { makeScopedSharedPin, scopedShareUrl } from './scopedShare.js'
import { renderQrDataUrl } from './shareQr.js'

export function CrisisCard({ language }) {
  const t = TEXT[language]
  return <details className="crisis-strip">
    <summary>{t.emergency} · 911 / 988 / 211</summary>
    <p>{t.crisisInfo}</p>
    <div className="crisis-contacts">
      {CRISIS_CONTACTS.map((contact) => <div className="crisis-contact" key={contact.number}>
        <strong>{contact.number}</strong>
        <span>{contact[language]}</span>
        <div className="crisis-links"><a href={contact.call}>{language === 'es' ? 'Llamar' : 'Call'} {contact.number}</a>{contact.text && <a href={contact.text}>{language === 'es' ? 'Mensaje' : 'Text'} {contact.number}</a>}</div>
      </div>)}
    </div>
    <p className="crisis-note">{language === 'es'
      ? 'Sin señal no se puede garantizar una llamada. Algunos teléfonos sin plan pueden llamar al 911 si hay una red compatible disponible.'
      : 'No signal means a call cannot be guaranteed. Some phones without a plan can still call 911 if a compatible network is in range.'}</p>
  </details>
}

export function SharePanel({ pin, language, onClose }) {
  const t=TEXT[language]
  const spanish=language==='es'
  const revision=useRef(0)
  const [scope,setScope]=useState('area')
  const [includeName,setIncludeName]=useState(false)
  const [confirmed,setConfirmed]=useState(false)
  const [copied,setCopied]=useState('')
  const [qr,setQr]=useState('')
  const [error,setError]=useState('')
  if(!pin)return null
  const preview=makeScopedSharedPin(pin,{scope,includeName})
  // No shareable link is even generated until the person reviews and approves the chosen fields.
  const link=confirmed?scopedShareUrl(pin,window.location.origin+import.meta.env.BASE_URL,{scope,includeName}):''
  function changeScope(value) {
    revision.current+=1
    setScope(value);setConfirmed(false);setCopied('');setQr('');setError('')
  }
  function changeName(value) {
    revision.current+=1
    setIncludeName(value);setConfirmed(false);setCopied('');setQr('');setError('')
  }
  function approve() {
    const detail=spanish
      ? '¿Crear un enlace para cualquier persona que lo reciba? Incluye '+(scope==='exact'?'coordenadas EXACTAS':'una zona aproximada')+
        (includeName?', el nombre del lugar':' y la categoría sin el nombre')+'. No se puede revocar después de compartirlo.'
      : 'Create a link readable by anyone who receives it? It includes '+(scope==='exact'?'EXACT coordinates':'an approximate area')+
        (includeName?', the resource name':', only the resource category')+'. GLO cannot revoke a link after it has been shared.'
    if(window.confirm(detail)){setConfirmed(true);setCopied('');setQr('')}
  }
  async function copy() {
    if(!confirmed)return
    const currentRevision=revision.current
    try {
      await navigator.clipboard.writeText(link)
      // Clipboard may already contain old content; never claim the new scope has been copied.
      if(currentRevision===revision.current)
        setCopied(spanish?'Enlace copiado. No se puede revocar después de enviarlo.':'Link copied. Sharing it is irreversible; GLO cannot revoke it.')
    } catch {if(currentRevision===revision.current)setCopied(t.shareFail)}
  }
  async function showQr() {
    if(!confirmed)return
    const currentRevision=revision.current
    try {
      setError('')
      const dataUrl=await renderQrDataUrl(link)
      // A pending QR from the previous grant MUST NOT reappear after a change.
      if(currentRevision===revision.current)setQr(dataUrl)
    } catch {
      if(currentRevision===revision.current)
        setError(spanish?'No se pudo crear el QR.':'Unable to create QR offline.')
    }
  }
  return <section className="share-dialog handoff-dialog" role="region" aria-label={spanish?'Revisar lo que compartes':'Review shared information'}>
    <div className="header-row"><strong>{spanish?'Compartir con control':'Choose what you disclose'}</strong><button className="secondary compact" onClick={onClose}>{spanish?'Cerrar':'Close'}</button></div>
    <p>{spanish
      ? 'Inspirado en FamilyVault: privado por defecto. GLO no exige cuenta ni verifica quién recibe el enlace. Selecciona los datos permitidos.'
      : 'Inspired by FamilyVault: private by default. GLO has no accounts and cannot authenticate link recipients. You choose the fields that leave this device.'}</p>
    <fieldset className="handoff-choices"><legend>{spanish?'Precisión de ubicación':'Location precision'}</legend>
      <label><input type="radio" name="handoff-scope" checked={scope==='area'} onChange={()=>changeScope('area')}/>
        <span><strong>{spanish?'Zona aproximada (recomendado)':'Approximate area (recommended)'}</strong><small>{spanish?'Coordenadas redondeadas a 2 decimales. NO indica una entrada exacta.':'Rounded to 2 decimal places. NOT an exact address or entrance.'}</small></span></label>
      <label><input type="radio" name="handoff-scope" checked={scope==='exact'} onChange={()=>changeScope('exact')}/>
        <span><strong>{spanish?'Lugar exacto':'Exact location'}</strong><small>{spanish?'Hasta 6 decimales; solo si necesitas compartir el punto exacto.':'Up to 6 decimals. Select only when an exact point truly needs sharing.'}</small></span></label>
    </fieldset>
    <label className="handoff-name"><input type="checkbox" checked={includeName} onChange={e=>changeName(e.target.checked)}/>
      <span>{spanish?'Incluir el nombre del recurso':'Include the resource name'}</span></label>
    <div className="handoff-preview" aria-live="polite">
      <strong>{spanish?'Vista previa de lo que saldrá del dispositivo':'Preview of outgoing data'}</strong>
      <p>{spanish?'Tipo de recurso':'Resource category'}: {preview.category}</p>
      <p>{spanish?'Nombre revelado':'Disclosed title'}: {preview.title} {preview.nameShared?'':(spanish?'(sin nombre privado)':'(generic label only)')}</p>
      <p>{scope==='area'?(spanish?'Zona aproximada':'Approximate area'):(spanish?'Coordenadas exactas':'Exact coordinates')}: {preview.lat.toFixed(scope==='area'?2:6)}, {preview.lon.toFixed(scope==='area'?2:6)}</p>
      <p>{spanish?'Nunca se incluyen notas privadas, IDs del dispositivo ni historial de ubicación.':'Private notes, device IDs and location history are never included.'}</p>
    </div>
    <p className="handoff-warning"><strong>{spanish?'Importante:':'Important:'}</strong> {spanish
      ? 'Un enlace o código QR puede copiarse, reenviarse o guardarse. GLO no puede revocarlo, borrarlo de otros dispositivos ni impedir capturas de pantalla.'
      : 'Links and QR codes can be copied, forwarded, screenshotted or stored. GLO cannot revoke them, remove copies from other devices, or guarantee who reads them.'}</p>
    {!confirmed ? <button className="primary handoff-approve" onClick={approve}>
      {spanish?'Revisar y aprobar estos datos':'Review and approve these fields'}</button> :
      <>
        <div className="shared-link">{link}</div>
        <div className="actions"><button className="secondary" onClick={copy}>{spanish?'Copiar enlace aprobado':'Copy approved link'}</button>
          <button className="secondary" onClick={showQr}>{t.qr}</button></div>
        {copied&&<p role="status">{copied}</p>}
        {error&&<p role="alert">{error}</p>}
        {qr&&<div><img src={qr} alt={spanish?'Código QR del enlace aprobado':'QR code of approved link'}/>
          <p>{spanish?'Este QR contiene exactamente los datos aprobados.':'This QR includes exactly the approved fields.'}</p></div>}
      </>}
  </section>
}

export function SharedPreview({ pin, language, onView, onDismiss }) {
  if(!pin)return null
  const spanish=language==='es'
  const approximate=pin.scope==='area'
  return <section className="shared-preview">
    <div className="header-row"><strong>{spanish?'Ubicación compartida':'Peer-shared location'}</strong>
      <button className="secondary compact" onClick={onDismiss}>{spanish?'Cerrar':'Dismiss'}</button></div>
    <p>{pin.title} · {pin.lat.toFixed(approximate?2:5)}, {pin.lon.toFixed(approximate?2:5)}</p>
    <p>{approximate
      ? (spanish?'Esta es una zona APROXIMADA, no una entrada precisa. No navegues directamente a este marcador.':'This is an APPROXIMATE area, not a precise entrance. Do not navigate to the marker as a destination.')
      : (spanish?'La ubicación compartida es precisa, pero no está verificada.':'The shared point is precise, but not verified.')}</p>
    <p>{spanish?'No verificado y no se guarda automáticamente. Confirma el acceso.':'Unverified and never saved automatically. Confirm accessibility and access directly.'}</p>
    <button className="secondary" onClick={onView}>{approximate?(spanish?'Ver zona aproximada':'View approximate area'):(spanish?'Ver en mapa':'View on map')}</button>
  </section>
}
