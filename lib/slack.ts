import { Ticket, PRIORITY_CONFIG, formatTicketNumber } from './types'

const AUTO_TAG = `<!here> <@U0B5G8JFMLL>`

function resolveAssigneeTag(ticket: Ticket): string {
  const mentionType = (ticket as unknown as Record<string, unknown>).mention_type as string | null
  if (mentionType === '__here__')    return '<!here>'
  if (mentionType === '__channel__') return '<!channel>'
  if (ticket.assignee?.slack_user_id) return `<@${ticket.assignee.slack_user_id}>`
  if (ticket.assignee) return `@${ticket.assignee.full_name ?? ticket.assignee.email}`
  return 'Unassigned'
}

function buildBlocks(ticket: Ticket, appUrl: string) {
  const priority    = PRIORITY_CONFIG[ticket.priority]
  const assigneeTag = resolveAssigneeTag(ticket)
  const ticketUrl   = `${appUrl}/ticket/${ticket.id}`
  const ticketNum   = formatTicketNumber(ticket.ticket_number)

  const dueDateText = ticket.due_date
    ? `📅 Due: ${new Date(ticket.due_date).toLocaleDateString('th-TH', { dateStyle: 'medium' })}`
    : null

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🎫 New Ticket Assigned! ${ticketNum}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `${AUTO_TAG}` },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Ticket:*\n${ticketNum}` },
        { type: 'mrkdwn', text: `*Priority:*\n${priority.emoji} ${ticket.priority}` },
      ],
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Title:*\n${ticket.title}` },
        { type: 'mrkdwn', text: `*Category:*\n${ticket.category}` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Detail:*\n${ticket.detail ?? '-'}` },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Assigned to:*\n${assigneeTag}` },
        ...(dueDateText ? [{ type: 'mrkdwn', text: dueDateText }] : []),
      ],
    },
    {
      type: 'actions',
      elements: [{
        type: 'button',
        text: { type: 'plain_text', text: '👉 View Ticket', emoji: true },
        style: 'primary',
        url: ticketUrl,
      }],
    },
  ]
}

export async function sendSlackNotification(ticket: Ticket, appUrl: string): Promise<string | null> {
  const token      = process.env.SLACK_BOT_TOKEN
  const channelId  = process.env.SLACK_CHANNEL_ID
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  console.log('[Slack] token:', token ? 'SET' : 'NOT SET')
  console.log('[Slack] channelId:', channelId ? 'SET' : 'NOT SET')

  if (token && channelId) {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        channel: channelId,
        blocks: buildBlocks(ticket, appUrl),
        text: `🎫 ${formatTicketNumber(ticket.ticket_number)} ${ticket.title}`,
      }),
    })
    const data = await res.json()
    console.log('[Slack] response ok:', data.ok, data.error ?? '')
    if (!data.ok) return null
    return data.ts
  }

  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: buildBlocks(ticket, appUrl),
        text: `🎫 ${formatTicketNumber(ticket.ticket_number)} ${ticket.title}`,
      }),
    })
    return null
  }

  console.warn('[Slack] No credentials set!')
  return null
}

export async function sendSlackThreadReply(threadTs: string, message: string): Promise<void> {
  const token     = process.env.SLACK_BOT_TOKEN
  const channelId = process.env.SLACK_CHANNEL_ID
  if (!token || !channelId) return

  const res  = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ channel: channelId, thread_ts: threadTs, text: message }),
  })
  const data = await res.json()
  if (!data.ok) console.error('[Slack] Thread reply error:', data.error)
}