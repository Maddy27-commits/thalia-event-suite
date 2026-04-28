import { CalendarDays, MapPin, Users, Sparkles, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { useClientEvent } from '../../hooks/useClientEvent'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ThaliaFullLogo, ThaliaBloomMark } from '../../components/ui/ThaliaLogo'
import { formatDate, daysUntil, formatCurrency, completionPercent } from '../../lib/utils'

export function ClientDashboard() {
  const { setActiveEvent, activeEventId } = useStore()
  const navigate = useNavigate()
  const { event, matches } = useClientEvent()

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <ThaliaFullLogo width={220} />
        <p className="text-stone-400 text-sm mt-2">No event found. Ask your planner to set up your event.</p>
      </div>
    )
  }

  const days = daysUntil(event.date)
  const progress = completionPercent(event.milestones)
  const pendingConcepts = event.concepts.filter((c) => c.status === 'pending').length
  const approvedConcepts = event.concepts.filter((c) => c.status === 'approved').length

  const nextMilestone = event.milestones.find((m) => !m.completed)

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Multi-event picker (only if client has more than one event) */}
      {matches.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Your events</span>
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveEvent(m.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                (activeEventId === m.id || (!activeEventId && m.id === event.id))
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-300'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full translate-y-8" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <ThaliaBloomMark size={22} className="opacity-80" />
            <p className="text-white/70 text-sm font-medium">Your upcoming event</p>
          </div>
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-white/80 mt-3">
            <span className="flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(event.date)}</span>
            <span className="flex items-center gap-1.5"><MapPin size={14} />{event.venue}, {event.location}</span>
            <span className="flex items-center gap-1.5"><Users size={14} />{event.guestCount} guests</span>
          </div>
        </div>

        {/* Countdown */}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <div className="text-5xl font-black">{days}</div>
            <div className="text-white/70 text-sm">days to go</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="text-white/70 text-sm">planning complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          hover
          onClick={() => navigate('/client/concepts')}
          className={pendingConcepts > 0 ? 'ring-2 ring-amber-300' : ''}
        >
          <CardBody className="text-center py-5">
            <Sparkles size={20} className={`mx-auto mb-2 ${pendingConcepts > 0 ? 'text-amber-500' : 'text-stone-300'}`} />
            <p className="text-2xl font-bold text-stone-900">{event.concepts.length}</p>
            <p className="text-xs text-stone-400 mt-0.5">Design Concepts</p>
            {pendingConcepts > 0 && (
              <Badge variant="warning" className="mt-2">{pendingConcepts} awaiting you</Badge>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center py-5">
            <CheckCircle2 size={20} className={`mx-auto mb-2 ${approvedConcepts > 0 ? 'text-emerald-500' : 'text-stone-300'}`} />
            <p className="text-2xl font-bold text-stone-900">{approvedConcepts}</p>
            <p className="text-xs text-stone-400 mt-0.5">Approved</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center py-5">
            <CheckCircle2 size={20} className="mx-auto mb-2 text-brand-400" />
            <p className="text-2xl font-bold text-stone-900">
              {event.milestones.filter((m) => m.completed).length}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">Milestones Done</p>
          </CardBody>
        </Card>
      </div>

      {/* Concepts preview */}
      {event.concepts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-stone-900">Your Event Concepts</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/client/concepts')}>
              View all <ArrowRight size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.concepts.slice(0, 2).map((concept) => (
              <Card key={concept.id} hover onClick={() => navigate('/client/concepts')}>
                <div className={`h-24 bg-gradient-to-r ${concept.coverGradient} rounded-t-2xl relative`}>
                  <div className="absolute inset-0 flex items-end p-4">
                    <div>
                      <p className="text-white font-bold drop-shadow">{concept.title}</p>
                      <p className="text-white/80 text-xs">{concept.tagline}</p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      concept.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      concept.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-white/90 text-stone-700'
                    }`}>
                      {concept.status}
                    </span>
                  </div>
                </div>
                <CardBody className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {concept.colorPalette.slice(0, 3).map((c) => (
                      <span key={c} className="text-[10px] bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full text-stone-500">{c}</span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Next milestone */}
      {nextMilestone && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-brand-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-stone-400 font-medium">Next milestone</p>
                <p className="font-semibold text-stone-900">{nextMilestone.label}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400">{formatDate(nextMilestone.dueDate)}</p>
                <p className="text-sm font-semibold text-brand-600">{daysUntil(nextMilestone.dueDate)}d away</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Event details card */}
      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-stone-700 mb-3">Event Details</p>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-stone-400">Event Type</p>
              <p className="font-medium text-stone-800 capitalize">{event.type}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Theme</p>
              <p className="font-medium text-stone-800">{event.theme}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Budget</p>
              <p className="font-medium text-stone-800">{formatCurrency(event.budget)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Guest Count</p>
              <p className="font-medium text-stone-800">{event.guestCount}</p>
            </div>
            {event.preferences.style.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-stone-400 mb-1">Style Preferences</p>
                <div className="flex flex-wrap gap-1">
                  {event.preferences.style.map((s) => (
                    <Badge key={s} variant="brand">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
