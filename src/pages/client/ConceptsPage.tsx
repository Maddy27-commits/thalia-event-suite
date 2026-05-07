import { useState } from 'react'
import { Check, X, MessageSquare, Sparkles, ChevronDown } from 'lucide-react'
import { useStore } from '../../store'
import { useClientEvent } from '../../hooks/useClientEvent'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import type { EventConcept, ConceptStatus } from '../../types'

const statusConfig: Record<ConceptStatus, { label: string; badge: 'default' | 'success' | 'danger' | 'warning' | 'info'; bar: string }> = {
  pending:  { label: 'Awaiting Your Review', badge: 'warning',  bar: 'bg-amber-400' },
  approved: { label: 'Approved',             badge: 'success',  bar: 'bg-emerald-500' },
  rejected: { label: 'Declined',             badge: 'danger',   bar: 'bg-red-400' },
  revised:  { label: 'Changes Requested',    badge: 'info',     bar: 'bg-sky-400' },
}

// Pinterest-style mood board grid — same layout as the planner's AI Generator view
function MoodBoardGrid({ images, gradient }: { images: string[]; gradient: string }) {
  const [failed, setFailed] = useState<Set<number>>(new Set())
  if (!images?.length) return null

  const imgs = [...images]
  while (imgs.length < 6) imgs.push('')

  const slot = (src: string, i: number, cls: string) => {
    if (!src || failed.has(i)) {
      return <div key={i} className={`${cls} bg-gradient-to-br ${gradient} opacity-60`} />
    }
    return (
      <img key={i} src={src} alt="" onError={() => setFailed(p => new Set([...p, i]))}
        className={`${cls} object-cover`} />
    )
  }

  return (
    <div className="space-y-0.5">
      {/* 5-photo: tall hero left + 2×2 right */}
      <div className="grid grid-cols-3 grid-rows-2 gap-0.5 h-[240px]">
        {slot(imgs[0], 0, 'col-span-1 row-span-2 w-full h-full')}
        {slot(imgs[1], 1, 'w-full h-full')}
        {slot(imgs[2], 2, 'w-full h-full')}
        {slot(imgs[3], 3, 'w-full h-full')}
        {slot(imgs[4], 4, 'w-full h-full')}
      </div>
      {/* Panoramic footer */}
      {slot(imgs[5], 5, 'w-full h-32')}
    </div>
  )
}

export function ConceptsPage() {
  const { updateConceptStatus } = useStore()
  const { event, stakeholder } = useClientEvent()
  const [selected, setSelected] = useState<EventConcept | null>(null)
  const [commentInput, setCommentInput] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revise' | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!event) return null

  // Role gate: only organisers can flip a concept's status. Contributors and
  // viewers can browse and (in the next pass) comment, but the approve /
  // reject / revise buttons are hidden from them. Planner preview gets
  // organiser permissions automatically.
  const canDecide = !stakeholder || stakeholder.role === 'organiser'

  // Pending first, then revised, then approved/rejected — so the inbox of
  // decisions you still need to make is always at the top.
  const statusOrder: Record<ConceptStatus, number> = { pending: 0, revised: 1, approved: 2, rejected: 3 }
  const sharedConcepts = event.concepts
    .filter(c => c.sharedWithClient !== false)
    .slice()
    .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9))

  const handleAction = (concept: EventConcept, action: 'approve' | 'reject' | 'revise') => {
    setSelected(concept)
    setCommentInput(concept.clientComment || '')
    setActionType(action)
  }

  const submitAction = () => {
    if (!selected || !actionType) return
    const map: Record<string, ConceptStatus> = { approve: 'approved', reject: 'rejected', revise: 'revised' }
    updateConceptStatus(
      event.id,
      selected.id,
      map[actionType] as ConceptStatus,
      commentInput,
      stakeholder ? { stakeholderId: stakeholder.id, stakeholderName: stakeholder.name } : undefined,
    )
    setSelected(null)
    setActionType(null)
  }

  const pendingCount = sharedConcepts.filter((c) => c.status === 'pending').length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Concepts & Approvals</h1>
        <p className="text-stone-400 text-sm mt-0.5">
          {pendingCount > 0
            ? `${pendingCount} concept${pendingCount !== 1 ? 's' : ''} waiting for your review — pending ones are highlighted first.`
            : 'Review and approve your personalised event concepts. All caught up!'}
        </p>
      </div>

      {sharedConcepts.length === 0 && (
        <div className="py-28 text-center">
          <div className="w-20 h-20 rounded-3xl bg-stone-50 ring-1 ring-black/[0.04] flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} className="text-stone-200" />
          </div>
          <p className="text-stone-500 font-medium">No concepts yet</p>
          <p className="text-stone-400 text-sm mt-1">Your planner hasn't shared any concepts yet.</p>
        </div>
      )}

      <div className="space-y-8">
        {sharedConcepts.map((concept) => {
          const sc = statusConfig[concept.status]
          const isExpanded = expanded === concept.id

          return (
            <Card key={concept.id} className="overflow-hidden">
              {/* Top status bar */}
              <div className={`h-1 w-full ${sc.bar}`} />

              {/* Mood board image grid with overlaid title (single hero) */}
              <div className="relative">
                <MoodBoardGrid images={concept.images ?? []} gradient={concept.coverGradient} />
                {/* Gradient scrim & title overlay on top of the mood board */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-6 pr-24">
                  <h2 className="text-3xl font-black text-white drop-shadow-lg">{concept.title}</h2>
                  <p className="text-white/85 text-sm mt-1 italic drop-shadow">"{concept.tagline}"</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {concept.colorPalette.map((c) => (
                      <span key={c} className="text-xs bg-white/25 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full font-medium ring-1 ring-white/20">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant={sc.badge} dot>{sc.label}</Badge>
                </div>
              </div>

              <CardBody className="space-y-5">
                {/* Mood + venue description */}
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">The Atmosphere</p>
                  <p className="text-sm font-semibold text-brand-600 italic mb-2">"{concept.mood}"</p>
                  <p className="text-sm text-stone-600 leading-relaxed">{concept.venueDescription}</p>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : concept.id)}
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  {isExpanded ? 'Show less' : 'See full concept details'}
                  <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="space-y-5 animate-fade-in pt-1">
                    {/* Decor grid */}
                    <div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Decor Elements</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {concept.decorItems.map((item) => (
                          <div key={item.name} className="bg-stone-50/80 ring-1 ring-black/[0.04] rounded-2xl p-4">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-stone-800">{item.name}</p>
                              <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">{item.estimatedCost}</span>
                            </div>
                            <p className="text-xs text-stone-500 leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Food & Drinks</p>
                        <p className="text-sm text-stone-600 leading-relaxed">{concept.cateringNotes}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Music & Entertainment</p>
                        <p className="text-sm text-stone-600 leading-relaxed">{concept.entertainmentNotes}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-stone-100">
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Estimated Budget</p>
                        <p className="text-2xl font-black text-stone-900 mt-0.5">{concept.estimatedBudget}</p>
                      </div>
                      {concept.clientComment && (
                        <div className="bg-sky-50 ring-1 ring-sky-200 rounded-xl p-3 max-w-xs">
                          <p className="text-[10px] text-sky-500 font-bold uppercase tracking-wide mb-0.5">Your note</p>
                          <p className="text-xs text-sky-700">"{concept.clientComment}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA row — only organisers can decide; everyone else just sees the status. */}
                {canDecide ? (
                  concept.status === 'pending' ? (
                    <div className="flex gap-2 pt-1">
                      <Button variant="client" className="flex-1" icon={<Check size={15} />} onClick={() => handleAction(concept, 'approve')}>
                        Approve this Concept
                      </Button>
                      <Button variant="outline" icon={<MessageSquare size={15} />} onClick={() => handleAction(concept, 'revise')}>
                        Request Changes
                      </Button>
                      <Button variant="ghost" icon={<X size={15} />} onClick={() => handleAction(concept, 'reject')}>
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Badge variant={sc.badge} dot>{sc.label}</Badge>
                      {concept.status !== 'approved' && (
                        <Button size="sm" variant="ghost" onClick={() => handleAction(concept, 'approve')}>
                          Change to Approved
                        </Button>
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <Badge variant={sc.badge} dot>{sc.label}</Badge>
                    <p className="text-[11px] text-stone-400 italic">
                      Only an organiser on this event can approve, request changes, or decline. You're signed in as a {stakeholder?.role ?? 'viewer'}.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Decision modal */}
      <Modal
        open={!!selected && !!actionType}
        onClose={() => { setSelected(null); setActionType(null) }}
        title={actionType === 'approve' ? '✓ Approve Concept' : actionType === 'revise' ? 'Request Changes' : 'Decline Concept'}
      >
        <div className="p-6 space-y-4">
          {selected && (
            <div className={`h-16 bg-gradient-to-r ${selected.coverGradient} rounded-2xl flex items-center px-5`}>
              <p className="text-white font-bold text-lg drop-shadow">{selected.title}</p>
            </div>
          )}
          <Textarea
            label={actionType === 'approve' ? 'Add a note (optional)' : actionType === 'revise' ? 'What changes would you like?' : 'Any feedback? (optional)'}
            rows={4}
            placeholder={
              actionType === 'approve' ? "Looks incredible, can't wait!"
              : actionType === 'revise' ? 'Love the concept but would prefer deeper tones…'
              : "I'd prefer a different direction…"
            }
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setSelected(null); setActionType(null) }}>Cancel</Button>
            <Button
              variant={actionType === 'approve' ? 'client' : actionType === 'reject' ? 'danger' : 'primary'}
              onClick={submitAction}
            >
              {actionType === 'approve' ? 'Yes, Approve!' : actionType === 'revise' ? 'Send Feedback' : 'Decline'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
