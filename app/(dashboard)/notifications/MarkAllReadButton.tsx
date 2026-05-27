'use client'

import { useTransition } from 'react'
import { markAllAsRead } from './actions'

export default function MarkAllReadButton() {
  // ใช้ useTransition เพื่อทำ Loading State แบบเนียนๆ โดยไม่บล็อกหน้าจอ
  const [isPending, startTransition] = useTransition()

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsRead()
    })
  }

  return (
    <button 
      onClick={handleMarkAllRead}
      disabled={isPending}
      className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors px-3 py-1 rounded-md hover:bg-blue-50"
    >
      {isPending ? 'Marking...' : 'Mark all as read'}
    </button>
  )
}