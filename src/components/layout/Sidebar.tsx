import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, CalendarDays, Users, Store, Wand2,
  Eye, CheckSquare, TrendingUp, Sparkles, Settings, ChevronDown,
} from 'lucide-react'
import { useStore } from '../../store'
import { cn, formatDateShort, daysUntil, completionPercent } from '../../lib/utils'
import { ThaliaBloomMark } from '../ui/ThaliaLogo'

const plannerNav = [
  { to: '/planner',              label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/planner/events',       label: 'Events',        icon: CalendarDays               },
  { to: '/planner/vendors',      label: 'Vendors',       icon: Store                      },
  { to: '/planner/clients',      label: 'Clients',       icon: Users                      },
  { to: '/planner/ai-generator', label: 'AI Generator',  icon: Wand2, ai: true            },
  { to: '/planner/settings',     label: 'Settings',      icon: Settings                   },
]

const clientNav = [
  { to: '/client',            label: 'My Event',        icon: Eye,         end: true },
  { to: '/client/concepts',   label: 'Design Concepts', icon: Sparkles               },
  { to: '/client/approvals',  label: 'Approvals',       icon: CheckSquare            },
  { to: '/client/progress',   label: 'Progress',        icon: TrendingUp             },
  { to: '/client/settings',   label: 'Settings',        icon: Settings               },
]

export function Sidebar() {
  const { role, events, activeEventId, setActiveEvent } = useStore()
  const isPlanner = role === 'planner'
  const nav = isPlanner ? plannerNav : clientNav
  const navigate = useNavigate()
  const [showAllEvents, setShowAllEvents] = useState(false)
  const visibleEvents = showAllEvents ? events : events.slice(0, 4)

  return (
    <aside className={cn(
      'w-64 flex flex-col h-full shrink-0 relative overflow-hidden',
      isPlanner ? 'bg-surface' : 'bg-white border-r border-stone-100'
    )}>

      {/* Planner: subtle radial glow from top-left */}
      {isPlanner && (
        <>
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-0 w-32 h-32 bg-brand-400/5 rounded-full blur-2xl pointer-events-none" />
        </>
      )}

      {/* ── Logo ── */}
      <div className={cn('relative px-5 pt-6 pb-5', isPlanner ? 'border-b border-white/[0.07]' : 'border-b border-stone-100')}>
        <div className="flex items-center gap-3">
          {/* Bloom mark */}
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0',
            isPlanner
              ? 'bg-white/[0.07] ring-1 ring-white/10'
              : 'bg-brand-50 ring-1 ring-brand-100',
          )}>
            <ThaliaBloomMark size={28} />
          </div>
          <div>
            <p className={cn('font-display font-semibold text-lg leading-none tracking-wide', isPlanner ? 'text-white' : 'text-stone-900')}>
              Thalia
            </p>
            <p className={cn('text-[10px] mt-0.5 font-medium tracking-widest uppercase', isPlanner ? 'text-brand-400/80' : 'text-stone-400')}>
              {isPlanner ? 'Planner Suite' : 'Client Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Event switcher (planner only) ── */}
      {isPlanner && events.length > 0 && (
        <div className="relative px-3 py-3 border-b border-white/[0.07]">
          <p className="text-[10px] font-bold text-brand-400/70 uppercase tracking-widest px-2 mb-2">
            Events
          </p>
          <div className="space-y-0.5">
            {visibleEvents.map((e) => {
              const active = activeEventId === e.id
              return (
                <button
                  key={e.id}
                  onClick={() => { setActiveEvent(e.id); navigate('/planner/events') }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all text-xs',
                    active
                      ? 'bg-brand-500/20 text-white ring-1 ring-brand-400/30'
                      : 'text-surface-text hover:bg-white/[0.06] hover:text-white'
                  )}
                >
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', active ? 'bg-brand-400' : 'bg-white/20')} />
                  <span className="truncate font-medium">{e.name}</span>
                </button>
              )
            })}

            {events.length > 4 && (
              <button
                onClick={() => setShowAllEvents(v => !v)}
                className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 mt-1 rounded-xl text-[10px] text-brand-400/70 hover:text-brand-300 hover:bg-white/[0.04] font-bold uppercase tracking-widest transition-all"
              >
                <ChevronDown size={10} className={cn('transition-transform', showAllEvents && 'rotate-180')} />
                {showAllEvents ? 'Show less' : `Show all ${events.length}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="relative flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className={cn('text-[10px] font-bold uppercase tracking-widest px-2 mb-2', isPlanner ? 'text-brand-400/70' : 'text-stone-400')}>
          Navigation
        </p>

        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isPlanner
                ? isActive
                  ? 'bg-brand-500/20 text-white ring-1 ring-brand-400/25'
                  : 'text-surface-text hover:bg-white/[0.06] hover:text-white'
                : isActive
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200/60'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={16} className={cn('shrink-0 transition-transform', !isActive && 'group-hover:scale-110')} />
                <span className="flex-1">{item.label}</span>
                {'ai' in item && item.ai && !isActive && (
                  <span className="text-[9px] font-bold bg-brand-500/25 text-brand-300 px-1.5 py-0.5 rounded-full border border-brand-400/20">
                    AI
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Client event countdown ── */}
      {!isPlanner && events[0] && (() => {
        const ev = events[0]
        const days = daysUntil(ev.date)
        const pct  = completionPercent(ev.milestones)
        return (
          <div className="px-3 pb-4">
            <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-brand-50 ring-1 ring-stone-200/60 p-4">
              <p className="text-xs font-semibold text-stone-800 truncate">{ev.name}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{formatDateShort(ev.date)}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sage-400 to-sage-600 rounded-full" style={{ width: `${Math.max(4, pct)}%` }} />
                </div>
                <span className="text-[10px] text-sage-600 font-bold">{days}d</span>
              </div>
            </div>
          </div>
        )
      })()}
    </aside>
  )
}
