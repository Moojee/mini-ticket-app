'use client'

import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { markTicketAsRead, markCommentAsRead } from './actions'
import { useTransition } from 'react'

// ประกาศ Type เอาไว้ให้ครบถ้วนเพื่อไม่ให้เกิด Error
interface UserProfile {
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

interface CardProps {
  id: string
  type: 'ticket' | 'comment'
  href: string
  profile: UserProfile | null
  title: string
  time: string
  actionText: string
  isRead: boolean
  theme: 'indigo' | 'gray'
}

export default function NotificationCard({ id, type, href, profile, title, time, actionText, isRead, theme }: CardProps) {
  // ใช้ useTransition เพื่อไม่ให้การกด Link ไปรบกวน Server Action
  const [isPending, startTransition] = useTransition()

  const displayName = profile?.full_name || profile?.email || 'Unknown User'
  const initial = displayName.charAt(0).toUpperCase()
  
  const themeClasses = theme === 'indigo' 
    ? { bg: 'bg-indigo-100', text: 'text-indigo-600' }
    : { bg: 'bg-gray-100', text: 'text-gray-600' }

  const handleClick = () => {
    if (!isRead) {
      // เรียกใช้ startTransition เพื่อให้การรันฝั่ง Server ทำงานเสร็จสมบูรณ์
      startTransition(async () => {
        if (type === 'ticket') await markTicketAsRead(id)
        if (type === 'comment') await markCommentAsRead(id)
      })
    }
  }

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={`flex items-start gap-3 rounded-xl px-4 py-3 border transition-all ${
        isRead 
          ? 'bg-white border-gray-100 hover:border-gray-200 opacity-70'
          : 'bg-blue-50 border-blue-100 hover:border-blue-200 shadow-sm'
      }`}
    >
      <div className={`w-8 h-8 rounded-full ${themeClasses.bg} flex items-center justify-center flex-shrink-0 overflow-hidden mt-1`}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className={`text-xs font-bold ${themeClasses.text}`}>{initial}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isRead ? 'font-medium' : 'font-bold'} text-gray-800 truncate`}>
          <span className={themeClasses.text}>{displayName}</span> {actionText}
        </p>
        <p className="text-sm text-gray-600 truncate">{title}</p>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{format(new Date(time), 'dd MMM yyyy, HH:mm')}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(time), { addSuffix: true })}</span>
        </div>
      </div>

      {!isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
      )}
    </Link>
  )
}