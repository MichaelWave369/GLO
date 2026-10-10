// User-directed public-source snapshot only. Never put local personal observations in a pack.
import { CATEGORIES, distanceKm, validCoordinates } from './domain.js'

export const PACK_FORMAT = 'glo-public-osm-pack'
export const PACK_CATEGORIES = Object.freeze(['water','power','shelter','restroom','food','shower'])
export const MAX_PACK_RECORDS = 160
export const MAX_PACK_BYTES = 150_000
const ALLOWED_PACK_FIELDS = ['format','version','id','center','scannedAt','savedAt','source','license','incomplete','records']
const ALLOWED_RECORD_FIELDS = ['id','title','category','lat','lon','source','sourceUrl','lastMappedAt','checkedAt','provenance','condition','availability','accessNote','reportedHours']
const iso = (x) => typeof x === 'string' && Number.isFinite(Date.parse(x)) && x.length <= 35
const only = (obj, keys) => obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).every(key => keys.includes(key))
const rounded = (x) => Number(Number(x).toFixed(3))
const bounded = (s, max) => typeof s === 'string' && s.length <= max && !/[<>\u0000-\u001f]/.test(s)
const packId = (center) => 'osm:' + center.lat.toFixed(3) + ':' + center.lon.toFixed(3)

export function normalizePublicRecord(record, center) {
  if (!only(record, ALLOWED_RECORD_FIELDS)) throw new Error('Pack contains unexpected or private record fields.')
  if (!/^osm:(node|way|relation)\/[1-9][0-9]*$/.test(record.id || '')) throw new Error('Invalid OSM record identifier.')
  const expectedUrl = 'https://www.openstreetmap.org/' + record.id.slice(4)
  if (record.sourceUrl !== expectedUrl) throw new Error('Unexpected source link.')
  if (!PACK_CATEGORIES.includes(record.category) || !Object.hasOwn(CATEGORIES, record.category)) throw new Error('Unsupported public Scout category.')
  if (!validCoordinates(record.lat, record.lon)) throw new Error('Invalid public coordinates.')
  if (!bounded(record.title, 110) || !record.title?.trim()) throw new Error('Invalid source label.')
  if (record.source !== 'OpenStreetMap via Overpass' || record.provenance !== 'mapped-record' ||
      record.condition !== 'not-verified' || record.availability !== 'unknown') throw new Error('Source cannot claim verification.')
  if (!iso(record.checkedAt) || (record.lastMappedAt !== null && !iso(record.lastMappedAt)))
    throw new Error('Missing or invalid source time.')
  if (!bounded(record.accessNote, 240) || !bounded(record.reportedHours || '', 120)) throw new Error('Invalid source details.')
  return {
    id: record.id, title: record.title, category: record.category, lat: record.lat, lon: record.lon,
    source: 'OpenStreetMap via Overpass', sourceUrl: expectedUrl,
    lastMappedAt: record.lastMappedAt, checkedAt: record.checkedAt,
    provenance: 'mapped-record', condition: 'not-verified', availability: 'unknown',
    accessNote: record.accessNote || '', reportedHours: record.reportedHours || '',
    distanceKm: distanceKm(center, record)
  }
}

export function createPublicPack(scan, now = new Date()) {
  if (!validCoordinates(scan?.center?.lat, scan?.center?.lon)) throw new Error('No valid scan center to save.')
  if (!iso(scan?.checkedAt) || !Number.isFinite(now.getTime()) || !Array.isArray(scan.sources)) throw new Error('No usable public scan to save.')
  if (scan.sources.length > MAX_PACK_RECORDS) throw new Error('Too many source records in pack.')
  const center = { lat: rounded(scan.center.lat), lon: rounded(scan.center.lon) }
  const records = scan.sources.map(record => {
    // Projection intentionally discards custom properties, including private note, author, device ID.
    const projected = Object.fromEntries(ALLOWED_RECORD_FIELDS.map(key => [key, record[key]]))
    projected.title = String(record.title || '').replace(/[<>\u0000-\u001f]/g, ' ').trim().slice(0, 110)
    projected.reportedHours = String(record.reportedHours || '').replace(/[<>\u0000-\u001f]/g, ' ').slice(0, 120)
    return stripRuntime(normalizePublicRecord(projected, center))
  })
  const pack = {
    format: PACK_FORMAT, version: 1, id: packId(center), center, scannedAt: scan.checkedAt,
    savedAt: now.toISOString(), source: 'OpenStreetMap via Overpass', license: 'ODbL-1.0',
    incomplete: Boolean(scan.mayBeIncomplete), records
  }
  if (new TextEncoder().encode(JSON.stringify(pack)).length > MAX_PACK_BYTES) throw new Error('Pack exceeds storage cap.')
  return pack
}

function stripRuntime(record) {
  const { distanceKm, ...stored } = record
  return stored
}

export function validatePublicPack(input, now = new Date()) {
  if (!only(input, ALLOWED_PACK_FIELDS)) throw new Error('Invalid pack fields. Private records are not allowed here.')
  if (input.format !== PACK_FORMAT || input.version !== 1 ||
    !validCoordinates(input.center?.lat, input.center?.lon) ||
    rounded(input.center.lat) !== input.center.lat || rounded(input.center.lon) !== input.center.lon ||
    input.id !== packId(input.center) ||
    input.source !== 'OpenStreetMap via Overpass' || input.license !== 'ODbL-1.0' ||
    typeof input.incomplete !== 'boolean' ||
    !iso(input.scannedAt) || !iso(input.savedAt) ||
    !Array.isArray(input.records) || input.records.length > MAX_PACK_RECORDS) throw new Error('Invalid public pack manifest.')
  if (new TextEncoder().encode(JSON.stringify(input)).length > MAX_PACK_BYTES) throw new Error('Public pack exceeds storage cap.')
  if (Date.parse(input.scannedAt) > now.getTime() + 300_000) throw new Error('Future scan timestamp rejected.')
  const ids = new Set()
  const records = input.records.map(r => {
    const safe = normalizePublicRecord(r, input.center)
    if (ids.has(safe.id)) throw new Error('Duplicate map record.')
    if (Date.parse(safe.checkedAt) > now.getTime() + 300_000) throw new Error('Future source timestamp rejected.')
    ids.add(safe.id)
    return stripRuntime(safe)
  })
  return { ...input, records }
}

export function parsePublicPack(json) {
  if (typeof json !== 'string' || json.length > MAX_PACK_BYTES) throw new Error('File is not a small public GLO pack.')
  return validatePublicPack(JSON.parse(json))
}

export function sourcesFromPack(pack) {
  const validated = validatePublicPack(pack)
  return validated.records.map(record => normalizePublicRecord(record, validated.center))
}

export function packAge(pack, now = Date.now()) {
  const age = Math.floor((now - Date.parse(pack.scannedAt)) / 86_400_000)
  return !Number.isFinite(age) || age < 0
    ? { level: 'unknown', label: 'Snapshot date unknown' }
    : age > 30 ? { level: 'old', label: 'Source scan ' + age + ' days old. Recheck before travel.' }
    : age > 7 ? { level: 'aging', label: 'Source scan ' + age + ' days old. Verify details.' }
    : { level: 'recent', label: 'Source scan ' + age + (age === 1 ? ' day' : ' days') + ' ago. NOT verified operational.' }
}
