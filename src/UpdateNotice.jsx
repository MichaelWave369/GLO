import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { shouldCheckForUpdate, UPDATE_CHECK_INTERVAL_MS } from './updatePolicy.js'
import './updateNotice.css'

// A new version is never installed without a deliberate tap.
// This widget cannot retrofit update behavior into an older app already cached on a device.
export default function UpdateNotice({ language='en' }) {
  const [needsRefresh,setNeedsRefresh] = useState(false)
  const [updating,setUpdating] = useState(false)
  const [error,setError] = useState('')
  const registration=useRef(null)
  const updateSW=useRef(null)
  const lastCheckedAt=useRef(0)
  const isSpanish=language==='es'

  useEffect(()=>{
    let mounted=true
    let reg=null
    const check=()=>{
      const now=Date.now()
      if (!reg || !shouldCheckForUpdate({
        online:navigator.onLine, visible:document.visibilityState==='visible',
        now,lastCheckedAt:lastCheckedAt.current
      })) return
      lastCheckedAt.current=now
      // SW update() checks the versioned script, not any private data or location.
      void reg.update().catch(()=>{})
    }
    const unregister=registerSW({
      immediate:true,
      onNeedRefresh(){if(mounted)setNeedsRefresh(true)},
      onRegisteredSW(_url,r){reg=r;registration.current=r;check()},
      onRegisterError(){/* The offline app still works; no silent forced refresh. */}
    })
    updateSW.current=unregister
    const onFocus=()=>check()
    const onOnline=()=>check()
    const onVisibility=()=>{if(document.visibilityState==='visible')check()}
    window.addEventListener('focus',onFocus)
    window.addEventListener('online',onOnline)
    document.addEventListener('visibilitychange',onVisibility)
    const interval=window.setInterval(check,UPDATE_CHECK_INTERVAL_MS)
    return ()=>{
      mounted=false
      window.removeEventListener('focus',onFocus)
      window.removeEventListener('online',onOnline)
      document.removeEventListener('visibilitychange',onVisibility)
      window.clearInterval(interval)
      registration.current=null
      updateSW.current=null
    }
  },[])

  async function applyUpdate() {
    if(!needsRefresh||updating||!updateSW.current)return
    setUpdating(true);setError('')
    try {
      await updateSW.current(true)
      // The PWA registration activates its waiting worker and reloads the page.
    } catch {
      setUpdating(false)
      setError(isSpanish
        ? 'No se pudo aplicar la actualización. Guarda cualquier trabajo antes de recargar manualmente.'
        : 'Could not apply the update. Save anything you are editing before manually reloading.')
    }
  }
  if(!needsRefresh)return null
  return <div className="version-banner" role="status" aria-live="polite">
    <div><strong>{isSpanish?'Nueva versión de GLO disponible':'A new GLO version is ready'}</strong>
      <p>{isSpanish
        ? 'La actualización requiere recargar. Guarda los borradores que no hayas terminado; tus puntos guardados permanecen en este dispositivo.'
        : 'Updating reloads this page. Finish any unsaved forms first. Your saved pins stay on this device.'}</p>
      {error && <p role="alert">{error}</p>}
    </div>
    <button type="button" className="primary" disabled={updating} onClick={applyUpdate}>
      {updating?(isSpanish?'Actualizando…':'Updating…'):(isSpanish?'Actualizar ahora':'Update now')}
    </button>
  </div>
}
