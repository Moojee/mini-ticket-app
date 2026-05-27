import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, title, priority, status, created_at')
    .order('created_at', { ascending: false })

  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  const days = eachDayOfInterval({ start, end })
  const startDay = getDay(start) // 0=Sun

  const PRIORITY_DOT: Record<string, string> = {
    High: 'bg-red-400', Medium: 'bg-amber-400', Low: 'bg-blue-400',
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
        <span className="text-sm text-gray-500">{format(now, 'MMMM yyyy')}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells before month start */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-16 md:min-h-24 border-r border-b border-gray-50" />
          ))}

          {days.map(day => {
            const dayTickets = (tickets ?? []).filter((t: { created_at: string }) =>
              isSameDay(new Date(t.created_at), day)
            )
            const isToday = isSameDay(day, now)

            return (
              <div key={day.toISOString()}
                className="min-h-16 md:min-h-24 border-r border-b border-gray-50 p-1.5 md:p-2"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                  isToday ? 'bg-indigo-600 text-white' : 'text-gray-500'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayTickets.slice(0, 3).map((t: { id: string; title: string; priority: string }) => (
                    <Link key={t.id} href={`/ticket/${t.id}`}
                      className="flex items-center gap-1 hover:bg-gray-50 rounded px-1 py-0.5"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority] ?? 'bg-gray-300'}`} />
                      <span className="text-[10px] text-gray-600 truncate hidden md:block">{t.title}</span>
                    </Link>
                  ))}
                  {dayTickets.length > 3 && (
                    <span className="text-[10px] text-gray-400 px-1">+{dayTickets.length - 3} more</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        {Object.entries(PRIORITY_DOT).map(([p, dot]) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-xs text-gray-500">{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
