import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSlackNotification } from '@/lib/slack'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      creator:profiles!tickets_created_by_fkey(id, email, full_name, avatar_url),
      assignee:profiles!tickets_assigned_to_fkey(id, email, full_name, avatar_url, slack_user_id)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ticketIds = (data ?? []).map((t: { id: string }) => t.id)
  let commentCounts: Record<string, number> = {}
  if (ticketIds.length > 0) {
    const { data: counts } = await supabase
      .from('comments').select('ticket_id').in('ticket_id', ticketIds)
    if (counts) {
      counts.forEach((c: { ticket_id: string }) => {
        commentCounts[c.ticket_id] = (commentCounts[c.ticket_id] ?? 0) + 1
      })
    }
  }

  return NextResponse.json(
    (data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      comments_count: commentCounts[t.id as string] ?? 0,
    }))
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, detail, priority, category, assigned_to } = body

  if (!title || !priority || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // assigned_to ต้องเป็น UUID จริงเท่านั้น
  const realAssignedTo = (
    assigned_to &&
    assigned_to !== '__here__' &&
    assigned_to !== '__channel__'
  ) ? assigned_to : null

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      title,
      detail: detail ?? null,
      priority,
      category,
      status: 'todo',
      created_by: user.id,
      assigned_to: realAssignedTo,
    })
    .select(`
      *,
      creator:profiles!tickets_created_by_fkey(id, email, full_name, avatar_url),
      assignee:profiles!tickets_assigned_to_fkey(id, email, full_name, avatar_url, slack_user_id)
    `)
    .single()

  if (error) {
    console.error('[Ticket] Insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ส่ง Slack ทุก ticket เสมอ ไม่ว่าจะ assign หรือไม่
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const threadTs = await sendSlackNotification(ticket, appUrl)
    if (threadTs) {
      // บันทึก thread_ts เพื่อ reply comment ทีหลัง
      await supabase
        .from('tickets')
        .update({ slack_thread_ts: threadTs })
        .eq('id', ticket.id)
    }
  } catch (e) {
    console.error('[Ticket] Slack notification failed:', e)
  }

  return NextResponse.json(ticket, { status: 201 })
}