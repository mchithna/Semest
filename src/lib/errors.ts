function rawMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return ''
}

function isNetworkError(text: string): boolean {
  return (
    text.includes('failed to fetch') ||
    text.includes('networkerror') ||
    text.includes('network request failed') ||
    text.includes('network error') ||
    text.includes('load failed')
  )
}

/** Turns a Supabase or network error into a sentence a student can act on. */
export function friendlyError(err: unknown, fallback: string): string {
  console.error(err)
  const text = rawMessage(err).toLowerCase()

  if (text.includes('invalid login credentials')) {
    return 'Wrong email or password. Try again or reset your password.'
  }
  if (text.includes('already registered')) {
    return 'An account with this email already exists. Sign in instead.'
  }
  if (text.includes('email not confirmed')) {
    return 'Confirm your email first. Check your inbox for the link.'
  }
  if (text.includes('rate limit')) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  if (isNetworkError(text)) {
    return "Can't reach the server. Check your connection and try again."
  }
  return fallback
}
