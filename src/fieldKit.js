import { CATEGORIES, validCoordinates } from './domain.js'

export const CRISIS_CONTACTS = Object.freeze([
  { number: '911', en: 'Immediate danger or medical emergency', es: 'Peligro inmediato o emergencia médica', call: 'tel:911' },
  { number: '988', en: 'Mental health, suicide or substance use crisis', es: 'Crisis de salud mental, suicidio o consumo de sustancias', call: 'tel:988', text: 'sms:988' },
  { number: '211', en: 'Local food, housing and social-service referrals', es: 'Ayuda local con comida, vivienda y servicios sociales', call: 'tel:211' }
])

export const TEXT = Object.freeze({
  en: {
    add: 'Add a private pin', locate: 'Use my location', emergency: 'Need help right now?', crisisInfo: 'U.S. support numbers. These stay readable offline. Calling or texting still requires a usable phone connection.',
    battery: 'Low-battery list', batteryOff: 'Show map and full view', language: 'Español', panic: 'Panic clear', panicConfirm: 'Erase ALL GLO observations saved on this device? This cannot undo shared links, downloads, browser history or copies outside this app.',
    cleared: 'GLO local observations cleared. Shared links, downloads and browser history must be removed separately.', noPins: 'No saved resource pins match this view.',
    resources: 'Your local pins', private: 'Only saved on this device. Never checked by a service.', search: 'Search your pins', type: 'Resource type', observed: 'What did you observe?', note: 'Optional notes', hours: 'Reported opening hours (unverified)', status: 'When you visited', worked: 'Worked when I saw it', broken: 'Not working when I saw it', unknown: 'I did not check',
    access: 'Access details (only what you actually checked)', wheelchair: 'Wheelchair access', stepFree: 'Step-free entrance', id: 'ID required', pets: 'Pets accepted', yes: 'Yes', no: 'No', dontKnow: 'Unknown', save: 'Save privately', cancel: 'Cancel', seen: 'Last observation', reported: 'Reported hours', noteStatus: 'Not confirmed now', share: 'Share location', qr: 'Show QR', shareWarn: 'Share this pin location? Its exact coordinates, title and category will be visible to anyone who gets the link. Notes and author data are excluded.',
    shareCopied: 'Link copied. Anyone with it can see the location.', shareFail: 'Clipboard unavailable. Copy the displayed link manually.', backup: 'Download private backup',
    emptyTitle: 'Nothing saved here yet', description: 'Water, meals, restrooms, charging and more. Reports are personal notes, not safety guarantees.'
  },
  es: {
    add: 'Agregar punto privado', locate: 'Usar mi ubicación', emergency: '¿Necesitas ayuda ahora?', crisisInfo: 'Números de ayuda en EE. UU. Se pueden leer sin conexión. Llamar o enviar mensajes requiere señal.',
    battery: 'Lista de bajo consumo', batteryOff: 'Mostrar mapa', language: 'English', panic: 'Borrar datos', panicConfirm: '¿Borrar TODAS las observaciones de GLO en este dispositivo? No se borran enlaces compartidos, descargas ni historial del navegador.',
    cleared: 'Se borraron las observaciones locales de GLO. Los enlaces, descargas e historial deben borrarse aparte.', noPins: 'No hay recursos guardados que coincidan.',
    resources: 'Mis puntos guardados', private: 'Solo guardados aquí. No se han verificado.', search: 'Buscar puntos', type: 'Tipo de recurso', observed: '¿Qué observaste?', note: 'Notas opcionales', hours: 'Horario indicado (sin verificar)', status: 'Cuando lo visitaste', worked: 'Funcionaba al verlo', broken: 'No funcionaba al verlo', unknown: 'No lo comprobé',
    access: 'Acceso (solo lo que comprobaste)', wheelchair: 'Acceso en silla de ruedas', stepFree: 'Entrada sin escalones', id: 'Se requiere identificación', pets: 'Se aceptan mascotas', yes: 'Sí', no: 'No', dontKnow: 'No sé', save: 'Guardar solo aquí', cancel: 'Cancelar', seen: 'Última observación', reported: 'Horario indicado', noteStatus: 'No confirmado ahora', share: 'Compartir ubicación', qr: 'Mostrar QR', shareWarn: '¿Compartir este lugar? Su ubicación exacta, nombre y categoría serán visibles. No se incluyen notas ni datos del autor.',
    shareCopied: 'Enlace copiado. Quien lo tenga puede ver la ubicación.', shareFail: 'No se pudo copiar. Copia el enlace manualmente.', backup: 'Descargar copia privada',
    emptyTitle: 'No hay puntos guardados', description: 'Agua, comida, baños, carga y más. Las notas no garantizan seguridad.'
  }
})

export function accessText(key, value, lang = 'en') {
  if (!['yes','no','unknown'].includes(value)) return TEXT[lang]?.dontKnow || 'Unknown'
  return value === 'yes' ? TEXT[lang].yes : value === 'no' ? TEXT[lang].no : TEXT[lang].dontKnow
}

// Share is a deliberate *transfer of exact coordinates*, not automatic publication.
export function makeSharedPin(report) {
  if (!CATEGORIES[report?.category] || !validCoordinates(report?.lat, report?.lon)) throw new Error('Invalid pin for sharing.')
  return {
    version: 1,
    type: 'glo-shared-location',
    category: report.category,
    title: String(report.title || '').slice(0, 90),
    lat: Number(report.lat.toFixed(6)),
    lon: Number(report.lon.toFixed(6))
  }
}
export function shareUrl(report, baseUrl) {
  const url = new URL(baseUrl)
  const payload = makeSharedPin(report)
  url.hash = 'pin=' + encodeURIComponent(JSON.stringify(payload))
  return url.toString()
}
export function parseSharedPin(hash) {
  try {
    const raw = String(hash || '')
    if (raw.length > 1500 || !raw.startsWith('#pin=')) return null
    const item = JSON.parse(decodeURIComponent(raw.slice(5)))
    if (item.version !== 1 || item.type !== 'glo-shared-location' || !CATEGORIES[item.category] || !validCoordinates(item.lat, item.lon)) return null
    if (typeof item.title !== 'string' || !item.title || item.title.length > 90) return null
    return { ...makeSharedPin(item), id: 'shared-preview', provenance: 'peer-shared', condition: 'not-verified' }
  } catch { return null }
}
