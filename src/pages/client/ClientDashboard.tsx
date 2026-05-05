import { CalendarDays, MapPin, Users, Sparkles, CheckCircle2, Clock, ArrowRight, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { useClientEvent } from '../../hooks/useClientEvent'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ThaliaFullLogo, ThaliaBloomMark } from '../../components/ui/ThaliaLogo'
import { formatDate, daysUntil, formatCurrency, completionPercent } from '../../lib/utils'

// Rich gradient per event type — warm and premium
const heroGradient: Record<string, string> = {
  wedding:     'from-rose-900 via-stone-900 to-brand-900',
  corporate:   'from-slate-900 via-stone-900 to-indigo-950',
  birthday:    'from-amber-900 via-stone-900 to-brand-900',
  anniversary: 'from-stone-900 via-brand-950 to-plum-950',
  default:     'from-stone-900 via-stone-800 to-stone-900',
}

const heroAccent: Record<string, string> = {
  wedding:     'text-rose-300',
  corporate:   'text-sky-300',
  birthday:    'text-amber-300',
  anniversary: 'text-brand-300',
  default:     'text-brand-300',
}

export function ClientDashboard() {
  const { setActiveEvent, activeEventId } = useStore()
  const navigate = useNavigate()
  const { event, matches } = useClientEvent()

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
        <ThaliaFullLogo width={200} />
        <p className="text-stone-400 text-sm mt-2 max-w-xs">
          No event found. Ask your planner to set up your event.
        </p>
      </div>
    )
  }

  const days            = daysUntil(event.date)
  const progress        = completionPercent(event.milestones)
  const pendingConcepts = event.concepts.filter((c) => c.status === 'pending').length
  const approvedConcepts= event.concepts.filter((c) => c.status === 'approved').length
  const nextMilestone   = event.milestones.find((m) => !m.completed)
  const gradient        = heroGradient[event.type] ?? heroGradient.default
  const accent          = heroAccent[event.type]   ?? heroAccent.default

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-7 animate-fade-in">

      {/* Multi-event picker */}
      {matches.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Your events</span>
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveEvent(m.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                (activeEventId === m.id || (!activeEventId && m.id === event.id))
                  ? 'bg-sage-500 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-sage-300'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Hero banner ── */}
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${gradient} p-6 sm:p-8 text-white`}>
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/[0.03] rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
        <div className="absolute bottom-0 left-16 w-28 sm:w-40 h-28 sm:h-40 bg-white/[0.03] rounded-full translate-y-10 pointer-events-none" />
        {/* Gold shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <ThaliaBloomMark size={18} className="opacity-60" />
            <p className={`text-xs font-medium opacity-60`}>Your upcoming event</p>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">{event.name}</h1>

          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-white/60 mt-3">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} />{formatDate(event.date)}
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <MapPin size={12} />{event.venue}, {event.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={12} />{event.guestCount} guests
            </span>
          </div>
        </div>

        {/* Countdown + progress */}
        <div className="mt-5 sm:mt-6 flex items-end justify-between gap-4">
          <div>
            <div className={`text-4xl sm:text-5xl font-black ${accent}`}>{days}</div>
            <div className="text-white/50 text-xs mt-0.5">days to go</div>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold">{progress}%</div>
            <div className="text-white/50 text-xs mt-0.5">planned</div>
          </div>
        </div>
        <div className="mt-3 sm:mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-300 rounded-full transition-all"
            style={{ width: `${Math.max(3, progress)}%` }}
          />
        </div>
      </div>

      {/* ── Quick links — clear labels + helper text ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          hover
          onClick={() => navigate('/client/concepts')}
          glow={pendingConcepts > 0 ? 'amber' : undefined}
        >
          <CardBody className="text-center py-4 px-3">
            <div className={`w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center ${pendingConcepts > 0 ? 'bg-amber-50' : 'bg-stone-50'}`}>
              <Sparkles size={16} className={pendingConcepts > 0 ? 'text-amber-500' : 'text-stone-300'} />
            </div>
            <p className="text-xl font-bold text-stone-900">{event.concepts.length}</p>
            <p className="text-[11px] text-stone-500 mt-0.5 font-semibold">Design concepts</p>
            <p className="text-[10px] text-stone-400 leading-snug">Tap to review</p>
            {pendingConcepts > 0 && (
              <Badge variant="warning" className="mt-1.5 text-[9px]">{pendingConcepts} new</Badge>
            )}
          </CardBody>
        </Card>

        <Card hover onClick={() => navigate('/client/concepts')}>
          <CardBody className="text-center py-4 px-3">
            <div className={`w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center ${approvedConcepts > 0 ? 'bg-sage-50' : 'bg-stone-50'}`}>
              <CheckCircle2 size={16} className={approvedConcepts > 0 ? 'text-sage-500' : 'text-stone-300'} />
            </div>
            <p className="text-xl font-bold text-stone-900">{approvedConcepts}</p>
            <p className="text-[11px] text-stone-500 mt-0.5 font-semibold">Approved</p>
            <p className="text-[10px] text-stone-400 leading-snug">Locked-in choices</p>
          </CardBody>
        </Card>

        <Card hover onClick={() => navigate('/client/progress')}>
          <CardBody className="text-center py-4 px-3">
            <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center bg-brand-50">
              <CheckCircle2 size={16} className="text-brand-500" />
            </div>
            <p className="text-xl font-bold text-stone-900">
              {event.milestones.filter((m) => m.completed).length}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5 font-semibold">Milestones met</p>
            <p className="text-[10px] text-stone-400 leading-snug">See full timeline</p>
          </CardBody>
        </Card>
      </div>

      {/* ── Concepts preview ── */}
      {event.concepts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-semibold text-stone-900">Your Event Concepts</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/client/concepts')} className="gap-1 text-xs">
              View all <ArrowRight size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {event.concepts.slice(0, 2).map((concept) => (
              <Card key={concept.id} hover onClick={() => navigate('/client/concepts')}>
                <div className={`h-20 sm:h-24 bg-gradient-to-r ${concept.coverGradient} rounded-t-2xl relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-white font-semibold text-sm drop-shadow leading-tight">{concept.title}</p>
                    <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{concept.tagline}</p>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      concept.status === 'approved' ? 'bg-sage-100 text-sage-700' :
                      concept.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-white/90 text-stone-700'
                    }`}>
                      {concept.status}
                    </span>
                  </div>
                </div>
                <CardBody className="py-2.5 px-4">
                  <div className="flex flex-wrap gap-1">
                    {concept.colorPalette.slice(0, 4).map((c) => (
                      <span key={c} className="text-[9px] bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full text-stone-500 capitalize">{c}</span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Next milestone ── */}
      {nextMilestone && (
        <Card>
          <CardBody className="flex items-center gap-3 sm:gap-4 py-4 px-4 sm:px-6">
            <div className="w-10 h-10 rounded-xl bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide">Next milestone</p>
              <p className="font-semibold text-stone-900 text-sm mt-0.5 truncate">{nextMilestone.label}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-stone-400">{formatDate(nextMilestone.dueDate)}</p>
              <p className="text-sm font-bold text-brand-600 mt-0.5">{daysUntil(nextMilestone.dueDate)}d</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Event details ── */}
      <Card>
        <CardBody className="px-4 sm:px-6">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Event Details</p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4 sm:gap-x-8 text-sm">
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide font-medium">Type</p>
              <p className="font-semibold text-stone-800 capitalize mt-0.5">{event.type}</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide font-medium">Theme</p>
              <p className="font-semibold text-stone-800 mt-0.5">{event.theme}</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide font-medium">Budget</p>
              <p className="font-semibold text-stone-800 mt-0.5">{formatCurrency(event.budget)}</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide font-medium">Guests</p>
              <p className="font-semibold text-stone-800 mt-0.5">{event.guestCount}</p>
            </div>
            {event.preferences.style.length > 0 && (
              <div className="col-span-2">
                <p className="text-[10px] text-stone-400 uppercase tracking-wide font-medium mb-1.5">Style</p>
                <div className="flex flex-wrap gap-1.5">
                  {event.preferences.style.map((s) => (
                    <Badge key={s} variant="brand">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ── Message planner CTA ── */}
      <Card className="bg-gradient-to-br from-brand-50/50 to-sage-50/40">
        <CardBody className="flex items-center gap-4 py-4 px-4 sm:px-6">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <MessageSquare size={18} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900">Need to ask your planner something?</p>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              Open any decision in <strong>Progress</strong> to start a discussion thread — your planner gets notified instantly.
            </p>
          </div>
          <Button variant="client" size="sm" onClick={() => navigate('/client/progress')} className="shrink-0">
            Go to Progress
          </Button>
        </CardBody>
      </Card>

      {/* ── Footer note ── */}
      <footer className="pt-6 mt-2 border-t border-stone-100 text-center">
        <p className="text-xs text-stone-400">
          Your planner curates everything you see here — review concepts, watch milestones tick by, message us anytime.
        </p>
        <p className="text-[10px] text-stone-300 mt-1">
          Need help? Reach out to your planner directly through any task discussion.
        </p>
      </footer>
    </div>
  )
}
