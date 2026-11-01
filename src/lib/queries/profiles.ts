import { assertText, LIMITS } from '../limits'
import { supabase } from '../supabase'
import { rememberOnboarded } from '../onboardingMemory'

export { forgetOnboarded, hasFinishedOnboarding, rememberOnboarded, resolveOnboarding } from '../onboardingMemory'

export type Profile = {
  id: string
  display_name: string | null
  onboarded_at: string | null
}

export async function getProfile(): Promise<Profile | null> {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, onboarded_at')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const name = displayName.trim()
  assertText(name, LIMITS.displayName, 'Name')
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', userData.user.id)
  if (error) throw error
}

export async function completeOnboarding(): Promise<void> {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const { error } = await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', userData.user.id)

  if (error) throw error
  rememberOnboarded(userData.user.id)
}
