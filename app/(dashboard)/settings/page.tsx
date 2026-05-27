import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>
      <SettingsForm profile={profile} />
    </div>
  )
}
