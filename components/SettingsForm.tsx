'use client'

import { useState } from 'react'
import { Profile } from '@/lib/types'

interface Props { profile: Profile | null }

export default function SettingsForm({ profile }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [slackUserId, setSlackUserId] = useState(profile?.slack_user_id ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)

    const res = await fetch('/api/profiles/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, slack_user_id: slackUserId }),
    })

    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else { const d = await res.json(); setError(d.error ?? 'Failed to save') }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              : <span className="text-xl font-bold text-indigo-600">
                  {(profile?.full_name ?? profile?.email ?? 'U').slice(0,1).toUpperCase()}
                </span>
            }
          </div>
          <div>
            <p className="font-semibold text-gray-800">{profile?.full_name ?? 'No name set'}</p>
            <p className="text-sm text-gray-400">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Display name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
            <input type="text" value={profile?.email ?? ''} disabled
              className="w-full px-3 py-2.5 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Slack Member ID
              <span className="font-normal text-gray-400 ml-1">(for @mention notifications)</span>
            </label>
            <input type="text" value={slackUserId} onChange={e => setSlackUserId(e.target.value)}
              placeholder="e.g. U0B5G8JFMLL"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              หาได้จาก Slack → คลิกชื่อตัวเอง → ⋯ More → Copy member ID
            </p>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {saved && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ Saved successfully</p>}

          <button type="submit" disabled={saving}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-800 font-medium disabled:opacity-60"
          >{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">About</h2>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <div className="flex justify-between"><span>Version</span><span className="font-medium text-gray-700">1.0.0</span></div>
          <div className="flex justify-between"><span>Stack</span><span className="font-medium text-gray-700">Next.js 14 + Supabase</span></div>
          <div className="flex justify-between"><span>Notifications</span><span className="font-medium text-green-600">Slack ✓</span></div>
        </div>
      </div>
    </div>
  )
}
