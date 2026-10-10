// Keep public Scout results in Scout, instead of duplicating them in the private list.
// Low-battery mode is intentionally different: it provides one combined offline-friendly list.
export function listRowsForMode(privateRows = [], publicRows = [], lowBattery = false) {
  const own = privateRows.map(r => ({ ...r, from: 'private' }))
  if (!lowBattery) return own
  const seen = new Set()
  return [...own, ...publicRows.map(r => ({ ...r, from: 'osm' }))]
    .filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
}

// A save confirmation is tied to the specific report, never an unrelated string.
export function visibleSaveReceipt(receipt, reports = []) {
  return receipt && reports.some(r => r.id === receipt.id) ? receipt : null
}
