import { supabase } from '../supabase'

export async function completeOnboarding(): Promise<void> {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const { error } = await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', userData.user.id)

  if (error) throw error
}
