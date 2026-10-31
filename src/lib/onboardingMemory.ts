const ONBOARDED_KEY = 'semest-onboarded-users'

function readOnboardedUsers(): string[] {
  try {
    const raw = localStorage.getItem(ONBOARDED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function hasFinishedOnboarding(userId: string): boolean {
  return readOnboardedUsers().includes(userId)
}

export function rememberOnboarded(userId: string): void {
  const ids = new Set(readOnboardedUsers())
  ids.add(userId)
  try {
    localStorage.setItem(ONBOARDED_KEY, JSON.stringify([...ids]))
  } catch {
    // Private mode can block storage. The server value still applies this visit.
  }
}

export function forgetOnboarded(userId: string): void {
  try {
    localStorage.setItem(
      ONBOARDED_KEY,
      JSON.stringify(readOnboardedUsers().filter((id) => id !== userId)),
    )
  } catch {
    // Private mode can block storage.
  }
}

/** A failed lookup must not look like a brand-new account. */
export function resolveOnboarding(failed: boolean, onboardedAt: string | null, remembered: boolean): 'yes' | 'no' | 'unknown' {
  if (failed) return remembered ? 'yes' : 'unknown'
  return onboardedAt ? 'yes' : 'no'
}
