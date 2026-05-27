'use client'

import { useEffect, useState, useCallback } from 'react'
import { Ticket, Profile, Status, Priority, Category, STATUS_COLUMNS, PRIORITY_CONFIG, CATEGORY_CONFIG } from '@/lib/types'
import TicketCard from './TicketCard'
import CreateTicketModal from './CreateTicketModal'
import { Plus, Search, LayoutGrid, List, X, ChevronDown, SlidersHorizontal } from 'lucide-react'

interface Props { currentUser: Profile | null }

type ViewMode = 'kanban' | 'list'

export default function KanbanBoard({ currentUser }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [activeCol, setActiveCol] = useState<Status>('todo')
  const [dragTicket, setDragTicket] = useState<Ticket | null>(null)
  const [dragOver, setDragOver] = useState<Status | null>(null)
  // Filters
  const [showFilter, setShowFilter] = useState(false)
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [filterCategory, setFilterCategory] = useState<Category | ''>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')

  const fetchTickets = useCallback(async () => {
    const res = await fetch('/api/tickets')
    if (res.ok) setTickets(await res.json())
    setLoading(false)
  }, [])

  const fetchProfiles = useCallback(async () => {
    const res = await fetch('/api/profiles')
    if (res.ok) setProfiles(await res.json())
  }, [])

  useEffect(() => { fetchTickets(); fetchProfiles() }, [fetchTickets, fetchProfiles])

  async function handleStatusChange(ticket: Ticket, newStatus: Status) {
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t))
    await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  function handleDragStart(ticket: Ticket) { setDragTicket(ticket) }
  function handleDragEnd() { setDragTicket(null); setDragOver(null) }
  async function handleDropCol(status: Status) {
    if (dragTicket && dragTicket.status !== status) await handleStatusChange(dragTicket, status)
    setDragTicket(null); setDragOver(null)
  }

  const activeFiltersCount = [filterPriority, filterCategory, filterAssignee].filter(Boolean).length

  const filteredTickets = tickets.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      t.title.toLowerCase().includes(q) ||
      (t.detail ?? '').toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.priority.toLowerCase().includes(q) ||
      (t.assignee?.full_name ?? '').toLowerCase().includes(q) ||
      (t.assignee?.email ?? '').toLowerCase().includes(q)
    const matchPriority = !filterPriority || t.priority === filterPriority
    const matchCategory = !filterCategory || t.category === filterCategory
    const matchAssignee = !filterAssignee || t.assigned_to === filterAssignee
    return matchSearch && matchPriority && matchCategory && matchAssignee
  })

  const grouped = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.id] = filteredTickets.filter(t => t.status === col.id)
    return acc
  }, {} as Record<Status, Ticket[]>)

  function clearFilters() {
    setFilterPriority(''); setFilterCategory(''); setFilterAssignee(''); setSearch('')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading tickets…</div>
  )

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="py-3 md:py-4 flex flex-col gap-2">

        {/* Desktop toolbar */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* View tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            ><LayoutGrid size={14} /> Kanban</button>
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            ><List size={14} /> List</button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search title, detail, category…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 w-64 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <button onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                  activeFiltersCount > 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                }`}
              >
                <SlidersHorizontal size={14} />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {showFilter && (
                <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-72">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-800">Filters</span>
                    {activeFiltersCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600">Clear all</button>
                    )}
                  </div>

                  {/* Priority filter */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Priority</label>
                    <div className="flex gap-1.5">
                      {(['Low', 'Medium', 'High'] as Priority[]).map(p => {
                        const cfg = PRIORITY_CONFIG[p]
                        return (
                          <button key={p} onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              filterPriority === p ? `${cfg.bg} ${cfg.color} border-transparent` : 'bg-gray-50 text-gray-500 border-gray-200'
                            }`}
                          >{p}</button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Category filter */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Category</label>
                    <div className="relative">
                      <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as Category | '')}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none pr-8"
                      >
                        <option value="">All categories</option>
                        {Object.keys(CATEGORY_CONFIG).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Assignee filter */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Assignee</label>
                    <div className="relative">
                      <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none pr-8"
                      >
                        <option value="">All assignees</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <button onClick={() => setShowFilter(false)}
                    className="mt-3 w-full py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-800"
                  >Apply</button>
                </div>
              )}
            </div>

            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 font-medium"
            >
              <Plus size={14} /> New Task
            </button>
          </div>
        </div>

        {/* Mobile toolbar */}
        <div className="flex md:hidden items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            ><LayoutGrid size={11} /> Kanban</button>
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            ><List size={11} /> List</button>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setShowSearch(!showSearch)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                showSearch || search ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200 bg-white'
              }`}
            ><Search size={14} className={showSearch || search ? 'text-indigo-600' : 'text-gray-500'} /></button>
            <button onClick={() => setShowFilter(!showFilter)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors relative ${
                activeFiltersCount > 0 ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200 bg-white'
              }`}
            >
              <SlidersHorizontal size={14} className={activeFiltersCount > 0 ? 'text-indigo-600' : 'text-gray-500'} />
              {activeFiltersCount > 0 && <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">{activeFiltersCount}</span>}
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg font-medium"
            ><Plus size={13} /> New</button>
          </div>
        </div>

        {/* Mobile search bar */}
        {showSearch && (
          <div className="md:hidden relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search tickets…" value={search}
              onChange={e => setSearch(e.target.value)} autoFocus
              className="w-full pl-8 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Mobile filter panel */}
        {showFilter && (
          <div className="md:hidden bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">Filters</span>
              {activeFiltersCount > 0 && <button onClick={clearFilters} className="text-xs text-red-500">Clear all</button>}
            </div>
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Priority</label>
              <div className="flex gap-1.5">
                {(['Low', 'Medium', 'High'] as Priority[]).map(p => {
                  const cfg = PRIORITY_CONFIG[p]
                  return (
                    <button key={p} onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                        filterPriority === p ? `${cfg.bg} ${cfg.color} border-transparent` : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >{p}</button>
                  )
                })}
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Category</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as Category | '')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none appearance-none"
              >
                <option value="">All categories</option>
                {Object.keys(CATEGORY_CONFIG).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Assignee</label>
              <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none appearance-none"
              >
                <option value="">All assignees</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>)}
              </select>
            </div>
            <button onClick={() => setShowFilter(false)} className="mt-3 w-full py-2 bg-gray-900 text-white text-sm rounded-xl">Apply</button>
          </div>
        )}

        {/* Active filter tags */}
        {(search || activeFiltersCount > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">{filteredTickets.length} result{filteredTickets.length !== 1 ? 's' : ''}</span>
            {search && (
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                "{search}" <button onClick={() => setSearch('')}><X size={10} /></button>
              </span>
            )}
            {filterPriority && (
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                {filterPriority} <button onClick={() => setFilterPriority('')}><X size={10} /></button>
              </span>
            )}
            {filterCategory && (
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                {filterCategory} <button onClick={() => setFilterCategory('')}><X size={10} /></button>
              </span>
            )}
            {filterAssignee && (
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                {profiles.find(p => p.id === filterAssignee)?.full_name ?? 'Assignee'}
                <button onClick={() => setFilterAssignee('')}><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-2 pb-24 md:pb-8">
          {filteredTickets.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">No tickets found</div>
          )}
          {STATUS_COLUMNS.map(col => {
            const colTickets = filteredTickets.filter(t => t.status === col.id)
            if (colTickets.length === 0) return null
            return (
              <div key={col.id}>
                <div className="flex items-center gap-2 px-1 py-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{col.label}</span>
                  <span className="text-xs text-gray-400">({colTickets.length})</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {colTickets.map(ticket => (
                    <ListTicketRow key={ticket.id} ticket={ticket} profiles={profiles}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {viewMode === 'kanban' && (
        <>
          {/* Mobile column tabs */}
          <div className="flex md:hidden gap-1 overflow-x-auto pb-2">
            {STATUS_COLUMNS.map(col => (
              <button key={col.id} onClick={() => setActiveCol(col.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-colors ${
                  activeCol === col.id ? 'bg-white shadow-sm text-gray-800 border border-gray-200' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                {col.label}
                <span className="bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 text-[10px]">{grouped[col.id].length}</span>
              </button>
            ))}
          </div>

          {/* Desktop columns */}
          <div className="hidden md:flex gap-4 overflow-x-auto pb-6" style={{ minHeight: '60vh' }}>
            {STATUS_COLUMNS.map(col => (
              <KanbanColumn key={col.id} col={col} tickets={grouped[col.id]}
                isDragTarget={dragOver === col.id}
                onDragOver={() => setDragOver(col.id)}
                onDrop={() => handleDropCol(col.id)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onNewTask={() => setShowCreate(true)}
                onUpdate={fetchTickets}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {/* Mobile single column */}
          <div className="flex md:hidden flex-col gap-3 pb-24">
            {STATUS_COLUMNS.filter(c => c.id === activeCol).map(col => (
              <KanbanColumn key={col.id} col={col} tickets={grouped[col.id]}
                isDragTarget={false} onDragOver={() => {}} onDrop={() => {}}
                onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                onNewTask={() => setShowCreate(true)}
                onUpdate={fetchTickets} onStatusChange={handleStatusChange} mobile
              />
            ))}
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button onClick={() => setShowCreate(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform"
      >
        <Plus size={22} />
      </button>

      {showCreate && (
        <CreateTicketModal profiles={profiles} currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchTickets() }}
        />
      )}
    </>
  )
}

// ── Kanban Column ──
function KanbanColumn({ col, tickets, isDragTarget, onDragOver, onDrop, onDragStart, onDragEnd, onNewTask, onUpdate, onStatusChange, mobile }: {
  col: typeof STATUS_COLUMNS[0]; tickets: Ticket[]
  isDragTarget: boolean; onDragOver: () => void; onDrop: () => void
  onDragStart: (t: Ticket) => void; onDragEnd: () => void
  onNewTask: () => void; onUpdate: () => void
  onStatusChange: (t: Ticket, s: Status) => void; mobile?: boolean
}) {
  return (
    <div className={`flex flex-col ${mobile ? 'w-full' : 'flex-shrink-0 w-72'}`}
      onDragOver={e => { e.preventDefault(); onDragOver() }} onDrop={onDrop}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.dot}`} />
          <span className="text-sm font-semibold text-gray-700">{col.label}</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{tickets.length}</span>
        </div>
        <button onClick={onNewTask} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
          <Plus size={14} />
        </button>
      </div>
      {/* Scrollable card area */}
      <div className={`flex flex-col gap-3 rounded-xl p-2 overflow-y-auto transition-colors ${
        isDragTarget ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'bg-transparent'
      }`} style={{ maxHeight: 'calc(100vh - 340px)', minHeight: '80px' }}>
        {tickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket}
            onStatusChange={onStatusChange} onUpdate={onUpdate}
            draggable={!mobile}
            onDragStart={() => onDragStart(ticket)} onDragEnd={onDragEnd}
          />
        ))}
        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-16 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400">
            {mobile ? 'No tickets' : 'Drop here'}
          </div>
        )}
      </div>
    </div>
  )
}

// ── List Row ──
function ListTicketRow({ ticket, profiles, onStatusChange }: {
  ticket: Ticket; profiles: Profile[]
  onStatusChange: (t: Ticket, s: Status) => void
}) {
  const priority = PRIORITY_CONFIG[ticket.priority]
  const category = CATEGORY_CONFIG[ticket.category]

  return (
    <a href={`/ticket/${ticket.id}`}
      className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all group"
    >
      {/* Status dot */}
      <select
        value={ticket.status}
        onClick={e => e.preventDefault()}
        onChange={e => { e.preventDefault(); onStatusChange(ticket, e.target.value as Status) }}
        className="text-xs border-0 bg-transparent focus:outline-none cursor-pointer text-gray-400 flex-shrink-0 -ml-1"
      >
        {STATUS_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>

      {/* Title */}
      <span className="flex-1 text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
        {ticket.title}
      </span>

      {/* Badges */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${category.bg} ${category.color}`}>
          {ticket.category}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.bg} ${priority.color}`}>
          {priority.emoji} {ticket.priority}
        </span>
      </div>

      {/* Assignee avatar */}
      {ticket.assignee && (
        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          {ticket.assignee.avatar_url
            ? <img src={ticket.assignee.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            : <span className="text-[9px] font-bold text-violet-600">
                {(ticket.assignee.full_name ?? ticket.assignee.email).split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
              </span>
          }
        </div>
      )}
    </a>
  )
}
