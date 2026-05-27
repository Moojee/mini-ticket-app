import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSlackThreadReply } from '@/lib/slack'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const content = body.content
  const mention_user_ids: string[] = body.mention_user_ids ?? []

  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .insert({ ticket_id: id, user_id: user.id, content: content.trim() })
    .select('*, author:profiles(id, email, full_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build @mention string จาก mention_user_ids
  let mentionText = ''
  if (mention_user_ids.length > 0) {
    const { data: mentionedProfiles } = await supabase
      .from('profiles')
      .select('slack_user_id, full_name, email')
      .in('id', mention_user_ids)

    if (mentionedProfiles && mentionedProfiles.length > 0) {
      mentionText = mentionedProfiles
        .map((p: { slack_user_id: string | null; full_name: string | null; email: string }) =>
          p.slack_user_id ? `<@${p.slack_user_id}>` : `@${p.full_name ?? p.email}`
        )
        .join(' ') + '\n'
    }
  }

  // ดึง ticket เพื่อเอา slack_thread_ts
  const { data: ticket } = await supabase
    .from('tickets')
    .select('slack_thread_ts, title')
    .eq('id', id)
    .single()

  console.log('[Comment] ticket slack_thread_ts:', ticket?.slack_thread_ts)

  if (ticket?.slack_thread_ts) {
    const authorName = data.author?.full_name ?? data.author?.email ?? 'Someone'
    const message = `💬 *${authorName}* commented on *${ticket.title}*:\n${mentionText}${content}`
    try {
      await sendSlackThreadReply(ticket.slack_thread_ts, message)
      console.log('[Comment] Slack thread reply sent')
    } catch (e) {
      console.error('[Comment] Slack thread reply error:', e)
    }
  } else {
    console.warn('[Comment] No slack_thread_ts found — comment will not appear in Slack')
  }

  return NextResponse.json(data, { status: 201 })
}