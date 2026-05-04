import { useState } from 'react'
import { CalendarDays, Store, Wand2, TrendingUp, CheckCircle2, AlertCircle, Bell, ArrowRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { usePlannerEvents } from '../../hooks/usePlannerEvents'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SendReminderModal } from '../../components/planner/SendReminderModal'
import { ThaliaBloomMark } from '../../components/ui/ThaliaLogo'
import { formatCurrency, formatDateShort, daysUntil, completionPercent } from '../../lib/utils'
import type { Event } from '../../types'

const statusBadge: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft:     'default',
  planning:  'info',
  confirmed: 'success',
  completed: 'success',
  cancelled: 'danger',
}

function timeGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours()
  if (h < 5)  return { text: 'Burning the midnight oil', emoji: '🌙' }
  if (h < 12) return { text: 'Good morning',              emoji: '☀️' }
  if (h < 17) return { text: 'Good afternoon',            emoji: '👋' }
  if (h < 21) return { text: 'Good evening',              emoji: '🌆' }
  return       { text: 'Good night',                       emoji: '✨' }
}

// Coloured top-band gradient per event type
const eventTypeBand: Record<string, string> = {
  wedding:     'from-rose-400 via-pink-500 to-rose-600',
  corporate:   'from-sky-500 via-blue-500 to-indigo-600',
  birthday:    'from-amber-400 via-orange-400 to-amber-600',
  anniversary: 'from-brand-400 via-brand-500 to-brand-700',
  default:     'from-stone-400 via-stone-500 to-stone-600',
}

export function PlannerDashboard() {
  const { vendors, setActiveEvent, plannerProfile } = useStore()
  const events = usePlannerEvents()
  const navigate = useNavigate()
  const [reminderEvent, setReminderEvent] = useState<Event | null>(null)
  const greeting  = timeGreeting()
  const firstName = plannerProfile.name.trim().split(/\s+/)[0]

  const upcomingEvents = events
    .filter((e) => e.status !== 'cancelled' && e.status !== 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const totalBudget      = events.reduce((sum, e) => sum + e.budget, 0)
  const pendingApprovals = events.reduce((sum, e) => sum + e.concepts.filter(c => c.status === 'pending').length, 0)

  // Each summary card has its own colour identity, a value, a headline label,
  // a one-line context blurb, and a route — so the card is informative AND
  // navigable, not just a passive number.
  const stats = [
    {
      label: 'Active Events',
      sub:   upcomingEvents.length === 0 ? 'No upcoming events yet' : 'In planning right now',
      value: String(upcomingEvents.length),
      icon: CalendarDays,
      to: '/planner/events',
      cardBg:    'bg-gradient-to-br from-brand-50 to-brand-100/70',
      ring:      'ring-brand-200/50',
      numColor:  'text-brand-800',
      iconBg:    'bg-brand-100',
      iconColor: 'text-brand-600',
    },
    {
      label: 'Portfolio Budget',
      sub:   'Across all your events',
      value: formatCurrency(totalBudget),
      icon: TrendingUp,
      to: '/planner/events',
      cardBg:    'bg-gradient-to-br from-sage-50 to-sage-100/70',
      ring:      'ring-sage-200/50',
      numColor:  'text-sage-800',
      iconBg:    'bg-sage-100',
      iconColor: 'text-sage-600',
    },
    {
      label: 'Vendor Network',
      sub:   vendors.length === 0 ? 'Add your first vendor' : 'Florists, venues, caterers…',
      value: String(vendors.length),
      icon: Store,
      to: '/planner/vendors',
      cardBg:    'bg-gradient-to-br from-plum-50 to-plum-100/70',
      ring:      'ring-plum-200/50',
      numColor:  'text-plum-800',
      iconBg:    'bg-plum-100',
      iconColor: 'text-plum-600',
    },
    {
      label: 'Pending Approvals',
      sub:   pendingApprovals === 0 ? 'You’re all caught up' : 'Concepts awaiting client review',
      value: String(pendingApprovals),
      icon: AlertCircle,
      to: '/planner/events',
      cardBg:    pendingApprovals > 0 ? 'bg-gradient-to-br from-rose-50 to-rose-100/70' : 'bg-gradient-to-br from-stone-50 to-stone-100/60',
      ring:      pendingApprovals > 0 ? 'ring-rose-200/50' : 'ring-stone-200/40',
      numColor:  pendingApprovals > 0 ? 'text-rose-700'   : 'text-stone-500',
      iconBg:    pendingApprovals > 0 ? 'bg-rose-100'     : 'bg-stone-100',
      iconColor: pendingApprovals > 0 ? 'text-rose-500'   : 'text-stone-400',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-10">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3 min-w-0">
          <ThaliaBloomMark size={36} className="shrink-0 opacity-75 hidden sm:block" />
          <div className="min-w-0">
            <p className="eyebrow text-brand-400 hidden sm:block">Planner Dashboard</p>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 truncate">
              {greeting.text}{firstName ? `, ${firstName}` : ''} {greeting.emoji}
            </h1>
            <p className="text-stone-400 text-sm mt-0.5 hidden sm:block">
              Here's what's happening across your events.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            icon={<Plus size={15} />}
            size="sm"
            onClick={() => navigate('/planner/events', { state: { openCreate: true } })}
            className="sm:hidden"
          >
          </Button>
          <Button
            variant="ghost"
            icon={<Plus size={15} />}
            onClick={() => navigate('/planner/events', { state: { openCreate: true } })}
            className="hidden sm:inline-flex"
          >
            New Event
          </Button>
          <Button
            icon={<Wand2 size={15} />}
            size="sm"
            onClick={() => navigate('/planner/ai-generator')}
            className="sm:hidden"
          >
            AI
          </Button>
          <Button
            icon={<Wand2 size={15} />}
            onClick={() => navigate('/planner/ai-generator')}
            className="hidden sm:inline-flex"
          >
            Generate Concepts
          </Button>
        </div>
      </div>

      {/* ── Summary cards — each is a clickable shortcut to its section ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.to)}
            className={`stat-card text-left ${stat.cardBg} ${stat.ring} animate-fade-in hover:scale-[1.02] hover:shadow-md transition-all group`}
            style={{ animationDelay: `${i * 75}ms` }}
          >
            {/* Icon + headline label */}
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.iconColor} />
              </div>
              <ArrowRight size={13} className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            {/* Big display number */}
            <p className={`font-display text-3xl sm:text-4xl font-semibold leading-none ${stat.numColor}`}>
              {stat.value}
            </p>
            <p className="text-sm font-semibold text-stone-700 mt-2 leading-tight">{stat.label}</p>
            <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">{stat.sub}</p>
          </button>
        ))}
      </div>

      {/* ── Upcoming Events ── */}
      <section className="animate-fade-in delay-300">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <p className="eyebrow text-brand-400">Your Work</p>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-stone-900 leading-tight">
              Upcoming Events
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/planner/events')} className="gap-1 text-stone-400 hover:text-stone-700">
            View all <ArrowRight size={13} />
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 py-14 text-center">
            <CalendarDays size={28} className="mx-auto text-stone-200 mb-3" />
            <p className="text-stone-400 text-sm font-medium">No upcoming events</p>
            <p className="text-stone-300 text-xs mt-1 mb-4">Create your first event to get started</p>
            <button
              onClick={() => navigate('/planner/events', { state: { openCreate: true } })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-all"
            >
              <Plus size={13} />
              New Event
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => {
              const days         = daysUntil(event.date)
              const progress     = completionPercent(event.milestones)
              const pendingCount = event.concepts.filter(c => c.status === 'pending').length
              const band         = eventTypeBand[event.type] ?? eventTypeBand.default

              return (
                <div
                  key={event.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Card hover onClick={() => { setActiveEvent(event.id); navigate('/planner/events') }}>
                    {/* Coloured type band */}
                    <div className={`h-12 sm:h-14 bg-gradient-to-r ${band} rounded-t-2xl relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10" />
                      {/* Decorative circles */}
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
                      <div className="absolute -right-1 top-6 w-10 h-10 bg-white/8 rounded-full" />
                      <div className="absolute inset-x-0 bottom-0 top-0 flex items-center px-4 gap-2.5">
                        <p className="text-white font-semibold text-sm drop-shadow-sm truncate flex-1">{event.name}</p>
                        <Badge variant={statusBadge[event.status]} className="shrink-0 bg-white/20 text-white border-0 backdrop-blur-sm">
                          {event.status}
                        </Badge>
                        {pendingCount > 0 && (
                          <span className="shrink-0 text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">
                            {pendingCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content area */}
                    <CardBody className="pt-3 pb-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-4">
                        {/* Left: meta info + progress */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-stone-400 truncate mb-2">
                            {event.clientName} · {event.location} · {event.guestCount} guests
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${band} rounded-full transition-all opacity-80`}
                                style={{ width: `${Math.max(3, progress)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-stone-400 shrink-0 font-medium">{progress}%</span>
                          </div>
                        </div>

                        {/* Right: key numbers */}
                        <div className="text-right shrink-0 hidden xs:block">
                          <p className="text-sm font-bold text-stone-800">{formatCurrency(event.budget)}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">{formatDateShort(event.date)}</p>
                          <p className={`text-[10px] font-semibold mt-0.5 ${days <= 30 ? 'text-rose-500' : days <= 90 ? 'text-amber-500' : 'text-stone-400'}`}>
                            {days > 0 ? `${days}d away` : 'Today!'}
                          </p>
                        </div>

                        {/* Remind button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setReminderEvent(event) }}
                          className={`shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                            pendingCount > 0
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              : 'text-stone-400 bg-white hover:bg-stone-50 border-stone-200'
                          }`}
                        >
                          <Bell size={9} />
                          <span className="hidden sm:inline">{pendingCount > 0 ? 'Remind' : 'Bell'}</span>
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Upcoming Milestones ── */}
      <section className="animate-fade-in delay-375">
        <div className="mb-4 sm:mb-5">
          <p className="eyebrow text-stone-400">Timeline</p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-stone-900 leading-tight">
            Upcoming Milestones
          </h2>
        </div>

        <Card>
          <CardBody className="px-4 sm:px-5 py-3 divide-y divide-stone-50">
            {events
              .flatMap(e =>
                e.milestones
                  .filter(m => !m.completed)
                  .map(m => ({ ...m, eventName: e.name, eventId: e.id }))
              )
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 6)
              .map((m) => {
                const days = daysUntil(m.dueDate)
                const isUrgent = days <= 7
                const isSoon   = days > 7 && days <= 30
                return (
                  <div key={`${m.eventId}-${m.id}`} className="flex items-center gap-3 py-3 first:pt-2 last:pb-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isUrgent ? 'bg-rose-400' : isSoon ? 'bg-amber-400' : 'bg-stone-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 truncate font-medium">{m.label}</p>
                      <p className="text-xs text-stone-400 truncate">{m.eventName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-stone-400">{formatDateShort(m.dueDate)}</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${isUrgent ? 'text-rose-500' : isSoon ? 'text-amber-500' : 'text-stone-400'}`}>
                        {days > 0 ? `${days}d` : 'Due today'}
                      </p>
                    </div>
                  </div>
                )
              })}

            {events.flatMap(e => e.milestones.filter(m => !m.completed)).length === 0 && (
              <div className="flex items-center gap-3 py-5 text-sage-600">
                <CheckCircle2 size={18} className="shrink-0" />
                <span className="text-sm font-medium">All milestones complete — well done!</span>
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* ── Footer note ── */}
      <footer className="pt-6 mt-2 border-t border-stone-100 text-center animate-fade-in delay-500">
        <p className="text-xs text-stone-400">
          Crafted with care · Thalia keeps you and your clients in lockstep, from briefing to the big day.
        </p>
        <p className="text-[10px] text-stone-300 mt-1">
          Tip: every event has a 6-digit access code your client uses to sign in — find it inside the event card.
        </p>
      </footer>

      {/* Reminder modal */}
      {reminderEvent && (
        <SendReminderModal
          open={!!reminderEvent}
          onClose={() => setReminderEvent(null)}
          event={reminderEvent}
        />
      )}
    </div>
  )
}
