// Avoid wasteful background service-worker update checks on low-battery/offline devices.
export const UPDATE_CHECK_INTERVAL_MS = 20 * 60 * 1000

export function shouldCheckForUpdate({ online, visible, now, lastCheckedAt = 0 }) {
  return online === true && visible === true &&
    Number.isFinite(now) && Number.isFinite(lastCheckedAt) &&
    now >= lastCheckedAt && now - lastCheckedAt >= UPDATE_CHECK_INTERVAL_MS
}
