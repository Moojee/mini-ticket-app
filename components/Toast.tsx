'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let addToastFn: ((msg: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  addToastFn?.(message, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  useEffect(() => {
    addToastFn = (message, type = 'success') => {
      const id = ++counter
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    return () => { addToastFn = null }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-64 max-w-sm animate-fade-up ${
            t.type === 'success'
              ? 'bg-gray-900 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {t.type === 'success'
            ? <CheckCircle size={16} className="flex-shrink-0 text-green-400" />
            : <XCircle    size={16} className="flex-shrink-0 text-red-200" />
          }
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
            <X size={14} className="opacity-60 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  )
}