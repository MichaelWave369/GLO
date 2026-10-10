import { CATEGORIES, distanceKm } from './domain.js'

export const CREW = Object.freeze([
  { id: 'scout', name: 'Scout', role: 'Search public mapped resources', detail: 'Runs only when you request a map scan.' },
  { id: 'freshness', name: 'Freshness', role: 'Check evidence age', detail: 'Distinguishes when OSM data changed from whether a service works.' },
  { id: 'guard', name: 'Guard', role: 'Protect people and private notes', detail: 'Keeps local observations separate from public source lookups.' },
  { id: 'bro', name: 'GLO Bro', role: 'Explain the next useful step', detail: 'Free local guidance, including when offline. Not connected to an AI model yet.' }
])

const KEYWORDS = Object.freeze({
  water: /\b(water|drink|drinking|hydration|thirst|fountain|refill|bottle)\b/i,
  power: /\b(power|electric|electricity|outlet|socket|charge|charger|charging|battery|phone)\b/i,
  shelter: /\b(shelter|shade|covered|rain|storm|roof|bench|sit|seating|rest|dry)\b/i
})
const FOOD = /\b(food|hungry|hunger|meal|eat|pantry|grocer)\b/i
const OTHER = /\b(bathroom|toilet|restroom|bath|wifi|internet|shower|laundry)\b/i
const URGENT = /\b(emergency|immediate danger|overdose|unconscious|cannot breathe|can't breathe)\b/i

export function detectNeed(message) {
  const text = String(message || '').slice(0, 500)
  const matches = Object.entries(KEYWORDS).filter(([, pattern]) => pattern.test(text)).map(([key]) => key)
  return {
    categories: matches,
    food: FOOD.test(text),
    other: OTHER.test(text),
    urgent: URGENT.test(text)
  }
}

export function guideReply(message, { reports = [], sources = [], center, online = true } = {}) {
  const need = detectNeed(message)
  if (need.urgent) return {
    title: 'Please seek immediate human help',
    lines: ['If someone may be in immediate danger, contact your local emergency services now (911 in the U.S.).', 'GLO Pin does not monitor emergencies and cannot dispatch assistance.'],
    matches: [], kind: 'urgent'
  }
  const all = [
    ...reports.map((r) => ({ ...r, origin: 'private-note' })),
    ...sources.map((r) => ({ ...r, origin: 'osm' }))
  ]
  const candidates = all.filter((r) => !need.categories.length || need.categories.includes(r.category))
    .filter((r) => r?.lat !== undefined && r?.lon !== undefined)
    .sort((a, b) => (center ? distanceKm(center, a) - distanceKm(center, b) : 0))
    .slice(0, 4)
  const lines = []
  if (need.categories.length) {
    lines.push('I can check ' + need.categories.map((c) => CATEGORIES[c].label.toLowerCase()).join(', ') + ' information saved or mapped here.')
  } else if (!need.food && !need.other) {
    lines.push('Tell me what you need: drinking water, somewhere to charge a phone, or a place to sit out of the weather.')
  }
  if (need.food) lines.push('Food listings are not in this pilot yet. If you are in the U.S., 211 may help you find local food programs. Check hours directly before traveling.')
  if (need.other) lines.push('Restrooms, Wi-Fi and other services are planned, but this pilot does not yet have a reliable directory for them.')
  if (candidates.length) {
    lines.push('I found ' + candidates.length + ' potentially useful ' + (candidates.length === 1 ? 'entry' : 'entries') + ' in the data available to this device. They are NOT confirmed open, safe, or working.')
    if (candidates.some((r) => r.origin === 'osm')) lines.push('Mapped entries came from OpenStreetMap. Their last edit dates do not prove real-world availability.')
  } else if (need.categories.length) {
    lines.push('I do not have a matching resource in the information currently loaded. That does not mean none exists nearby.')
  }
  if (!online) lines.push('You are offline. I can only use information already available on this device.')
  else if (!sources.length) lines.push('To look up public map candidates online, use the separate “Search public map” button. This sends the selected map area to an external map service.')
  lines.push('Please check access, opening hours, and conditions directly when possible.')
  return { title: 'GLO Bro · local guidance', lines, matches: candidates, kind: 'local' }
}
