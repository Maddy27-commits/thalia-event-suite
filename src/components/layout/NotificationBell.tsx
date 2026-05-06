import { useState, useRef, useEffect } from 'react'
import { Bell, X, Sparkles, Clock, MessageSquare, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import type { Notification } from '../../types'

/**
 * Header notification dropdown. Shows the most recent unread + read items
 * scoped to the currently-signed-in user (matched by email). One unread dot
 * appears on the bell when at least one notification is unread.
 */
export function NotificationBell() {
  const { session, notifications, markAllNotificationsRead, markNotificationRead, dismissNotification } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!session) return null

  const myEmail = session.email.toLowerCase()
  const mine = notifications
    .filter((n) => n.recipientEmail.toLowerCase() === myEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const unread = mine.filter((n) => !n.read).length

  const handleClick = (n: Notification) => {
    markNotificationRead(n.id)
    if (n.link) navigate(n.link)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-rose-500 rounded-full ring-2 ring-white text-[9px] font-bold text-white flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl ring-1 ring-stone-200 shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/60">
            <div>
              <p className="text-sm font-bold text-stone-800">Notifications</p>
              <p className="text-[10px] text-stone-400">{unread === 0 ? 'All caught up' : `${unread} unread`}</p>
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllNotificationsRead(session.email)}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded-md hover:bg-brand-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {mine.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell size={20} className="text-stone-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-stone-500">No notifications yet</p>
                <p className="text-[11px] text-stone-400 mt-1">When something needs your attention, it lands here.</p>
              </div>
            ) : (
              mine.map((n) => <NotificationRow key={n.id} n={n} onClick={() => handleClick(n)} onDismiss={() => dismissNotification(n.id)} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationRow({ n, onClick, onDismiss }: { n: Notification; onClick: () => void; onDismiss: () => void }) {
  const meta = KIND_META[n.kind] ?? KIND_META.general
  const ago = relativeTime(n.createdAt)
  return (
    <div className={`group flex items-start gap-3 px-4 py-3 hover:bg-stone-50/60 transition-colors border-b border-stone-50 last:border-0 ${!n.read ? 'bg-brand-50/30' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.colour}`}>
        <meta.Icon size={14} />
      </div>
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-2 mb-0.5">
          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />}
          <p className="text-sm font-semibold text-stone-800 truncate">{n.title}</p>
        </div>
        <p className="text-[11px] text-stone-500 leading-snug line-clamp-2">{n.body}</p>
        <p className="text-[10px] text-stone-400 mt-1">{ago}</p>
      </button>
      <button
        onClick={onDismiss}
        className="text-stone-300 hover:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1"
        title="Dismiss"
      >
        <X size={11} />
      </button>
    </div>
  )
}

const KIND_META: Record<Notification['kind'], { Icon: React.ElementType; colour: string }> = {
  'concept-reminder': { Icon: Sparkles,      colour: 'text-amber-700 bg-amber-50 ring-1 ring-amber-200' },
  'milestone-due':    { Icon: Clock,         colour: 'text-rose-700 bg-rose-50 ring-1 ring-rose-200'    },
  'planner-message':  { Icon: MessageSquare, colour: 'text-brand-700 bg-brand-50 ring-1 ring-brand-200' },
  'vendor-message':   { Icon: Store,         colour: 'text-violet-700 bg-violet-50 ring-1 ring-violet-200' },
  'general':          { Icon: Bell,          colour: 'text-stone-600 bg-stone-100 ring-1 ring-stone-200' },
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60_000)
  if (min < 1)  return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}
