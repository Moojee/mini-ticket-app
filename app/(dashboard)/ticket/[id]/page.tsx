import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TicketDetailView from '@/components/TicketDetailView'

type Props = { params: Promise<{ id: string }> }

export default async function TicketPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      creator:profiles!tickets_created_by_fkey(id, email, full_name, avatar_url),
      assignee:profiles!tickets_assigned_to_fkey(id, email, full_name, avatar_url, slack_user_id)
    `)
    .eq('id', id)
    .single()

  if (error || !ticket) notFound()

  const { data: comments } = await supabase
    .from('comments')
    .select('*, author:profiles(id, email, full_name, avatar_url)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .order('full_name', { ascending: true })

  return (
    <TicketDetailView
      ticket={ticket}
      comments={comments ?? []}
      profiles={profiles ?? []}
      currentUserId={user!.id}
    />
  )
}
