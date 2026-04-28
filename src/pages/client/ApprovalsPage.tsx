import { Check, X, MessageSquare, Clock, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store'
import { useClientEvent } from '../../hooks/useClientEvent'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import type { EventConcept, ConceptStatus } from '../../types'

export function ApprovalsPage() {
  const { updateConceptStatus } = useStore()
  const { event } = useClientEvent()
  const [selected, setSelected] = useState<{ concept: EventConcept; action: 'approve' | 'reject' | 'revise' } | null>(null)
  const [comment, setComment]   = useState('')

  if (!event) return null

  const shared  = event.concepts.filter(c => c.sharedWithClient !== false)
  const pending = shared.filter(c => c.status === 'pending')
  const decided = shared.filter(c => c.status !== 'pending')

  const submit = () => {
    if (!selected) return
    const map: Record<string, ConceptStatus> = { approve: 'approved', reject: 'rejected', revise: 'revised' }
    updateConceptStatus(event.id, selected.concept.id, map[selected.action] as ConceptStatus, comment)
    setSelected(null)
    setComment('')
  }

  // Status colour config
  const decisionStyle = {
    approved: { badge: 'success' as const, dot: 'bg-sage-400' },
    rejected: { badge: 'danger'  as const, dot: 'bg-red-400'  },
    revised:  { badge: 'info'    as const, dot: 'bg-sky-400'  },
    pending:  { badge: 'warning' as const, dot: 'bg-amber-400'},
  }

  const ConceptRow = ({ concept }: { concept: EventConcept }) => (
    <div className="flex items-center gap-3 sm:gap-4 py-3.5 group">
      {/* Gradient swatch */}
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${concept.coverGradient} shrink-0 shadow-sm`} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-stone-900">{concept.title}</p>
        <p className="text-xs text-stone-400 italic line-clamp-1">{concept.tagline}</p>
        <p className="text-xs text-stone-300 mt-0.5">{concept.estimatedBudget}</p>
        {concept.clientComment && (
          <p className="text-xs text-sky-600 mt-1 bg-sky-50 border border-sky-100 px-2 py-1 rounded-lg inline-block line-clamp-1">
            "{concept.clientComment}"
          </p>
        )}
      </div>

      {/* Actions or status */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {concept.status === 'pending' ? (
          <>
            <button
              onClick={() => { setSelected({ concept, action: 'approve' }); setComment('') }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sage-100 hover:bg-sage-200 text-sage-600 flex items-center justify-center transition-all hover:scale-105 shadow-sm"
              title="Approve"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => { setSelected({ concept, action: 'revise' }); setComment(concept.clientComment) }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 flex items-center justify-center transition-all hover:scale-105 shadow-sm"
              title="Request changes"
            >
              <MessageSquare size={13} />
            </button>
            <button
              onClick={() => { setSelected({ concept, action: 'reject' }); setComment('') }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-500 flex items-center justify-center transition-all hover:scale-105 shadow-sm"
              title="Decline"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <Badge variant={decisionStyle[concept.status]?.badge ?? 'default'} dot>
            {concept.status}
          </Badge>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

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

      {/* ── Summary chips ── */}
      <div className="flex gap-2 sm:gap-3 flex-wrap animate-fade-in delay-75">
        <div className="flex items-center gap-1.5 bg-amber-50 ring-1 ring-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <Clock size={12} />
          {pending.length} pending
        </div>
        <div className="flex items-center gap-1.5 bg-sage-50 ring-1 ring-sage-200 text-sage-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <Check size={12} />
          {shared.filter(c => c.status === 'approved').length} approved
        </div>
        <div className="flex items-center gap-1.5 bg-rose-50 ring-1 ring-rose-200 text-rose-600 text-xs font-semibold px-3 py-1.5 rounded-full">
          <X size={12} />
          {shared.filter(c => c.status === 'rejected').length} declined
        </div>
      </div>

      {/* ── Pending — warm amber tinted card ── */}
      {pending.length > 0 && (
        <section className="animate-fade-in delay-150">
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-brand-50 ring-1 ring-amber-200/60 overflow-hidden shadow-sm">
            {/* Coloured header strip */}
            <div className="px-5 py-3 bg-amber-400/10 border-b border-amber-200/40 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
              <p className="text-xs font-bold text-amber-700 uppercase tracking-[0.12em]">
                Awaiting Your Review
              </p>
              <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            </div>
            <div className="px-4 sm:px-5 divide-y divide-amber-100/60">
              {pending.map(c => <ConceptRow key={c.id} concept={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Past decisions — neutral card ── */}
      {decided.length > 0 && (
        <section className="animate-fade-in delay-225">
          <div className="mb-3">
            <p className="eyebrow text-stone-400">History</p>
          </div>
          <Card>
            <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.12em]">Past Decisions</p>
            </div>
            <div className="px-4 sm:px-5 divide-y divide-stone-50">
              {decided.map(c => <ConceptRow key={c.id} concept={c} />)}
            </div>
          </Card>
        </section>
      )}

      {/* ── Empty state ── */}
      {shared.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 py-16 text-center animate-fade-in">
          <Sparkles size={28} className="mx-auto text-stone-200 mb-3" />
          <p className="text-stone-400 font-medium text-sm">Nothing to review yet</p>
          <p className="text-stone-300 text-xs mt-1 max-w-xs mx-auto">
            Your planner will share concepts with you once they're ready.
          </p>
        </div>
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
