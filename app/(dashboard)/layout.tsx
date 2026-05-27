import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  // Count unread: tickets assigned to me not yet read + unread comments on my tickets
  const { count: unreadTickets } = await supabase
    .from('tickets').select('id', { count: 'exact', head: true })
    .eq('assigned_to', user.id).eq('is_assigned_read', false)

  const { data: myTicketIds } = await supabase
    .from('tickets').select('id').eq('created_by', user.id)

  let unreadComments = 0
  if (myTicketIds && myTicketIds.length > 0) {
    const ids = myTicketIds.map((t: { id: string }) => t.id)
    const { count } = await supabase
      .from('comments').select('id', { count: 'exact', head: true })
      .in('ticket_id', ids).eq('is_read', false).neq('user_id', user.id)
    unreadComments = count ?? 0
  }

  const notifCount = (unreadTickets ?? 0) + unreadComments

  return (
    <div className="flex h-screen bg-[#f1f2f6]">
      <Sidebar profile={profile} notifCount={notifCount} />
      {/* pt-14 = mobile top bar offset */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}