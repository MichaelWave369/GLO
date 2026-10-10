// Never substitute a map viewport for an observed location.
export function localDateTime(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function initialDraft(now = new Date()) {
  return {
    observedAtLocal: localDateTime(now),
    category: 'water',
    title: '',
    note: '',
    lat: '',
    lon: '',
    visitStatus: 'unknown',
    reportedHours: '',
    accessibility: {
      wheelchair:'unknown', stepFree:'unknown', idRequired:'unknown', petsAllowed:'unknown'
    }
  }
}
