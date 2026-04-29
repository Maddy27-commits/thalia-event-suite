import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, CalendarDays, Users, Store, Wand2,
  Eye, CheckSquare, TrendingUp, Sparkles, Settings, ChevronDown, X, LogOut,
} from 'lucide-react'
import { useStore } from '../../store'
import { usePlannerEvents } from '../../hooks/usePlannerEvents'
import { useClientEvent } from '../../hooks/useClientEvent'
import { cn, formatDateShort, daysUntil, completionPercent } from '../../lib/utils'
import { ThaliaBloomMark } from '../ui/ThaliaLogo'

interface SidebarProps {
  onClose?: () => void
}

const plannerNav = [
  { to: '/planner',              label: 'Dashboard',    icon: LayoutDashboard, end: true  },
  { to: '/planner/events',       label: 'Events',       icon: CalendarDays                },
  { to: '/planner/vendors',      label: 'Vendors',      icon: Store                       },
  { to: '/planner/clients',      label: 'Clients',      icon: Users                       },
  { to: '/planner/ai-generator', label: 'AI Generator', icon: Wand2,          ai: true   },
  { to: '/planner/settings',     label: 'Settings',     icon: Settings                    },
]

const clientNav = [
  { to: '/client',            label: 'My Event',        icon: Eye,         end: true },
  { to: '/client/concepts',   label: 'Design Concepts', icon: Sparkles               },
  { to: '/client/approvals',  label: 'Approvals',       icon: CheckSquare            },
  { to: '/client/progress',   label: 'Progress',        icon: TrendingUp             },
  { to: '/client/settings',   label: 'Settings',        icon: Settings               },
]

export function Sidebar({ onClose }: SidebarProps) {
  const { role, activeEventId, setActiveEvent, logout, session } = useStore()
  const plannerEvents = usePlannerEvents()
  const { event: clientEvent } = useClientEvent()
  const isPlanner = role === 'planner'
  const nav = isPlanner ? plannerNav : clientNav
  const navigate = useNavigate()
  const [showAllEvents, setShowAllEvents] = useState(false)
  const visibleEvents = showAllEvents ? plannerEvents : plannerEvents.slice(0, 4)

  return (
    <aside className={cn(
      'w-64 flex flex-col h-full shrink-0 relative overflow-hidden',
      isPlanner ? 'bg-surface' : 'bg-white border-r border-stone-100'
    )}>

      {/* Planner: ambient glow effects */}
      {isPlanner && (
        <>
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-0 w-40 h-40 bg-plum-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-20 -left-10 w-48 h-48 bg-brand-400/5 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* ── Logo + mobile close ── */}
      <div className={cn(
        'relative px-5 pt-5 pb-4 flex items-center justify-between',
        isPlanner ? 'border-b border-white/[0.07]' : 'border-b border-stone-100'
      )}>
        <div className="flex items-center gap-3">
          {/* Geometric star mark */}
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            isPlanner
              ? 'bg-gradient-to-br from-brand-500/20 to-plum-500/10 ring-1 ring-brand-400/20'
              : 'bg-gradient-to-br from-brand-50 to-brand-100/60 ring-1 ring-brand-200/60',
          )}>
            <ThaliaBloomMark size={22} dark={isPlanner} />
          </div>
          <div>
            {/* Bold Inter wordmark — modern, not serif */}
            <p className={cn(
              'text-[17px] font-extrabold leading-none tracking-[-0.03em]',
              isPlanner ? 'text-white' : 'text-stone-900'
            )}>
              Thalia
            </p>
            <p className={cn(
              'text-[9px] mt-1 font-semibold tracking-[0.15em] uppercase',
              isPlanner ? 'text-brand-400/60' : 'text-stone-400'
            )}>
              {isPlanner ? 'Planner Suite' : 'Client Portal'}
            </p>
          </div>
        </div>

        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              'md:hidden p-1.5 rounded-lg transition-colors',
              isPlanner
                ? 'text-white/40 hover:text-white/80 hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            )}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Event switcher (planner only) ── */}
      {isPlanner && plannerEvents.length > 0 && (
        <div className="relative px-3 py-3 border-b border-white/[0.07]">
          <p className="text-[10px] font-bold text-brand-400/60 uppercase tracking-widest px-2 mb-2">
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
                      ? 'bg-brand-500/18 text-white ring-1 ring-brand-400/25'
                      : 'text-surface-text hover:bg-white/[0.05] hover:text-white'
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                    active ? 'bg-brand-400' : 'bg-white/20'
                  )} />
                  <span className="truncate font-medium">{e.name}</span>
                </button>
              )
            })}

            {plannerEvents.length > 4 && (
              <button
                onClick={() => setShowAllEvents(v => !v)}
                className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 mt-1 rounded-xl text-[10px] text-brand-400/60 hover:text-brand-300 hover:bg-white/[0.04] font-bold uppercase tracking-widest transition-all"
              >
                <ChevronDown size={10} className={cn('transition-transform', showAllEvents && 'rotate-180')} />
                {showAllEvents ? 'Show less' : `+${plannerEvents.length - 4} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="relative flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-widest px-2 mb-2',
          isPlanner ? 'text-white/25' : 'text-stone-400'
        )}>
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
                  ? 'bg-brand-500/18 text-white ring-1 ring-brand-400/20'
                  : 'text-surface-text hover:bg-white/[0.05] hover:text-white'
                : isActive
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200/50'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={16}
                  className={cn(
                    'shrink-0 transition-all duration-150',
                    isPlanner && isActive && 'text-brand-400',
                    !isActive && 'group-hover:scale-110'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {'ai' in item && item.ai && (
                  <span className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                    isActive
                      ? 'bg-plum-500/30 text-plum-300 border border-plum-400/30'
                      : isPlanner
                        ? 'bg-plum-500/20 text-plum-300/80 border border-plum-400/15'
                        : 'bg-plum-100 text-plum-600 border border-plum-200'
                  )}>
                    AI
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Session footer ── */}
      <div className={cn(
        'relative px-3 py-2 border-t',
        isPlanner ? 'border-white/[0.07]' : 'border-stone-100'
      )}>
        <button
          onClick={() => { logout(); navigate('/welcome') }}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all text-xs font-medium',
            isPlanner
              ? 'text-white/30 hover:text-white/60 hover:bg-white/[0.05]'
              : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
          )}
        >
          <LogOut size={13} className="shrink-0" />
          <span className="flex-1 truncate">
            {session?.displayName ? `Sign out (${session.displayName})` : 'Sign out'}
          </span>
        </button>
      </div>

      {/* ── Client: event countdown widget ── */}
      {!isPlanner && clientEvent && (() => {
        const ev   = clientEvent
        const days = daysUntil(ev.date)
        const pct  = completionPercent(ev.milestones)
        return (
          <div className="px-3 pb-4">
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 via-stone-50 to-sage-50 ring-1 ring-stone-200/50 p-4">
              <p className="text-xs font-semibold text-stone-800 truncate">{ev.name}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{formatDateShort(ev.date)}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-stone-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-sage-500 rounded-full transition-all"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
                <span className="text-[10px] text-brand-600 font-bold">{days}d</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1.5">{pct}% planned</p>
            </div>
          </div>
        )
      })()}
    </aside>
  )
}
