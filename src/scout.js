// Public OpenStreetMap source scouting: explicitly user-triggered. No user identity or device ID.
import { validCoordinates, distanceKm } from './domain.js'

export const MAX_RESULTS = 160
export const SCOUT_RADIUS_M = 1800
export const SOURCE_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const MAX_OVERPASS_ELEMENTS = 450

export function buildScoutQuery(center, radius = SCOUT_RADIUS_M) {
  if (!validCoordinates(center?.lat, center?.lon)) throw new Error('Choose a valid map center.')
  if (!Number.isInteger(radius) || radius < 500 || radius > 3000) throw new Error('Search radius must be 500 to 3000 meters.')
  const around = '(around:' + radius + ',' + center.lat.toFixed(3) + ',' + center.lon.toFixed(3) + ')'
  // The only charging candidates included explicitly advertise USB sockets.
  // Generic amenity=charging_station is usually about cars, not phone charging.
  return '[out:json][timeout:18];(' +
    'nwr' + around + '["amenity"="drinking_water"];' +
    'nwr' + around + '["amenity"="fountain"]["drinking_water"="yes"];' +
    'nwr' + around + '["amenity"="shelter"]["access"!="private"];' +
    'nwr' + around + '["amenity"="bench"]["covered"="yes"];' +
    'nwr' + around + '["amenity"="charging_station"]["socket:usb"~"^(yes|[1-9][0-9]*)$"];' +
    'nwr' + around + '["amenity"="charging_station"]["socket:usb_c"~"^(yes|[1-9][0-9]*)$"];' +
    ');out center meta ' + MAX_OVERPASS_ELEMENTS + ';'
}

function categoryOf(tags = {}) {
  if (tags.amenity === 'drinking_water' || (tags.amenity === 'fountain' && tags.drinking_water === 'yes')) return 'water'
  if ((tags.amenity === 'shelter' && tags.access !== 'private') || (tags.amenity === 'bench' && tags.covered === 'yes')) return 'shelter'
  if (tags.amenity === 'charging_station' && (tags['socket:usb'] || tags['socket:usb_c'])) return 'power'
  return null
}
function safeName(tags, category) {
  const name = typeof tags.name === 'string' ? tags.name.trim().slice(0, 110) : ''
  if (name) return name
  if (category === 'water') return 'Mapped public drinking water'
  if (category === 'shelter') return tags.amenity === 'bench' ? 'Mapped covered bench' : 'Mapped shelter'
  return 'USB charging candidate (access unverified)'
}
export function normalizeScoutResults(elements, center, checkedAt = new Date()) {
  if (!validCoordinates(center?.lat, center?.lon)) throw new Error('Invalid scan center.')
  if (!Array.isArray(elements)) throw new Error('Invalid OpenStreetMap response.')
  const seen = new Set()
  return elements.slice(0, MAX_OVERPASS_ELEMENTS).flatMap((item) => {
    const tags = item?.tags || {}
    const category = categoryOf(tags)
    const lat = item.lat ?? item.center?.lat
    const lon = item.lon ?? item.center?.lon
    const type = String(item?.type || '')
    const id = item?.id
    const identifier = type + '/' + String(id)
    if (!category || !['node','way','relation'].includes(type) || !Number.isInteger(id) || !validCoordinates(lat, lon) || seen.has(identifier)) return []
    // Filter out things explicitly marked private. OSM itself can be incomplete or outdated.
    if (tags.access === 'private' || tags.access === 'no') return []
    seen.add(identifier)
    const lastMappedAt = typeof item.timestamp === 'string' && Number.isFinite(Date.parse(item.timestamp)) ? item.timestamp : null
    return [{
      id: 'osm:' + identifier,
      title: safeName(tags, category),
      category, lat, lon,
      source: 'OpenStreetMap via Overpass',
      sourceUrl: 'https://www.openstreetmap.org/' + identifier,
      lastMappedAt,
      checkedAt: checkedAt.toISOString(),
      distanceKm: distanceKm(center, { lat, lon }),
      provenance: 'mapped-record',
      condition: 'not-verified',
      availability: 'unknown',
      accessNote: category === 'power' ? 'OSM advertises USB charging; public phone access is not confirmed.' :
        category === 'water' ? 'OSM says drinking water; present availability and potability are not independently confirmed.' :
          'OSM describes cover or shelter; accessibility, seating, and opening times are not confirmed.'
    }]
  }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, MAX_RESULTS)
}

export function mappedAge(item, now = Date.now()) {
  if (!item?.lastMappedAt) return { level: 'unknown', label: 'OSM edit age unknown' }
  const ms = Date.parse(item.lastMappedAt)
  if (!Number.isFinite(ms) || ms > now + 86400000) return { level: 'unknown', label: 'OSM edit age unknown' }
  const days = Math.max(0, Math.floor((now - ms) / 86400000))
  return {
    level: days > 365 ? 'older' : 'recent',
    label: days === 0 ? 'OSM edited today' : 'OSM last edited ' + days + (days === 1 ? ' day' : ' days') + ' ago'
  }
}

export async function scoutPublicMap(center, signal) {
  const query = buildScoutQuery(center)
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(() => controller.abort(), 22000)
  try {
    const response = await fetch(SOURCE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal
    })
    if (!response.ok) throw new Error('OpenStreetMap query unavailable (HTTP ' + response.status + '). Try again later.')
    const payload = await response.json()
    if (!Array.isArray(payload?.elements)) throw new Error('Invalid OpenStreetMap source response.')
    // The server-side out limit can truncate results. Never present as exhaustive coverage.
    return {
      center, checkedAt: new Date().toISOString(),
      sources: normalizeScoutResults(payload.elements, center),
      mayBeIncomplete: payload.elements.length >= MAX_OVERPASS_ELEMENTS,
      queryLimit: MAX_OVERPASS_ELEMENTS
    }
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
