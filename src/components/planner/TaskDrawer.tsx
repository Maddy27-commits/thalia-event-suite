import { useState, useMemo, useEffect } from 'react'
import {
  X, Check, MessageSquare, Mail, StickyNote, Sparkles,
  ThumbsUp, ThumbsDown, AlertTriangle, Star, Trash2, Plus, Send, Loader2,
  ChevronRight, CheckCircle2, Calendar, Wand2, Lightbulb,
} from 'lucide-react'
import type {
  Event, EventCeremony, EventStage, StageTask,
  TaskPhase, TaskMessage, TaskOption, MessageChannel, MessageAuthor, OptionStatus,
} from '../../types'
import { TASK_PHASES } from '../../types'
import { useStore } from '../../store'
import { generateId, formatDate, daysUntil, cn } from '../../lib/utils'
import { extractTaskInsight, suggestDiscussionStarters, suggestTaskOptions } from '../../lib/claude'

interface TaskDrawerProps {
  event: Event
  ceremony: EventCeremony
  sub: EventStage
  task: StageTask
  onClose: () => void
}

// Keep all channels for backward-compat with persisted messages; only expose in-app/note/email in UI
const CHANNEL_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'in-app':  { label: 'Chat',    icon: MessageSquare, color: 'text-brand-700 bg-brand-50 ring-brand-100'   },
  note:      { label: 'Note',    icon: StickyNote,    color: 'text-amber-700 bg-amber-50 ring-amber-200'   },
  email:     { label: 'Email',   icon: Mail,          color: 'text-blue-600 bg-blue-50 ring-blue-200'      },
  // Legacy — may appear in existing messages, not offered as new options
  whatsapp:  { label: 'WhatsApp', icon: Mail,         color: 'text-stone-600 bg-stone-100 ring-stone-200'  },
  sms:       { label: 'SMS',      icon: Mail,         color: 'text-stone-600 bg-stone-100 ring-stone-200'  },
}

const AUTHOR_META: Record<MessageAuthor, { label: string; color: string }> = {
  client:  { label: 'Client',  color: 'bg-rose-100 text-rose-700'         },
  planner: { label: 'You',     color: 'bg-brand-100 text-brand-700'       },
  ai:      { label: 'AI',      color: 'bg-violet-100 text-violet-700'     },
  vendor:  { label: 'Vendor',  color: 'bg-amber-100 text-amber-700'       },
}

const OPTION_STATUS_META: Record<OptionStatus, { label: string; color: string }> = {
  proposed:    { label: 'Proposed',    color: 'bg-stone-100 text-stone-600' },
  shortlisted: { label: 'Shortlisted', color: 'bg-amber-100 text-amber-700' },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700'     },
  selected:    { label: 'Selected',    color: 'bg-emerald-100 text-emerald-700' },
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d ago`
  return formatDate(iso)
}

export function TaskDrawer({ event, ceremony, sub, task, onClose }: TaskDrawerProps) {
  const {
    setTaskPhase, addTaskMessage, deleteTaskMessage, updateTaskMessage,
    addTaskOption, updateTaskOption, deleteTaskOption,
    toggleStageTask, updateStageTask, deleteStageTask,
    addNotification,
  } = useStore()

  const [activePhase, setActivePhase] = useState<TaskPhase>(task.currentPhase)
  const [channelFilter, setChannelFilter] = useState<MessageChannel | 'all'>('all')

  // ── Compose new message form ──
  const [draft, setDraft] = useState('')
  const [draftChannel, setDraftChannel] = useState<MessageChannel>('in-app')
  // Default: planner sends from their own account. The previous default of
  // 'client' was confusing — it asked for a name on every send.
  const [draftAuthor, setDraftAuthor] = useState<MessageAuthor>('planner')
  // Only used when logging a message from someone else; pre-fills with the
  // active stakeholder's name where possible so the planner doesn't retype.
  const [draftAuthorName, setDraftAuthorName] = useState('')
  const [extracting, setExtracting] = useState(false)
  // Advanced compose options ("Log message from someone else" + audience +
  // mentions). Collapsed by default — most messages are just planner-sent.
  const [showAdvanced, setShowAdvanced] = useState(false)

  // ── Add option form ──
  const [showAddOption, setShowAddOption] = useState(false)
  const [optTitle, setOptTitle] = useState('')
  const [optDesc, setOptDesc] = useState('')
  const [optCost, setOptCost] = useState('')

  // ── Inline-editable task due date ──
  const [editingDate, setEditingDate] = useState(false)
  const [dateDraft, setDateDraft] = useState(task.dueDate)

  // ── AI assist state ──
  const [starters, setStarters] = useState<string[]>([])
  const [loadingStarters, setLoadingStarters] = useState(false)
  const [generatingOptions, setGeneratingOptions] = useState(false)
  const [optionsError, setOptionsError] = useState('')

  // ── Audience + @mentions ──
  // The audience picker scopes a message to specific stakeholders. 'all' (the
  // default) means everyone with access to the event sees it. @mentions fire a
  // notification to each mentioned stakeholder regardless of audience.
  const stakeholders = (event.stakeholders ?? []).filter((s) => !s.removedAt)
  const [audience, setAudience] = useState<'all' | string[]>('all')
  const [mentions, setMentions] = useState<string[]>([])
  const [showAudiencePicker, setShowAudiencePicker] = useState(false)

  useEffect(() => { setActivePhase(task.currentPhase) }, [task.currentPhase])
  useEffect(() => { setDateDraft(task.dueDate) }, [task.dueDate])

  // Esc-to-close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  // ── Aggregated insights across all messages ──
  const aggregateInsight = useMemo(() => {
    const prefs = new Set<string>()
    const cons  = new Set<string>()
    const decs  = new Set<string>()
    let pos = 0, neg = 0
    for (const m of task.messages) {
      if (!m.insight) continue
      m.insight.preferences.forEach(p => prefs.add(p))
      m.insight.concerns.forEach(c => cons.add(c))
      m.insight.decisions.forEach(d => decs.add(d))
      if (m.insight.sentiment === 'positive') pos++
      if (m.insight.sentiment === 'negative') neg++
    }
    return {
      preferences: [...prefs],
      concerns: [...cons],
      decisions: [...decs],
      mood: pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral',
    }
  }, [task.messages])

  // ── Filtered messages by phase + channel ──
  const visibleMessages = useMemo(() => {
    return task.messages
      .filter(m => channelFilter === 'all' || m.channel === channelFilter)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [task.messages, channelFilter])

  const optionsByStatus = useMemo(() => {
    const grouped: Record<OptionStatus, TaskOption[]> = {
      proposed: [], shortlisted: [], rejected: [], selected: [],
    }
    task.options.forEach(o => grouped[o.status].push(o))
    return grouped
  }, [task.options])

  // ── Handlers ──
  const handlePhaseChange = (phase: TaskPhase) => {
    setActivePhase(phase)
    setTaskPhase(event.id, ceremony.id, sub.id, task.id, phase)
  }

  const handleAddMessage = async (extract: boolean) => {
    const text = draft.trim()
    if (!text) return
    const id = generateId()
    const message: TaskMessage = {
      id,
      author: draftAuthor,
      authorName: draftAuthor === 'client' ? (draftAuthorName || event.clientName) : undefined,
      channel: draftChannel,
      content: text,
      timestamp: new Date().toISOString(),
      phase: activePhase,
      audience: audience === 'all' || (Array.isArray(audience) && audience.length === 0) ? 'all' : audience,
      mentions: mentions.length > 0 ? mentions : undefined,
    }
    addTaskMessage(event.id, ceremony.id, sub.id, task.id, message)

    // Fan out a portal notification to every mentioned stakeholder so they
    // see the @mention next time they sign in.
    if (mentions.length > 0) {
      mentions.forEach((sid) => {
        const sh = stakeholders.find((s) => s.id === sid)
        if (!sh) return
        addNotification({
          id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          recipientEmail: sh.email,
          eventId: event.id,
          kind: 'planner-message',
          title: `You were mentioned in "${task.label}"`,
          body: text.length > 120 ? text.slice(0, 120) + '…' : text,
          link: '/client',
          read: false,
          createdAt: new Date().toISOString(),
        })
      })
    }

    setDraft('')
    setMentions([])
    setAudience('all')
    setShowAudiencePicker(false)

    if (extract && draftAuthor === 'client') {
      setExtracting(true)
      try {
        const insight = await extractTaskInsight(
          text,
          {
            taskLabel: task.label,
            eventType: event.type,
            ceremonyName: ceremony.name,
            clientName: event.clientName,
          },
          '',
        )
        updateTaskMessage(event.id, ceremony.id, sub.id, task.id, id, { insight })
      } finally {
        setExtracting(false)
      }
    }
  }

  const handleAddOption = () => {
    if (!optTitle.trim()) return
    const opt: TaskOption = {
      id: generateId(),
      title: optTitle.trim(),
      description: optDesc.trim(),
      estimatedCost: optCost.trim(),
      pros: [],
      cons: [],
      status: 'proposed',
      createdAt: new Date().toISOString(),
    }
    addTaskOption(event.id, ceremony.id, sub.id, task.id, opt)
    setOptTitle(''); setOptDesc(''); setOptCost(''); setShowAddOption(false)
  }

  const handleDateSave = () => {
    if (dateDraft && dateDraft !== task.dueDate) {
      updateStageTask(event.id, ceremony.id, sub.id, task.id, { dueDate: dateDraft })
    }
    setEditingDate(false)
  }

  // ── AI: suggest 3 phase-aware discussion starters ──
  const handleSuggestStarters = async () => {
    setLoadingStarters(true)
    try {
      const list = await suggestDiscussionStarters(
        {
          phase: activePhase,
          taskLabel: task.label,
          eventType: event.type,
          ceremonyName: ceremony.name,
          clientName: event.clientName,
          recentMessages: task.messages.slice(-6).map((m) => ({
            author: m.author === 'planner' ? 'You' : (m.authorName ?? m.author),
            content: m.content,
          })),
        },
        '',
      )
      setStarters(list)
    } finally {
      setLoadingStarters(false)
    }
  }

  // ── AI: generate option suggestions for the Recommendations phase ──
  const handleGenerateOptions = async () => {
    setOptionsError('')
    setGeneratingOptions(true)
    try {
      const suggestions = await suggestTaskOptions(
        {
          taskLabel: task.label,
          eventType: event.type,
          ceremonyName: ceremony.name,
          budget: event.budget,
          preferences: aggregateInsight.preferences,
          concerns:    aggregateInsight.concerns,
          existingTitles: task.options.map((o) => o.title),
        },
        '',
      )
      suggestions.forEach((s) => {
        const opt: TaskOption = {
          id: generateId(),
          title: s.title,
          description: s.description,
          estimatedCost: s.estimatedCost,
          pros: s.pros,
          cons: s.cons,
          status: 'proposed',
          createdAt: new Date().toISOString(),
        }
        addTaskOption(event.id, ceremony.id, sub.id, task.id, opt)
      })
    } catch (err) {
      setOptionsError((err as Error).message ?? 'Could not generate options. Please try again.')
    } finally {
      setGeneratingOptions(false)
    }
  }

  const days = daysUntil(task.dueDate)
  const overdue = !task.completed && days < 0

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slide-up">
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-stone-100 bg-gradient-to-br from-white to-stone-50/50 shrink-0">
          <div className="flex items-start gap-3">
            <button
              onClick={() => toggleStageTask(event.id, ceremony.id, sub.id, task.id)}
              className={cn(
                'w-6 h-6 mt-1 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                task.completed ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300 hover:border-brand-400',
              )}
            >
              {task.completed && <Check size={14} className="text-white" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <p className="text-[11px] text-stone-400 font-medium tracking-wide truncate">
                  {ceremony.emoji} {ceremony.name}  ·  {sub.emoji} {sub.name}
                </p>
              </div>
              <h2 className={cn('text-xl font-bold leading-tight', task.completed ? 'text-stone-400 line-through' : 'text-stone-900')}>
                {task.label}
              </h2>

              {/* Due date — inline editable */}
              <div className="flex items-center gap-2 mt-2">
                <Calendar size={13} className="text-stone-400" />
                {editingDate ? (
                  <>
                    <input
                      type="date"
                      value={dateDraft}
                      onChange={e => setDateDraft(e.target.value)}
                      className="text-xs border border-brand-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                      autoFocus
                    />
                    <button onClick={handleDateSave} className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check size={12} />
                    </button>
                    <button onClick={() => { setDateDraft(task.dueDate); setEditingDate(false) }} className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingDate(true)}
                    className="flex items-center gap-1.5 text-xs hover:text-brand-600 group"
                  >
                    <span className="text-stone-600 group-hover:text-brand-600 font-medium">{task.dueDate ? formatDate(task.dueDate) : 'Set due date'}</span>
                    {task.dueDate && !task.completed && (
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-md font-semibold',
                        overdue ? 'bg-red-50 text-red-600' :
                        days <= 14 ? 'bg-amber-50 text-amber-600' : 'bg-stone-50 text-stone-500',
                      )}>
                        {overdue ? `${Math.abs(days)}d late` : days === 0 ? 'today' : `${days}d`}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  if (confirm(`Delete task "${task.label}"?`)) {
                    deleteStageTask(event.id, ceremony.id, sub.id, task.id)
                    onClose()
                  }
                }}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 flex items-center justify-center transition-colors"
                title="Delete task"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Phase stepper */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
            {TASK_PHASES.map((p, idx) => {
              const isActive = p.id === activePhase
              const isPast   = TASK_PHASES.findIndex(x => x.id === activePhase) > idx
              return (
                <div key={p.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => handlePhaseChange(p.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-stone-900 text-white shadow-sm'
                        : isPast
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-stone-50 text-stone-500 ring-1 ring-stone-200 hover:bg-stone-100',
                    )}
                    title={p.description}
                  >
                    {isPast ? <CheckCircle2 size={11} /> : <span className="w-4 h-4 rounded-full bg-current/20 text-[9px] flex items-center justify-center font-black">{idx + 1}</span>}
                    {p.label}
                  </button>
                  {idx < TASK_PHASES.length - 1 && (
                    <ChevronRight size={12} className="text-stone-300 mx-0.5 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Phase guidance — different content per phase */}
          <PhaseIntroCard phase={activePhase} />
          {/*
           * Section visibility is driven by the active phase tab so each phase
           * shows only the work that belongs to it. Briefing focuses on
           * gathering preferences (AI insights + chat); Recommendations and
           * Revisions surface the option-building tools; Client Review shows
           * options (read-mostly) for the client to react to; Final collapses
           * down to the locked-in decision.
           */}
          {/* AI insights summary — useful in every phase except Final (where the decision is locked) */}
          {activePhase !== 'final' && (aggregateInsight.preferences.length || aggregateInsight.concerns.length || aggregateInsight.decisions.length) > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 ring-1 ring-violet-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-violet-600" />
                <p className="text-xs font-bold text-violet-900 uppercase tracking-widest">AI Summary</p>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto',
                  aggregateInsight.mood === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                  aggregateInsight.mood === 'negative' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600',
                )}>
                  {aggregateInsight.mood}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {aggregateInsight.preferences.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <ThumbsUp size={10} /> Preferences
                    </p>
                    <ul className="space-y-1">
                      {aggregateInsight.preferences.map((p, i) => (
                        <li key={i} className="text-stone-700 leading-snug">· {p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aggregateInsight.concerns.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <AlertTriangle size={10} /> Concerns
                    </p>
                    <ul className="space-y-1">
                      {aggregateInsight.concerns.map((p, i) => (
                        <li key={i} className="text-stone-700 leading-snug">· {p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aggregateInsight.decisions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-brand-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Star size={10} /> Decisions
                    </p>
                    <ul className="space-y-1">
                      {aggregateInsight.decisions.map((p, i) => (
                        <li key={i} className="text-stone-700 leading-snug">· {p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Options & Recommendations — hidden in Briefing (you are still
              gathering the brief; nothing to recommend yet). In Final we show
              only the selected option further below as a read-only summary. */}
          {activePhase === 'briefing' && (
            <div className="rounded-2xl bg-stone-50 ring-1 ring-stone-200 p-4 text-center">
              <p className="text-sm font-semibold text-stone-700 mb-1">Still capturing the brief</p>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Options, vendor ideas and AI generation appear once you advance to the <span className="font-semibold text-violet-600">Recommendations</span> phase above.
              </p>
            </div>
          )}
          {activePhase === 'final' && (() => {
            const finalOpt = task.options.find((o) => o.status === 'selected')
            return finalOpt ? (
              <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 p-4">
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Locked-in decision</p>
                <p className="text-base font-bold text-stone-900">{finalOpt.title}</p>
                {finalOpt.estimatedCost && <p className="text-xs text-emerald-700 font-semibold mt-0.5">{finalOpt.estimatedCost}</p>}
                {finalOpt.description && <p className="text-xs text-stone-600 mt-2 leading-relaxed">{finalOpt.description}</p>}
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">No option selected yet</p>
                <p className="text-[11px] text-amber-700">Go back to <span className="font-semibold">Client Review</span> or <span className="font-semibold">Revisions</span> and mark an option as Selected to lock the final decision.</p>
              </div>
            )
          })()}
          {activePhase !== 'briefing' && activePhase !== 'final' && (
          <section className={cn(
            'rounded-2xl transition-all',
            activePhase === 'recommendations' && 'ring-2 ring-violet-200 bg-violet-50/30 -mx-2 px-2 py-3',
          )}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Options & Recommendations</h3>
                <p className="text-[11px] text-stone-400">Vendors, dishes, mood-boards — anything you're presenting to the client.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleGenerateOptions}
                  disabled={generatingOptions}
                  className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 ring-1 ring-violet-200 px-2.5 py-1 rounded-lg disabled:opacity-50 transition-all"
                  title="Use AI to draft option ideas based on this event"
                >
                  {generatingOptions ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  AI generate
                </button>
                <button
                  onClick={() => setShowAddOption(v => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50"
                >
                  <Plus size={12} /> Add option
                </button>
              </div>
            </div>

            {optionsError && (
              <div className="mb-2 text-[11px] text-red-600 bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-1.5">
                {optionsError}
              </div>
            )}

            {showAddOption && (
              <div className="bg-brand-50/40 ring-1 ring-brand-100 rounded-2xl p-3 mb-3 space-y-2">
                <input
                  placeholder="Title (e.g. Rosewood Estate)"
                  value={optTitle} onChange={e => setOptTitle(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  autoFocus
                />
                <textarea
                  placeholder="Short description"
                  value={optDesc} onChange={e => setOptDesc(e.target.value)}
                  rows={2}
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Estimated cost (e.g. $4,500)"
                    value={optCost} onChange={e => setOptCost(e.target.value)}
                    className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button onClick={handleAddOption} className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 rounded-lg">
                    Save
                  </button>
                  <button onClick={() => setShowAddOption(false)} className="text-xs font-semibold text-stone-500 hover:bg-stone-100 px-3 rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {task.options.length === 0 && !showAddOption ? (
              <p className="text-xs text-stone-400 italic py-3 px-1">No options yet — add the venues / vendors / ideas you're considering.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(['selected', 'shortlisted', 'proposed', 'rejected'] as OptionStatus[]).flatMap(st =>
                  optionsByStatus[st].map(opt => (
                    <OptionCard
                      key={opt.id}
                      option={opt}
                      onUpdate={(updates) => updateTaskOption(event.id, ceremony.id, sub.id, task.id, opt.id, updates)}
                      onDelete={() => deleteTaskOption(event.id, ceremony.id, sub.id, task.id, opt.id)}
                    />
                  ))
                )}
              </div>
            )}
          </section>
          )}

          {/* ── Discussion (in-app chat) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Discussion</h3>
                <p className="text-[11px] text-stone-400">Conversation with your client, scoped to this task.</p>
              </div>
              {/* Channel filter is intentionally hidden for now — most planners
                  don't switch between Chat / Note / Email and the row of pills
                  was creating noise. The underlying state is preserved so we
                  can re-expose it as a "▾ Filters" affordance if needed. */}
            </div>

            {visibleMessages.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-3 px-1">No messages yet — say hi to your client below.</p>
            ) : (
              <div className="space-y-3">
                {visibleMessages.map(m => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    onDelete={() => deleteTaskMessage(event.id, ceremony.id, sub.id, task.id, m.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Compose footer (redesigned) ──────────────────────────────────
         *
         * One clean composer. Defaults send as "you" (the planner) over chat,
         * which covers the 90% case in one keystroke. Everything else —
         * logging a message someone else said, restricting who sees it,
         * @-mentioning stakeholders — lives behind a single "More" toggle so
         * it's there when you need it but never in the way.
         * ─────────────────────────────────────────────────────────────── */}
        <div className="border-t border-stone-100 bg-white shrink-0">

          {/* Top row: mode tabs + AI starters + More toggle */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 flex-wrap">
            {/* Chat / Note tabs */}
            <div className="flex items-center gap-1 bg-stone-50 rounded-xl p-0.5 ring-1 ring-stone-100">
              {(['in-app', 'note'] as MessageChannel[]).map(c => {
                const Icon = CHANNEL_META[c].icon
                return (
                  <button
                    key={c}
                    onClick={() => setDraftChannel(c)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                      draftChannel === c
                        ? c === 'note'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-sm'
                          : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 shadow-sm'
                        : 'text-stone-400 hover:text-stone-600',
                    )}
                  >
                    <Icon size={11} />
                    {c === 'in-app' ? 'Chat' : 'Private Note'}
                  </button>
                )
              })}
            </div>

            {/* AI starters trigger — only meaningful for chat */}
            {draftChannel === 'in-app' && (
              <button
                onClick={handleSuggestStarters}
                disabled={loadingStarters}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 ring-1 ring-violet-200 px-2 py-1 rounded-full disabled:opacity-50 transition-all"
                title="Get 3 phase-aware message ideas"
              >
                {loadingStarters ? <Loader2 size={11} className="animate-spin" /> : <Lightbulb size={11} />}
                {starters.length > 0 ? 'Regenerate' : 'Suggest reply'}
              </button>
            )}

            <span className="ml-auto" />

            {/* Single "More" toggle for advanced compose options */}
            {draftChannel === 'in-app' && (
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className={cn(
                  'text-[11px] font-medium px-2 py-1 rounded-md transition-colors',
                  showAdvanced || draftAuthor !== 'planner' || (Array.isArray(audience) && audience.length > 0) || mentions.length > 0
                    ? 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'
                    : 'text-stone-400 hover:text-stone-600',
                )}
                title="Log a message from someone else, mention stakeholders, or restrict view"
              >
                {showAdvanced ? '▾ Less' : '▾ More'}
              </button>
            )}
          </div>

          {/* AI starter chips — appears under the top row when results loaded */}
          {starters.length > 0 && (
            <div className="px-4 pb-1.5 flex gap-1.5 flex-wrap items-center">
              <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-widest">Ideas</span>
              {starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setDraft(s); setStarters([]) }}
                  className="text-[11px] text-stone-700 bg-stone-50 hover:bg-violet-50 hover:text-violet-700 ring-1 ring-stone-200 hover:ring-violet-300 px-2 py-1 rounded-lg text-left max-w-[260px] truncate transition-all"
                  title={s}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => setStarters([])}
                className="text-[11px] text-stone-400 hover:text-stone-600 px-1.5"
                title="Dismiss suggestions"
              >
                <X size={11} />
              </button>
            </div>
          )}

          {/* Advanced compose panel — collapsible */}
          {showAdvanced && draftChannel === 'in-app' && (
            <div className="mx-4 mb-2 rounded-xl bg-stone-50 ring-1 ring-stone-200 p-3 space-y-3 text-xs">
              {/* Log on behalf */}
              <div>
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5">
                  Send as
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => { setDraftAuthor('planner'); setDraftAuthorName('') }}
                    className={cn(
                      'text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 transition-colors',
                      draftAuthor === 'planner'
                        ? 'bg-brand-100 text-brand-700 ring-brand-300'
                        : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50',
                    )}
                  >
                    You (planner)
                  </button>
                  {/* Stakeholder pickers — replace the manual name input */}
                  {stakeholders.map((sh) => (
                    <button
                      key={sh.id}
                      onClick={() => { setDraftAuthor('client'); setDraftAuthorName(sh.name) }}
                      className={cn(
                        'text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 transition-colors',
                        draftAuthor === 'client' && draftAuthorName === sh.name
                          ? 'bg-rose-100 text-rose-700 ring-rose-300'
                          : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50',
                      )}
                      title={`Log a message from ${sh.name}`}
                    >
                      {sh.name}
                    </button>
                  ))}
                  <button
                    onClick={() => { setDraftAuthor('vendor'); setDraftAuthorName('Vendor') }}
                    className={cn(
                      'text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 transition-colors',
                      draftAuthor === 'vendor'
                        ? 'bg-amber-100 text-amber-700 ring-amber-300'
                        : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50',
                    )}
                  >
                    A vendor
                  </button>
                </div>
                {draftAuthor !== 'planner' && (
                  <p className="text-[10px] text-stone-400 mt-1.5 italic">
                    Use this to log conversations that happened off-platform (e.g. a phone call).
                  </p>
                )}
              </div>

              {/* @mentions — only when there's more than one stakeholder */}
              {stakeholders.length > 1 && (
                <div>
                  <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5">
                    @-mention to notify
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {stakeholders.map((sh) => {
                      const on = mentions.includes(sh.id)
                      return (
                        <button
                          key={sh.id}
                          onClick={() => setMentions((m) => on ? m.filter((id) => id !== sh.id) : [...m, sh.id])}
                          className={cn(
                            'text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 transition-colors',
                            on
                              ? 'bg-violet-100 text-violet-700 ring-violet-300'
                              : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50',
                          )}
                        >
                          @{sh.name.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Restrict view — only when there's more than one stakeholder */}
              {stakeholders.length > 1 && (
                <div>
                  <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5">
                    Visible to
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setAudience('all')}
                      className={cn(
                        'text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 transition-colors',
                        audience === 'all'
                          ? 'bg-emerald-100 text-emerald-700 ring-emerald-300'
                          : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50',
                      )}
                    >
                      Everyone
                    </button>
                    {stakeholders.map((sh) => {
                      const on = Array.isArray(audience) && audience.includes(sh.id)
                      return (
                        <button
                          key={sh.id}
                          onClick={() => {
                            const current = Array.isArray(audience) ? audience : []
                            const next = on ? current.filter((id) => id !== sh.id) : [...current, sh.id]
                            setAudience(next.length === 0 ? 'all' : next)
                          }}
                          className={cn(
                            'text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 transition-colors',
                            on
                              ? 'bg-amber-100 text-amber-700 ring-amber-300'
                              : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50',
                          )}
                        >
                          Only {sh.name.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                  {Array.isArray(audience) && audience.length > 0 && (
                    <p className="text-[10px] text-stone-400 mt-1.5 italic">
                      Restricting view is for discretion, not secrecy.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Textarea + send */}
          <div className="flex gap-2 items-end px-4 pb-3">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={
                draftChannel === 'note'
                  ? 'Private planner note (not visible to client)…'
                  : draftAuthor === 'planner'
                    ? 'Type a message…'
                    : `Logging on behalf of ${draftAuthorName || (draftAuthor === 'vendor' ? 'a vendor' : 'someone else')}…`
              }
              rows={2}
              className="flex-1 text-sm border border-stone-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none bg-stone-50"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  // AI insight extraction only when logging client-side input
                  handleAddMessage(draftAuthor === 'client' && draftChannel === 'in-app')
                }
              }}
            />
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => handleAddMessage(draftAuthor === 'client' && draftChannel === 'in-app')}
                disabled={!draft.trim() || extracting}
                className={cn(
                  'flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all min-w-[80px]',
                  draftChannel === 'note'
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm',
                )}
                title="Send (⌘↵)"
              >
                {extracting ? <Loader2 size={12} className="animate-spin" /> : <Send size={13} />}
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const PHASE_INTRO: Record<TaskPhase, { title: string; body: string; emoji: string; gradient: string; ring: string }> = {
  briefing: {
    title:    'Capture the brief',
    body:     'Get the client talking about what they want — and what they don\'t. Use Suggest starters below if you need an opener.',
    emoji:    '🎤',
    gradient: 'from-amber-50 to-orange-50',
    ring:     'ring-amber-200',
  },
  recommendations: {
    title:    'Build the shortlist',
    body:     'Add the options you want to present. Use AI generate to draft 4 ideas based on the brief, then refine and reject as needed.',
    emoji:    '✨',
    gradient: 'from-violet-50 to-fuchsia-50',
    ring:     'ring-violet-200',
  },
  'client-review': {
    title:    'Client is reviewing',
    body:     'Watch for incoming messages. Mark options Selected / Rejected as the client reacts so the trail is clean.',
    emoji:    '👀',
    gradient: 'from-blue-50 to-cyan-50',
    ring:     'ring-blue-200',
  },
  revisions: {
    title:    'Refine and re-present',
    body:     'Update options based on feedback. The Discussion thread is your record — keep notes private with the Note tab.',
    emoji:    '✏️',
    gradient: 'from-rose-50 to-pink-50',
    ring:     'ring-rose-200',
  },
  final: {
    title:    'Locked in',
    body:     'Selected option is the final answer. Confirm with the vendor, mark the task done, and move on.',
    emoji:    '🎯',
    gradient: 'from-emerald-50 to-sage-50',
    ring:     'ring-emerald-200',
  },
}

/**
 * Compact one-line phase explainer. The phase tabs already display the
 * phase name; this just adds a short tip for what to do in the current
 * phase without taking up a banner-sized chunk of vertical space.
 */
function PhaseIntroCard({ phase }: { phase: TaskPhase }) {
  const intro = PHASE_INTRO[phase]
  return (
    <div className={cn('rounded-xl bg-gradient-to-r px-3 py-2 ring-1 flex items-center gap-2.5', intro.gradient, intro.ring)}>
      <span className="text-base shrink-0">{intro.emoji}</span>
      <p className="text-[11px] text-stone-700 leading-snug min-w-0">
        <span className="font-bold text-stone-900">{intro.title}.</span>{' '}
        <span className="text-stone-600">{intro.body}</span>
      </p>
    </div>
  )
}

function MessageBubble({ message, onDelete }: { message: TaskMessage; onDelete: () => void }) {
  const ch = CHANNEL_META[message.channel] ?? CHANNEL_META['in-app']
  const author = AUTHOR_META[message.author]
  const fromClient = message.author === 'client'
  const isNote = message.channel === 'note'
  const isEmail = message.channel === 'email'

  return (
    <div className={cn('group flex gap-2.5', fromClient ? '' : 'flex-row-reverse')}>
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', author.color)}>
        {(message.authorName ?? author.label).slice(0, 2).toUpperCase()}
      </div>

      <div className={cn('flex-1 min-w-0', fromClient ? '' : 'flex flex-col items-end')}>
        <div className="flex items-center gap-2 mb-1">
          {isNote && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ring-1 font-semibold text-amber-700 bg-amber-50 ring-amber-200">
              <StickyNote size={9} /> Note
            </span>
          )}
          {isEmail && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ring-1 font-semibold text-blue-600 bg-blue-50 ring-blue-200">
              <Mail size={9} /> Email
            </span>
          )}
          {Array.isArray(message.audience) && message.audience.length > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ring-1 font-semibold text-amber-700 bg-amber-50 ring-amber-200"
              title={`Restricted view — visible only to ${message.audience.length} stakeholder${message.audience.length !== 1 ? 's' : ''}`}
            >
              Restricted
            </span>
          )}
          {message.mentions && message.mentions.length > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ring-1 font-semibold text-violet-700 bg-violet-50 ring-violet-200"
              title={`@-mentioned ${message.mentions.length} stakeholder${message.mentions.length !== 1 ? 's' : ''}`}
            >
              @{message.mentions.length}
            </span>
          )}
          <span className="text-[10px] text-stone-500 font-medium">{message.authorName ?? author.label}</span>
          <span className="text-[10px] text-stone-300">· {timeAgo(message.timestamp)}</span>
          <button
            onClick={onDelete}
            className="ml-1 text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete message"
          >
            <X size={11} />
          </button>
        </div>

        <div className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[92%] whitespace-pre-wrap break-words',
          isNote
            ? 'bg-amber-50 text-amber-900 rounded-tl-sm border border-dashed border-amber-200'
            : fromClient
              ? 'bg-stone-100 text-stone-800 rounded-tl-sm'
              : message.author === 'planner'
                ? 'bg-brand-500 text-white rounded-tr-sm'
                : 'bg-stone-100 text-stone-800 rounded-tl-sm',
        )}>
          {message.content}
        </div>

        {/* AI-extracted insight chips */}
        {message.insight && (
          <div className={cn('flex flex-wrap gap-1 mt-1.5 max-w-[92%]', fromClient ? '' : 'justify-end')}>
            {message.insight.preferences.map((p, i) => (
              <span key={`p-${i}`} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md ring-1 ring-emerald-100 font-medium inline-flex items-center gap-1">
                <ThumbsUp size={8} /> {p}
              </span>
            ))}
            {message.insight.concerns.map((c, i) => (
              <span key={`c-${i}`} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md ring-1 ring-amber-100 font-medium inline-flex items-center gap-1">
                <AlertTriangle size={8} /> {c}
              </span>
            ))}
            {message.insight.decisions.map((d, i) => (
              <span key={`d-${i}`} className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-md ring-1 ring-brand-100 font-medium inline-flex items-center gap-1">
                <Star size={8} /> {d}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OptionCard({
  option,
  onUpdate,
  onDelete,
}: {
  option: TaskOption
  onUpdate: (updates: Partial<TaskOption>) => void
  onDelete: () => void
}) {
  const meta = OPTION_STATUS_META[option.status]
  const isSelected = option.status === 'selected'
  const isRejected = option.status === 'rejected'

  return (
    <div className={cn(
      'rounded-xl ring-1 p-3 transition-all group',
      isSelected ? 'bg-emerald-50/40 ring-emerald-200' :
      isRejected ? 'bg-stone-50 ring-stone-100 opacity-70' : 'bg-white ring-stone-200',
    )}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={cn('text-sm font-semibold truncate', isRejected ? 'text-stone-500 line-through' : 'text-stone-900')}>
              {option.title}
            </p>
            {option.estimatedCost && (
              <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap">
                {option.estimatedCost}
              </span>
            )}
          </div>
          {option.description && (
            <p className="text-[11px] text-stone-500 leading-snug">{option.description}</p>
          )}

          {(option.pros.length > 0 || option.cons.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {option.pros.map((p, i) => (
                <span key={`p-${i}`} className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-medium">+ {p}</span>
              ))}
              {option.cons.map((c, i) => (
                <span key={`c-${i}`} className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md font-medium">− {c}</span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          title="Delete option"
        >
          <X size={12} />
        </button>
      </div>

      {/* Status switcher */}
      <div className="flex items-center gap-1 mt-2">
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-bold', meta.color)}>
          {meta.label}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          {(['proposed', 'shortlisted', 'selected', 'rejected'] as OptionStatus[]).map(st => (
            <button
              key={st}
              onClick={() => onUpdate({ status: st })}
              className={cn(
                'text-[9px] font-semibold px-1.5 py-0.5 rounded transition-colors',
                option.status === st
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-400 hover:bg-stone-100',
              )}
              title={`Mark as ${OPTION_STATUS_META[st].label}`}
            >
              {OPTION_STATUS_META[st].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
