import { CheckCircle2, CalendarDays } from 'lucide-react'
import { useClientEvent } from '../../hooks/useClientEvent'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatDate, daysUntil, completionPercent } from '../../lib/utils'

export function ProgressPage() {
  const { event } = useClientEvent()

  if (!event) return null

  const progress = completionPercent(event.milestones)
  const completedCount = event.milestones.filter((m) => m.completed).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Planning Progress</h1>
        <p className="text-stone-400 text-sm mt-0.5">
          Track every step toward your perfect event.
        </p>
      </div>

      {/* Progress overview */}
      <Card>
        <CardBody className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-black text-stone-900">{progress}%</p>
              <p className="text-stone-400 text-sm">Planning complete</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
              <p className="text-stone-400 text-sm">of {event.milestones.length} milestones</p>
            </div>
          </div>

          {/* Progress bar — switches from segmented (≤12 milestones) to smooth (>12) */}
          {event.milestones.length <= 12 ? (
            <div className="flex gap-1 h-3 rounded-full overflow-hidden">
              {event.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`flex-1 transition-all ${m.completed ? 'bg-emerald-500' : 'bg-stone-100'}`}
                />
              ))}
            </div>
          ) : (
            <div className="relative h-3 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all rounded-full"
                style={{ width: `${progress}%` }}
              />
              {/* tick marks every 25% */}
              {[25, 50, 75].map((pct) => (
                <div key={pct} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${pct}%` }} />
              ))}
            </div>
          )}

          <div className="flex justify-between mt-2 text-xs text-stone-400">
            <span>Started</span>
            <span>{event.name}</span>
            <span>{formatDate(event.date)}</span>
          </div>
        </CardBody>
      </Card>

      {/* Milestones timeline */}
      <div>
        <h2 className="text-base font-semibold text-stone-900 mb-4">Milestones</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-stone-100" />

          <div className="space-y-4">
            {event.milestones.map((milestone, idx) => {
              const days = daysUntil(milestone.dueDate)
              const isOverdue = !milestone.completed && days < 0
              const isSoon = !milestone.completed && days >= 0 && days <= 14

              return (
                <div key={milestone.id} className="relative flex gap-4 pl-10">
                  {/* Node */}
                  <div
                    className={`absolute left-3.5 top-3 -translate-x-1/2 transition-all ${
                      milestone.completed
                        ? 'w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200'
                        : isOverdue
                        ? 'w-4 h-4 rounded-full bg-red-300 border-2 border-red-400'
                        : isSoon
                        ? 'w-4 h-4 rounded-full bg-amber-200 border-2 border-amber-400'
                        : 'w-4 h-4 rounded-full bg-white border-2 border-stone-200'
                    }`}
                  >
                    {milestone.completed && <CheckCircle2 size={12} className="text-white" />}
                  </div>

                  {/* Card */}
                  <Card className={`flex-1 ${milestone.completed ? 'opacity-70' : ''}`}>
                    <CardBody className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-medium text-sm ${milestone.completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                            {milestone.label}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                            <CalendarDays size={10} />
                            {formatDate(milestone.dueDate)}
                          </p>
                        </div>
                        <div className="shrink-0 ml-3">
                          {milestone.completed ? (
                            <Badge variant="success">Done</Badge>
                          ) : isOverdue ? (
                            <Badge variant="danger">Overdue</Badge>
                          ) : isSoon ? (
                            <Badge variant="warning">Soon — {days}d</Badge>
                          ) : (
                            <Badge variant="default">{days}d away</Badge>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ceremony-level progress (Event → Ceremonies → Sub-categories) */}
      {event.ceremonies && event.ceremonies.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-stone-900">Ceremonies & Sub-Elements</h2>

          {event.ceremonies.map((ceremony) => {
            // Aggregate all tasks across this ceremony's sub-categories
            const allTasks = ceremony.subCategories.flatMap((s) => s.tasks)
            const totalTasks = allTasks.length || 1
            const doneTasks = allTasks.filter((t) => t.completed).length
            const ceremonyPct = Math.round((doneTasks / totalTasks) * 100)
            const ceremonyDays = daysUntil(ceremony.date)

            return (
              <div key={ceremony.id}>
                {/* Ceremony header card */}
                <Card className="mb-3">
                  <CardBody className="py-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{ceremony.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-stone-900 truncate">{ceremony.name}</p>
                        <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                          <CalendarDays size={11} />
                          {formatDate(ceremony.date)}
                          {ceremonyDays >= 0 && <span className="text-stone-300">· {ceremonyDays}d to go</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${ceremonyPct === 100 ? 'text-emerald-600' : ceremonyPct >= 50 ? 'text-amber-500' : 'text-stone-500'}`}>
                          {ceremonyPct}%
                        </p>
                        <p className="text-[10px] text-stone-400">{doneTasks}/{totalTasks} tasks</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${ceremonyPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-300 to-emerald-500'}`}
                        style={{ width: `${Math.max(2, ceremonyPct)}%` }}
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* Sub-category grid */}
                {ceremony.subCategories.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                    {ceremony.subCategories.map((sub) => {
                      const total = sub.tasks.length || 1
                      const done  = sub.tasks.filter((t) => t.completed).length
                      const pct   = sub.tasks.length === 0 ? 0 : Math.round((done / total) * 100)
                      return (
                        <Card key={sub.id}>
                          <CardBody className="py-3">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl">{sub.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-stone-900 truncate">{sub.name}</p>
                                <p className="text-[10px] text-stone-400">
                                  {sub.tasks.length === 0
                                    ? 'No tasks yet'
                                    : `${done} of ${total} complete`}
                                </p>
                              </div>
                              <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-stone-400'}`}>
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-300 to-emerald-500'}`}
                                style={{ width: `${Math.max(2, pct)}%` }}
                              />
                            </div>
                          </CardBody>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Concept approvals summary */}
      {event.concepts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-stone-900 mb-3">Concept Decisions</h2>
          <Card>
            <CardBody className="divide-y divide-gray-50">
              {event.concepts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.coverGradient} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{c.title}</p>
                    {c.clientComment && <p className="text-xs text-stone-400 truncate italic">"{c.clientComment}"</p>}
                  </div>
                  <Badge
                    variant={
                      c.status === 'approved' ? 'success' :
                      c.status === 'rejected' ? 'danger' :
                      c.status === 'revised' ? 'info' : 'warning'
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
