'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { LayoutDashboard, Bell, Calendar, Settings, LogOut, Plus, Menu, X } from 'lucide-react'

interface Props { profile: Profile | null; notifCount?: number }

export default function Sidebar({ profile, notifCount = 0 }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (profile?.full_name ?? profile?.email ?? 'U')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const navItems = [
    { icon: Bell,     label: 'Notifications', href: '/notifications', badge: notifCount },
    { icon: Calendar, label: 'Calendar',       href: '/calendar' },
    { icon: Settings, label: 'Settings',       href: '/settings' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User */}
      <div className="p-4 border-b border-gray-100">
        <Link href="/settings" onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-1.5 -m-1.5 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
              : <span className="text-white text-xs font-bold">{initials}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-800 truncate">{profile?.full_name ?? 'User'}</div>
            <div className="text-xs text-gray-400 truncate">{profile?.email}</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 border-b border-gray-100 flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Main Menu</p>
        {navItems.map(({ icon: Icon, label, href, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={label} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} className={active ? 'text-indigo-600' : 'text-gray-400'} />
              {label}
              {badge && badge > 0 ? (
                <span className="ml-auto bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      {/* Pages */}
      <div className="px-3 py-3 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">My Pages</p>
        <Link href="/board" onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/board' || pathname.startsWith('/ticket')
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard size={11} className="text-white" />
          </div>
          Ticket Board
        </Link>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50 transition-colors w-full text-left mt-0.5">
          <Plus size={15} />
          Create New
        </button>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-gray-100">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-white border-r border-gray-100 flex-col h-full">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/board" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">Ticket Board</span>
        </Link>
        <button onClick={() => setMobileOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <Menu size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-gray-800">Menu</span>
              <button onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              ><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-auto"><SidebarContent /></div>
          </div>
        </div>
      )}
    </>
  )
}
