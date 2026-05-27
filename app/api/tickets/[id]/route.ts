import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSlackNotification } from '@/lib/slack'

type Params = { params: Promise<{ id: string }> }

// GET /api/tickets/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      creator:profiles!tickets_created_by_fkey(id, email, full_name, avatar_url),
      assignee:profiles!tickets_assigned_to_fkey(id, email, full_name, avatar_url, slack_user_id)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: comments } = await supabase
    .from('comments')
    .select('*, author:profiles(id, email, full_name, avatar_url)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ ...ticket, comments: comments ?? [] })
}

// PATCH /api/tickets/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Get old ticket to detect assignee change
  const { data: oldTicket } = await supabase
    .from('tickets')
    .select('assigned_to')
    .eq('id', id)
    .single()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      creator:profiles!tickets_created_by_fkey(id, email, full_name, avatar_url),
      assignee:profiles!tickets_assigned_to_fkey(id, email, full_name, avatar_url, slack_user_id)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify Slack if assignee changed
  const assigneeChanged = body.assigned_to && body.assigned_to !== oldTicket?.assigned_to
  if (assigneeChanged && ticket.assignee) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    try { await sendSlackNotification(ticket, appUrl) } catch (e) { console.error(e) }
  }

  return NextResponse.json(ticket)
}

// DELETE /api/tickets/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('tickets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
