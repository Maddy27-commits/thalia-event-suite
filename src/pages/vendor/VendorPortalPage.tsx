import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Users, MessageSquare, ChevronDown, Send, X } from 'lucide-react'
import { useStore } from '../../store'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ThaliaFullLogo } from '../../components/ui/ThaliaLogo'
import { formatDate, daysUntil, generateId } from '../../lib/utils'
import type { Event, VendorChatMessage } from '../../types'

/**
 * Vendor's view of the platform. Strict subset of what a planner sees:
 *   - Only events the planner has explicitly added them to.
 *   - No client preferences, no budget figures, no vendor-cost intelligence.
 *   - Read-most chat — vendor can post messages back into the per-event
 *     vendor coordination thread the planner already uses.
 */
export function VendorPortalPage() {
  const { session, vendors, events } = useStore()
  const navigate = useNavigate()

  const vendor = useMemo(
    () => vendors.find((v) => v.id === session?.vendorId),
    [vendors, session?.vendorId]
  )

  // Only the events this vendor is assigned to. Anything else is invisible.
  const assignedEvents = useMemo(
    () => (vendor ? events.filter((e) => e.vendorIds.includes(vendor.id)) : []),
    [vendor, events]
  )

  if (!session || session.role !== 'vendor' || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
        <ThaliaFullLogo width={200} />
        <p className="text-stone-400 text-sm mt-2 max-w-xs">
          We couldn't load your vendor profile. Please sign in again.
        </p>
        <button onClick={() => navigate('/welcome')} className="text-amber-600 font-semibold text-sm hover:underline">Back to sign-in</button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-7 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <p className="eyebrow text-amber-500">Vendor Portal</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 leading-tight">
          Hello, {vendor.name}
        </h1>
        <p className="text-stone-400 text-sm mt-1">
          {assignedEvents.length === 0
            ? "You're not assigned to any events yet — your planner will add you when they're ready."
            : `You're assigned to ${assignedEvents.length} event${assignedEvents.length !== 1 ? 's' : ''}. Use the chat to coordinate.`}
        </p>
      </div>

      {/* ── Events ── */}
      {assignedEvents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 py-14 text-center">
          <CalendarDays size={28} className="mx-auto text-stone-200 mb-3" />
          <p className="text-stone-400 text-sm font-medium">No assigned events</p>
          <p className="text-stone-300 text-xs mt-1">Once a planner adds you to an event, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignedEvents.map((event) => (
            <VendorEventCard key={event.id} event={event} vendorId={vendor.id} vendorName={vendor.name} />
          ))}
        </div>
      )}

      <footer className="pt-6 mt-2 border-t border-stone-100 text-center">
        <p className="text-xs text-stone-400">
          You see only what your planner has shared with you. Messages you send go to the planner's vendor-coordination thread.
        </p>
      </footer>
    </div>
  )
}

// ─── Single-event card with inline chat ──────────────────────────────────────
function VendorEventCard({ event, vendorId, vendorName }: { event: Event; vendorId: string; vendorName: string }) {
  const { addVendorMessage } = useStore()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const myMessages = (event.vendorMessages ?? [])
    .filter((m) => m.vendorId === vendorId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const days = daysUntil(event.date)

  const handleSend = () => {
    const content = draft.trim()
    if (!content) return
    addVendorMessage(event.id, {
      id: generateId(),
      vendorId,
      author: 'vendor',
      content,
      timestamp: new Date().toISOString(),
    })
    setDraft('')
  }

  return (
    <Card>
      <CardBody className="px-4 sm:px-5 py-4">
        {/* Event header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{event.name}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1"><CalendarDays size={11} />{formatDate(event.date)}</span>
              {event.location && <span className="inline-flex items-center gap-1"><MapPin size={11} />{event.location}</span>}
              <span className="inline-flex items-center gap-1"><Users size={11} />{event.guestCount} guests</span>
            </div>
          </div>
          <Badge variant={days <= 30 ? 'danger' : days <= 90 ? 'warning' : 'default'} dot>
            {days > 0 ? `${days}d to go` : 'today'}
          </Badge>
        </div>

        {event.theme && (
          <p className="text-xs text-stone-500 mb-3"><span className="font-semibold text-stone-700">Theme:</span> {event.theme}</p>
        )}

        {/* Chat toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 ring-1 ring-amber-200 transition-colors"
        >
          <MessageSquare size={13} className="text-amber-600 shrink-0" />
          <span className="text-xs font-semibold text-amber-800 flex-1 text-left">
            {myMessages.length === 0 ? 'Open chat with planner' : `Chat with planner · ${myMessages.length} message${myMessages.length !== 1 ? 's' : ''}`}
          </span>
          <ChevronDown size={13} className={`text-amber-600 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="mt-3 rounded-2xl bg-stone-50 ring-1 ring-stone-100 overflow-hidden">
            <div className="px-4 py-3 max-h-72 overflow-y-auto space-y-2.5 bg-white">
              {myMessages.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center py-4">
                  No messages yet. Say hi to your planner.
                </p>
              ) : (
                myMessages.map((m) => <VendorMessageBubble key={m.id} m={m} myName={vendorName} />)
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-stone-100 p-3 bg-white">
              <div className="flex gap-2 items-end">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Reply to your planner…"
                  rows={2}
                  className="flex-1 text-sm border border-stone-200 rounded-2xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-stone-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-all"
                  title="Send (⌘↵)"
                >
                  <Send size={12} /> Send
                </button>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function VendorMessageBubble({ m, myName }: { m: VendorChatMessage; myName: string }) {
  const fromMe = m.author === 'vendor'
  return (
    <div className={`flex gap-2 group ${fromMe ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
        fromMe ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'
      }`}>
        {fromMe ? myName.slice(0, 2).toUpperCase() : 'PL'}
      </div>
      <div className={`flex-1 min-w-0 ${fromMe ? 'flex flex-col items-end' : ''}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-semibold text-stone-600">{fromMe ? 'You' : 'Planner'}</span>
          <span className="text-[10px] text-stone-300">{new Date(m.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
        </div>
        <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed max-w-[88%] whitespace-pre-wrap break-words ${
          fromMe
            ? 'bg-amber-500 text-white rounded-tr-sm'
            : 'bg-brand-50 text-stone-800 rounded-tl-sm ring-1 ring-brand-100'
        }`}>
          {m.content}
        </div>
        {/* Suppress unused var warning */}
        <X size={0} className="hidden" aria-hidden />
      </div>
    </div>
  )
}
