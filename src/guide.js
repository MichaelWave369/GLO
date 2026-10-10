import { CATEGORIES, distanceKm } from './domain.js'

export const CREW = Object.freeze([
  { id: 'scout', name: 'Scout', role: 'Search public mapped resources', detail: 'Runs only when you request a map scan.' },
  { id: 'freshness', name: 'Freshness', role: 'Check evidence age', detail: 'Distinguishes when OSM data changed from whether a service works.' },
  { id: 'guard', name: 'Guard', role: 'Protect people and private notes', detail: 'Keeps local observations separate from public source lookups.' },
  { id: 'bro', name: 'GLO Bro', role: 'Explain the next useful step', detail: 'Offline rule-based help, with optional on-device AI on supported browsers.' }
])

const KEYWORDS = Object.freeze({
  water: /\b(water|drink|drinking|hydration|thirst|fountain|refill|bottle)\b/i,
  power: /\b(power|electric|electricity|outlet|socket|charge|charger|charging|battery|phone)\b/i,
  shelter: /\b(shelter|shade|covered|rain|storm|roof|bench|sit|seating|rest|dry)\b/i,
  restroom: /\b(bathroom|toilet|restroom|bathrooms|baño|aseo)\b/i,
  food: /\b(food|hungry|hunger|meal|eat|pantry|grocer|comida|hambre)\b/i,
  shower: /\b(shower|showers|ducha)\b/i,
  laundry: /\b(laundry|wash clothes|lavandería)\b/i,
  warming: /\b(warming|cold|freeze|freezing|calentarme)\b/i,
  cooling: /\b(cooling|heat|hot weather|cool off|refrescarme)\b/i,
  wifi: /\b(wifi|wi-fi|internet|online)\b/i,
  sharps: /\b(sharps|needles|needle disposal|agujas)\b/i,
  pet_support: /\b(pets|dog|cat|pet friendly|mascotas)\b/i,
  overnight: /\b(overnight|night shelter|sleeping program|albergue)\b/i
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
    lines.push('Tell me what you need: water, food, a restroom, charging, a covered place, or another essential service.')
  }
  if (need.food) lines.push('Scout may show mapped food banks and meal services. That is not evidence of eligibility, current food supply, cost or hours. In the U.S., 211 may provide local referrals.')
  if (need.other) lines.push('Scout now checks tagged public restrooms and showers. Wi-Fi and laundry remain private-note categories until trustworthy public filters are designed. Empty results do not prove there are no services.')
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


export function freshnessAudit(reports = [], sources = [], now = Date.now()) {
  const ageDays = (value) => {
    const date = Date.parse(value)
    if (!Number.isFinite(date) || date > now + 86400000) return null
    return Math.max(0, (now - date) / 86400000)
  }
  return {
    privateRecheck: reports.filter((r) => {
      const age = ageDays(r.observedAt)
      return age === null || age > 7
    }).length,
    sourceOlderYear: sources.filter((r) => {
      const age = ageDays(r.lastMappedAt)
      return age !== null && age > 365
    }).length,
    sourceAgeUnknown: sources.filter((r) => ageDays(r.lastMappedAt) === null).length
  }
}
