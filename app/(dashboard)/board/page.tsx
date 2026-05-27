import KanbanBoard from '@/components/KanbanBoard'
import { createClient } from '@/lib/supabase/server'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="flex flex-col min-h-full">
      {/* Cover */}
      <div className="relative h-32 md:h-44 flex-shrink-0 bg-gradient-to-br from-indigo-400 via-blue-500 to-violet-500 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 1200 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <path d="M0 60 Q300 10 600 60 T1200 60"  stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 100 Q300 50 600 100 T1200 100" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 140 Q300 90 600 140 T1200 140" stroke="white" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        <div className="relative z-10 p-5 md:p-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Ticket Board</h1>
          <p className="text-blue-100 mt-1 text-xs md:text-sm">Internal task management · Mini Ticket</p>
        </div>
      </div>

      {/* Board — px only, no height constraint so page scrolls */}
      <div className="flex-1 px-3 md:px-6 pb-8">
        <KanbanBoard currentUser={profile} />
      </div>
    </div>
  )
}