import { CheckCircle2, CalendarDays, Clock } from 'lucide-react'
import { useClientEvent } from '../../hooks/useClientEvent'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatDate, daysUntil, completionPercent } from '../../lib/utils'

export function ProgressPage() {
  const { event, stakeholder } = useClientEvent()

  if (!event) return null

  // Visibility: planner can hide specific stages from a stakeholder.
  const hidden = new Set(stakeholder?.hiddenStageIds ?? [])

  const progress       = completionPercent(event.milestones)
  const completedCount = event.milestones.filter(m => m.completed).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-7 sm:space-y-9">

      {/* ── Header ── */}
      <div className="animate-fade-in">
        <p className="eyebrow text-sage-500">Client Portal</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 leading-tight">
          Planning Progress
        </h1>
        <p className="text-stone-400 text-sm mt-1">Track every step toward your perfect event.</p>
      </div>

      {/* ── Overall progress — coloured overview card ── */}
      <Card className="animate-fade-in delay-75 overflow-hidden">
        {/* Coloured top bar */}
        <div className="h-1.5 bg-stone-100">
          <div
            className="h-full bg-gradient-to-r from-sage-400 via-brand-400 to-sage-500 rounded-full transition-all"
            style={{ width: `${Math.max(3, progress)}%` }}
          />
        </div>
        <CardBody className="py-5 sm:py-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            {/* Big percentage */}
            <div>
              <p className="font-display text-5xl sm:text-6xl font-semibold leading-none text-gradient-brand">
                {progress}<span className="text-3xl sm:text-4xl text-stone-300">%</span>
              </p>
              <p className="text-stone-400 text-sm mt-1.5">Planning complete</p>
            </div>
            {/* Milestone count */}
            <div className="text-right">
              <p className="font-display text-4xl sm:text-5xl font-semibold text-sage-600 leading-none">{completedCount}</p>
              <p className="text-stone-400 text-sm mt-1.5">of {event.milestones.length} milestones</p>
            </div>
          </div>

          {/* Segmented or smooth progress bar */}
          {event.milestones.length <= 12 ? (
            <div className="flex gap-1 h-2.5 rounded-full overflow-hidden">
              {event.milestones.map(m => (
                <div
                  key={m.id}
                  className={`flex-1 transition-all rounded-sm ${m.completed ? 'bg-sage-400' : 'bg-stone-100'}`}
                />
              ))}
            </div>
          ) : (
            <div className="relative h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-sage-400 to-sage-500 transition-all rounded-full"
                style={{ width: `${progress}%` }}
              />
              {[25, 50, 75].map(pct => (
                <div key={pct} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${pct}%` }} />
              ))}
            </div>
          )}
          <div className="flex justify-between mt-2 text-[10px] text-stone-400 font-medium">
            <span>Started</span>
            <span>{event.name}</span>
            <span>{formatDate(event.date)}</span>
          </div>
        </CardBody>
      </Card>

      {/* ── Milestones timeline ── */}
      <section className="animate-fade-in delay-150">
        <div className="mb-4 sm:mb-5">
          <p className="eyebrow text-stone-400">Timeline</p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-stone-900 leading-tight">Milestones</h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-stone-200 via-stone-100 to-transparent" />

          <div className="space-y-3">
            {event.milestones.map((milestone, idx) => {
              const days      = daysUntil(milestone.dueDate)
              const isOverdue = !milestone.completed && days < 0
              const isSoon    = !milestone.completed && days >= 0 && days <= 14

              // Colour coding per status
              let cardBg = 'bg-white'
              let nodeEl: React.ReactNode
              if (milestone.completed) {
                cardBg = 'bg-gradient-to-r from-sage-50/80 to-white'
                nodeEl = (
                  <div className="w-5 h-5 rounded-full bg-sage-500 flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                )
              } else if (isOverdue) {
                cardBg = 'bg-gradient-to-r from-rose-50/80 to-white'
                nodeEl = <div className="w-4 h-4 rounded-full bg-rose-200 border-2 border-rose-400" />
              } else if (isSoon) {
                cardBg = 'bg-gradient-to-r from-amber-50/80 to-white'
                nodeEl = <div className="w-4 h-4 rounded-full bg-amber-200 border-2 border-amber-400" />
              } else {
                nodeEl = <div className="w-4 h-4 rounded-full bg-white border-2 border-stone-200" />
              }

              return (
                <div
                  key={milestone.id}
                  className="relative flex gap-4 pl-10 animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Timeline node */}
                  <div className="absolute left-3 top-3.5 -translate-x-1/2">
                    {nodeEl}
                  </div>

                  {/* Card — colour-coded by status */}
                  <div className={`flex-1 rounded-2xl ${cardBg} ring-1 ${
                    milestone.completed ? 'ring-sage-200/50 opacity-75'
                    : isOverdue ? 'ring-rose-200/60'
                    : isSoon ? 'ring-amber-200/60'
                    : 'ring-black/[0.05]'
                  } shadow-card px-4 py-3`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium text-sm ${milestone.completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                          {milestone.label}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                          <CalendarDays size={10} />
                          {formatDate(milestone.dueDate)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {milestone.completed ? (
                          <Badge variant="success" dot>Done</Badge>
                        ) : isOverdue ? (
                          <Badge variant="danger" dot>Overdue</Badge>
                        ) : isSoon ? (
                          <Badge variant="warning" dot>Soon · {days}d</Badge>
                        ) : (
                          <Badge variant="default">{days}d away</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Ceremony-level progress ── */}
      {event.ceremonies && event.ceremonies.length > 0 && (
        <section className="space-y-6 animate-fade-in delay-225">
          <div>
            <p className="eyebrow text-stone-400">Breakdown</p>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-stone-900 leading-tight">
              Your Event, Stage by Stage
            </h2>
            <p className="text-xs text-stone-400 mt-1">Each stage covers a part of your day; we track every detail underneath.</p>
          </div>

          {event.ceremonies.map((ceremony) => {
            // Filter out stages the planner has hidden from this stakeholder
            const visibleStages = ceremony.stages.filter((s) => !hidden.has(s.id))
            const allTasks     = visibleStages.flatMap(s => s.tasks)
            const totalTasks   = allTasks.length || 1
            const doneTasks    = allTasks.filter(t => t.completed).length
            const ceremonyPct  = Math.round((doneTasks / totalTasks) * 100)
            const ceremonyDays = daysUntil(ceremony.date)

            return (
              <div key={ceremony.id} className="space-y-3">
                {/* Ceremony header */}
                <div className="rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100/50 ring-1 ring-stone-200/50 px-4 sm:px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{ceremony.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{ceremony.name}</p>
                      <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} />
                        {formatDate(ceremony.date)}
                        {ceremonyDays >= 0 && <span className="text-stone-300">· {ceremonyDays}d to go</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-display text-2xl font-semibold ${ceremonyPct === 100 ? 'text-sage-600' : ceremonyPct >= 50 ? 'text-amber-500' : 'text-stone-500'}`}>
                        {ceremonyPct}%
                      </p>
                      <p className="text-[10px] text-stone-400">{doneTasks}/{totalTasks}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-stone-200/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ceremonyPct === 100 ? 'bg-sage-500' : 'bg-gradient-to-r from-sage-300 to-sage-500'}`}
                      style={{ width: `${Math.max(2, ceremonyPct)}%` }}
                    />
                  </div>
                </div>

                {/* Sub-category grid */}
                {visibleStages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-3">
                    {visibleStages.map(sub => {
                      const total = sub.tasks.length || 1
                      const done  = sub.tasks.filter(t => t.completed).length
                      const pct   = sub.tasks.length === 0 ? 0 : Math.round((done / total) * 100)
                      return (
                        <div
                          key={sub.id}
                          className={`rounded-xl px-4 py-3 ring-1 shadow-sm ${
                            pct === 100
                              ? 'bg-sage-50/70 ring-sage-200/50'
                              : 'bg-white ring-black/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-lg">{sub.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-stone-900 truncate">{sub.name}</p>
                              <p className="text-[10px] text-stone-400">
                                {sub.tasks.length === 0 ? 'No tasks yet' : `${done} of ${total} complete`}
                              </p>
                            </div>
                            <span className={`text-xs font-bold shrink-0 ${pct === 100 ? 'text-sage-600' : pct >= 50 ? 'text-amber-500' : 'text-stone-400'}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-sage-400' : 'bg-gradient-to-r from-brand-300 to-brand-500'}`}
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* ── Concept decisions summary ── */}
      {event.concepts.length > 0 && (
        <section className="animate-fade-in delay-300">
          <div className="mb-3">
            <p className="eyebrow text-plum-400">Design</p>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-stone-900 leading-tight">
              Concept Decisions
            </h2>
          </div>
          <Card>
            <CardBody className="px-4 sm:px-5 py-3 divide-y divide-stone-50">
              {event.concepts.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-3 first:pt-1.5 last:pb-1.5">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.coverGradient} shrink-0 shadow-sm`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{c.title}</p>
                    {c.clientComment && (
                      <p className="text-xs text-stone-400 truncate italic">"{c.clientComment}"</p>
                    )}
                  </div>
                  <Badge
                    dot
                    variant={
                      c.status === 'approved' ? 'success'
                      : c.status === 'rejected' ? 'danger'
                      : c.status === 'revised'  ? 'info'
                      : 'warning'
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </section>
      )}
    </div>
  )
}
