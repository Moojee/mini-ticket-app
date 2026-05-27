'use client'

import Link from 'next/link'
import { Ticket, Status, PRIORITY_CONFIG, CATEGORY_CONFIG, formatTicketNumber } from '@/lib/types'
import { MessageCircle, Paperclip, Clock } from 'lucide-react'
import { format, isAfter } from 'date-fns'

interface Props {
  ticket: Ticket
  onStatusChange: (ticket: Ticket, status: Status) => void
  onUpdate: () => void
  draggable?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
}

export default function TicketCard({ ticket, draggable, onDragStart, onDragEnd }: Props) {
  const priority = PRIORITY_CONFIG[ticket.priority]
  const category = CATEGORY_CONFIG[ticket.category]

  const assigneeInitials = ticket.assignee
    ? (ticket.assignee.full_name ?? ticket.assignee.email).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : null

  const creatorInitials = ticket.creator
    ? (ticket.creator.full_name ?? ticket.creator.email).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : null

  const isOverdue = ticket.due_date &&
    ticket.status !== 'completed' &&
    isAfter(new Date(), new Date(ticket.due_date))

  return (
    <Link href={`/ticket/${ticket.id}`}>
      <div
        draggable={draggable} onDragStart={onDragStart} onDragEnd={onDragEnd}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer md:cursor-grab active:cursor-grabbing group active:scale-[0.98]"
      >
        {/* Ticket number */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-semibold text-gray-400">
            {formatTicketNumber(ticket.ticket_number)}
          </span>
          {isOverdue && (
            <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Clock size={9} /> Overdue
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${category.bg} ${category.color}`}>
            {ticket.category}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {ticket.priority}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1 group-hover:text-indigo-700 transition-colors">
          {ticket.title}
        </h3>

        {/* Detail */}
        {ticket.detail && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{ticket.detail}</p>
        )}

        {/* Due date */}
        {ticket.due_date && (
          <div className={`flex items-center gap-1 text-xs mb-2 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            <Clock size={10} />
            {format(new Date(ticket.due_date), 'MMM d, yyyy')}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex -space-x-1.5">
            {creatorInitials && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center flex-shrink-0">
                {ticket.creator?.avatar_url
                  ? <img src={ticket.creator.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  : <span className="text-[9px] font-bold text-indigo-600">{creatorInitials}</span>
                }
              </div>
            )}
            {assigneeInitials && ticket.assigned_to !== ticket.created_by
              && ticket.assigned_to !== '__here__' && ticket.assigned_to !== '__channel__' && (
              <div className="w-6 h-6 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center flex-shrink-0">
                {ticket.assignee?.avatar_url
                  ? <img src={ticket.assignee.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  : <span className="text-[9px] font-bold text-violet-600">{assigneeInitials}</span>
                }
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {(ticket.attachments_count ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Paperclip size={11} />{ticket.attachments_count}</span>
            )}
            <span className="flex items-center gap-1"><MessageCircle size={11} />{ticket.comments_count ?? 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}