import { useState } from 'react'
import { CalendarDays, Store, Wand2, TrendingUp, Clock, CheckCircle2, AlertCircle, Bell, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
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

// Colour coding per event type
const eventTypeColor: Record<string, string> = {
  wedding:     'from-rose-400 to-rose-600',
  corporate:   'from-sky-500 to-indigo-600',
  birthday:    'from-amber-400 to-orange-500',
  anniversary: 'from-brand-400 to-brand-600',
  default:     'from-stone-400 to-stone-600',
}

export function PlannerDashboard() {
  const { events, vendors, setActiveEvent, plannerProfile } = useStore()
  const navigate = useNavigate()
  const [reminderEvent, setReminderEvent] = useState<Event | null>(null)
  const greeting  = timeGreeting()
  const firstName = plannerProfile.name.trim().split(/\s+/)[0]

  const upcomingEvents = events
    .filter((e) => e.status !== 'cancelled' && e.status !== 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const totalBudget       = events.reduce((sum, e) => sum + e.budget, 0)
  const pendingApprovals  = events.reduce((sum, e) => sum + e.concepts.filter((c) => c.status === 'pending').length, 0)

  const stats = [
    {
      label: 'Active Events',
      value: upcomingEvents.length,
      icon: CalendarDays,
      bg:   'bg-brand-50',
      fg:   'text-brand-600',
      ring: 'ring-brand-100',
    },
    {
      label: 'Total Budget',
      value: formatCurrency(totalBudget),
      icon: TrendingUp,
      bg:   'bg-sage-50',
      fg:   'text-sage-600',
      ring: 'ring-sage-100',
    },
    {
      label: 'Vendors',
      value: vendors.length,
      icon: Store,
      bg:   'bg-sky-50',
      fg:   'text-sky-600',
      ring: 'ring-sky-100',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      icon: AlertCircle,
      bg:   pendingApprovals > 0 ? 'bg-rose-50'  : 'bg-stone-50',
      fg:   pendingApprovals > 0 ? 'text-rose-500' : 'text-stone-400',
      ring: pendingApprovals > 0 ? 'ring-rose-100' : 'ring-stone-100',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ThaliaBloomMark size={36} className="shrink-0 opacity-80 hidden sm:block" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 truncate">
              {greeting.text}{firstName ? `, ${firstName}` : ''} {greeting.emoji}
            </h1>
            <p className="text-stone-400 text-sm mt-0.5 hidden sm:block">
              Here's what's happening across your events.
            </p>
          </div>
        </div>
        <Button
          icon={<Wand2 size={15} />}
          size="sm"
          onClick={() => navigate('/planner/ai-generator')}
          className="shrink-0 sm:hidden"
        >
          AI
        </Button>
        <Button
          icon={<Wand2 size={15} />}
          onClick={() => navigate('/planner/ai-generator')}
          className="shrink-0 hidden sm:inline-flex"
        >
          Generate Concepts
        </Button>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-3 py-4 px-4 sm:px-5">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${stat.bg} ${stat.fg} ${stat.ring}`}>
                <stat.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-stone-900 leading-none">{stat.value}</p>
                <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 leading-tight">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ── Upcoming Events ── */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-base font-semibold text-stone-900">Upcoming Events</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/planner/events')} className="gap-1">
            View all <ArrowRight size={13} />
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10 sm:py-14">
              <div className="w-14 h-14 rounded-2xl bg-stone-50 ring-1 ring-stone-100 flex items-center justify-center mx-auto mb-3">
                <CalendarDays size={24} className="text-stone-300" />
              </div>
              <p className="text-stone-400 text-sm font-medium">No upcoming events</p>
              <p className="text-stone-300 text-xs mt-1">Go to Events to create one.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {upcomingEvents.map((event) => {
              const days         = daysUntil(event.date)
              const progress     = completionPercent(event.milestones)
              const pendingCount = event.concepts.filter((c) => c.status === 'pending').length
              const typeColor    = eventTypeColor[event.type] ?? eventTypeColor.default

              return (
                <Card
                  key={event.id}
                  hover
                  onClick={() => { setActiveEvent(event.id); navigate('/planner/events') }}
                >
                  <CardBody className="flex items-center gap-3 sm:gap-4 py-3.5 sm:py-4 px-4 sm:px-5">
                    {/* Event type colour bar */}
                    <div className={`w-1 self-stretch rounded-full bg-gradient-to-b ${typeColor} shrink-0`} />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-stone-900 text-sm leading-tight">{event.name}</p>
                        <Badge variant={statusBadge[event.status]}>{event.status}</Badge>
                        {pendingCount > 0 && (
                          <Badge variant="warning">{pendingCount} awaiting approval</Badge>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {event.clientName} · {event.location} · {event.guestCount} guests
                      </p>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${typeColor} rounded-full transition-all`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stone-400 shrink-0">{progress}%</span>
                      </div>
                    </div>

                    {/* Right side — hidden on very small screens, visible on sm+ */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1 hidden xs:flex">
                      <p className="text-sm font-semibold text-stone-800">{formatCurrency(event.budget)}</p>
                      <p className="text-xs text-stone-400">{formatDateShort(event.date)}</p>
                      <p className={`text-xs font-medium ${days <= 30 ? 'text-rose-500' : days <= 90 ? 'text-amber-500' : 'text-stone-400'}`}>
                        {days > 0 ? `${days}d away` : 'Today!'}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setReminderEvent(event) }}
                        className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                          pendingCount > 0
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            : 'text-stone-400 bg-stone-50 hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        <Bell size={9} />
                        {pendingCount > 0 ? 'Remind' : 'Reminder'}
                      </button>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Upcoming Milestones ── */}
      <section>
        <h2 className="text-sm sm:text-base font-semibold text-stone-900 mb-3 sm:mb-4">Upcoming Milestones</h2>
        <Card>
          <CardBody className="divide-y divide-stone-50 px-4 sm:px-6 py-2">
            {events
              .flatMap((e) =>
                e.milestones
                  .filter((m) => !m.completed)
                  .map((m) => ({ ...m, eventName: e.name, eventId: e.id }))
              )
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 6)
              .map((m) => {
                const days = daysUntil(m.dueDate)
                return (
                  <div key={`${m.eventId}-${m.id}`} className="flex items-center gap-3 py-3 first:pt-2 last:pb-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${days <= 7 ? 'bg-rose-400' : days <= 30 ? 'bg-amber-400' : 'bg-stone-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 truncate">{m.label}</p>
                      <p className="text-xs text-stone-400 truncate">{m.eventName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-stone-400">{formatDateShort(m.dueDate)}</p>
                      <p className={`text-[10px] font-semibold ${days <= 7 ? 'text-rose-500' : days <= 30 ? 'text-amber-500' : 'text-stone-400'}`}>
                        {days > 0 ? `${days}d` : 'Due today'}
                      </p>
                    </div>
                  </div>
                )
              })}

            {events.flatMap((e) => e.milestones.filter((m) => !m.completed)).length === 0 && (
              <div className="flex items-center gap-2.5 py-5 text-sm text-sage-600">
                <CheckCircle2 size={18} className="shrink-0" />
                <span className="font-medium">All milestones complete — well done!</span>
              </div>
            )}
          </CardBody>
        </Card>
      </section>

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
