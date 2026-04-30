import { useState } from 'react'
import { Wand2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../../store'
import { usePlannerEvents } from '../../hooks/usePlannerEvents'
import { TagInput } from '../../components/ui/TagInput'
import { generateEventConcepts } from '../../lib/claude'
import { getImageForDecorItem } from '../../lib/images'
import type { ConceptGeneratorInput, EventConcept, EventType } from '../../types'

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'wedding',     label: 'Wedding'     },
  { value: 'corporate',   label: 'Corporate'   },
  { value: 'birthday',    label: 'Birthday'    },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'graduation',  label: 'Graduation'  },
  { value: 'gala',        label: 'Gala'        },
  { value: 'conference',  label: 'Conference'  },
  { value: 'other',       label: 'Other'       },
]

const STYLE_OPTIONS = [
  'romantic', 'modern', 'rustic', 'minimalist', 'bohemian',
  'glam', 'garden', 'luxe', 'industrial', 'tropical', 'vintage', 'ethereal',
]

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  pending:  { label: 'Awaiting Review', dot: 'bg-amber-400'   },
  approved: { label: 'Approved',        dot: 'bg-emerald-500' },
  rejected: { label: 'Declined',        dot: 'bg-red-400'     },
  revised:  { label: 'Revision Req.',   dot: 'bg-sky-400'     },
}

// ─── Resilient image with gradient fallback ────────────────────────────────────
function Img({
  src, alt = '', className, gradient,
}: {
  src: string; alt?: string; className: string; gradient?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return <div className={`${className} ${gradient ?? 'bg-stone-200'} bg-gradient-to-br`} />
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  )
}

// ─── Pinterest mood board grid ─────────────────────────────────────────────────
// Layout:
//   Row 1+2 combined: [  tall hero  ][ img2 ][ img3 ]   (3 cols)
//                     [             ][ img4 ][ img5 ]
//   Row 3: [ img6 — full-width panoramic                ]
function MoodBoard({ images, gradient }: { images: string[]; gradient: string }) {
  const imgs = images.slice(0, 6)
  while (imgs.length < 6) imgs.push('')   // pad if fewer than 6

  return (
    <div className="space-y-0.5 overflow-hidden rounded-t-2xl">
      {/* 5-photo grid: tall left + 2×2 right */}
      <div className="grid grid-cols-3 grid-rows-2 gap-0.5 h-[260px]">
        <Img src={imgs[0]} gradient={gradient} className="col-span-1 row-span-2 w-full h-full" />
        <Img src={imgs[1]} gradient={gradient} className="w-full h-full" />
        <Img src={imgs[2]} gradient={gradient} className="w-full h-full" />
        <Img src={imgs[3]} gradient={gradient} className="w-full h-full" />
        <Img src={imgs[4]} gradient={gradient} className="w-full h-full" />
      </div>
      {/* Panoramic footer image */}
      <Img src={imgs[5]} gradient={gradient} className="w-full h-36" />
    </div>
  )
}

// ─── Decor item card ───────────────────────────────────────────────────────────
function DecorCard({ name, cost, primaryColor, vibe }: {
  name: string; cost: string; primaryColor: string; vibe: string
}) {
  const [src] = useState(() => getImageForDecorItem(name, primaryColor, vibe))
  const [failed, setFailed] = useState(false)

  return (
    <div className="shrink-0 w-32 rounded-xl overflow-hidden bg-white ring-1 ring-black/[0.07] shadow-sm flex flex-col">
      {failed || !src ? (
        <div className="h-20 bg-gradient-to-br from-stone-100 to-stone-200" />
      ) : (
        <img src={src} alt={name} onError={() => setFailed(true)}
          className="h-20 w-full object-cover" />
      )}
      <div className="p-2">
        <p className="text-[11px] font-semibold text-stone-800 line-clamp-2 leading-tight">{name}</p>
        <p className="text-[11px] font-bold text-brand-600 mt-1">{cost}</p>
      </div>
    </div>
  )
}

// ─── Single concept board ──────────────────────────────────────────────────────
function ConceptBoard({ concept, index, onShare }: { concept: EventConcept; index: number; onShare: (conceptId: string, shared: boolean) => void }) {
  const [expanded, setExpanded] = useState(false)
  const sc = STATUS_CONFIG[concept.status] ?? STATUS_CONFIG.pending
  const primaryColor = concept.colorPalette[0] ?? ''
  const vibe = concept.mood.split(/[\s,]+/)[0] ?? ''

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white ring-1 ring-black/[0.07] shadow-md animate-slide-up"
      style={{ animationDelay: `${index * 0.15}s` } as React.CSSProperties}
    >
      {/* Mood board image grid */}
      <MoodBoard images={concept.images} gradient={concept.coverGradient} />

      {/* Title bar */}
      <div className={`bg-gradient-to-r ${concept.coverGradient} px-5 py-3 relative`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <h3 className="text-white font-bold text-xl font-display drop-shadow leading-tight">
              {concept.title}
            </h3>
            <p className="text-white/75 text-xs italic mt-0.5">{concept.tagline}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onShare(concept.id, !concept.sharedWithClient)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                concept.sharedWithClient
                  ? 'bg-sage-500 text-white border-sage-500 shadow-sm'
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
              }`}
            >
              {concept.sharedWithClient ? '✓ Shared with client' : 'Share with client'}
            </button>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            <span className="text-white/80 text-[11px] font-medium">{sc.label}</span>
          </div>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="px-5 py-3 flex items-center gap-2 flex-wrap border-b border-stone-100">
        {concept.colorPalette.map((c) => (
          <span key={c} className="flex items-center gap-1.5 text-[11px] text-stone-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 bg-stone-200 inline-block shrink-0" />
            {c}
          </span>
        ))}
        <span className="text-stone-300 mx-1">·</span>
        <span className="text-[11px] text-stone-400 italic">{concept.mood}</span>
        <span className="ml-auto text-base font-black text-stone-900">{concept.estimatedBudget}</span>
      </div>

      {/* Decor highlights — horizontal scroll */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
          Decor Highlights
        </p>
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {concept.decorItems.map((item) => (
            <DecorCard
              key={item.name}
              name={item.name}
              cost={item.estimatedCost}
              primaryColor={primaryColor}
              vibe={vibe}
            />
          ))}
        </div>
      </div>

      {/* Expand toggle + detail panel */}
      <div className="px-5 pb-4 border-t border-stone-100 pt-3">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Hide details' : 'See full concept details'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Venue */}
            <p className="text-sm text-stone-600 leading-relaxed">{concept.venueDescription}</p>

            {/* Catering + Entertainment side-by-side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                  Food & Drinks
                </p>
                <ul className="space-y-1.5">
                  {concept.cateringNotes.split(/[.!]/).filter(s => s.trim()).slice(0, 3).map((s, i) => (
                    <li key={i} className="flex gap-2 text-xs text-stone-600">
                      <span className="text-brand-400 shrink-0 mt-0.5">·</span>
                      {s.trim()}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                  Entertainment
                </p>
                <ul className="space-y-1.5">
                  {concept.entertainmentNotes.split(/[.!]/).filter(s => s.trim()).slice(0, 3).map((s, i) => (
                    <li key={i} className="flex gap-2 text-xs text-stone-600">
                      <span className="text-brand-400 shrink-0 mt-0.5">·</span>
                      {s.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Decor descriptions */}
            <div className="space-y-2">
              {concept.decorItems.map((item) => (
                <div key={item.name} className="flex gap-3 text-xs">
                  <span className="font-semibold text-stone-800 w-36 shrink-0">{item.name}</span>
                  <span className="text-stone-500 flex-1 line-clamp-1">{item.description}</span>
                  <span className="font-bold text-brand-600 shrink-0">{item.estimatedCost}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function AIGeneratorPage() {
  const { activeEventId, addConcept, setIsGenerating, isGenerating, shareConceptWithClient } = useStore()
  const events = usePlannerEvents()
  const activeEvent = events.find(e => e.id === activeEventId)

  const [form, setForm] = useState<ConceptGeneratorInput>({
    eventType:        activeEvent?.type                     ?? 'wedding',
    budget:           activeEvent?.budget                   ?? 30000,
    location:         activeEvent?.location                 ?? '',
    theme:            activeEvent?.theme                    ?? '',
    guestCount:       activeEvent?.guestCount               ?? 100,
    style:            activeEvent?.preferences?.style       ?? [],
    colorPreferences: activeEvent?.preferences?.colorPalette ?? [],
    dietary:          activeEvent?.preferences?.dietary      ?? [],
    additionalNotes:  activeEvent?.preferences?.notes        ?? '',
  })

  const [targetEventId,     setTargetEventId]     = useState(activeEventId ?? '')
  const [generatedConcepts, setGeneratedConcepts] = useState<EventConcept[]>([])
  const [error,             setError]             = useState('')

  const handleShare = (conceptId: string, eventId: string, shared: boolean) => {
    shareConceptWithClient(eventId, conceptId, shared)
    setGeneratedConcepts(prev =>
      prev.map(c => c.id === conceptId ? { ...c, sharedWithClient: shared } : c)
    )
  }

  const toggleStyle = (s: string) =>
    setForm(f => ({
      ...f,
      style: f.style.includes(s) ? f.style.filter(x => x !== s) : [...f.style, s],
    }))

  const handleGenerate = async () => {
    if (!targetEventId) { setError('Select an event to attach concepts to.'); return }

    setError('')
    setGeneratedConcepts([])
    setIsGenerating(true)

    try {
      const batch: EventConcept[] = []
      await generateEventConcepts(form, '', (concept) => {
        const c = { ...concept, eventId: targetEventId }
        batch.push(c)
        setGeneratedConcepts([...batch])
      })
      batch.forEach(c => addConcept(targetEventId, c))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">

      {/* ── Left: input panel ── */}
      <div className="md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-white/[0.06] bg-stone-950 flex flex-col max-h-[45vh] md:max-h-none">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-plum-500 via-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-900/40">
              <Wand2 size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm tracking-tight">AI Studio</p>
              <p className="text-[11px] text-stone-500">3 bespoke concepts per run</p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Event section */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Event</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Attach to Event</label>
                <div className="relative">
                  <select
                    value={targetEventId}
                    onChange={e => setTargetEventId(e.target.value)}
                    className="w-full appearance-none bg-white/[0.07] ring-1 ring-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all"
                  >
                    <option value="">Select…</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Type</label>
                <div className="relative">
                  <select
                    value={form.eventType}
                    onChange={e => setForm(f => ({ ...f, eventType: e.target.value as EventType }))}
                    className="w-full appearance-none bg-white/[0.07] ring-1 ring-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Theme / Direction</label>
                <input
                  type="text"
                  placeholder="e.g. Romantic Garden, Futuristic Luxe"
                  value={form.theme}
                  onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                  className="w-full bg-white/[0.07] ring-1 ring-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Tuscany, Italy"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full bg-white/[0.07] ring-1 ring-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1.5">Budget ($)</label>
                  <input
                    type="number"
                    value={String(form.budget)}
                    onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/[0.07] ring-1 ring-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1.5">Guests</label>
                  <input
                    type="number"
                    value={String(form.guestCount)}
                    onChange={e => setForm(f => ({ ...f, guestCount: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/[0.07] ring-1 ring-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Vibe & Palette section */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Vibe &amp; Palette</p>
            <div className="space-y-4">
              {/* Style chips */}
              <div className="flex flex-wrap gap-1.5">
                {STYLE_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleStyle(s)}
                    className={`text-xs px-3 py-1.5 rounded-full ring-1 font-medium capitalize transition-all ${
                      form.style.includes(s)
                        ? 'bg-brand-500 ring-brand-500 text-white'
                        : 'bg-white/[0.06] ring-white/[0.08] text-stone-400 hover:text-white hover:ring-white/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Color palette */}
              <div className="bg-white/[0.04] ring-1 ring-white/[0.07] rounded-xl p-3">
                <p className="text-xs font-medium text-stone-400 mb-1.5">Colour Palette</p>
                <TagInput
                  value={form.colorPreferences}
                  onChange={v => setForm(f => ({ ...f, colorPreferences: v }))}
                  placeholder="blush, gold, sage, ivory…"
                />
              </div>

              {/* Dietary */}
              <div className="bg-white/[0.04] ring-1 ring-white/[0.07] rounded-xl p-3">
                <p className="text-xs font-medium text-stone-400 mb-1.5">Dietary</p>
                <TagInput
                  value={form.dietary}
                  onChange={v => setForm(f => ({ ...f, dietary: v }))}
                  placeholder="vegetarian, nut-free…"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Loves candlelight, hates neon, wants pampas grass…"
                  value={form.additionalNotes}
                  onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))}
                  className="w-full bg-white/[0.07] ring-1 ring-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all resize-none"
                />
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="bg-rose-950/50 ring-1 ring-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Generate button — pinned at bottom */}
        <div className="shrink-0 p-5 border-t border-white/[0.06]">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-plum-600 via-brand-600 to-brand-500 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-900/30"
          >
            <Sparkles size={15} />
            {isGenerating ? 'Generating…' : 'Generate 3 Concepts'}
          </button>
        </div>
      </div>

      {/* ── Right: mood board output (scrollable) ── */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Loading */}
        {isGenerating && generatedConcepts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center animate-pulse">
              <Wand2 size={32} className="text-white" />
            </div>
            <p className="font-semibold text-stone-800 text-lg">Designing your concepts…</p>
            <p className="text-stone-400 text-sm">Claude is crafting 3 visual mood boards — ~20 seconds</p>
            <div className="flex gap-2 mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isGenerating && generatedConcepts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
            <div className="w-20 h-20 rounded-3xl bg-stone-50 ring-1 ring-stone-100 flex items-center justify-center">
              <Sparkles size={32} className="text-stone-200" />
            </div>
            <p className="text-stone-500 font-medium">Your mood boards appear here</p>
            <p className="text-stone-400 text-sm max-w-xs">
              Fill in the vibe and colour palette on the left — each concept gets photos that actually match your inputs.
            </p>
          </div>
        )}

        {/* Generated concept boards */}
        {generatedConcepts.length > 0 && (
          <div className="p-6 space-y-8 max-w-3xl">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                {generatedConcepts.length} concept{generatedConcepts.length !== 1 ? 's' : ''} generated
              </p>
              {isGenerating && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
              )}
            </div>
            {generatedConcepts.map((concept, i) => (
              <ConceptBoard key={concept.id} concept={concept} index={i} onShare={(id, shared) => handleShare(id, concept.eventId || targetEventId, shared)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
