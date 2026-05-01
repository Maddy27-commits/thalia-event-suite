import { useState, useEffect, useRef } from 'react'
import {
  Plus, CalendarDays, MapPin, Users, DollarSign, Trash2,
  Bell, ChevronDown, ChevronUp, Check, AlertCircle, Edit2,
  X, Circle, Sparkles, ListChecks, Store, Star, Phone, Mail,
  ArrowRight, ArrowLeft, Heart, Building2, Cake, GraduationCap,
  PartyPopper, Briefcase, Trophy, MicVocal, MessageSquare, Eye,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore, getDefaultCeremonies, offsetFor } from '../../store'
import { usePlannerEvents } from '../../hooks/usePlannerEvents'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { SendReminderModal } from '../../components/planner/SendReminderModal'
import { TaskDrawer } from '../../components/planner/TaskDrawer'
import { formatCurrency, formatDate, daysUntil, generateId, completionPercent, offsetDate } from '../../lib/utils'
import type { Event, EventType, EventStatus, EventMilestone, EventCeremony, EventSubCategory, SubCategoryTask } from '../../types'

const EVENT_TYPES: { value: EventType; label: string; icon: React.ElementType; description: string; gradient: string }[] = [
  { value: 'wedding',     label: 'Wedding',     icon: Heart,         description: 'Multi-day with ceremonies, sangeet, reception', gradient: 'from-rose-400 to-pink-600' },
  { value: 'birthday',    label: 'Birthday',    icon: Cake,          description: 'Themed party, cake, entertainment',              gradient: 'from-amber-400 to-orange-500' },
  { value: 'anniversary', label: 'Anniversary', icon: Heart,         description: 'Intimate celebration with close family',         gradient: 'from-rose-300 to-rose-500' },
  { value: 'corporate',   label: 'Corporate',   icon: Briefcase,     description: 'Off-sites, summits, product launches',            gradient: 'from-sky-400 to-blue-600' },
  { value: 'gala',        label: 'Gala',        icon: Trophy,        description: 'Black-tie fundraiser or awards night',            gradient: 'from-violet-400 to-purple-600' },
  { value: 'conference',  label: 'Conference',  icon: MicVocal,      description: 'Multi-day with sessions, keynotes, breakouts',    gradient: 'from-teal-400 to-emerald-600' },
  { value: 'graduation',  label: 'Graduation',  icon: GraduationCap, description: 'Convocation, family celebration',                 gradient: 'from-indigo-400 to-violet-500' },
  { value: 'other',       label: 'Other',       icon: PartyPopper,   description: 'Custom event format',                             gradient: 'from-stone-400 to-stone-600' },
]

const STATUS_OPTIONS: EventStatus[] = ['draft', 'planning', 'confirmed', 'completed', 'cancelled']
const statusBadge: Record<EventStatus, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'default', planning: 'info', confirmed: 'success', completed: 'success', cancelled: 'danger',
}
const statusGradient: Record<EventStatus, string> = {
  draft: 'from-stone-400 to-stone-500',
  planning: 'from-blue-400 to-brand-500',
  confirmed: 'from-emerald-400 to-teal-500',
  completed: 'from-stone-300 to-stone-400',
  cancelled: 'from-red-400 to-rose-500',
}

const TYPE_DEFAULTS: Record<EventType, { name: string; theme: string; guestCount: string; budget: string }> = {
  wedding:     { name: "Sarah & Mark's Wedding",    theme: 'Romantic Garden Luxe',     guestCount: '150', budget: '40000' },
  birthday:    { name: "Emma's 30th Birthday",       theme: 'Tropical Paradise',         guestCount: '60',  budget: '8000'  },
  anniversary: { name: "The Smiths' 25th Anniversary", theme: 'Silver & Gold Elegance', guestCount: '80',  budget: '12000' },
  corporate:   { name: 'Q4 Company Retreat',          theme: 'Modern Minimalist',         guestCount: '120', budget: '25000' },
  gala:        { name: 'Annual Charity Gala',          theme: 'Black Tie Glamour',         guestCount: '200', budget: '50000' },
  conference:  { name: 'Tech Innovation Summit',       theme: 'Innovation Forward',        guestCount: '300', budget: '35000' },
  graduation:  { name: "Alex's Graduation Celebration", theme: 'Future is Bright',         guestCount: '50',  budget: '5000'  },
  other:       { name: 'Special Celebration',           theme: 'Timeless & Personal',      guestCount: '80',  budget: '10000' },
}

interface EditForm {
  name: string; clientName: string; clientEmail: string; clientPhone: string
  type: EventType; date: string; venue: string; location: string
  guestCount: string; budget: string; theme: string
}

// ─── Visual milestone timeline ─────────────────────────────────────────────────
function MilestoneTimeline({ event }: { event: Event }) {
  const { toggleMilestone, addMilestone, updateMilestone, deleteMilestone } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDate, setEditDate] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDate, setNewDate] = useState('')

  const startEdit = (m: EventMilestone) => {
    setEditingId(m.id); setEditLabel(m.label); setEditDate(m.dueDate)
  }
  const saveEdit = () => {
    if (!editingId) return
    updateMilestone(event.id, editingId, { label: editLabel, dueDate: editDate })
    setEditingId(null)
  }
  const handleAdd = () => {
    if (!newLabel.trim()) return
    addMilestone(event.id, {
      id: generateId(), label: newLabel.trim(),
      dueDate: newDate || new Date().toISOString().slice(0, 10),
      completed: false, notes: '',
    })
    setNewLabel(''); setNewDate(''); setAddingNew(false)
  }

  const sorted = [...event.milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">
        Timeline — {event.milestones.filter(m => m.completed).length}/{event.milestones.length} complete
      </p>

      <div className="relative">
        {sorted.length > 0 && (
          <div className="absolute left-[13px] top-3.5 bottom-3.5 w-0.5 bg-stone-100" />
        )}

        <div className="space-y-1">
          {sorted.map((m) => {
            const days = daysUntil(m.dueDate)
            const overdue = !m.completed && days < 0
            const soon = !m.completed && days >= 0 && days <= 14
            const isEditing = editingId === m.id

            return (
              <div key={m.id} className="flex items-start gap-3 group">
                <div className={`relative z-10 mt-2 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  m.completed ? 'border-emerald-400 bg-emerald-50'
                  : overdue ? 'border-red-400 bg-red-50'
                  : soon ? 'border-amber-400 bg-amber-50'
                  : 'border-stone-200 bg-white'
                }`}>
                  {m.completed ? <Check size={12} className="text-emerald-600" />
                    : overdue ? <AlertCircle size={11} className="text-red-500" />
                    : <Circle size={11} className={soon ? 'text-amber-400' : 'text-stone-300'} />}
                </div>

                <div className={`flex-1 rounded-xl px-3 py-2.5 transition-colors ${
                  m.completed ? 'bg-stone-50/60' : 'bg-white ring-1 ring-stone-100'
                }`}>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        value={editLabel} onChange={e => setEditLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                      <input type="date" className="text-xs border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        value={editDate} onChange={e => setEditDate(e.target.value)} />
                      <button onClick={saveEdit} className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200">
                        <Check size={11} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-tight ${m.completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                          {m.label}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">{formatDate(m.dueDate)}</p>
                      </div>
                      {m.completed ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold shrink-0">Done</span>
                      ) : overdue ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold shrink-0">{Math.abs(days)}d overdue</span>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${soon ? 'bg-amber-50 text-amber-600' : 'bg-stone-50 text-stone-400'}`}>
                          {days === 0 ? 'Today' : `in ${days}d`}
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => toggleMilestone(event.id, m.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${m.completed ? 'bg-stone-100 hover:bg-stone-200 text-stone-400' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-500'}`}
                          title={m.completed ? 'Mark incomplete' : 'Mark complete'}>
                          <Check size={11} />
                        </button>
                        <button onClick={() => startEdit(m)} className="w-6 h-6 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-400 flex items-center justify-center" title="Edit">
                          <Edit2 size={10} />
                        </button>
                        <button onClick={() => deleteMilestone(event.id, m.id)} className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center" title="Delete">
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 ml-10">
          {addingNew ? (
            <div className="flex items-center gap-2 bg-brand-50 ring-1 ring-brand-200 rounded-xl px-3 py-2">
              <input placeholder="Milestone name…" className="flex-1 text-sm bg-transparent focus:outline-none text-stone-800 placeholder-stone-400"
                value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} autoFocus />
              <input type="date" className="text-xs border border-brand-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                value={newDate} onChange={e => setNewDate(e.target.value)} />
              <button onClick={handleAdd} className="flex items-center gap-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={12} /> Add
              </button>
              <button onClick={() => { setAddingNew(false); setNewLabel(''); setNewDate('') }} className="w-6 h-6 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-200">
                <X size={11} />
              </button>
            </div>
          ) : (
            <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-brand-600 font-medium transition-colors py-1">
              <Plus size={13} /> Add milestone
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Inline edit details form ──────────────────────────────────────────────────
function EditDetailsForm({ event, onClose }: { event: Event; onClose: () => void }) {
  const { updateEvent } = useStore()
  const [form, setForm] = useState<EditForm>({
    name: event.name, clientName: event.clientName, clientEmail: event.clientEmail,
    clientPhone: event.clientPhone, type: event.type, date: event.date,
    venue: event.venue, location: event.location,
    guestCount: String(event.guestCount), budget: String(event.budget), theme: event.theme,
  })
  const set = (k: keyof EditForm, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    updateEvent(event.id, {
      name: form.name, clientName: form.clientName, clientEmail: form.clientEmail,
      clientPhone: form.clientPhone, type: form.type as EventType, date: form.date,
      venue: form.venue, location: form.location,
      guestCount: parseInt(form.guestCount) || event.guestCount,
      budget: parseInt(form.budget) || event.budget, theme: form.theme,
    })
    onClose()
  }

  return (
    <div className="px-5 py-4 border-t border-stone-100 space-y-3 bg-stone-50/50">
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Edit Event Details</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Event Name" value={form.name} onChange={e => set('name', e.target.value)} className="col-span-2" />
        <Input label="Client Name" value={form.clientName} onChange={e => set('clientName', e.target.value)} />
        <Input label="Client Email" type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} />
        <Input label="Client WhatsApp" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} />
        <Select label="Event Type" value={form.type} onChange={e => set('type', e.target.value)}
          options={EVENT_TYPES.map(t => ({ value: t.value, label: t.label }))} />
        <Input label="Event Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <Input label="Venue" value={form.venue} onChange={e => set('venue', e.target.value)} className="col-span-2" />
        <Input label="Location / City" value={form.location} onChange={e => set('location', e.target.value)} />
        <Input label="Theme" value={form.theme} onChange={e => set('theme', e.target.value)} />
        <Input label="Guest Count" type="number" value={form.guestCount} onChange={e => set('guestCount', e.target.value)} />
        <Input label="Budget ($)" type="number" value={form.budget} onChange={e => set('budget', e.target.value)} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={save} icon={<Check size={14} />}>Save Changes</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── Hierarchical Ceremony Checklist ──────────────────────────────────────────
function CeremonyChecklist({ event }: { event: Event }) {
  const {
    addSubCategoryTask, toggleSubCategoryTask, updateSubCategoryTask, deleteSubCategoryTask,
    deleteSubCategory, addSubCategory, updateCeremony, deleteCeremony,
  } = useStore()
  const ceremonies = event.ceremonies ?? []
  const [selectedCeremonyId, setSelectedCeremonyId] = useState(ceremonies[0]?.id ?? '')
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null)
  const [addingTaskInSub, setAddingTaskInSub] = useState<string | null>(null)
  const [newTaskLabel, setNewTaskLabel] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskLabel, setEditTaskLabel] = useState('')
  const [editingTaskDateId, setEditingTaskDateId] = useState<string | null>(null)
  const [editTaskDate, setEditTaskDate] = useState('')
  const [editingCeremonyId, setEditingCeremonyId] = useState<string | null>(null)
  const [editCeremonyDate, setEditCeremonyDate] = useState('')
  const [showAddSub, setShowAddSub] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [newSubEmoji, setNewSubEmoji] = useState('📌')
  // Open task in deep-dive drawer
  const [openTaskRef, setOpenTaskRef] = useState<{ ceremonyId: string; subId: string; taskId: string } | null>(null)

  const selected = ceremonies.find(c => c.id === selectedCeremonyId) ?? ceremonies[0]

  useEffect(() => {
    if (ceremonies.length && !ceremonies.find(c => c.id === selectedCeremonyId)) {
      setSelectedCeremonyId(ceremonies[0].id)
    }
  }, [ceremonies, selectedCeremonyId])

  if (!ceremonies.length) {
    return <div className="px-5 py-6 text-center text-stone-400 text-sm">No ceremonies yet</div>
  }

  // Overall progress across ALL ceremonies and ALL sub-categories
  const allTasks = ceremonies.flatMap(c => c.subCategories.flatMap(s => s.tasks))
  const allDone  = allTasks.filter(t => t.completed).length
  const overallPct = allTasks.length ? Math.round((allDone / allTasks.length) * 100) : 0

  const handleAddTask = (sub: EventSubCategory) => {
    if (!newTaskLabel.trim() || !selected) return
    const off = sub.defaultOffsetDays
    const task: SubCategoryTask = {
      id: generateId(),
      label: newTaskLabel.trim(),
      completed: false,
      notes: '',
      offsetDays: off,
      dueDate: offsetDate(selected.date, -off),
      currentPhase: 'briefing',
      messages: [],
      options: [],
    }
    addSubCategoryTask(event.id, selected.id, sub.id, task)
    setNewTaskLabel('')
    setAddingTaskInSub(null)
  }

  const handleAddSub = () => {
    if (!newSubName.trim() || !selected) return
    const off = offsetFor(newSubName.trim())
    addSubCategory(event.id, selected.id, {
      id: generateId(),
      name: newSubName.trim(),
      emoji: newSubEmoji,
      defaultOffsetDays: off,
      tasks: [],
    })
    setNewSubName('')
    setNewSubEmoji('📌')
    setShowAddSub(false)
  }

  return (
    <div className="px-5 py-4">
      {/* Overall progress bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all"
            style={{ width: `${overallPct}%` }} />
        </div>
        <span className="text-[10px] text-stone-400 font-medium shrink-0">
          {allDone}/{allTasks.length} tasks · {overallPct}%
        </span>
      </div>

      {/* Ceremony selector — vertical pills with date on each */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {ceremonies
          .sort((a, b) => a.offsetDaysFromEvent - b.offsetDaysFromEvent)
          .map(cer => {
            const tasksTotal = cer.subCategories.reduce((s, sub) => s + sub.tasks.length, 0)
            const tasksDone  = cer.subCategories.reduce((s, sub) => s + sub.tasks.filter(t => t.completed).length, 0)
            const active = cer.id === selectedCeremonyId
            return (
              <button
                key={cer.id}
                onClick={() => setSelectedCeremonyId(cer.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/10'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 ring-1 ring-stone-200'
                }`}
              >
                <span className="text-base leading-none">{cer.emoji}</span>
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">{cer.name}</span>
                  <span className={`text-[9px] mt-0.5 font-normal ${active ? 'text-white/60' : 'text-stone-400'}`}>
                    {formatDate(cer.date)} · {tasksDone}/{tasksTotal}
                  </span>
                </div>
              </button>
            )
          })}
      </div>

      {/* Selected ceremony detail */}
      {selected && (
        <div className="mt-4 space-y-2">
          {/* Ceremony header — date + actions */}
          <div className="flex items-center justify-between bg-stone-50 rounded-2xl px-4 py-2.5 ring-1 ring-stone-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl">{selected.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-800 leading-tight">{selected.name}</p>
                {editingCeremonyId === selected.id ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input type="date" value={editCeremonyDate}
                      onChange={e => setEditCeremonyDate(e.target.value)}
                      className="text-[11px] border border-stone-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white" />
                    <button
                      onClick={() => {
                        const newOffset = Math.round(
                          (new Date(editCeremonyDate).getTime() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24)
                        )
                        updateCeremony(event.id, selected.id, { date: editCeremonyDate, offsetDaysFromEvent: newOffset })
                        setEditingCeremonyId(null)
                      }}
                      className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"
                    ><Check size={9} /></button>
                    <button onClick={() => setEditingCeremonyId(null)} className="w-5 h-5 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
                      <X size={9} />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {formatDate(selected.date)}
                    {selected.offsetDaysFromEvent !== 0 && (
                      <span className="ml-1.5 text-stone-300">
                        ({selected.offsetDaysFromEvent > 0 ? '+' : ''}{selected.offsetDaysFromEvent}d from event)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {editingCeremonyId !== selected.id && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditingCeremonyId(selected.id); setEditCeremonyDate(selected.date) }}
                  className="text-[10px] text-stone-400 hover:text-brand-600 font-medium px-2 py-1 rounded-md hover:bg-white"
                >
                  <Edit2 size={11} />
                </button>
                {ceremonies.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${selected.name}" ceremony?`)) deleteCeremony(event.id, selected.id)
                    }}
                    className="text-[10px] text-stone-400 hover:text-red-500 font-medium px-2 py-1 rounded-md hover:bg-white"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sub-categories — accordion */}
          {selected.subCategories.map(sub => {
            const expanded = expandedSubId === sub.id
            const total = sub.tasks.length
            const done  = sub.tasks.filter(t => t.completed).length
            const pct   = total ? Math.round((done / total) * 100) : 0

            return (
              <div key={sub.id} className="rounded-2xl bg-white ring-1 ring-stone-100 overflow-hidden transition-all">
                {/* Sub header */}
                <button
                  onClick={() => setExpandedSubId(expanded ? null : sub.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50/50 transition-colors group"
                >
                  <span className="text-lg shrink-0">{sub.emoji}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-800 truncate">{sub.name}</p>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {done}/{total}
                      </span>
                    </div>
                  </div>
                  {/* Mini progress */}
                  <div className="w-12 h-1 bg-stone-100 rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-400 to-brand-600'}`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <ChevronDown size={14} className={`text-stone-300 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
                  {/* delete — only on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Remove "${sub.name}" from ${selected.name}?`)) {
                        deleteSubCategory(event.id, selected.id, sub.id)
                      }
                    }}
                    className="w-5 h-5 rounded-full bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove sub-category"
                  >
                    <X size={9} />
                  </button>
                </button>

                {/* Tasks */}
                {expanded && (
                  <div className="px-4 pb-3 border-t border-stone-100 pt-2 space-y-0.5">
                    {sub.tasks.length === 0 && (
                      <p className="text-xs text-stone-400 py-2 pl-1">No tasks yet — add one below</p>
                    )}
                    {sub.tasks.map(task => {
                      const days = task.dueDate ? daysUntil(task.dueDate) : null
                      const overdue = !task.completed && days !== null && days < 0
                      const soon    = !task.completed && days !== null && days >= 0 && days <= 14
                      const msgCount = task.messages?.length ?? 0
                      const optCount = task.options?.length ?? 0
                      const isEditingDate = editingTaskDateId === task.id

                      return (
                        <div key={task.id} className="flex items-center gap-2.5 group/task py-1.5 px-2 rounded-xl hover:bg-stone-50 transition-colors">
                          <button
                            onClick={() => toggleSubCategoryTask(event.id, selected.id, sub.id, task.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                              task.completed ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300 hover:border-brand-400'
                            }`}
                          >
                            {task.completed && <Check size={9} className="text-white" />}
                          </button>

                          {editingTaskId === task.id ? (
                            <input
                              className="flex-1 text-sm border border-brand-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                              value={editTaskLabel}
                              onChange={e => setEditTaskLabel(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  updateSubCategoryTask(event.id, selected.id, sub.id, task.id, { label: editTaskLabel })
                                  setEditingTaskId(null)
                                }
                                if (e.key === 'Escape') setEditingTaskId(null)
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setOpenTaskRef({ ceremonyId: selected.id, subId: sub.id, taskId: task.id })}
                              className={`flex-1 text-left text-sm leading-snug truncate hover:text-brand-700 transition-colors ${task.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}
                              title="Open task — recommendations, conversation, AI insights"
                            >
                              {task.label}
                            </button>
                          )}

                          {/* Indicators: messages + options */}
                          {(msgCount > 0 || optCount > 0) && (
                            <div className="flex items-center gap-1 shrink-0">
                              {optCount > 0 && (
                                <span className="text-[9px] inline-flex items-center gap-0.5 bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-md font-bold ring-1 ring-violet-100" title={`${optCount} option(s)`}>
                                  <Star size={8} /> {optCount}
                                </span>
                              )}
                              {msgCount > 0 && (
                                <span className="text-[9px] inline-flex items-center gap-0.5 bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md font-bold" title={`${msgCount} message(s)`}>
                                  <MessageSquare size={8} /> {msgCount}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Due date — click to edit inline */}
                          {isEditingDate ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="date"
                                value={editTaskDate}
                                onChange={e => setEditTaskDate(e.target.value)}
                                className="text-[10px] border border-brand-200 rounded-md px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (editTaskDate) {
                                    updateSubCategoryTask(event.id, selected.id, sub.id, task.id, { dueDate: editTaskDate })
                                  }
                                  setEditingTaskDateId(null)
                                }}
                                className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center"
                              ><Check size={8} /></button>
                              <button onClick={() => setEditingTaskDateId(null)} className="w-4 h-4 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
                                <X size={8} />
                              </button>
                            </div>
                          ) : (
                            task.dueDate && (
                              <button
                                onClick={() => { setEditingTaskDateId(task.id); setEditTaskDate(task.dueDate) }}
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 whitespace-nowrap transition-colors ${
                                  task.completed ? 'bg-stone-50 text-stone-300' :
                                  overdue ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                                  soon    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' :
                                  'bg-stone-50 text-stone-500 hover:bg-stone-100'
                                }`}
                                title="Click to edit due date"
                              >
                                {formatDate(task.dueDate)}
                                {!task.completed && days !== null && (
                                  <span className="ml-1 opacity-70">
                                    {overdue ? `· ${Math.abs(days)}d late` : days === 0 ? '· today' : `· ${days}d`}
                                  </span>
                                )}
                              </button>
                            )
                          )}

                          <div className="flex gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => { setEditingTaskId(task.id); setEditTaskLabel(task.label) }}
                              className="w-5 h-5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 flex items-center justify-center"
                              title="Rename"
                            ><Edit2 size={8} /></button>
                            <button
                              onClick={() => deleteSubCategoryTask(event.id, selected.id, sub.id, task.id)}
                              className="w-5 h-5 rounded-full bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center"
                              title="Delete"
                            ><X size={8} /></button>
                          </div>
                        </div>
                      )
                    })}

                    {/* Add task */}
                    {addingTaskInSub === sub.id ? (
                      <div className="flex items-center gap-2 bg-brand-50 ring-1 ring-brand-200 rounded-xl px-3 py-2 mt-1">
                        <input placeholder="Add a task…"
                          className="flex-1 text-sm bg-transparent focus:outline-none text-stone-800 placeholder-stone-400"
                          value={newTaskLabel}
                          onChange={e => setNewTaskLabel(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddTask(sub)
                            if (e.key === 'Escape') { setAddingTaskInSub(null); setNewTaskLabel('') }
                          }}
                          autoFocus />
                        <button onClick={() => handleAddTask(sub)} className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1 rounded-lg transition-colors">
                          Add
                        </button>
                        <button onClick={() => { setAddingTaskInSub(null); setNewTaskLabel('') }} className="w-5 h-5 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center">
                          <X size={9} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingTaskInSub(sub.id)}
                        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-brand-600 font-medium transition-colors py-1 pl-1 mt-1"
                      >
                        <Plus size={12} /> Add task
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Add new sub-category */}
          {showAddSub ? (
            <div className="flex items-center gap-2 bg-brand-50 ring-1 ring-brand-200 rounded-xl px-3 py-2">
              <input
                value={newSubEmoji}
                onChange={e => setNewSubEmoji(e.target.value)}
                className="w-10 text-center text-sm bg-white border border-brand-200 rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                maxLength={2}
              />
              <input
                placeholder="Sub-category name (e.g. Stationery)"
                className="flex-1 text-sm bg-transparent focus:outline-none text-stone-800 placeholder-stone-400"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSub()
                  if (e.key === 'Escape') { setShowAddSub(false); setNewSubName('') }
                }}
                autoFocus
              />
              <button onClick={handleAddSub} className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1 rounded-lg transition-colors">
                Add
              </button>
              <button onClick={() => { setShowAddSub(false); setNewSubName('') }} className="w-5 h-5 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center">
                <X size={9} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSub(true)}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-brand-600 font-medium transition-colors py-1.5 pl-1"
            >
              <Plus size={12} /> Add sub-category to {selected.name}
            </button>
          )}
        </div>
      )}

      {/* Task drill-down drawer */}
      {openTaskRef && (() => {
        const cer = ceremonies.find(c => c.id === openTaskRef.ceremonyId)
        const drwSub = cer?.subCategories.find(s => s.id === openTaskRef.subId)
        const drwTask = drwSub?.tasks.find(t => t.id === openTaskRef.taskId)
        if (!cer || !drwSub || !drwTask) return null
        return (
          <TaskDrawer
            event={event}
            ceremony={cer}
            sub={drwSub}
            task={drwTask}
            onClose={() => setOpenTaskRef(null)}
          />
        )
      })()}
    </div>
  )
}

// ─── Vendor Assignment ────────────────────────────────────────────────────────
function VendorAssignment({ event }: { event: Event }) {
  const { vendors, updateEvent } = useStore()
  const [picking, setPicking] = useState(false)

  const assigned = vendors.filter(v => event.vendorIds.includes(v.id))
  const available = vendors.filter(v => !event.vendorIds.includes(v.id))

  const toggle = (vendorId: string) => {
    const next = event.vendorIds.includes(vendorId)
      ? event.vendorIds.filter(id => id !== vendorId)
      : [...event.vendorIds, vendorId]
    updateEvent(event.id, { vendorIds: next })
  }

  const totalEstimate = assigned.reduce((sum, v) => {
    const nums = v.priceRange.match(/\d[\d,]*/g)?.map(n => parseInt(n.replace(/,/g, ''))) ?? []
    return sum + (nums.length ? Math.max(...nums) : 0)
  }, 0)

  return (
    <div className="px-5 py-4 border-t border-stone-100">
      <div className="flex items-center gap-2 mb-3">
        <Store size={13} className="text-brand-500" />
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          Vendors — {assigned.length} assigned
        </p>
        {totalEstimate > 0 && (
          <span className="ml-auto text-[10px] text-stone-400">
            Est. ceiling <span className="font-semibold text-stone-700">{formatCurrency(totalEstimate)}</span>
          </span>
        )}
      </div>

      {assigned.length === 0 && !picking && (
        <p className="text-xs text-stone-400 mb-2 pl-1">No vendors linked yet</p>
      )}

      {assigned.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {assigned.map(v => (
            <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-stone-50 ring-1 ring-stone-100 group">
              <div className="w-7 h-7 rounded-lg bg-white ring-1 ring-stone-200 flex items-center justify-center shrink-0">
                <Store size={13} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-stone-800 truncate">{v.name}</p>
                  <span className="text-[10px] capitalize px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-600 font-medium shrink-0">
                    {v.category}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={9} className={i < v.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-stone-400">
                  <span>{v.priceRange}</span>
                  {v.email && <span className="flex items-center gap-1"><Mail size={9} />{v.email}</span>}
                  {v.phone && <span className="flex items-center gap-1"><Phone size={9} />{v.phone}</span>}
                </div>
              </div>
              <button onClick={() => toggle(v.id)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-all shrink-0"
                title="Remove from event"
              ><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {picking ? (
        <div className="bg-white rounded-xl ring-1 ring-stone-200 p-2 max-h-56 overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-xs text-stone-400 px-2 py-3 text-center">All vendors already assigned</p>
          ) : (
            <div className="space-y-0.5">
              {available.map(v => (
                <button key={v.id} onClick={() => toggle(v.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 text-left transition-colors"
                >
                  <Plus size={11} className="text-brand-500 shrink-0" />
                  <span className="text-sm text-stone-700 flex-1 truncate">{v.name}</span>
                  <span className="text-[10px] capitalize text-stone-400">{v.category}</span>
                  <span className="text-[10px] text-stone-400">{v.priceRange}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={() => setPicking(false)} className="text-xs text-stone-400 hover:text-stone-700 font-medium px-2 py-1">
              Done
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setPicking(true)}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-brand-600 font-medium transition-colors py-1 pl-1"
        >
          <Plus size={12} /> Assign vendor
        </button>
      )}
    </div>
  )
}

// ─── Single event card ─────────────────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const { updateEvent, deleteEvent, setActiveEvent, activeEventId, enterPreviewMode } = useStore()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(activeEventId === event.id)
  const [activeTab, setActiveTab] = useState<'checklist' | 'timeline'>('checklist')
  const [editingDetails, setEditingDetails] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeEventId === event.id) {
      setExpanded(true)
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [activeEventId, event.id])

  const days = daysUntil(event.date)
  const progress = completionPercent(event.milestones)
  const ceremonies = event.ceremonies ?? []
  const allTasks = ceremonies.flatMap(c => c.subCategories.flatMap(s => s.tasks))
  const tasksDone = allTasks.filter(t => t.completed).length
  const shared = event.concepts.filter(c => c.sharedWithClient !== false)
  const pendingApproval = shared.filter(c => c.status === 'pending').length

  const categoryLabel = EVENT_TYPES.find(t => t.value === event.type)?.label ?? event.type

  return (
    <>
      <div ref={cardRef} className={`bg-white rounded-2xl ring-1 ring-black/[0.07] shadow-sm overflow-hidden transition-all ${expanded ? 'shadow-md' : ''}`}>

        <div
          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
          onClick={() => { setExpanded(v => !v); setActiveEvent(event.id) }}
        >
          <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${statusGradient[event.status]} shrink-0`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-stone-900">{event.name}</p>
              <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-semibold capitalize">
                {categoryLabel}
              </span>
              <Badge variant={statusBadge[event.status]}>{event.status}</Badge>
              {ceremonies.length > 1 && (
                <span className="text-[10px] bg-violet-50 text-violet-600 ring-1 ring-violet-200 px-2 py-0.5 rounded-full font-semibold">
                  {ceremonies.length} ceremonies
                </span>
              )}
              {pendingApproval > 0 && (
                <span className="text-[10px] bg-amber-50 text-amber-600 ring-1 ring-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  {pendingApproval} pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-stone-400 flex-wrap">
              <span className="flex items-center gap-1"><CalendarDays size={11} />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1"><MapPin size={11} />{event.venue || event.location}</span>
              <span className="flex items-center gap-1"><Users size={11} />{event.guestCount} guests</span>
              <span className="flex items-center gap-1"><DollarSign size={11} />{formatCurrency(event.budget)}</span>
              {allTasks.length > 0 && (
                <span className="flex items-center gap-1 text-brand-500 font-medium">
                  <ListChecks size={11} />{tasksDone}/{allTasks.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xl font-black text-stone-900 leading-none">{Math.abs(days)}</p>
              <p className="text-[10px] text-stone-400">{days < 0 ? 'days ago' : 'days left'}</p>
            </div>
            {expanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
          </div>
        </div>

        <div className="px-5 pb-3 -mt-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all"
                style={{ width: `${Math.max(2, progress)}%` }} />
            </div>
            <span className="text-[10px] text-stone-400 font-medium">{Math.round(progress)}% milestones</span>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-stone-100">
            <div className="flex items-center gap-1 px-5 pt-3 pb-0">
              {(['checklist', 'timeline'] as const).map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    activeTab === tab ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {tab === 'checklist' ? '✅ Ceremonies & Checklist' : '📅 Timeline'}
                </button>
              ))}
            </div>

            {activeTab === 'checklist'
              ? <CeremonyChecklist event={event} />
              : <MilestoneTimeline event={event} />
            }

            <VendorAssignment event={event} />

            {event.concepts.length > 0 && (
              <div className="px-5 pb-4 border-t border-stone-100">
                <div className="flex items-center gap-3 mt-4">
                  <Sparkles size={13} className="text-brand-500 shrink-0" />
                  <p className="text-xs text-stone-500">
                    <span className="font-semibold text-stone-800">{shared.length}</span> of{' '}
                    <span className="font-semibold text-stone-800">{event.concepts.length}</span> concepts shared with client
                    {pendingApproval > 0 && (
                      <span className="ml-1 text-amber-600 font-semibold">· {pendingApproval} awaiting approval</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {editingDetails && (
              <EditDetailsForm event={event} onClose={() => setEditingDetails(false)} />
            )}

            <div className="px-5 py-3 bg-stone-50/50 border-t border-stone-100 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => updateEvent(event.id, { status: s })}
                    className={`text-[11px] px-2.5 py-1 rounded-full border font-medium capitalize transition-all ${
                      event.status === s
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-stone-200 text-stone-500 hover:border-brand-300'
                    }`}
                  >{s}</button>
                ))}
              </div>

              <div className="flex-1" />

              <button onClick={() => setEditingDetails(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-600 bg-white hover:bg-brand-50 border border-stone-200 hover:border-brand-300 px-3 py-1.5 rounded-full transition-all"
              >
                <Edit2 size={11} />
                {editingDetails ? 'Close' : 'Edit details'}
              </button>

              <button onClick={() => setReminderOpen(true)}
                className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  pendingApproval > 0
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                    : 'text-stone-400 bg-white hover:bg-stone-50 border-stone-200'
                }`}
              >
                <Bell size={11} />
                {pendingApproval > 0 ? `Remind client (${pendingApproval})` : 'Remind client'}
              </button>

              <button
                onClick={() => {
                  enterPreviewMode(event.id, event.clientName, event.clientEmail)
                  navigate('/client')
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-plum-200 text-plum-600 bg-plum-50 hover:bg-plum-100 transition-all"
                title="Preview client view"
              >
                <Eye size={11} />
                Client view
              </button>

              <button onClick={() => setDeleteConfirm(true)}
                className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-colors"
                title="Delete event"
              ><Trash2 size={12} /></button>
            </div>
          </div>
        )}
      </div>

      {reminderOpen && (
        <SendReminderModal open={reminderOpen} onClose={() => setReminderOpen(false)} event={event} />
      )}

      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete Event" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-600">
            Are you sure you want to delete <strong>{event.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => { deleteEvent(event.id); setDeleteConfirm(false) }}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─── Multi-step Create Event Wizard ────────────────────────────────────────────
interface NewEventForm {
  type: EventType | null
  name: string; clientName: string; clientEmail: string; clientPhone: string
  date: string; venue: string; location: string
  guestCount: string; budget: string; theme: string
}

const emptyNewForm: NewEventForm = {
  type: null,
  name: '', clientName: '', clientEmail: '', clientPhone: '',
  date: '', venue: '', location: '',
  guestCount: '100', budget: '20000', theme: '',
}

function CreateEventWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addEvent } = useStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<NewEventForm>(emptyNewForm)
  const [ceremonies, setCeremonies] = useState<EventCeremony[]>([])

  const setF = (k: keyof NewEventForm, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Auto-fill sensible defaults when entering the details step
  useEffect(() => {
    if (step === 1 && form.type) {
      const d = TYPE_DEFAULTS[form.type]
      setForm(f => ({
        ...f,
        name:       f.name       || d.name,
        theme:      f.theme      || d.theme,
        guestCount: f.guestCount === '100'   ? d.guestCount : f.guestCount,
        budget:     f.budget     === '20000' ? d.budget     : f.budget,
      }))
    }
  }, [step, form.type])

  // When transitioning to step 2, generate default ceremonies based on type + date
  useEffect(() => {
    if (step === 2 && form.type && form.date) {
      setCeremonies(getDefaultCeremonies(form.type, form.date))
    }
  }, [step, form.type, form.date])

  const reset = () => {
    setForm(emptyNewForm)
    setCeremonies([])
    setStep(0)
  }

  const handleClose = () => { reset(); onClose() }

  const canAdvance = (): boolean => {
    if (step === 0) return !!form.type
    if (step === 1) return !!form.name.trim() && !!form.date
    if (step === 2) return ceremonies.length > 0
    return true
  }

  const handleCreate = () => {
    if (!form.type) return
    const e: Event = {
      id: generateId(),
      name: form.name,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone,
      type: form.type,
      status: 'planning',
      date: form.date,
      venue: form.venue,
      location: form.location,
      guestCount: parseInt(form.guestCount) || 100,
      budget: parseInt(form.budget) || 0,
      theme: form.theme,
      preferences: { style: [], colorPalette: [], dietary: [], musicGenre: [], dislikes: [], notes: '' },
      milestones: [
        { id: generateId(), label: 'Initial consultation', dueDate: offsetDate(form.date, -180), completed: false, notes: '' },
        { id: generateId(), label: 'Venue confirmed',      dueDate: offsetDate(form.date, -150), completed: false, notes: '' },
        { id: generateId(), label: 'Vendors booked',       dueDate: offsetDate(form.date, -90),  completed: false, notes: '' },
        { id: generateId(), label: 'Final headcount',      dueDate: offsetDate(form.date, -30),  completed: false, notes: '' },
        { id: generateId(), label: 'Event day',            dueDate: form.date,                   completed: false, notes: '' },
      ],
      ceremonies,
      vendorIds: [],
      concepts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addEvent(e)
    handleClose()
  }

  const totalTasks = ceremonies.reduce((sum, c) => sum + c.subCategories.reduce((s, sub) => s + sub.tasks.length, 0), 0)
  const totalSubs  = ceremonies.reduce((sum, c) => sum + c.subCategories.length, 0)

  return (
    <Modal open={open} onClose={handleClose} title="Create New Event" size="xl">
      <div className="px-6 pt-5 pb-2">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-1">
          {[
            { i: 0, label: 'Category' },
            { i: 1, label: 'Details' },
            { i: 2, label: 'Ceremonies & timing' },
            { i: 3, label: 'Review' },
          ].map((s, idx, arr) => {
            const reached = step >= s.i
            const active  = step === s.i
            return (
              <div key={s.i} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${active ? 'bg-stone-900 text-white' : reached ? 'text-emerald-600' : 'text-stone-300'}`}>
                  <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    active ? 'bg-white text-stone-900'
                    : reached ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-400'
                  }`}>
                    {reached && step > s.i ? <Check size={10} /> : s.i + 1}
                  </div>
                  <span className="text-xs font-semibold">{s.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 ${reached && step > s.i ? 'bg-emerald-200' : 'bg-stone-100'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-6 pt-3">
        {/* ─── Step 0: Pick category ─── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">What kind of event?</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                The category sets up ceremonies, sub-elements, and recommended timing automatically.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {EVENT_TYPES.map(t => {
                const active = form.type === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`group relative overflow-hidden rounded-2xl ring-1 transition-all p-4 text-left ${
                      active
                        ? 'ring-2 ring-brand-500 bg-brand-50 shadow-md'
                        : 'ring-stone-200 bg-white hover:ring-brand-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Gradient blob */}
                    <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full bg-gradient-to-br ${t.gradient} opacity-${active ? '30' : '10'} blur-xl pointer-events-none transition-opacity group-hover:opacity-25`} />
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center shadow-sm mb-2.5`}>
                        <t.icon size={18} className="text-white" />
                      </div>
                      <p className={`font-bold text-sm ${active ? 'text-brand-700' : 'text-stone-800'}`}>{t.label}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{t.description}</p>
                    </div>
                    {active && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow-sm">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Step 1: Details ─── */}
        {step === 1 && form.type && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-brand-50 ring-1 ring-brand-100 rounded-2xl px-4 py-3">
              {(() => {
                const t = EVENT_TYPES.find(x => x.value === form.type)
                if (!t) return null
                return (
                  <>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center shrink-0`}>
                      <t.icon size={15} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-700">{t.label}</p>
                      <p className="text-[10px] text-brand-600/70">{t.description}</p>
                    </div>
                  </>
                )
              })()}
              <button onClick={() => setStep(0)} className="ml-auto text-[10px] text-brand-600 hover:text-brand-800 font-semibold underline">
                Change
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Event Name *" value={form.name} onChange={e => setF('name', e.target.value)} className="col-span-2" placeholder="e.g. Aisha & Rohan Wedding" />
              <Input label="Event Date *" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
              <Input label="Theme" value={form.theme} onChange={e => setF('theme', e.target.value)} placeholder="Romantic Garden Luxe" />
              <Input label="Client Name" value={form.clientName} onChange={e => setF('clientName', e.target.value)} placeholder="e.g. Aisha Patel" />
              <Input label="Client Email" type="email" value={form.clientEmail} onChange={e => setF('clientEmail', e.target.value)} placeholder="client@example.com" />
              <div className="col-span-2 flex items-start gap-2 bg-sky-50 ring-1 ring-sky-200/50 rounded-xl px-3.5 py-2.5 -mt-1">
                <span className="text-sky-500 text-[10px] shrink-0 mt-0.5">🔑</span>
                <p className="text-[11px] text-sky-700 leading-relaxed">
                  Your client uses this email address to sign in to their event portal. Double-check it's correct.
                </p>
              </div>
              <Input label="Client Phone" value={form.clientPhone} onChange={e => setF('clientPhone', e.target.value)} placeholder="+1 415 555 0101" className="col-span-2" />
              <Input label="Venue" value={form.venue} onChange={e => setF('venue', e.target.value)} placeholder="The Rosewood Estate" className="col-span-2" />
              <Input label="Location / City" value={form.location} onChange={e => setF('location', e.target.value)} placeholder="Napa Valley, CA" />
              <Input label="Guest Count" type="number" value={form.guestCount} onChange={e => setF('guestCount', e.target.value)} />
              <Input label="Budget ($)" type="number" value={form.budget} onChange={e => setF('budget', e.target.value)} className="col-span-2" />
            </div>
          </div>
        )}

        {/* ─── Step 2: Ceremonies & timing ─── */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Ceremonies & their tentative dates</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                We've auto-suggested ceremonies based on the category. Adjust dates here — tasks inside will recompute their due dates automatically.
              </p>
            </div>

            <div className="space-y-2">
              {ceremonies
                .sort((a, b) => a.offsetDaysFromEvent - b.offsetDaysFromEvent)
                .map(cer => {
                  const offsetLabel = cer.offsetDaysFromEvent === 0 ? 'Event day'
                    : cer.offsetDaysFromEvent < 0 ? `${Math.abs(cer.offsetDaysFromEvent)}d before`
                    : `${cer.offsetDaysFromEvent}d after`
                  return (
                    <div key={cer.id} className="flex items-center gap-3 bg-white ring-1 ring-stone-200 rounded-2xl px-4 py-3">
                      <span className="text-2xl shrink-0">{cer.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800">{cer.name}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {cer.subCategories.length} sub-elements · {cer.subCategories.reduce((s, sub) => s + sub.tasks.length, 0)} tasks · {offsetLabel}
                        </p>
                      </div>
                      <input
                        type="date"
                        value={cer.date}
                        onChange={e => {
                          const newDate = e.target.value
                          const newOffset = Math.round(
                            (new Date(newDate).getTime() - new Date(form.date).getTime()) / (1000 * 60 * 60 * 24)
                          )
                          // Recompute due dates for tasks inside this ceremony
                          setCeremonies(prev =>
                            prev.map(c =>
                              c.id === cer.id
                                ? {
                                    ...c,
                                    date: newDate,
                                    offsetDaysFromEvent: newOffset,
                                    subCategories: c.subCategories.map(sub => ({
                                      ...sub,
                                      tasks: sub.tasks.map(t => ({
                                        ...t,
                                        dueDate: offsetDate(newDate, -t.offsetDays),
                                      })),
                                    })),
                                  }
                                : c
                            )
                          )
                        }}
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                      <button
                        onClick={() => setCeremonies(prev => prev.filter(c => c.id !== cer.id))}
                        className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center shrink-0"
                        title="Remove ceremony"
                      ><X size={12} /></button>
                    </div>
                  )
                })}

              {/* Add ceremony */}
              <button
                onClick={() => {
                  const newCer: EventCeremony = {
                    id: generateId(),
                    name: 'New ceremony',
                    emoji: '🎉',
                    date: form.date,
                    offsetDaysFromEvent: 0,
                    notes: '',
                    subCategories: [],
                  }
                  setCeremonies(prev => [...prev, newCer])
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-400 hover:text-brand-600 font-medium border-2 border-dashed border-stone-200 hover:border-brand-300 rounded-2xl py-3 transition-colors"
              >
                <Plus size={13} /> Add another ceremony
              </button>
            </div>

            {/* Sub-element preview — collapsible per ceremony */}
            <div className="mt-4">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                Sub-elements inside each ceremony
              </p>
              <div className="space-y-2">
                {ceremonies.map(cer => (
                  <div key={cer.id} className="bg-stone-50 rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{cer.emoji}</span>
                      <p className="text-xs font-bold text-stone-700">{cer.name}</p>
                      <span className="text-[10px] text-stone-400">{formatDate(cer.date)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cer.subCategories.map(sub => (
                        <span key={sub.id} className="text-[11px] bg-white ring-1 ring-stone-200 px-2 py-1 rounded-lg text-stone-600 flex items-center gap-1">
                          <span>{sub.emoji}</span>
                          <span className="font-medium">{sub.name}</span>
                          <span className="text-stone-300">·</span>
                          <span className="text-stone-400">{sub.defaultOffsetDays}d before</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Review ─── */}
        {step === 3 && form.type && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Almost done — review and create</h3>
              <p className="text-xs text-stone-400 mt-0.5">You can change anything later from the event card.</p>
            </div>

            <div className="bg-gradient-to-br from-brand-50 to-rose-50 ring-1 ring-brand-100 rounded-2xl p-4 space-y-1">
              <p className="text-base font-bold text-stone-900">{form.name}</p>
              <p className="text-xs text-stone-500">
                {EVENT_TYPES.find(t => t.value === form.type)?.label} · {formatDate(form.date)} · {form.guestCount} guests · {formatCurrency(parseInt(form.budget) || 0)}
              </p>
              {form.venue && <p className="text-xs text-stone-500">{form.venue}{form.location ? ` · ${form.location}` : ''}</p>}
              {form.clientName && (
                <p className="text-xs text-stone-500">
                  Client: <span className="font-medium text-stone-700">{form.clientName}</span>
                  {form.clientEmail && <span> · {form.clientEmail}</span>}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white ring-1 ring-stone-200 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-stone-900">{ceremonies.length}</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Ceremonies</p>
              </div>
              <div className="bg-white ring-1 ring-stone-200 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-stone-900">{totalSubs}</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Sub-elements</p>
              </div>
              <div className="bg-white ring-1 ring-stone-200 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-stone-900">{totalTasks}</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Tasks queued</p>
              </div>
            </div>

            <div className="bg-stone-50 ring-1 ring-stone-100 rounded-2xl p-3 max-h-64 overflow-y-auto">
              {ceremonies
                .sort((a, b) => a.offsetDaysFromEvent - b.offsetDaysFromEvent)
                .map(cer => (
                  <div key={cer.id} className="py-2 first:pt-0 last:pb-0 border-b border-stone-200/70 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cer.emoji}</span>
                      <p className="text-xs font-bold text-stone-800">{cer.name}</p>
                      <span className="text-[10px] text-stone-400">— {formatDate(cer.date)}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1 ml-6">
                      {cer.subCategories.map(s => `${s.emoji} ${s.name}`).join(' · ')}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <div>
          {step > 0 && (
            <Button variant="secondary" icon={<ArrowLeft size={13} />} onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
              Next <ArrowRight size={13} />
            </Button>
          ) : (
            <Button onClick={handleCreate} icon={<Check size={14} />}>
              Create Event
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function EventsPage() {
  const events = usePlannerEvents()
  const [createOpen, setCreateOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      setCreateOpen(true)
      // Clear state so navigating back doesn't reopen
      window.history.replaceState({}, '')
    }
  }, [location.state])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Events</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)} size="sm" className="sm:text-sm sm:px-4 sm:py-2 shrink-0">
          <span className="hidden xs:inline">New Event</span>
          <span className="xs:hidden">New</span>
        </Button>
      </div>

      <div className="space-y-4">
        {events.map(event => <EventCard key={event.id} event={event} />)}
        {events.length === 0 && (
          <div className="py-20 text-center text-stone-400">
            <CalendarDays size={36} className="mx-auto mb-3 text-stone-200" />
            <p className="font-medium">No events yet</p>
            <p className="text-sm mt-1">Create your first event to get started</p>
          </div>
        )}
      </div>

      <CreateEventWizard open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

// Suppress unused import warnings — Building2 is reserved for future event types
void Building2
