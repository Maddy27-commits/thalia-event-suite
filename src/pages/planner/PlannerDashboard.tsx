import { useState } from 'react'
import { CalendarDays, Store, Wand2, TrendingUp, Clock, CheckCircle2, AlertCircle, Bell } from 'lucide-react'
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
  draft: 'default',
  planning: 'info',
  confirmed: 'success',
  completed: 'success',
  cancelled: 'danger',
}

// Time-aware greeting — returns "Good morning/afternoon/evening" + emoji
function timeGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours()
  if (h < 5)  return { text: 'Burning the midnight oil', emoji: '🌙' }
  if (h < 12) return { text: 'Good morning',              emoji: '☀️' }
  if (h < 17) return { text: 'Good afternoon',            emoji: '👋' }
  if (h < 21) return { text: 'Good evening',              emoji: '🌆' }
  return       { text: 'Good night',                       emoji: '✨' }
}

export function PlannerDashboard() {
  const { events, vendors, setActiveEvent, plannerProfile } = useStore()
  const navigate = useNavigate()
  const [reminderEvent, setReminderEvent] = useState<Event | null>(null)
  const greeting = timeGreeting()
  const firstName = plannerProfile.name.trim().split(/\s+/)[0]

  const upcomingEvents = events
    .filter((e) => e.status !== 'cancelled' && e.status !== 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const totalBudget = events.reduce((sum, e) => sum + e.budget, 0)
  const pendingApprovals = events.reduce(
    (sum, e) => sum + e.concepts.filter((c) => c.status === 'pending').length,
    0
  )

  const stats = [
    { label: 'Active Events', value: upcomingEvents.length, icon: CalendarDays, color: 'text-brand-600 bg-brand-50' },
    { label: 'Total Budget', value: formatCurrency(totalBudget), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Vendors', value: vendors.length, icon: Store, color: 'text-sky-600 bg-sky-50' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ThaliaBloomMark size={40} className="shrink-0 opacity-90" />
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {greeting.text}{firstName ? `, ${firstName}` : ''} {greeting.emoji}
            </h1>
            <p className="text-stone-500 mt-0.5">Here's what's happening across your events.</p>
          </div>
        </div>
        <Button icon={<Wand2 size={16} />} onClick={() => navigate('/planner/ai-generator')}>
          Generate Concepts
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-stone-900">{stat.value}</p>
                <p className="text-xs text-stone-500">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-stone-900">Upcoming Events</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/planner/events')}>
            View all
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <CalendarDays size={40} className="mx-auto text-stone-200 mb-3" />
              <p className="text-stone-400 text-sm">No upcoming events. Create one to get started.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const days = daysUntil(event.date)
              const progress = completionPercent(event.milestones)
              const pendingCount = event.concepts.filter((c) => c.status === 'pending').length

              return (
                <Card
                  key={event.id}
                  hover
                  onClick={() => {
                    setActiveEvent(event.id)
                    navigate('/planner/events')
                  }}
                >
                  <CardBody className="flex items-center gap-4 py-4">
                    {/* Color swatch */}
                    <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-brand-400 to-brand-600 shrink-0" />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-stone-900 text-sm">{event.name}</p>
                        <Badge variant={statusBadge[event.status]}>{event.status}</Badge>
                        {pendingCount > 0 && (
                          <Badge variant="warning">{pendingCount} awaiting approval</Badge>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {event.clientName} · {event.location} · {event.guestCount} guests
                      </p>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stone-400">{progress}%</span>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <p className="text-sm font-semibold text-stone-900">{formatCurrency(event.budget)}</p>
                      <p className="text-xs text-stone-400">{formatDateShort(event.date)}</p>
                      <p className={`text-xs font-medium ${days <= 30 ? 'text-rose-500' : days <= 90 ? 'text-amber-500' : 'text-stone-400'}`}>
                        {days > 0 ? `${days}d away` : 'Today!'}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setReminderEvent(event) }}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          pendingCount > 0
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            : 'text-stone-400 bg-stone-50 hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        <Bell size={10} />
                        {pendingCount > 0 ? `Remind client` : 'Reminder'}
                      </button>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick tasks from milestones */}
      <div>
        <h2 className="text-base font-semibold text-stone-900 mb-4">Upcoming Milestones</h2>
        <Card>
          <CardBody className="divide-y divide-gray-50">
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
                  <div key={`${m.eventId}-${m.id}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Clock size={14} className="text-stone-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700">{m.label}</p>
                      <p className="text-xs text-stone-400">{m.eventName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400">{formatDateShort(m.dueDate)}</p>
                      <p className={`text-[10px] font-medium ${days <= 7 ? 'text-rose-500' : days <= 30 ? 'text-amber-500' : 'text-stone-400'}`}>
                        {days > 0 ? `${days}d` : 'Due today'}
                      </p>
                    </div>
                  </div>
                )
              })}
            {events.flatMap((e) => e.milestones.filter((m) => !m.completed)).length === 0 && (
              <div className="flex items-center gap-2 py-4 text-sm text-emerald-600">
                <CheckCircle2 size={16} />
                All milestones complete!
              </div>
            )}
          </CardBody>
        </Card>
      </div>

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
