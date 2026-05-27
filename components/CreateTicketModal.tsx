'use client'

import { useState } from 'react'
import { Profile, Priority, Category } from '@/lib/types'
import { X } from 'lucide-react'

interface Props {
  profiles: Profile[]
  currentUser: Profile | null
  onClose: () => void
  onCreated: () => void
}

export default function CreateTicketModal({ profiles, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [category, setCategory] = useState<Category>('Dashboard')
  const [assignedTo, setAssignedTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(), detail: detail.trim() || null,
        priority, category, assigned_to: assignedTo || null,
      }),
    })

    if (res.ok) { onCreated() }
    else { const d = await res.json(); setError(d.error ?? 'Failed to create ticket') }
    setLoading(false)
  }

  const priorities: Priority[] = ['Low', 'Medium', 'High']
  const categories: Category[] = ['Dashboard', 'Mobile app', 'Backend', 'Design', 'Bug', 'Feature']
  const priorityColors: Record<Priority, string> = {
    Low: 'bg-blue-100 text-blue-700 border-blue-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    High: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
      {/* Mobile: bottom sheet | Desktop: centered modal */}
      <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">Create New Ticket</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Fix login bug"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Detail */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Detail</label>
            <textarea value={detail} onChange={e => setDetail(e.target.value)}
              placeholder="Describe the task..." rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {priorities.map(p => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    priority === p ? priorityColors[p] : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >{p}</button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Assign to <span className="font-normal text-gray-400">(Slack will be notified)</span>
            </label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              <option value="">Unassigned</option>
              <option value="__here__">📢 @here (คนที่ online อยู่)</option>
              <option value="__channel__">📣 @channel (ทุกคนในช่อง)</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-3 text-sm text-white bg-gray-900 rounded-xl hover:bg-gray-800 font-medium disabled:opacity-60"
            >{loading ? 'Creating…' : 'Create Ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
