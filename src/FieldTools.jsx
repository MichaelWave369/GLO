import { useState } from 'react'
import { CRISIS_CONTACTS, TEXT, shareUrl } from './fieldKit.js'
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
        <div><a href={contact.call}>{language === 'es' ? 'Llamar' : 'Call'} {contact.number}</a>{contact.text && <> · <a href={contact.text}>{language === 'es' ? 'Mensaje' : 'Text'} {contact.number}</a></>}</div>
      </div>)}
    </div>
    <p className="crisis-note">{language === 'es'
      ? 'Sin señal no se puede garantizar una llamada. Algunos teléfonos sin plan pueden llamar al 911 si hay una red compatible disponible.'
      : 'No signal means a call cannot be guaranteed. Some phones without a plan can still call 911 if a compatible network is in range.'}</p>
  </details>
}

export function SharePanel({ pin, language, onClose }) {
  const t = TEXT[language]
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState('')
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  if (!pin) return null
  // A hash URL works without a backend. It contains precise coords; every send is user-directed.
  const link = shareUrl(pin, window.location.origin + import.meta.env.BASE_URL)
  function approve() { if (window.confirm(t.shareWarn)) setConfirmed(true) }
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(t.shareCopied) }
    catch { setCopied(t.shareFail) }
  }
  async function showQr() {
    try { setError(''); setQr(await renderQrDataUrl(link)) }
    catch { setError(language === 'es' ? 'No se pudo crear el QR.' : 'Unable to create QR offline.') }
  }
  return <section className="share-dialog" role="region" aria-label="Share pin">
    <div className="header-row"><strong>{t.share}: {pin.title}</strong><button className="secondary compact" onClick={onClose}>{language === 'es' ? 'Cerrar' : 'Close'}</button></div>
    <p>{language === 'es' ? 'El enlace contiene coordenadas exactas y el nombre del lugar. Se omiten notas privadas e identificadores.' : 'A shared link contains the exact location, name and category, but not your private notes or any device ID.'}</p>
    <p><strong>{pin.lat.toFixed(5)}, {pin.lon.toFixed(5)}</strong></p>
    {!confirmed ? <button className="primary" onClick={approve}>{language === 'es' ? 'Revisar y permitir compartir' : 'Review and allow sharing'}</button> :
      <>
        <div className="shared-link">{link}</div>
        <div className="actions"><button className="secondary compact" onClick={copy}>{language === 'es' ? 'Copiar enlace' : 'Copy link'}</button>
          <button className="secondary compact" onClick={showQr}>{t.qr}</button></div>
        {copied && <p role="status">{copied}</p>}
        {error && <p role="alert">{error}</p>}
        {qr && <div><img src={qr} alt={language === 'es' ? 'Código QR de la ubicación' : 'Shared-location QR code'}/><p>{language === 'es' ? 'El QR contiene el mismo enlace y coordenadas.' : 'This QR holds the same location and exact coordinates.'}</p></div>}
      </>}
  </section>
}

export function SharedPreview({ pin, language, onView, onDismiss }) {
  if (!pin) return null
  return <section className="shared-preview">
    <div className="header-row"><strong>{language === 'es' ? 'Ubicación compartida' : 'Peer-shared location'}</strong><button className="secondary compact" onClick={onDismiss}>{language === 'es' ? 'Cerrar' : 'Dismiss'}</button></div>
    <p>{pin.title} · {pin.lat.toFixed(5)}, {pin.lon.toFixed(5)}</p>
    <p>{language === 'es' ? 'No verificado; no se guarda automáticamente. Confirma el acceso antes de viajar.' : 'Unverified, not saved to your device. Check access before traveling.'}</p>
    <button className="secondary" onClick={onView}>{language === 'es' ? 'Ver en mapa' : 'View on map'}</button>
  </section>
}
