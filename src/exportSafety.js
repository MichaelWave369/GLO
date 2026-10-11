// GLO Data Safety: minimize disclosure before exporting device-owned private reports.
// No background transfer, third-party data, tracking IDs, or verification claims.
import { CATEGORIES, privateBackup } from './domain.js'
import { validatedRechecks } from './recheck.js'

export const EXPORT_MODES=Object.freeze(['overview','private-backup'])
const categoryKeys=Object.keys(CATEGORIES)

export function exportInventory(reports=[]) {
  const list=Array.isArray(reports)?reports:[]
  return {
    pins:list.length,
    rechecks:list.reduce((n,r)=>n+validatedRechecks(r).length,0),
    withCoordinates:list.filter(r=>Number.isFinite(r?.lat)&&Number.isFinite(r?.lon)).length,
    withNotes:list.filter(r=>Boolean(String(r?.note||'').trim())||
      validatedRechecks(r).some(check=>Boolean(check.note.trim()))).length
  }
}

// Intentionally allowlist derived counts. This is NOT a restorable data backup.
// Category counts can still disclose interests; users must choose to export.
export function countOnlyOverview(reports=[],at=new Date()) {
  if(!Array.isArray(reports)||!Number.isFinite(at.getTime()))throw new Error('Invalid overview data.')
  const categories=Object.fromEntries(categoryKeys.map(key=>[key,0]))
  for(const r of reports)if(Object.hasOwn(categories,r?.category))categories[r.category]++
  const {pins,rechecks}=exportInventory(reports)
  return {
    format:'glo-pin-counts-overview',schemaVersion:1,
    exportedAt:at.toISOString(),
    warning:'Aggregate counts only. NOT a restorable private backup or verification.',
    totals:{privatePins:pins,privateRechecks:rechecks},
    categories
  }
}
export function buildLocalExport(reports,mode,at=new Date()) {
  if(!Array.isArray(reports)||!EXPORT_MODES.includes(mode))throw new Error('Choose a valid export option.')
  if(mode==='overview')return {
    name:'GLO-Pin-OVERVIEW-NOT-A-BACKUP.json',
    payload:countOnlyOverview(reports,at)
  }
  return {
    name:'GLO-Pin-PRIVATE-SENSITIVE-backup.json',
    // Original full-fidelity format and legacy backup schema are preserved.
    payload:privateBackup(reports,at)
  }
}
