import { Check, X, MessageSquare, Clock } from 'lucide-react'
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
  const [comment, setComment] = useState('')

  if (!event) return null

  const shared  = event.concepts.filter((c) => c.sharedWithClient !== false)
  const pending = shared.filter((c) => c.status === 'pending')
  const decided = shared.filter((c) => c.status !== 'pending')

  const submit = () => {
    if (!selected) return
    const map: Record<string, ConceptStatus> = { approve: 'approved', reject: 'rejected', revise: 'revised' }
    updateConceptStatus(event.id, selected.concept.id, map[selected.action] as ConceptStatus, comment)
    setSelected(null)
    setComment('')
  }

  const ConceptRow = ({ concept }: { concept: EventConcept }) => (
    <div className="flex items-center gap-4 py-3">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${concept.coverGradient} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-stone-900">{concept.title}</p>
        <p className="text-xs text-stone-400 italic">{concept.tagline}</p>
        <p className="text-xs text-stone-400 mt-0.5">{concept.estimatedBudget}</p>
        {concept.clientComment && (
          <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded-lg inline-block">
            "{concept.clientComment}"
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {concept.status === 'pending' ? (
          <>
            <button
              onClick={() => { setSelected({ concept, action: 'approve' }); setComment('') }}
              className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-colors"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => { setSelected({ concept, action: 'revise' }); setComment(concept.clientComment) }}
              className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
            >
              <MessageSquare size={14} />
            </button>
            <button
              onClick={() => { setSelected({ concept, action: 'reject' }); setComment('') }}
              className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <Badge
            variant={concept.status === 'approved' ? 'success' : concept.status === 'rejected' ? 'danger' : 'info'}
          >
            {concept.status}
          </Badge>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Approvals</h1>
        <p className="text-stone-500 text-sm mt-0.5">
          Review and approve design concepts and decisions.
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-3 py-1.5 rounded-full">
          <Clock size={14} />
          {pending.length} pending
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-1.5 rounded-full">
          <Check size={14} />
          {shared.filter((c) => c.status === 'approved').length} approved
        </div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-1.5 rounded-full">
          <X size={14} />
          {shared.filter((c) => c.status === 'rejected').length} declined
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
              Awaiting Your Review
            </p>
            <div className="divide-y divide-gray-50">
              {pending.map((c) => <ConceptRow key={c.id} concept={c} />)}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Decided */}
      {decided.length > 0 && (
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Past Decisions</p>
            <div className="divide-y divide-gray-50">
              {decided.map((c) => <ConceptRow key={c.id} concept={c} />)}
            </div>
          </CardBody>
        </Card>
      )}

      {shared.length === 0 && (
        <div className="py-16 text-center text-stone-400">
          <Clock size={36} className="mx-auto mb-3 text-stone-200" />
          <p>Nothing to approve yet.</p>
          <p className="text-sm mt-1">Your planner hasn't shared any concepts for review yet.</p>
        </div>
      )}

      {/* Action modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.action === 'approve' ? 'Approve Concept' : selected?.action === 'revise' ? 'Request Changes' : 'Decline Concept'}
      >
        <div className="p-6 space-y-4">
          {selected && (
            <div className={`h-14 bg-gradient-to-r ${selected.concept.coverGradient} rounded-xl flex items-center px-4`}>
              <p className="text-white font-bold">{selected.concept.title}</p>
            </div>
          )}
          <Textarea
            label={selected?.action === 'revise' ? 'What changes would you like?' : 'Add a note (optional)'}
            rows={3}
            placeholder={selected?.action === 'revise' ? 'I love the concept but would prefer softer tones...' : 'Any final thoughts?'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end gap-2">
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
