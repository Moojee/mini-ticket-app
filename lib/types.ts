export type Priority = 'Low' | 'Medium' | 'High'
export type Status   = 'todo' | 'inprogress' | 'inreview' | 'completed'
export type Category = 'Dashboard' | 'Mobile app' | 'Backend' | 'Design' | 'Bug' | 'Feature'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  slack_user_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface Ticket {
  id: string
  ticket_number: number | null
  title: string
  detail: string | null
  status: Status
  priority: Priority
  category: Category
  created_by: string
  assigned_to: string | null
  due_date: string | null
  slack_thread_ts: string | null
  is_assigned_read: boolean
  created_at: string
  updated_at: string
  // joined
  creator?: Profile
  assignee?: Profile
  comments_count?: number
  attachments_count?: number
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  content: string
  is_read: boolean
  created_at: string
  author?: Profile
}

export const STATUS_COLUMNS: { id: Status; label: string; color: string; dot: string }[] = [
  { id: 'todo',       label: 'To-do',       color: 'text-gray-500',  dot: 'bg-gray-400'  },
  { id: 'inprogress', label: 'In Progress',  color: 'text-blue-500',  dot: 'bg-blue-400'  },
  { id: 'inreview',   label: 'In Review',    color: 'text-amber-500', dot: 'bg-amber-400' },
  { id: 'completed',  label: 'Completed',    color: 'text-green-500', dot: 'bg-green-400' },
]

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; emoji: string; dot: string }> = {
  Low:    { label: 'Low',    color: 'text-blue-600',  bg: 'bg-blue-50',   emoji: '🟢', dot: 'bg-blue-400'  },
  Medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50',  emoji: '🟡', dot: 'bg-amber-400' },
  High:   { label: 'High',   color: 'text-red-600',   bg: 'bg-red-50',    emoji: '🔴', dot: 'bg-red-400'   },
}

export const CATEGORY_CONFIG: Record<Category, { color: string; bg: string; icon: string }> = {
  'Dashboard':  { color: 'text-indigo-600', bg: 'bg-indigo-50',  icon: '📊' },
  'Mobile app': { color: 'text-orange-600', bg: 'bg-orange-50',  icon: '📱' },
  'Backend':    { color: 'text-purple-600', bg: 'bg-purple-50',  icon: '⚙️' },
  'Design':     { color: 'text-pink-600',   bg: 'bg-pink-50',    icon: '🎨' },
  'Bug':        { color: 'text-red-600',    bg: 'bg-red-50',     icon: '🐛' },
  'Feature':    { color: 'text-green-600',  bg: 'bg-green-50',   icon: '✨' },
}

export function formatTicketNumber(n: number | null | undefined): string {
  if (!n) return '#---'
  return `#${String(n).padStart(3, '0')}`
}