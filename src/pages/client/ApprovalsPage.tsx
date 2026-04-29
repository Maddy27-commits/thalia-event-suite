import { Check, X, MessageSquare, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store'
import { useClientEvent } from '../../hooks/useClientEvent'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import type { EventConcept, ConceptStatus } from '../../types'

export function ApprovalsPage() {
  const { updateConceptStatus } = useStore()
  const { event } = useClientEvent()
  const [selected, setSelected]   = useState<{ concept: EventConcept; action: 'approve' | 'reject' | 'revise' } | null>(null)
  const [comment, setComment]     = useState('')
  const [pendingIdx, setPendingIdx] = useState(0)

  if (!event) return null

  const shared  = event.concepts.filter(c => c.sharedWithClient !== false)
  const pending = shared.filter(c => c.status === 'pending')
  const decided = shared.filter(c => c.status !== 'pending')

  // Clamp index
  const safePendingIdx = Math.min(pendingIdx, Math.max(0, pending.length - 1))
  const current = pending[safePendingIdx]

  const submit = () => {
    if (!selected) return
    const map: Record<string, ConceptStatus> = { approve: 'approved', reject: 'rejected', revise: 'revised' }
    updateConceptStatus(event.id, selected.concept.id, map[selected.action] as ConceptStatus, comment)
    setSelected(null)
    setComment('')
    // Move to next pending (index stays, list shrinks, so next one slides in)
  }

  // Status badge
  const decisionBadge: Record<string, 'success' | 'danger' | 'info' | 'warning'> = {
    approved: 'success',
    rejected: 'danger',
    revised:  'info',
    pending:  'warning',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="animate-fade-in">
        <p className="eyebrow text-sage-500">Client Portal</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 leading-tight">
          Approvals
        </h1>
        <p className="text-stone-400 text-sm mt-1">
          Review and respond to design concepts from your planner.
        </p>
      </div>

      {/* ── Empty state ── */}
      {shared.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 py-20 text-center animate-fade-in">
          <Sparkles size={28} className="mx-auto text-stone-200 mb-3" />
          <p className="text-stone-400 font-medium text-sm">Nothing to review yet</p>
          <p className="text-stone-300 text-xs mt-1 max-w-xs mx-auto">
            Your planner will share concepts with you once they're ready.
          </p>
        </div>
      )}

      {/* ── Focused pending concept ── */}
      {pending.length > 0 && current && (
        <section className="animate-fade-in delay-75">
          {/* Counter + navigation */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.12em]">
                Awaiting your review
              </p>
              <p className="text-stone-400 text-xs mt-0.5">
                Concept {safePendingIdx + 1} of {pending.length}
              </p>
            </div>
            {pending.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPendingIdx(i => Math.max(0, i - 1))}
                  disabled={safePendingIdx === 0}
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-300 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPendingIdx(i => Math.min(pending.length - 1, i + 1))}
                  disabled={safePendingIdx === pending.length - 1}
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-300 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Progress dots */}
          {pending.length > 1 && (
            <div className="flex gap-1.5 mb-4">
              {pending.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPendingIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === safePendingIdx ? 'bg-amber-400 w-6' : 'bg-stone-200 w-1.5 hover:bg-stone-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Concept card */}
          <div className="rounded-2xl overflow-hidden ring-1 ring-amber-200/60 shadow-sm bg-white">
            {/* Full-width gradient hero */}
            <div className={`h-32 sm:h-40 bg-gradient-to-br ${current.coverGradient} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/15" />
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -left-4 bottom-0 w-24 h-24 bg-white/8 rounded-full" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <p className="text-white font-bold text-xl drop-shadow-sm leading-tight">{current.title}</p>
                <p className="text-white/75 text-sm mt-0.5 italic">{current.tagline}</p>
              </div>
              {/* Pending badge */}
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-bold bg-amber-400/90 text-amber-900 px-2.5 py-1 rounded-full">
                  Pending
                </span>
              </div>
            </div>

            {/* Concept details */}
            <div className="p-5 space-y-4">
              {/* Mood + palette chips */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Mood</p>
                <p className="text-sm text-stone-700">{current.mood}</p>
              </div>

              {current.colorPalette.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Colour palette</p>
                  <div className="flex flex-wrap gap-1.5">
                    {current.colorPalette.map(c => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Venue & Setting</p>
                <p className="text-sm text-stone-600 leading-relaxed">{current.venueDescription}</p>
              </div>

              {/* Budget estimate */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-400">Estimated budget</p>
                <p className="text-sm font-semibold text-stone-800">{current.estimatedBudget}</p>
              </div>

              {/* Previous comment if any */}
              {current.clientComment && (
                <div className="px-3 py-2.5 rounded-xl bg-sky-50 border border-sky-100">
                  <p className="text-xs text-sky-700 italic">"{current.clientComment}"</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-5 grid grid-cols-3 gap-2">
              <button
                onClick={() => { setSelected({ concept: current, action: 'approve' }); setComment('') }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-sage-50 hover:bg-sage-100 text-sage-700 ring-1 ring-sage-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check size={18} />
                <span className="text-[11px] font-bold">Approve</span>
              </button>
              <button
                onClick={() => { setSelected({ concept: current, action: 'revise' }); setComment(current.clientComment) }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 ring-1 ring-sky-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare size={18} />
                <span className="text-[11px] font-bold">Request changes</span>
              </button>
              <button
                onClick={() => { setSelected({ concept: current, action: 'reject' }); setComment('') }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 ring-1 ring-rose-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <X size={18} />
                <span className="text-[11px] font-bold">Decline</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── All pending resolved ── */}
      {pending.length === 0 && decided.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-stone-50 ring-1 ring-sage-200/60 p-6 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-3">
            <Check size={22} className="text-sage-600" />
          </div>
          <p className="text-stone-800 font-semibold text-sm">You're all caught up!</p>
          <p className="text-stone-400 text-xs mt-1">All concepts have been reviewed.</p>
        </div>
      )}

      {/* ── Past decisions — compact history ── */}
      {decided.length > 0 && (
        <section className="animate-fade-in delay-150">
          <div className="mb-3">
            <p className="eyebrow text-stone-400">History</p>
            <h2 className="font-display text-lg font-semibold text-stone-800">Past decisions</h2>
          </div>
          <div className="space-y-2">
            {decided.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.coverGradient} shrink-0 shadow-sm`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-stone-800 truncate">{c.title}</p>
                  {c.clientComment && (
                    <p className="text-xs text-stone-400 italic truncate">"{c.clientComment}"</p>
                  )}
                </div>
                <Badge dot variant={decisionBadge[c.status] ?? 'default'}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Action modal ── */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected?.action === 'approve' ? '✓ Approve Concept'
          : selected?.action === 'revise' ? '✏️ Request Changes'
          : '✕ Decline Concept'
        }
      >
        <div className="p-5 sm:p-6 space-y-4">
          {selected && (
            <div className={`h-14 bg-gradient-to-r ${selected.concept.coverGradient} rounded-xl flex items-center px-4 shadow-sm`}>
              <div>
                <p className="text-white font-bold text-sm drop-shadow">{selected.concept.title}</p>
                <p className="text-white/70 text-xs">{selected.concept.tagline}</p>
              </div>
            </div>
          )}
          <Textarea
            label={selected?.action === 'revise' ? 'What changes would you like?' : 'Add a note (optional)'}
            rows={3}
            placeholder={
              selected?.action === 'revise'
                ? 'I love the concept but would prefer softer tones…'
                : 'Any final thoughts?'
            }
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant={selected?.action === 'approve' ? 'client' : selected?.action === 'reject' ? 'danger' : 'primary'}
              onClick={submit}
            >
              {selected?.action === 'approve' ? 'Approve' : selected?.action === 'revise' ? 'Send Feedback' : 'Decline'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
