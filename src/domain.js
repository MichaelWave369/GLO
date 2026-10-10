export const CATEGORIES = Object.freeze({
  water: { label: 'Water', icon: '💧', description: 'Drinking fountains and refill points' },
  power: { label: 'Power', icon: '⚡', description: 'Public phone charging and accessible outlets' },
  shelter: { label: 'Covered seating', icon: '⌂', description: 'Sheltered seating without a purchase requirement' },
  restroom: { label: 'Restrooms', icon: '🚻', description: 'Public bathrooms and toilet facilities' },
  food: { label: 'Free meals / food banks', icon: '🍲', description: 'Official meal programs or food assistance, not discarded food' },
  shower: { label: 'Showers', icon: '🚿', description: 'Public and nonprofit showers' },
  laundry: { label: 'Laundry', icon: '🫧', description: 'Public and nonprofit laundry resources' },
  warming: { label: 'Warming centers', icon: '☀', description: 'Organized public warming locations' },
  cooling: { label: 'Cooling centers', icon: '❄', description: 'Organized public cooling locations' },
  wifi: { label: 'Free Wi-Fi', icon: '📶', description: 'Public connectivity' },
  sharps: { label: 'Sharps disposal', icon: '♻', description: 'Designated public sharps disposal locations' },
  pet_support: { label: 'Pet support', icon: '🐾', description: 'Pet-friendly resource and support programs' },
  overnight: { label: 'Official overnight shelter', icon: '☾', description: 'Officially organized overnight shelter programs, never personal sleeping spots' }
})

export const PILOT_CENTER = Object.freeze({ lat: 40.986, lon: -75.194 })

export function validCoordinates(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

export function distanceKm(a, b) {
  const radians = (n) => n * Math.PI / 180
  const dLat = radians(b.lat - a.lat)
  const dLon = radians(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function normalizeReport(input, clock = new Date()) {
  const category = String(input.category || '')
  const title = String(input.title || '').trim()
  const note = String(input.note || '').trim()
  const lat = Number(input.lat)
  const lon = Number(input.lon)
  if (!Object.hasOwn(CATEGORIES, category)) throw new Error('Select one of the three resource types.')
  if (!title || title.length > 90) throw new Error('Add a title with no more than 90 characters.')
  if (note.length > 400) throw new Error('Notes must be 400 characters or fewer.')
  if (!validCoordinates(lat, lon)) throw new Error('Select a valid location on the map.')
  if (!Number.isFinite(clock.getTime())) throw new Error('Invalid observation time.')
  const visitStatus = ['working', 'not_working', 'unknown'].includes(input.visitStatus) ? input.visitStatus : 'unknown'
  const reportedHours = String(input.reportedHours || '').trim()
  if (reportedHours.length > 100) throw new Error('Reported hours must be 100 characters or fewer.')
  const allowed = ['yes', 'no', 'unknown']
  const accessibility = Object.fromEntries(['wheelchair','stepFree','idRequired','petsAllowed'].map(key => [key, allowed.includes(input.accessibility?.[key]) ? input.accessibility[key] : 'unknown']))
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    category, title, note, lat, lon,
    observedAt: clock.toISOString(),
    lastSeenWorkingAt: visitStatus === 'working' ? clock.toISOString() : null,
    visitStatus, reportedHours, accessibility,
    provenance: 'self-reported',
    condition: 'not-verified',
    visibility: 'device-only'
  }
}

export function publicReady() {
  return false // This prototype has no public publishing or community sync.
}

export function privateBackup(reports, at = new Date()) {
  return { format: 'glo-pin-private-backup', schemaVersion: 1, exportedAt: at.toISOString(), reports }
}
