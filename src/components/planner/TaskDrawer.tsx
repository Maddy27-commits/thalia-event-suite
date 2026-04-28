import { useState, useMemo, useEffect } from 'react'
import {
  X, Check, MessageSquare, Mail, Phone, MessageCircle, StickyNote, Sparkles,
  ThumbsUp, ThumbsDown, AlertTriangle, Star, Trash2, Plus, Send, Loader2,
  ChevronRight, CheckCircle2, Calendar,
} from 'lucide-react'
import type {
  Event, EventCeremony, EventSubCategory, SubCategoryTask,
  TaskPhase, TaskMessage, TaskOption, MessageChannel, MessageAuthor, OptionStatus,
} from '../../types'
import { TASK_PHASES } from '../../types'
import { useStore } from '../../store'
import { generateId, formatDate, daysUntil, cn } from '../../lib/utils'
import { extractTaskInsight } from '../../lib/claude'

interface TaskDrawerProps {
  event: Event
  ceremony: EventCeremony
  sub: EventSubCategory
  task: SubCategoryTask
  onClose: () => void
}

const CHANNEL_META: Record<MessageChannel, { label: string; icon: React.ElementType; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 ring-emerald-200' },
  email:    { label: 'Email',    icon: Mail,          color: 'text-blue-600 bg-blue-50 ring-blue-200'           },
  sms:      { label: 'SMS',      icon: Phone,         color: 'text-violet-600 bg-violet-50 ring-violet-200'     },
  'in-app': { label: 'In-app',   icon: MessageSquare, color: 'text-stone-700 bg-stone-100 ring-stone-200'        },
  note:     { label: 'Note',     icon: StickyNote,    color: 'text-amber-700 bg-amber-50 ring-amber-200'         },
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
    apiKey,
    setTaskPhase, addTaskMessage, deleteTaskMessage, updateTaskMessage,
    addTaskOption, updateTaskOption, deleteTaskOption,
    toggleSubCategoryTask, updateSubCategoryTask, deleteSubCategoryTask,
  } = useStore()

  const [activePhase, setActivePhase] = useState<TaskPhase>(task.currentPhase)
  const [channelFilter, setChannelFilter] = useState<MessageChannel | 'all'>('all')

  // ── Compose new message form ──
  const [draft, setDraft] = useState('')
  const [draftChannel, setDraftChannel] = useState<MessageChannel>('whatsapp')
  const [draftAuthor, setDraftAuthor] = useState<MessageAuthor>('client')
  const [draftAuthorName, setDraftAuthorName] = useState(event.clientName.split(' ')[0] ?? '')
  const [extracting, setExtracting] = useState(false)

  // ── Add option form ──
  const [showAddOption, setShowAddOption] = useState(false)
  const [optTitle, setOptTitle] = useState('')
  const [optDesc, setOptDesc] = useState('')
  const [optCost, setOptCost] = useState('')

  // ── Inline-editable task due date ──
  const [editingDate, setEditingDate] = useState(false)
  const [dateDraft, setDateDraft] = useState(task.dueDate)

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
    }
    addTaskMessage(event.id, ceremony.id, sub.id, task.id, message)
    setDraft('')

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
          apiKey,
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
      updateSubCategoryTask(event.id, ceremony.id, sub.id, task.id, { dueDate: dateDraft })
    }
    setEditingDate(false)
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
              onClick={() => toggleSubCategoryTask(event.id, ceremony.id, sub.id, task.id)}
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
                    deleteSubCategoryTask(event.id, ceremony.id, sub.id, task.id)
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
          {/* AI insights summary (if any) */}
          {(aggregateInsight.preferences.length || aggregateInsight.concerns.length || aggregateInsight.decisions.length) > 0 && (
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

          {/* ── Options / Recommendations ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Options & Recommendations</h3>
                <p className="text-[11px] text-stone-400">Vendors, dishes, mood-boards — anything you're presenting to the client.</p>
              </div>
              <button
                onClick={() => setShowAddOption(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50"
              >
                <Plus size={12} /> Add option
              </button>
            </div>

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

          {/* ── Conversation thread ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Conversation Thread</h3>
                <p className="text-[11px] text-stone-400">Cross-channel — paste client messages from WhatsApp / email / SMS into one timeline.</p>
              </div>

              {/* Channel filter */}
              <div className="flex items-center gap-1">
                {(['all', 'whatsapp', 'email', 'sms', 'in-app', 'note'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setChannelFilter(c)}
                    className={cn(
                      'text-[10px] px-2 py-1 rounded-md font-semibold uppercase tracking-wide transition-colors',
                      channelFilter === c ? 'bg-stone-900 text-white' : 'text-stone-400 hover:bg-stone-100',
                    )}
                  >
                    {c === 'all' ? 'All' : CHANNEL_META[c].label}
                  </button>
                ))}
              </div>
            </div>

            {visibleMessages.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-3 px-1">No messages yet for this filter.</p>
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

        {/* ── Compose footer ── */}
        <div className="border-t border-stone-100 px-6 py-3 bg-white shrink-0">
          <div className="flex items-center gap-2 mb-2 text-[11px]">
            {/* Channel selector */}
            <div className="flex items-center gap-1 bg-stone-50 rounded-lg p-0.5 ring-1 ring-stone-100">
              {(['whatsapp', 'email', 'sms', 'in-app', 'note'] as MessageChannel[]).map(c => {
                const meta = CHANNEL_META[c]
                const Icon = meta.icon
                return (
                  <button
                    key={c}
                    onClick={() => setDraftChannel(c)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition-colors',
                      draftChannel === c ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600',
                    )}
                    title={meta.label}
                  >
                    <Icon size={11} /> {meta.label}
                  </button>
                )
              })}
            </div>

            {/* Author selector */}
            <select
              value={draftAuthor}
              onChange={e => setDraftAuthor(e.target.value as MessageAuthor)}
              className="text-xs border border-stone-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 font-medium"
            >
              <option value="client">From client</option>
              <option value="planner">From you</option>
              <option value="vendor">From vendor</option>
            </select>

            {draftAuthor === 'client' && (
              <input
                value={draftAuthorName}
                onChange={e => setDraftAuthorName(e.target.value)}
                placeholder="Sender name"
                className="text-xs border border-stone-200 rounded-md px-2 py-1 w-28 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            )}

            <span className="text-stone-300 ml-auto">→ phase: <span className="font-semibold text-stone-600">{TASK_PHASES.find(p => p.id === activePhase)?.label}</span></span>
          </div>

          <div className="flex gap-2 items-end">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={
                draftAuthor === 'client'
                  ? "Paste the client's WhatsApp / email / SMS message here…"
                  : 'Type your update / note…'
              }
              rows={2}
              className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleAddMessage(draftAuthor === 'client')
                }
              }}
            />
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => handleAddMessage(false)}
                disabled={!draft.trim()}
                className="flex items-center gap-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Add to thread without AI extraction"
              >
                <Send size={12} /> Add
              </button>
              {draftAuthor === 'client' && (
                <button
                  onClick={() => handleAddMessage(true)}
                  disabled={!draft.trim() || extracting}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:opacity-90 px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-sm"
                  title="Add and extract preferences/concerns/sentiment"
                >
                  {extracting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {extracting ? 'Extracting…' : 'Add & Extract'}
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-stone-400 mt-1.5">
            {apiKey
              ? 'AI extraction uses Claude — preferences, concerns, sentiment surface as chips on the message.'
              : 'Tip: add an Anthropic API key in Settings for richer AI insight extraction.'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({ message, onDelete }: { message: TaskMessage; onDelete: () => void }) {
  const ch = CHANNEL_META[message.channel]
  const author = AUTHOR_META[message.author]
  const ChannelIcon = ch.icon
  const fromClient = message.author === 'client'

  return (
    <div className={cn('group flex gap-2.5', fromClient ? '' : 'flex-row-reverse')}>
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', author.color)}>
        {(message.authorName ?? author.label).slice(0, 2).toUpperCase()}
      </div>

      <div className={cn('flex-1 min-w-0', fromClient ? '' : 'flex flex-col items-end')}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ring-1 font-semibold', ch.color)}>
            <ChannelIcon size={9} /> {ch.label}
          </span>
          <span className="text-[10px] text-stone-500 font-medium">{message.authorName ?? author.label}</span>
          <span className="text-[10px] text-stone-300">· {timeAgo(message.timestamp)}</span>
          <span className="text-[10px] text-stone-300 font-medium uppercase tracking-wide">· {message.phase}</span>

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
          fromClient
            ? 'bg-stone-50 text-stone-800 rounded-tl-sm'
            : message.author === 'planner'
              ? 'bg-brand-500 text-white rounded-tr-sm'
              : 'bg-amber-50 text-amber-900 rounded-tr-sm',
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
